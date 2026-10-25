# ARCHANGEL ATMOS Gate 4

ARCHANGEL now exposes a fail-closed, receipt-backed authorization boundary for the control plane. Gate 4 permits `NOOP` plus one bounded active operation: `SET_CONTROL_PLANE_MODE`, which changes only ARCHANGEL's own durable `ready`/`maintenance` state. It does not provide shell execution, remote access, credential retrieval, node mutation, or unrestricted command APIs.

## HTTP contract

- `POST /authority/challenge` issues a single-use, 60-second Ed25519 challenge.
- `POST /mutate` accepts the exact `NEXINUS_ATMOS_MUTATION_REQUEST/v1` envelope with `targetNodeId: ARCHANGEL` and either `operation: NOOP` or `operation: SET_CONTROL_PLANE_MODE`.
- `GET /authority/status` exposes posture/configuration only.

The mutation path validates the operator public key, signature, key reference, challenge and nonce binding, request timestamps, payload hash, operation, replay state, and durable challenge consumption. A `NOOP` returns an `ACCEPTED_NOOP` receipt. `SET_CONTROL_PLANE_MODE` returns an `APPLIED` receipt containing the previous mode, new mode, and rollback operation. It changes only ARCHANGEL's own durable state.

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
  "mutationPolicy": "NOOP_OR_CONTROL_PLANE_STATE_V1",
  "replayProtection": "durable",
  "externalMutation": "DISABLED"
}
```

The server-side signing configuration is now loaded and validated. Gate 4 is active only for the bounded control-plane state operation described above. The operator private key is never configured on ARCHANGEL.

## Transition path for active mutation

There is no environment-variable switch that activates infrastructure mutation. The implemented transition is deliberately narrow: an operation-specific payload, a durable state table, an allowlisted handler, previous/new state in the receipt, explicit rollback by sending the inverse mode, and adversarial tests for signatures, payload tampering, expiry, replay, and forbidden operations. Any future node or application mutation would require another separately reviewed handler with target enrollment, preconditions, rollback, and post-execution evidence; arbitrary shell, firewall, credential, and infrastructure mutation remains prohibited.
