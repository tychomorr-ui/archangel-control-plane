# ARCHANGEL Gate 5A — `REFRESH_SIGNED_STATUS`

## Status

This milestone is **staging-only**. It adds an operation-specific conductor contract and isolated tests. It does not add a production route, change production registrations, restart production services, rotate keys, or enable production node authority.

Current gate result: **`GATE_5A=BLOCKED`** for production promotion. The staging contract and tests pass, but the actual node-side runtime adapter, durable request-consumption store, and node-signed failure receipts must be integrated and independently verified before this operation can be enabled against a real node.

## Architecture map

- **Operator authorization:** existing Gate 4 challenge/signature boundary. The staging dispatch carries an explicit `operatorKeyReference` and `authorizationContext`.
- **Dispatch signer:** ARCHANGEL signs the canonical dispatch hash. ARCHANGEL does not receive or store the operator private key.
- **Target identity:** the dispatch binds `targetNodeId` to the registered node identity.
- **Node identity:** the node adapter signs the result with the node private key; ARCHANGEL verifies against the registered public key.
- **Replay and freshness:** the envelope binds `requestId`, `challengeId`, `nonce`, `issuedAt`, and `expiresAt`. The staging contract rejects expired or overlong windows and altered hashes.
- **Receipt verification:** ARCHANGEL checks schema, request ID, dispatch ID, operation, target, original dispatch hash, challenge ID, receipt hash, timestamp, and node signature.
- **Audit:** the conductor emits separate authorization, dispatch, execution, receipt, and final-decision evidence classes. Authorization is not represented as observation.
- **Node-side extension point:** `RefreshNodeAdapter.refreshSignedStatus()` is the only staging execution interface. There is no generic execute/command/shell/SSH abstraction.

## Contract

- Operation: `REFRESH_SIGNED_STATUS`
- Contract: `ARCHANGEL_REFRESH_SIGNED_STATUS/v1`
- Required scope: `read:health`
- Target: one exact registered node identity
- Permitted side effect: read-only status observation and evidence production
- Forbidden side effects: application mutation, deployment, restart, firewall/network changes, credential access, shell, SSH, subprocess, or cross-node commands
- Idempotency: `requestId` and `challengeId` are bound into the dispatch and receipt. A durable production adapter must reject a previously consumed pair before node execution.
- Failure: bounded failure receipt/evidence with a specific reason; no fallback authority.
- Timeout: abort signal is passed to the node-side adapter and is converted to a bounded timeout decision.

## Dispatch envelope

```ts
{
  schema: "ARCHANGEL_REFRESH_SIGNED_STATUS/v1",
  dispatchId: string,
  requestId: string,
  challengeId: string,
  nonce: string,
  issuedAt: string,
  expiresAt: string,
  archangelNodeId: "ARCHANGEL",
  targetNodeId: string,
  operation: "REFRESH_SIGNED_STATUS",
  contractVersion: "1",
  requiredScope: "read:health",
  operatorKeyReference: string,
  authorizationContext: "operator-approved",
  payload: {
    requestedFields: ["status", "version", "capabilities"],
    reason: string
  },
  payloadHash: "sha256:<64 lowercase hex>",
  dispatchHash: "sha256:<64 lowercase hex>",
  dispatchSignature: string
}
```

The signature covers the deterministic dispatch hash. The hash covers every dispatch field except `dispatchHash` and `dispatchSignature`.

## Receipt envelope

```ts
{
  schema: "ARCHANGEL_REFRESH_SIGNED_STATUS_RECEIPT/v1",
  receiptId: string,
  requestId: string,
  dispatchId: string,
  operation: "REFRESH_SIGNED_STATUS",
  targetNodeId: string,
  success: boolean,
  result: {
    status: "ok" | "degraded" | "not_ready",
    version: string,
    capabilities: string[],
    evidenceHash: string,
    observedAt: string
  } | null,
  failureReason: string | null,
  executionStartedAt: string,
  executionCompletedAt: string,
  originalDispatchHash: string,
  signerIdentity: string,
  nodePublicKeyFingerprint: string,
  challengeId: string,
  receiptHash: "sha256:<64 lowercase hex>",
  nodeSignature: string
}
```

## Test gate

The isolated suite covers:

- valid signed dispatch and signed node receipt
- payload, target, operation, scope, and dispatch-hash tampering
- expired dispatch
- invalid signer
- receipt binding verification
- explicit absence of generic command, subprocess, SSH, or shell interfaces

## Production boundary

`GATE_5A` is not promoted to production by this milestone. The real node-side contract still requires a separately reviewed adapter in the target application runtime. No production node registration or production service was modified. The staging suite is evidence of the ARCHANGEL-side contract behavior, not proof that a deployed external node can execute it.
