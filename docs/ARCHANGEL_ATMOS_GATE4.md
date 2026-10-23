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
- `ATMOS_OPERATOR_PUBLIC_KEY` — PEM-encoded Ed25519 public key.
- `ATMOS_CONTROL_PLANE_PRIVATE_KEY` — PEM-encoded Ed25519 private key used only to sign receipts.

Private keys are never accepted through HTTP, browser fields, query parameters, or JSON bodies.

## Current live posture

The live preview status endpoint currently reports:

```json
{
  "challengeEndpoint": "unconfigured",
  "operatorVerification": "unconfigured",
  "controlPlaneSigning": "unconfigured",
  "mutationPolicy": "NOOP_ONLY",
  "replayProtection": "durable",
  "externalMutation": "DISABLED"
}
```

This is correct and fail-closed until the two key materials and the operator key reference are configured. Gate 4 must not be labeled live until a valid signed NOOP request produces a receipt whose control-plane signature is independently verified.
