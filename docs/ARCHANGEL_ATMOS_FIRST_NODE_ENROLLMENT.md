# ATMOS First-Node Enrollment Status

## Candidate

The first candidate is the already registered Valkyrie Adjudication Entity integration (`xinusdash-doy5g86k.manus.space`). Its endpoint and public-key binding are recorded in ARCHANGEL's application integration registry, but application registration is not the same as node enrollment.

## Current result

The first real challenge-bound receipt was accepted on 2026-10-26. ARCHANGEL verified the droplet-held Ed25519 key, challenge nonce, canonical payload, freshness window, and signature, then persisted a verified `nodeStatusReports` row and append-only `receipt.recorded` audit event.

- `nodeId`: `valkyrie-adjudication-entity`
- `applicationReadiness`: `ready`
- `reachability`: `reachable`
- `verificationState`: `verified`
- `version`: `1.0.0`
- `receiptHash`: `sha256:a12419371ab5616fe17ac7664942257dc2b3ef015a585715424ba2ebdc4d43c4`

The other declared nodes remain pending until each provides its own real challenge-bound receipt.

## Required contract to complete enrollment

Valkyrie must expose an authenticated, challenge-bound receipt endpoint or agent flow that:

- proves possession of the registered Ed25519 private key;
- accepts an ARCHANGEL challenge and returns the canonical application/node identity;
- emits `status`, `version`, `issuedAt`, `expiresAt` (maximum five-minute window), `nonce`, sorted capabilities, and an Ed25519 signature;
- binds the receipt to the registered endpoint and public key;
- supports revocation and replay protection.

Once that real runtime contract exists, ARCHANGEL can perform enrollment, verify the first receipt, persist the signed status report, and display `verified` in the ATMOS matrix. Until then, the Atmosphere control surface intentionally reports the node as pending.
