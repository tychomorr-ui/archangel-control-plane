# ARCHANGEL ATMOS canonical cutover

Date: 2026-10-28

ARCHANGEL now consumes the supplied ATMOS-1.1.1 cutover values as a public verification registry. The implementation distinguishes four public fields and never collapses them into one identity hash:

- `publicKeyFingerprintSha256`: SHA-256 of the Ed25519 SPKI public key.
- `manifestPayloadSha256`: the signed manifest payload identifier published by the node.
- `artifactSha256`: the measured artifact hash named by signed health.
- runtime receipt evidence: separately stored status receipts and audit records.

The canonical roster is exactly 11 nodes: Root-Gate, Tesseract-Terminus, XinUS-Clarity, Monarch-OS, Tesseract Mirror/Tesseract-A, KEIRA, VALKYRIE, ARCHANGEL, Project Reclaim, IWA-SAGE, and Resonate Earth. Exitus Lens remains planned and is not silently promoted into the canonical 11.

## Implementation

- `shared/atmos.ts` is the typed source of truth for the ATMOS-1.1.1 public values.
- `manifests/node-identity-registry.json` contains the machine-readable canonical roster and the supplied hashes.
- `client/public/.well-known/archangel-node-directory.json` publishes the same roster from ARCHANGEL’s public surface.
- `server/archangel.ts` exposes canonical identity fields alongside, but distinctly from, stored runtime receipts.
- `client/src/pages/AtmosPage.tsx` shows the canonical ATMOS boundary and separates attested identity status from live receipt evidence.
- `launch/verify-node-directory.py` performs read-only HTTPS verification of the manifest fingerprint, manifest payload identifier, Ed25519 signature, signed health signature, manifest CID, and artifact hash.

## Independent live check

The updated verifier was run against the 11 canonical HTTPS loci. Current result:

- 10 verified live.
- 1 drifted: `https://archangel.nexinus.net`.

The ARCHANGEL public key fingerprint matches the supplied value, but its currently served manifest and health artifact are newer/different than the supplied cutover record:

- Expected manifest payload: `f65be7bf2d03cb719889a2fdac8f9c734d825cfa95a2bb1abdcdf8c95d7b4b2c`
- Live manifest payload: `26b3bf7b6a118ed8d191aae4550b35a157e9c361bc186bd4dd241d590b516780`
- Expected artifact: `05c780ea17cc1f9864d79bca2f50e0aa46bd640fd696f7431262fbed8cd4bdc1`
- Live signed health artifact: `651d1805a7da2f5907657d2a48f0be28572e8c25d86075f09ee5c11cfa6ee2d4`

The live ARCHANGEL manifest signature and health status are otherwise valid, and its public key fingerprint matches. This is recorded as a reconciliation/drift condition, not silently changed to green. The complete machine-readable result is in `docs/ARCHANGEL_ATMOS_PUBLIC_VERIFICATION_2026-10-28.json`.

No private keys were imported, no node was mutated, and no DNS or remote host was changed by this cutover implementation.
