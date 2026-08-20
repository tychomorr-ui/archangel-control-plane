from __future__ import annotations

import ipaddress
import time
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from redis import Redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_session
from .models import Application, AuditLog, CommandReceipt, SovereignKey
from .rate_limit import enforce_window
from .schemas import AppsResponse, AuditResponse, CommandRequest, CommandResponse, HealthResponse, KeyLifecycleResponse, RegistrationRequest, RegistrationResponse, StatusResponse
from .security import AuthenticatedKey, api_key_checksum_is_valid, hash_api_key, new_api_key, new_key_id, parse_timestamp, signing_payload, verify_api_key, verify_ed25519_signature

ALLOWED_SCOPES = frozenset({"read:status", "read:metrics", "read:audit", "write:commands", "write:config", "admin:keys"})
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
app = FastAPI(title="ARCHANGEL Control Plane Sovereign API", version="1.0.0", docs_url="/docs", openapi_url="/openapi.json")


def new_record_id(prefix: str) -> str:
    from .security import _base32
    import secrets
    return f"{prefix}_{_base32(secrets.token_bytes(10))}"


def source_metadata(request: Request) -> tuple[str | None, str | None, str | None]:
    source_ip = request.client.host if request.client else None
    trusted = False
    if source_ip:
        try:
            peer = ipaddress.ip_address(source_ip)
            trusted = any(peer in ipaddress.ip_network(cidr.strip()) for cidr in settings.trusted_proxy_cidrs)
        except ValueError:
            trusted = False
    forwarded = request.headers.get("x-forwarded-for") if trusted else None
    tls_fingerprint = request.headers.get("x-archangel-tls-fingerprint") if trusted else None
    return source_ip, forwarded, tls_fingerprint


def audit_request(request: Request, response: Response, latency_ms: int) -> None:
    try:
        session = next(get_session())
        source_ip, forwarded_for, tls_fingerprint = source_metadata(request)
        session.add(AuditLog(
            id=new_record_id("aud"),
            key_id=request.state.key_id if hasattr(request.state, "key_id") else request.headers.get("x-archangel-key-id"),
            application_id=request.state.application_id if hasattr(request.state, "application_id") else None,
            source_ip=source_ip,
            forwarded_for=forwarded_for,
            user_agent=request.headers.get("user-agent"),
            tls_fingerprint=tls_fingerprint,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            latency_ms=latency_ms,
            occurred_at=datetime.now(UTC),
        ))
        session.commit()
    except Exception:
        # Metadata audit failure must not expose a service internals or key material.
        pass
    finally:
        try:
            session.close()
        except UnboundLocalError:
            pass


@app.middleware("http")
async def metadata_only_audit(request: Request, call_next):
    started = time.perf_counter()
    request.state.raw_body = await request.body()
    try:
        response = await call_next(request)
    except Exception:
        response = JSONResponse({"detail": "Internal service error."}, status_code=500)
    audit_request(request, response, int((time.perf_counter() - started) * 1000))
    return response


def authenticate(request: Request, session: Annotated[Session, Depends(get_session)]) -> AuthenticatedKey:
    authorization = request.headers.get("authorization", "")
    key_id = request.headers.get("x-archangel-key-id")
    timestamp = request.headers.get("x-archangel-timestamp")
    if not authorization.startswith("Bearer ") or not key_id or not timestamp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing ARCHANGEL authentication headers.")
    api_key = authorization.removeprefix("Bearer ").strip()
    if not api_key_checksum_is_valid(api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API credential.")
    try:
        parse_timestamp(timestamp)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error
    key = session.scalar(select(SovereignKey).where(SovereignKey.key_id == key_id))
    expires_at = key.expires_at.replace(tzinfo=UTC) if key and key.expires_at.tzinfo is None else key.expires_at if key else None
    if not key or not key.active or expires_at <= datetime.now(UTC) or not verify_api_key(api_key, key.key_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API credential.")
    if key.public_key_pem:
        signature = request.headers.get("x-archangel-signature")
        if not signature or not verify_ed25519_signature(key.public_key_pem, signature, signing_payload(request.method, request.url.path, timestamp, request.state.raw_body)):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A valid Ed25519 request signature is required for this credential.")
    try:
        enforce_window(redis_client, f"archangel:key:{key.key_id}:{int(time.time() // 60)}", key.rate_limit_per_minute)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Rate-limit service unavailable.") from error
    request.state.key_id = key.key_id
    request.state.application_id = key.application_id
    application = session.get(Application, key.application_id)
    return AuthenticatedKey(key.key_id, key.application_id, application.name if application else key.application_id, frozenset(key.scopes), key.rate_limit_per_minute)


def require_scope(required_scope: str):
    def dependency(auth: Annotated[AuthenticatedKey, Depends(authenticate)]) -> AuthenticatedKey:
        if required_scope not in auth.scopes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing required scope: {required_scope}.")
        return auth
    return dependency


@app.post("/v1/sovereign-keys/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_key(payload: RegistrationRequest, request: Request, session: Annotated[Session, Depends(get_session)]):
    if not settings.enable_public_registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public registration is disabled.")
    source_ip, _, _ = source_metadata(request)
    if source_ip in settings.public_registration_ip_deny_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration source is denied.")
    try:
        enforce_window(redis_client, f"archangel:registration:{source_ip}:{int(time.time() // 60)}", settings.public_registration_rate_limit_per_ip)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Registration guard service unavailable.") from error
    requested = set(payload.requested_scopes)
    if not requested.issubset(ALLOWED_SCOPES):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Requested scopes include an unsupported value.")
    application = session.scalar(select(Application).where(Application.name == payload.application))
    if not application:
        application = Application(id=new_record_id("app"), name=payload.application, contact=str(payload.contact))
        session.add(application)
        session.flush()
    plaintext = new_api_key()
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=settings.key_ttl_days)
    rotation_due = expires_at - timedelta(days=settings.rotation_notice_days)
    key = SovereignKey(key_id=new_key_id(), application_id=application.id, key_hash=hash_api_key(plaintext), scopes=sorted(requested), public_key_pem=payload.public_key_pem, rate_limit_per_minute=payload.rate_limit_per_minute, expires_at=expires_at, rotation_due=rotation_due)
    session.add(key)
    session.commit()
    return RegistrationResponse(key_id=key.key_id, api_key=plaintext, expires_at=expires_at, scopes=key.scopes, observed_ip=source_ip, registration_ip=source_ip, rotation_due=rotation_due)


@app.get("/v1/health", response_model=HealthResponse)
def health(_: Annotated[AuthenticatedKey, Depends(authenticate)]):
    return HealthResponse()


@app.get("/v1/status", response_model=StatusResponse)
def status_view(auth: Annotated[AuthenticatedKey, Depends(require_scope("read:status"))]):
    return StatusResponse(service="archangel-control-plane", integration_state="build-only", execution_state="paused", key_id=auth.key_id, application=auth.application_name, timestamp=datetime.now(UTC))


@app.get("/v1/apps", response_model=AppsResponse)
def apps_view(auth: Annotated[AuthenticatedKey, Depends(require_scope("read:status"))], session: Annotated[Session, Depends(get_session)]):
    application = session.get(Application, auth.application_id)
    return AppsResponse(applications=[{"id": auth.application_id, "name": application.name if application else auth.application_name, "visibility": "self", "integration_state": "build-only"}])


@app.post("/v1/commands", response_model=CommandResponse, status_code=status.HTTP_202_ACCEPTED)
def commands_view(payload: CommandRequest, auth: Annotated[AuthenticatedKey, Depends(require_scope("write:commands"))], session: Annotated[Session, Depends(get_session)]):
    accepted_at = datetime.now(UTC)
    receipt = CommandReceipt(command_id=new_record_id("cmd"), key_id=auth.key_id, application_id=auth.application_id, command=payload.command, target=payload.target, params=payload.params, status="queued", accepted_at=accepted_at)
    session.add(receipt)
    session.commit()
    return CommandResponse(command_id=receipt.command_id, status="queued", accepted_at=accepted_at)


@app.get("/v1/audit", response_model=AuditResponse)
def audit_view(auth: Annotated[AuthenticatedKey, Depends(require_scope("read:audit"))], session: Annotated[Session, Depends(get_session)]):
    rows = session.scalars(select(AuditLog).where(AuditLog.key_id == auth.key_id).order_by(AuditLog.occurred_at.desc()).limit(250)).all()
    return AuditResponse(audit=[{"source_ip": row.source_ip, "x_forwarded_for": row.forwarded_for, "user_agent": row.user_agent, "tls_fingerprint": row.tls_fingerprint, "method": row.method, "path": row.path, "status": row.status_code, "latency_ms": row.latency_ms, "timestamp": row.occurred_at} for row in rows])


@app.post("/v1/sovereign-keys/{key_id}/rotate", response_model=KeyLifecycleResponse)
def rotate_key(key_id: str, request: Request, auth: Annotated[AuthenticatedKey, Depends(require_scope("admin:keys"))], session: Annotated[Session, Depends(get_session)]):
    existing = session.get(SovereignKey, key_id)
    if not existing or existing.application_id != auth.application_id or not existing.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active key was not found for this application.")
    existing.active = False
    existing.revoked_at = datetime.now(UTC)
    plaintext = new_api_key()
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=settings.key_ttl_days)
    rotation_due = expires_at - timedelta(days=settings.rotation_notice_days)
    replacement = SovereignKey(key_id=new_key_id(), application_id=auth.application_id, key_hash=hash_api_key(plaintext), scopes=list(existing.scopes), public_key_pem=existing.public_key_pem, rate_limit_per_minute=existing.rate_limit_per_minute, expires_at=expires_at, rotation_due=rotation_due)
    session.add(replacement)
    session.commit()
    return KeyLifecycleResponse(key_id=replacement.key_id, api_key=plaintext, status="active", expires_at=expires_at, rotation_due=rotation_due)


@app.delete("/v1/sovereign-keys/{key_id}", response_model=KeyLifecycleResponse)
def revoke_key(key_id: str, auth: Annotated[AuthenticatedKey, Depends(require_scope("admin:keys"))], session: Annotated[Session, Depends(get_session)]):
    existing = session.get(SovereignKey, key_id)
    if not existing or existing.application_id != auth.application_id or not existing.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active key was not found for this application.")
    existing.active = False
    existing.revoked_at = datetime.now(UTC)
    session.commit()
    return KeyLifecycleResponse(key_id=existing.key_id, status="revoked")
