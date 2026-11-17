# Valkyrie ATMOS Enrollment Contract

ARCHANGEL now exposes a challenge-bound node receipt contract:

1. `POST /v1/atmos/nodes/valkyrie-adjudication-entity/challenge`
2. Valkyrie signs the canonical receipt with its registered Ed25519 private key.
3. `POST /v1/atmos/nodes/valkyrie-adjudication-entity/receipts` with `{ challengeId, receipt }`.

The challenge is durable, node-bound, single-use, and valid for five minutes. ARCHANGEL checks the registered application identity, nonce, timestamps, maximum receipt window, canonical field order, Ed25519 signature, and replay state before recording `node_status_reports` and append-only audit events.

The local helper is `launch/submit-atmos-node-receipt.mjs`. It reads the private key only from `ATMOS_NODE_PRIVATE_KEY_FILE`, never prints it, redacts the returned signature, and accepts an explicit runtime status rather than inventing one. Run it from the real Valkyrie runtime only after its private key is available there:

```bash
ATMOS_NODE_PRIVATE_KEY_FILE=/secure/valkyrie/private.pem \
node launch/submit-atmos-node-receipt.mjs \
  https://archangel.nexinus.net \
  valkyrie-adjudication-entity \
  <runtime-version> \
  <ok|degraded|not_ready> \
  <capability-one,capability-two>
```

A challenge was successfully issued for the registered Valkyrie integration, and the signer was run from the actual Valkyrie droplet. The first real receipt returned HTTP 201 and was persisted as verified with receipt hash `sha256:a12419371ab5616fe17ac7664942257dc2b3ef015a585715424ba2ebdc4d43c4`. Valkyrie enrollment is complete; the remaining declared nodes are still pending.

## Thresholds

- Challenge lifetime: 5 minutes.
- Maximum receipt validity window: 5 minutes.
- UI freshness alert: 15 minutes after `issuedAt`.
- `fresh`: receipt age at or below 15 minutes.
- `stale`: receipt age above 15 minutes.
- `missing`: no stored receipt.

The UI's verified node statistics are derived only from stored receipt and audit data. External telemetry streams must be added as signed, named sources before they can populate an Atmos layer.
