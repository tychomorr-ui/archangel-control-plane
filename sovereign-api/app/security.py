from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime

from argon2 import PasswordHasher, Type
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from .config import settings

password_hasher = PasswordHasher(time_cost=3, memory_cost=65_536, parallelism=2, hash_len=32, salt_len=16, type=Type.ID)


def _base32(value: bytes) -> str:
    return base64.b32encode(value).decode("ascii").rstrip("=").lower()


def new_key_id() -> str:
    return f"key_{_base32(secrets.token_bytes(10))}"


def new_api_key() -> str:
    material = _base32(secrets.token_bytes(32))
    checksum = hmac.new(settings.api_key_checksum_secret.encode(), material.encode(), hashlib.sha256).hexdigest()[:8]
    return f"ak_live_{material}.{checksum}"


def api_key_checksum_is_valid(api_key: str) -> bool:
    if not api_key.startswith("ak_live_") or "." not in api_key:
        return False
    material, checksum = api_key.removeprefix("ak_live_").rsplit(".", 1)
    expected = hmac.new(settings.api_key_checksum_secret.encode(), material.encode(), hashlib.sha256).hexdigest()[:8]
    return hmac.compare_digest(expected, checksum)


def hash_api_key(api_key: str) -> str:
    return password_hasher.hash(api_key)


def verify_api_key(api_key: str, stored_hash: str) -> bool:
    try:
        return password_hasher.verify(stored_hash, api_key)
    except Exception:
        return False


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Timestamp must include a UTC offset.")
    parsed = parsed.astimezone(UTC)
    skew = abs((datetime.now(UTC) - parsed).total_seconds())
    if skew > settings.timestamp_max_skew_seconds:
        raise ValueError("Timestamp is outside the allowed freshness window.")
    return parsed


def signing_payload(method: str, path: str, timestamp: str, body: bytes) -> bytes:
    body_digest = hashlib.sha256(body).hexdigest()
    return f"{method.upper()}\n{path}\n{timestamp}\n{body_digest}".encode()


def verify_ed25519_signature(public_key_pem: str, signature_b64: str, payload: bytes) -> bool:
    try:
        loaded = serialization.load_pem_public_key(public_key_pem.encode())
        if not isinstance(loaded, Ed25519PublicKey):
            return False
        loaded.verify(base64.b64decode(signature_b64, validate=True), payload)
        return True
    except (ValueError, TypeError, InvalidSignature):
        return False


@dataclass(frozen=True)
class AuthenticatedKey:
    key_id: str
    application_id: str
    application_name: str
    scopes: frozenset[str]
    rate_limit_per_minute: int

