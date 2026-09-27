# ARCHANGEL Bounded Conductor Contract

## Decision

ARCHANGEL is the conductor, but its execution authority is **bounded, auditable, and application-scoped**. It is not an unrestricted root shell and does not store node private keys, cloud credentials, firewall credentials, or arbitrary command text.

## Current implementation

The control plane now exposes a protected policy contract that declares:

- `health.check` with `read:health`
- `deployment.status` with `read:deployment`
- `cache.refresh` with `write:cache`

Every action requires a registered application endpoint, a registered Ed25519 public key, a fresh signed receipt, an idempotency key, and an append-only audit record. `cache.refresh` is the first reversible mutation class; it is explicitly not an infrastructure mutation.

The implementation includes:

- Canonical signed health receipt bytes.
- Ed25519 verification using the application public key.
- A maximum five-minute receipt validity window.
- Future-issue protection and expiration checks.
- SHA-256 receipt hashes for audit references.
- Explicit rejection of shell-shaped or infrastructure actions.
- Protected Command Center copy that distinguishes conductor authority from hidden-shell authority.

## Activation state

The conductor policy is present, but dispatch remains paused until an application is registered with:

1. A stable HTTPS endpoint.
2. An application ID and node ID.
3. An Ed25519 public key.
4. A declared list of supported actions and scopes.
5. A server-side private key stored only in that application’s secret manager.
6. A documented health response and action response schema.

The current build does not claim live health for any application and does not contact any external endpoint merely because it is listed in the registry.

## Execution lifecycle

1. **Observe** — Request a signed health receipt from a registered application.
2. **Verify** — Validate identity, canonical payload, signature, nonce, freshness, and allowed capabilities.
3. **Draft** — Create a bounded action intent with scope, target, risk, TTL, and rollback description.
4. **Review** — Require an operator decision for actions beyond passive health verification.
5. **Authorize** — Check the application’s declared scope and the action policy.
6. **Dispatch** — Send only the named application action, never arbitrary shell text.
7. **Receipt** — Require a fresh signed result with the same idempotency key.
8. **Audit** — Store metadata, digest, actor, action, outcome, and timestamps; never store private keys or bearer credentials.

## Explicitly prohibited

- Arbitrary shell execution.
- `sudo`, `bash`, `sh`, `curl | sh`, or equivalent command injection paths.
- Direct SSH or cloud-provider control from the console.
- Firewall, mesh, node-enrollment, billing, credential, or account-security mutation.
- Silent execution without a proposal, scope, freshness check, and audit record.
- Treating a timeout or missing receipt as proof that a node is offline.

## Next integration input

To activate verification for the first real Manus-hosted application, the application team must provide its exact `*.manus.space` hostname and public Ed25519 key. The private key must remain in the application’s server-side secret store. ARCHANGEL can then verify signed health evidence without requiring Azure, AWS, SSH, or a separate control-plane VM.
