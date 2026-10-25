# ARCHANGEL ATMOS Gate 4

ARCHANGEL now exposes a fail-closed, receipt-backed authorization boundary for the control plane. It is intentionally **NOOP-only** and does not provide shell execution, remote access, credential retrieval, arbitrary mutation, or unrestricted command APIs.

## HTTP contract

- `POST /authority/challenge` issues a single-use, 60-second Ed25519 challenge.
- `POST /mutate` accepts only the exact `NEXINUS_ATMOS_MUTATION_REQUEST/v1` envelope with `operation: NOOP` and `targetNodeId: ARCHANGEL`.
- `GET /authority/status` exposes posture/configuration only.

The mutation path validates the operator public key, signature, key reference, challenge and nonce binding, request timestamps, payload hash, operation, replay state, and durable challenge consumption. A successful request returns a control-plane-signed `ACCEPTED_NOOP` receipt. It performs no state mutation other than durable replay/audit recording.

## Durable storage

Migration `drizzle/0006_nebulous_spectrum.sql` creates:

- `atmos_authority_challenges` — challenge nonce, timestamps, and single-use marker.
- `atmos_authority_mutations` — unique mutation IDs for replay protection.

Every accepted or rejected Gate 4 request is written to the existing append-only audit table with identifiers, hashes, timestamps, and an outcome. Private keys, request signatures, and payload contents are not written to logs or audit summaries.

## Required server secrets

Configure these server-side only through the WebDev secret manager or deployment environment:

- `ATMOS_OPERATOR_KEY_REFERENCE` — stable reference for the operator public key.
- `ATMOS_OPERATOR_PUBLIC_KEY` — single-line base64-encoded Ed25519 SPKI DER public key. PEM remains accepted by the loader for local development.
- `ATMOS_CONTROL_PLANE_PRIVATE_KEY` — single-line base64-encoded Ed25519 PKCS#8 DER private key used only to sign receipts. PEM remains accepted by the loader for local development.

Private keys are never accepted through HTTP, browser fields, query parameters, or JSON bodies.

## Current live posture

The live preview status endpoint currently reports:

```json
{
  "challengeEndpoint": "configured",
  "operatorVerification": "configured",
  "controlPlaneSigning": "configured",
  "mutationPolicy": "NOOP_ONLY",
  "replayProtection": "durable",
  "externalMutation": "DISABLED"
}
```

The server-side signing configuration is now loaded and validated. Gate 4 remains intentionally NOOP-only until a valid externally signed operator request produces a receipt whose control-plane signature is independently verified. The operator private key is never configured on ARCHANGEL.

## Transition path for active mutation

There is no environment-variable switch that activates infrastructure mutation. `GATE4.mutationPolicy` is deliberately `NOOP_ONLY`, and `/mutate` calls `authorizeNoop`. A safe transition requires a separate reviewed implementation: define a narrow allowlist of reversible application operations, add an operation-specific schema and handler, preserve dual authorization and replay/audit checks, require an explicit operator approval envelope, implement precondition and rollback receipts, and add adversarial tests for unauthorized operations, stale approvals, replay, target confusion, and rollback failure. Only after those tests pass should a separately checkpointed change replace the NOOP-only handler; arbitrary shell, firewall, credential, and infrastructure mutation must remain prohibited.
