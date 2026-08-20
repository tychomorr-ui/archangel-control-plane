# Sovereign API Configuration Reference

Use the deployment secret manager to supply these values. Do not commit an `.env` file, plaintext production secrets, or a generated API credential.

| Variable | Required at activation | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL SQLAlchemy connection string. |
| `REDIS_URL` | Yes | Redis connection for request-window limits. |
| `ENABLE_PUBLIC_REGISTRATION` | Yes | Must remain `false` until reviewed registration is approved. |
| `API_KEY_CHECKSUM_SECRET` | Yes | Random server-side HMAC secret for opaque-key checksums. |
| `TIMESTAMP_MAX_SKEW_SECONDS` | No | Defaults to 300 seconds. |
| `KEY_TTL_DAYS` | No | Defaults to 90 days. |
| `ROTATION_NOTICE_DAYS` | No | Defaults to 30 days before expiration. |
| `DEFAULT_RATE_LIMIT_PER_MINUTE` | No | Defaults to 120. |
| `PUBLIC_REGISTRATION_RATE_LIMIT_PER_IP` | No | Defaults to 5. |
| `PUBLIC_REGISTRATION_IP_DENY_LIST` | No | Comma-separated direct peer IP deny list. |
| `TRUSTED_PROXY_CIDRS` | Yes when TLS/proxy termination is used | Allows forwarding headers and upstream TLS fingerprints only from named proxy ranges. |
| `TLS_CERT_PATH` / `TLS_KEY_PATH` | Yes when the service terminates TLS itself | Certificate paths; otherwise terminate TLS at an approved proxy. |

The prior request for an `.env.example` is represented here because this project’s secure configuration policy deliberately prohibits committing `.env`-style environment files.

