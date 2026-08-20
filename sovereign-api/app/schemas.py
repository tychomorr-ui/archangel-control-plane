from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegistrationRequest(BaseModel):
    application: str = Field(min_length=2, max_length=160)
    contact: EmailStr
    requested_scopes: list[str] = Field(min_length=1, max_length=6)
    public_key_pem: str | None = Field(default=None, max_length=4096)
    rate_limit_per_minute: int = Field(default=120, ge=1, le=10_000)


class RegistrationResponse(BaseModel):
    key_id: str
    api_key: str
    expires_at: datetime
    scopes: list[str]
    observed_ip: str | None
    registration_ip: str | None
    rotation_due: datetime


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "archangel-control-plane"
    version: str = "1.0.0"


class StatusResponse(BaseModel):
    service: str
    integration_state: str
    execution_state: str
    key_id: str
    application: str
    timestamp: datetime


class AppsResponse(BaseModel):
    applications: list[dict[str, Any]]


class CommandRequest(BaseModel):
    command: str = Field(pattern="^ping$")
    target: str = Field(min_length=2, max_length=160)
    params: dict[str, Any] = Field(default_factory=dict)


class CommandResponse(BaseModel):
    command_id: str
    status: str
    accepted_at: datetime


class AuditResponse(BaseModel):
    audit: list[dict[str, Any]]


class KeyLifecycleResponse(BaseModel):
    key_id: str
    api_key: str | None = None
    status: str
    expires_at: datetime | None = None
    rotation_due: datetime | None = None

