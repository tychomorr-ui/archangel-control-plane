# ATMOS First-Node Enrollment Status

## Candidate

The first candidate is the already registered Valkyrie Adjudication Entity integration (`xinusdash-doy5g86k.manus.space`). Its endpoint and public-key binding are recorded in ARCHANGEL's application integration registry, but application registration is not the same as node enrollment.

## Current result

A real signed status receipt was not accepted because the deployed Valkyrie surface does not currently expose a stable external service-node receipt endpoint or runtime emitter. The prior inspection found `Registered Service Nodes: 0` and no callable signed-health receipt contract. ARCHANGEL therefore remains correct to show Valkyrie as pending and has not created a fabricated `nodeStatusReports` row or `receipt.recorded` audit event.

## Required contract to complete enrollment

Valkyrie must expose an authenticated, challenge-bound receipt endpoint or agent flow that:

- proves possession of the registered Ed25519 private key;
- accepts an ARCHANGEL challenge and returns the canonical application/node identity;
- emits `status`, `version`, `issuedAt`, `expiresAt` (maximum five-minute window), `nonce`, sorted capabilities, and an Ed25519 signature;
- binds the receipt to the registered endpoint and public key;
- supports revocation and replay protection.

Once that real runtime contract exists, ARCHANGEL can perform enrollment, verify the first receipt, persist the signed status report, and display `verified` in the ATMOS matrix. Until then, the Atmosphere control surface intentionally reports the node as pending.
