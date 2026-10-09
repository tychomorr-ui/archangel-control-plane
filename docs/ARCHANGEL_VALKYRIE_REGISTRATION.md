

## First receipt submission attempt — 2026-10-03

A real receipt was **not submitted**. The public Valkyrie application was inspected directly:

- The Command Center reports `Registered Service Nodes: 0`.
- Its readiness checks report only that the application contract is available; they do not produce a signed health receipt.
- The public route and tested candidate API paths did not expose a stable receipt-submission endpoint.
- The deployed bundle references a local deterministic receipt layer and a tRPC client, but no callable external signed-health-receipt submission contract was identified from the public surface.

ARCHANGEL therefore did not sign or ingest an operator-created payload. This preserves the requirement that the first accepted receipt must originate from the Valkyrie runtime, use its protected Ed25519 private key, and be traceable to a real application execution. No `nodeStatusReports` or `receipt.recorded` audit event was created by this attempt.

**Required unblock:** provision a Valkyrie service-node registration and a server-side receipt emitter/endpoint (or provide the authenticated integration contract) before retrying. Once available, the receipt must contain the canonical `applicationId`, `nodeId`, `status`, `version`, `issuedAt`, `expiresAt` (maximum five-minute window), `nonce`, sorted `capabilities`, and an Ed25519 signature using the registered key.
