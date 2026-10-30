# ARCHANGEL ATMOS canonical cutover

Initial cutover: 2026-10-28
Reconciled: 2026-10-30

ARCHANGEL now consumes the supplied ATMOS-1.1.1 cutover values, with the ARCHANGEL record formally promoted to the newer live signed values as a public verification registry. The implementation distinguishes four public fields and never collapses them into one identity hash:

- `publicKeyFingerprintSha256`: SHA-256 of the Ed25519 SPKI public key.
- `manifestPayloadSha256`: the signed manifest payload identifier published by the node.
- `artifactSha256`: the measured artifact hash named by signed health.
- runtime receipt evidence: separately stored status receipts and audit records.

The canonical roster is exactly 11 nodes: Root-Gate, Tesseract-Terminus, XinUS-Clarity, Monarch-OS, Tesseract Mirror/Tesseract-A, KEIRA, VALKYRIE, ARCHANGEL, Project Reclaim, IWA-SAGE, and Resonate Earth. Exitus Lens remains planned and is not silently promoted into the canonical 11.

## Implementation

- `shared/atmos.ts` is the typed source of truth for the ATMOS-1.1.1 public values.
- `manifests/node-identity-registry.json` contains the machine-readable canonical roster and the promoted live hashes.
- `client/public/.well-known/archangel-node-directory.json` publishes the same roster from ARCHANGEL’s public surface.
- `server/archangel.ts` exposes canonical identity fields alongside, but distinctly from, stored runtime receipts.
- `client/src/pages/AtmosPage.tsx` shows the canonical ATMOS boundary and separates attested identity status from live receipt evidence.
- `launch/verify-node-directory.py` performs read-only HTTPS verification of the manifest fingerprint, manifest payload identifier, Ed25519 signature, signed health signature, manifest CID, and artifact hash.

## Formal reconciliation

The live ARCHANGEL manifest and signed health response were fetched again on 2026-10-30. The public key fingerprint remained unchanged, the manifest signature remained valid, the signed health status was `ok`, and the live signed health `manifestCid` matched the live manifest payload hash.

The following values are now formally promoted in the typed registry, machine-readable registry, and published node directory:

- `manifestPayloadSha256`: `26b3bf7b6a118ed8d191aae4550b35a157e9c361bc186bd4dd241d590b516780`
- `artifactSha256`: `651d1805a7da2f5907657d2a48f0be28572e8c25d86075f09ee5c11cfa6ee2d4`

The superseded cutover values remain preserved in the prior verification report and history: manifest `f65be7bf2d03cb719889a2fdac8f9c734d825cfa95a2bb1abdcdf8c95d7b4b2c` and artifact `05c780ea17cc1f9864d79bca2f50e0aa46bd640fd696f7431262fbed8cd4bdc1`.

The complete post-promotion machine-readable result is `docs/ARCHANGEL_ATMOS_PUBLIC_VERIFICATION_2026-10-30.json`. The reconciled roster now verifies 11 of 11 canonical endpoints.

No private keys were imported, no node was mutated, and no DNS or remote host was changed by this cutover implementation.
