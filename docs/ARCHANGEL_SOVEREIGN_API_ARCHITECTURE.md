# ARCHANGEL Sovereign API Architecture

## Scope and Boundary

The Sovereign API is a **separate local integration service** intended to give declared applications, such as IWA Sage and KEIRA, a controlled future interface to ARCHANGEL. It is not a node-control transport. The build has no application connection, no issued production credential, no public registration, no mesh enrolment, no firewall action, no credential-store authority, and no shell path.

> The `POST /v1/commands` route records an allow-listed command receipt only. It does not resolve a node, enqueue work to an agent, invoke a shell, or create an execution envelope.

## Deployment Shape

| Component | Build role | Activation state |
|---|---|---|
| `sovereign-api` | FastAPI service for the versioned JSON contract, authentication, authorization, audit metadata, and OpenAPI. | Build-only; not connected to an application. |
| PostgreSQL | Dedicated state store for application identities, Argon2id key-verifier records, audit metadata, and non-executing command records. | Declared in local compose configuration only. |
| Redis | Per-key request-window counters and per-IP registration guardrail counters. | Declared in local compose configuration only. |
| ARCHANGEL console | Existing OAuth-protected product that can later expose management visibility. | No service-to-service link in this milestone. |

The intended local base URL is `https://control-plane.archangel.local/v1`. That hostname is an integration contract label, not a currently provisioned public endpoint.

## Authentication and Registration

All protected API routes require the following headers:

| Header | Requirement |
|---|---|
| `Authorization` | `Bearer ak_live_…` opaque API credential. |
| `X-Archangel-Key-Id` | Public identifier for the credential record. |
| `X-Archangel-Timestamp` | ISO 8601 UTC timestamp, freshness bounded by configuration. |
| `X-Archangel-Signature` | Required only when the registered application supplied an Ed25519 public key. |

The API stores only an **Argon2id verifier** of the full opaque key. A key is generated from 32 random bytes, Base32-encoded, and completed with an HMAC checksum. The plaintext is returned exactly once by registration or rotation logic, is never logged, and is never written to the audit table.

`POST /v1/sovereign-keys/register` is an intentionally exceptional bootstrap route: it cannot require a key that does not exist yet. It is disabled unless `ENABLE_PUBLIC_REGISTRATION=true`, guarded by an IP-level Redis rate limit, and must be placed behind a separate deployment approval before use. All other API routes require a valid, active credential.

## Scope Matrix

| Scope | Authorizes | Explicitly does not authorize |
|---|---|---|
| `read:status` | Scoped declared-control-plane status and visible application identities. | Health claims, node reachability, node access. |
| `read:metrics` | Reserved future metric contract only. | Runtime collection or telemetry polling. |
| `read:audit` | Metadata-only audit rows owned by the authenticated key. | Other applications’ audit history, raw secrets, request bodies. |
| `write:commands` | Receipt of one allow-listed non-executing `ping` planning command. | Shell execution, node command dispatch, mesh action. |
| `write:config` | Reserved future contract only. | Configuration mutation in this build. |
| `admin:keys` | Key rotation and revocation for the caller’s application identity. | Cross-application key administration. |

## IP and Request Metadata Capture

Every registration attempt and API request creates a metadata-only audit record. The service records direct peer address, `X-Forwarded-For` only when the deployment explicitly trusts a proxy, user agent, optional upstream TLS fingerprint when supplied by a trusted terminating proxy, HTTP method, normalized route, status, latency, and UTC timestamp. It does not store API keys, signatures, request bodies, or arbitrary header payloads.

## Activation Preconditions

Before any application receives a credential or connects to this service, an operator must separately complete all of the following: provision PostgreSQL and Redis, establish TLS and a controlled DNS route, set all runtime secrets through the secret manager, retain registration disabled unless a reviewed onboarding process exists, identify trusted proxies for forwarding headers, configure a key-rotation schedule, and review the OpenAPI contract with the connecting application team. None of these preconditions are completed by this build milestone.
