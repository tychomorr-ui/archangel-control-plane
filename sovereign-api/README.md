# ARCHANGEL Control Plane Sovereign API

This directory contains the **build-only** application-integration API for ARCHANGEL. It is intentionally separate from the React/Express console so an integration deployment cannot silently enlarge the console’s authority.

## Safety Boundary

The service provides scoped application identity, request authentication, metadata-only audit records, and an explicitly non-executing command receipt. It does **not** connect IWA Sage, KEIRA, Root-Gate, or any other application; it does not issue a production key; and it contains no node, mesh, firewall, shell, credential-store, or remote-execution implementation.

Public registration is disabled by default. `POST /v1/sovereign-keys/register` returns `404` until `ENABLE_PUBLIC_REGISTRATION=true` is set through the deployment secret manager after a separate onboarding review.

## Local Build Verification

Install the package with its test dependencies and run the test suite:

```bash
sudo uv pip install --system -e '.[test]'
pytest
```

The tests use an isolated in-memory database and a fake Redis counter. They generate credentials only in test memory; no static API key is present in the repository or test output.

## Production Activation Prerequisites

1. Provision dedicated PostgreSQL and Redis instances.
2. Supply configuration only through the deployment secret manager; see [`CONFIGURATION.md`](./CONFIGURATION.md).
3. Run the required Alembic migration before starting the service:

   ```bash
   alembic upgrade head
   ```

4. Terminate TLS with a reviewed configuration and set `TRUSTED_PROXY_CIDRS` before accepting any forwarded-address or TLS-fingerprint header.
5. Keep public registration disabled unless there is a reviewed, rate-limited onboarding path.
6. Review the OpenAPI specification at `/openapi.json` with each connecting application team before issuing the first controlled credential.

The Compose file binds the API only to `127.0.0.1:8081` as a local deployment default. It does not expose the service publicly and it does not use the existing ARCHANGEL console’s database.

## Contract Summary

| Route | Scope | Behavior in this build |
|---|---|---|
| `POST /v1/sovereign-keys/register` | Feature flag only | Creates a credential record only after the registration gate is enabled. |
| `GET /v1/health` | Authenticated key | Returns service identity. |
| `GET /v1/status` | `read:status` | Returns build-only and execution-paused status. |
| `GET /v1/apps` | `read:status` | Returns only the caller’s application identity. |
| `POST /v1/commands` | `write:commands` | Persists an allow-listed `ping` receipt; it cannot dispatch work. |
| `GET /v1/audit` | `read:audit` | Returns the caller’s metadata-only audit trail. |
| `POST /v1/sovereign-keys/{key_id}/rotate` | `admin:keys` | Replaces one active credential and returns the replacement once. |
| `DELETE /v1/sovereign-keys/{key_id}` | `admin:keys` | Immediately marks the caller-owned credential revoked. |

## Credential Format and Logging Rule

Opaque API credentials are generated from 32 random bytes, encoded as `ak_live_<base32>.<checksum>`, and stored only as an Argon2id hash. Audit records never contain a credential, request body, signature value, or arbitrary header payload.

The required request headers are `Authorization`, `X-Archangel-Key-Id`, and `X-Archangel-Timestamp`. An `X-Archangel-Signature` header is mandatory only for a credential registered with an Ed25519 public key. The signature covers HTTP method, path, timestamp, and SHA-256 request-body digest.

