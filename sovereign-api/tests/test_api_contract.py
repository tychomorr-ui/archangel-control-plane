from __future__ import annotations

import os
from dataclasses import replace
from datetime import UTC, datetime

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["SOVEREIGN_API_DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from app import main, security
from app.database import Base
from app.models import AuditLog, CommandReceipt, SovereignKey
from app.rate_limit import enforce_window


class FakeRedis:
    def __init__(self):
        self.values: dict[str, int] = {}

    def incr(self, key: str) -> int:
        self.values[key] = self.values.get(key, 0) + 1
        return self.values[key]

    def expire(self, key: str, _: int) -> bool:
        return True


@pytest.fixture()
def api(monkeypatch):
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    def test_session():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    runtime_settings = replace(main.settings, enable_public_registration=True, api_key_checksum_secret="test-only-checksum", default_rate_limit_per_minute=120)
    monkeypatch.setattr(main, "settings", runtime_settings)
    monkeypatch.setattr(security, "settings", runtime_settings)
    monkeypatch.setattr(main, "redis_client", FakeRedis())
    original_session_dependency = main.get_session
    main.app.dependency_overrides[original_session_dependency] = test_session
    monkeypatch.setattr(main, "get_session", test_session)
    main.app.router.on_startup.clear()
    with TestClient(main.app, client=("198.51.100.44", 41234)) as client:
        yield client, TestSession, runtime_settings
    main.app.dependency_overrides.clear()


def registration_payload(scopes: list[str] | None = None) -> dict:
    return {"application": "IWA-Sage", "contact": "ops@iwa-sage.org", "requested_scopes": scopes or ["read:status", "read:audit", "admin:keys"], "rate_limit_per_minute": 120}


def headers(registration: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {registration['api_key']}", "X-Archangel-Key-Id": registration["key_id"], "X-Archangel-Timestamp": datetime.now(UTC).isoformat()}


def test_registration_key_is_opaque_hashed_and_status_is_build_only(api):
    client, sessions, _ = api
    registration = client.post("/v1/sovereign-keys/register", json=registration_payload())
    assert registration.status_code == 201
    issued = registration.json()
    assert issued["api_key"].startswith("ak_live_")
    assert issued["observed_ip"] == "198.51.100.44"
    assert issued["registration_ip"] == "198.51.100.44"

    with sessions() as session:
        key = session.get(SovereignKey, issued["key_id"])
        assert key is not None
        assert key.key_hash != issued["api_key"]
        assert security.verify_api_key(issued["api_key"], key.key_hash)

    response = client.get("/v1/status", headers=headers(issued))
    assert response.status_code == 200
    assert response.json()["integration_state"] == "build-only"
    assert response.json()["execution_state"] == "paused"


def test_scope_enforcement_audit_metadata_and_no_cross_application_visibility(api):
    client, sessions, _ = api
    registration = client.post("/v1/sovereign-keys/register", json=registration_payload(["read:status", "read:audit"]))
    issued = registration.json()
    assert client.post("/v1/commands", headers=headers(issued), json={"command": "ping", "target": "declared-test-target", "params": {}}).status_code == 403
    assert client.get("/v1/apps", headers=headers(issued)).json()["applications"][0]["visibility"] == "self"

    audit = client.get("/v1/audit", headers=headers(issued))
    assert audit.status_code == 200
    with sessions() as session:
        rows = session.scalars(select(AuditLog).where(AuditLog.key_id == issued["key_id"])).all()
        assert rows
        assert rows[-1].source_ip == "198.51.100.44"
        assert all("api_key" not in row.path for row in rows)

    command_key = client.post("/v1/sovereign-keys/register", json=registration_payload(["write:commands"])).json()
    receipt = client.post("/v1/commands", headers=headers(command_key), json={"command": "ping", "target": "declared-test-target", "params": {"note": "receipt only"}})
    assert receipt.status_code == 202
    assert receipt.json()["status"] == "queued"
    with sessions() as session:
        stored = session.get(CommandReceipt, receipt.json()["command_id"])
        assert stored is not None
        assert stored.command == "ping"
        assert stored.status == "queued"


def test_rate_limit_rotation_and_revocation(api, monkeypatch):
    client, _, runtime_settings = api
    registration = client.post("/v1/sovereign-keys/register", json=registration_payload(["read:status", "admin:keys"]))
    issued = registration.json()
    monkeypatch.setattr(main, "settings", replace(runtime_settings, default_rate_limit_per_minute=1))
    limiter = FakeRedis()
    enforce_window(limiter, "test-window", 1)
    with pytest.raises(HTTPException) as limited:
        enforce_window(limiter, "test-window", 1)
    assert limited.value.status_code == 429

    rotation = client.post(f"/v1/sovereign-keys/{issued['key_id']}/rotate", headers=headers(issued))
    assert rotation.status_code == 200
    replacement = rotation.json()
    assert replacement["key_id"] != issued["key_id"]
    assert replacement["api_key"]
    assert client.get("/v1/status", headers=headers(issued)).status_code == 401
    assert client.delete(f"/v1/sovereign-keys/{replacement['key_id']}", headers=headers(replacement)).status_code == 200
    assert client.get("/v1/status", headers=headers(replacement)).status_code == 401


def test_public_registration_default_and_ed25519_verification_contract(monkeypatch):
    private_key = Ed25519PrivateKey.generate()
    public_pem = private_key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    payload = security.signing_payload("GET", "/v1/status", "2026-08-20T12:00:00+00:00", b"")
    signature = private_key.sign(payload)
    import base64
    assert security.verify_ed25519_signature(public_pem, base64.b64encode(signature).decode(), payload)
    assert not security.verify_ed25519_signature(public_pem, base64.b64encode(signature).decode(), b"tampered")
    disabled = replace(main.settings, enable_public_registration=False)
    monkeypatch.setattr(main, "settings", disabled)
    monkeypatch.setattr(main, "redis_client", FakeRedis())
    main.app.router.on_startup.clear()
    with TestClient(main.app) as client:
        assert client.post("/v1/sovereign-keys/register", json=registration_payload()).status_code == 404
