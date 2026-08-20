"""initial sovereign API schema

Revision ID: 20260820_01
Revises:
Create Date: 2026-08-20
"""
from alembic import op
import sqlalchemy as sa

revision = "20260820_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("applications", sa.Column("id", sa.String(length=64), primary_key=True), sa.Column("name", sa.String(length=160), nullable=False), sa.Column("contact", sa.String(length=320), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_applications_name", "applications", ["name"], unique=True)
    op.create_table("sovereign_keys", sa.Column("key_id", sa.String(length=80), primary_key=True), sa.Column("application_id", sa.String(length=64), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False), sa.Column("key_hash", sa.Text(), nullable=False), sa.Column("scopes", sa.JSON(), nullable=False), sa.Column("public_key_pem", sa.Text(), nullable=True), sa.Column("rate_limit_per_minute", sa.Integer(), nullable=False), sa.Column("active", sa.Boolean(), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("rotation_due", sa.DateTime(timezone=True), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_sovereign_keys_application_id", "sovereign_keys", ["application_id"])
    op.create_table("audit_logs", sa.Column("id", sa.String(length=80), primary_key=True), sa.Column("key_id", sa.String(length=80), nullable=True), sa.Column("application_id", sa.String(length=64), nullable=True), sa.Column("source_ip", sa.String(length=64), nullable=True), sa.Column("forwarded_for", sa.String(length=512), nullable=True), sa.Column("user_agent", sa.String(length=1024), nullable=True), sa.Column("tls_fingerprint", sa.String(length=512), nullable=True), sa.Column("method", sa.String(length=10), nullable=False), sa.Column("path", sa.String(length=256), nullable=False), sa.Column("status_code", sa.Integer(), nullable=False), sa.Column("latency_ms", sa.Integer(), nullable=False), sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_audit_logs_key_id", "audit_logs", ["key_id"])
    op.create_index("ix_audit_logs_application_id", "audit_logs", ["application_id"])
    op.create_table("commands", sa.Column("command_id", sa.String(length=80), primary_key=True), sa.Column("key_id", sa.String(length=80), sa.ForeignKey("sovereign_keys.key_id"), nullable=False), sa.Column("application_id", sa.String(length=64), sa.ForeignKey("applications.id"), nullable=False), sa.Column("command", sa.String(length=64), nullable=False), sa.Column("target", sa.String(length=160), nullable=False), sa.Column("params", sa.JSON(), nullable=False), sa.Column("status", sa.String(length=32), nullable=False), sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False))


def downgrade() -> None:
    op.drop_table("commands")
    op.drop_index("ix_audit_logs_application_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_key_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_sovereign_keys_application_id", table_name="sovereign_keys")
    op.drop_table("sovereign_keys")
    op.drop_index("ix_applications_name", table_name="applications")
    op.drop_table("applications")
