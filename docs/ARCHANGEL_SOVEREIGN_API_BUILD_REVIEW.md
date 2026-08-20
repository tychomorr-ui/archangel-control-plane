# ARCHANGEL Sovereign API Build Review

## Outcome

ARCHANGEL now contains a separate **build-only** FastAPI integration-service package at [`sovereign-api/`](../sovereign-api/). The package is intentionally not mounted into the existing React/Express console, not deployed, and not connected to IWA Sage, KEIRA, Root-Gate, or any other application.

The protected ARCHANGEL console now includes a **Sovereign API** surface. It presents the disabled registration state, credential security model, scope matrix, request-metadata model, and activation prerequisites. It does not reveal a credential or call the new service.

## Implemented Contract

| Area | Implemented behavior | Build-only boundary |
|---|---|---|
| Credential format | Generates opaque `ak_live_…` values from 32 random bytes with a checksum. | No real key has been issued or committed. |
| Credential storage | Persists only Argon2id hashes in the `sovereign_keys` table. | Plaintext values are returned once by guarded registration or rotation logic only. |
| Request authentication | Requires bearer credential, key identifier, and fresh UTC timestamp; registered Ed25519 keys require a signature over method, route, timestamp, and body digest. | No app is registered to use this protocol. |
| Registration | `POST /v1/sovereign-keys/register` is disabled unless `ENABLE_PUBLIC_REGISTRATION=true`. | Default configuration keeps the route unavailable. |
| Scopes | Supports status, metrics, audit, command receipt, config, and key-administration scopes. | Metrics/config are reserved; the command route only stores an allow-listed `ping` receipt. |
| IP capture | Records direct source IP, approved-proxy forwarding metadata, user agent, optional approved-proxy TLS fingerprint, method, normalized path, response status, latency, and UTC time. | No request bodies, credential values, signatures, or arbitrary header values are stored. |
| Rotation and revocation | Rotation invalidates the prior active credential; revocation deactivates it immediately. | No production credential lifecycle has begun. |

## Deliverables

| File or directory | Purpose |
|---|---|
| `sovereign-api/app/` | FastAPI application, SQLAlchemy models, auth, Ed25519 verification, metadata audit, and Redis-window limiter. |
| `sovereign-api/alembic/` | Initial PostgreSQL schema migration for applications, sovereign keys, audit logs, and command receipts. |
| `sovereign-api/Dockerfile` | Dedicated Python service image; separate from the console’s deployment container. |
| `sovereign-api/docker-compose.yml` | Local-only service composition with PostgreSQL and Redis, bound to `127.0.0.1:8081`. |
| `sovereign-api/CONFIGURATION.md` | Secret-manager configuration reference; no `.env` or plaintext production secret is present. |
| `sovereign-api/ARCHANGEL_SOVEREIGN_API.postman_collection.json` | Key-free contract collection with blank variables only. |
| `sovereign-api/README.md` | Build verification and controlled-activation instructions. |

## Validation Evidence

The isolated API suite completed with **4 passing tests**. It covers disabled registration, runtime-only opaque-key generation, Argon2id verification, timestamp-bound authentication, scope enforcement, caller-only application visibility, IP metadata audit, metadata exclusion of credentials, Redis-window rate-limit behavior, Ed25519 verification, rotation, revocation, and the non-executing command receipt.

The FastAPI package and Alembic sources passed Python compilation. The existing ARCHANGEL application passed `pnpm check` and **33 Vitest tests**. The new Sovereign API console surface was visually reviewed at **1280 × 720** and **375 × 812**, with readable desktop and mobile hierarchy and explicit no-connection messaging.

## Activation Is Still Withheld

> This build did not provision PostgreSQL or Redis, start Docker Compose, set a runtime secret, activate public registration, bind a public endpoint, issue a production key, or connect any application. It did not add node, mesh, firewall, shell, credential-store, or remote-execution authority.

The required activation sequence remains: provision dedicated state stores; enter secrets through the secret manager; run `alembic upgrade head`; establish TLS and trusted proxy ranges; review the OpenAPI contract; retain registration disabled unless reviewed onboarding is ready; and issue a least-privilege application credential only after explicit approval.
