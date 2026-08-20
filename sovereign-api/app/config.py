from __future__ import annotations

import os
from dataclasses import dataclass


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_int(name: str, default: int) -> int:
    value = os.getenv(name)
    return int(value) if value else default


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("SOVEREIGN_API_DATABASE_URL", os.getenv("DATABASE_URL", "postgresql+psycopg://archangel:change-me@localhost:5432/archangel_sovereign"))
    redis_url: str = os.getenv("SOVEREIGN_API_REDIS_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    enable_public_registration: bool = _as_bool(os.getenv("ENABLE_PUBLIC_REGISTRATION"), False)
    api_key_checksum_secret: str = os.getenv("API_KEY_CHECKSUM_SECRET", "build-only-not-for-activation")
    timestamp_max_skew_seconds: int = _as_int("TIMESTAMP_MAX_SKEW_SECONDS", 300)
    key_ttl_days: int = _as_int("KEY_TTL_DAYS", 90)
    rotation_notice_days: int = _as_int("ROTATION_NOTICE_DAYS", 30)
    default_rate_limit_per_minute: int = _as_int("DEFAULT_RATE_LIMIT_PER_MINUTE", 120)
    public_registration_rate_limit_per_ip: int = _as_int("PUBLIC_REGISTRATION_RATE_LIMIT_PER_IP", 5)
    public_registration_ip_deny_list: frozenset[str] = frozenset(filter(None, os.getenv("PUBLIC_REGISTRATION_IP_DENY_LIST", "").split(",")))
    trusted_proxy_cidrs: tuple[str, ...] = tuple(filter(None, os.getenv("TRUSTED_PROXY_CIDRS", "").split(",")))


settings = Settings()
