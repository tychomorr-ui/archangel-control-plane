# GitHub ATMOS Signing Audit

**Date:** 2026-10-27  
**Scope:** Tesseract-A signing and receipt protocol versus the live ARCHANGEL verification contract  
**Repositories reviewed:**

- `tychomorr-ui/XINUS-Tesseract-A`
- `tychomorr-ui/tesseract-a-core`
- `tychomorr-ui/nexinus-bootstrap`

## Finding

The GitHub repositories contain a revised ATMOS signing design, but they do not provide evidence that all eleven ARCHANGEL nodes have been verified. The strongest source, `XINUS-Tesseract-A`, explicitly states that its protocol implementation does not claim all eleven nodes implement the contract and that the other ten applications must consume the contract in their own repositories and deployments.

The repository’s operator input also labels the listed nodes as `AWAITING_SIGNED_PUBLIC_MANIFEST_AND_AUTHORIZATION`. Those are declarations and expected identity hashes, not accepted ARCHANGEL receipts.

The live ARCHANGEL database currently contains one accepted signed status receipt:

- `valkyrie-adjudication-entity`
- `verificationState=verified`
- receipt hash `sha256:a12419371ab5616fe17ac7664942257dc2b3ef015a585715424ba2ebdc4d43c4`

No persisted receipt rows were found for the other declared nodes during the live verification query.

## Protocols found in GitHub

### ATMOS Gate 1 signed health

`XINUS-Tesseract-A/server/atmos-health.ts` implements a signed `GET /health` response with this shape:

```json
{
  "schema": "NEXINUS_ATMOS_SIGNED_HEALTH/v1",
  "nodeId": "...",
  "status": "ok",
  "version": "...",
  "uptime": 1234,
  "manifestCid": "sha256:...",
  "codeHash": "sha256:...",
  "serviceKeyReference": "...",
  "observedAt": "...",
  "serviceSignature": "base64-ed25519-signature"
}
```

The signature is Ed25519 over recursively key-sorted canonical JSON with `serviceSignature` omitted. The endpoint fails closed with HTTP 503 when the signing key, manifest CID, artifact hash, artifact file, or artifact match is unavailable.

### ATMOS Gate 2 signed manifest integrity

The repository defines `NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v2`. It binds an Ed25519 public key to an identity hash, manifest CID, exact artifact hash, canonical URL, role, region, and capabilities. The manifest boundary is explicitly `SIGNATURE_PROVES_CONTROL_OF_KEY_ONLY`.

Gate 2 requires the signed manifest’s `integrity.manifestCid` to equal the health response’s `manifestCid`, and the signed manifest’s `integrity.artifactHash` to equal the health response’s `codeHash` and the locally computed running artifact hash.

### ATMOS HEAD probe receipt

`XINUS-Tesseract-A/scripts/atmos-sync-all.mjs` creates `NEXINUS_ATMOS_HEAD_PROBE_RECEIPT/v1` records after operator-authorized HTTPS `HEAD` probes. These records contain a `receiptReference` and `receiptHash`, but their boundary is explicitly `READ_ONLY_HEAD_OBSERVATION_NOT_IDENTITY_AUTHORITY`. They are not signed node-health receipts and cannot prove node identity by themselves.

### Tesseract-A / GitHub node set

The synchronization script enumerates these eleven identifiers:

```text
ROOT-GATE
TESSERACT-TERMINUS
XINUS-CLARITY
MONARCH-OS
TESSERACT-A
KEIRA
VALKYRIE
ARCHANGEL
PROJECT-RECLAIM
IWA-SAGE
RESONATE-EARTH
```

This set differs from ARCHANGEL’s declared registry: it includes `ARCHANGEL` and does not include `EXITUS-LENS`. That difference must be resolved before aggregate counts can be compared.

## Compatibility with live ARCHANGEL

ARCHANGEL’s current public receipt route expects a challenge-bound payload:

```json
{
  "applicationId": "...",
  "nodeId": "...",
  "status": "ok | degraded | not_ready",
  "version": "...",
  "issuedAt": "...",
  "expiresAt": "...",
  "nonce": "...",
  "capabilities": ["..."],
  "signature": "base64url-ed25519-signature"
}
```

ARCHANGEL signs the challenge to the node, verifies the nonce and five-minute freshness window, canonicalizes the fixed field order, verifies the signature against the registered application public key, consumes the challenge once, and persists the verified status row and `receipt.recorded` audit event.

The GitHub Gate 1 health payload does not contain `applicationId`, `expiresAt`, or a challenge nonce. It uses `uptime`, `manifestCid`, `codeHash`, `serviceKeyReference`, `observedAt`, and `serviceSignature`, with a different canonicalization and base64 signature contract. Therefore, the new GitHub health receipts are **not wire-compatible** with the current ARCHANGEL `/v1/atmos/nodes/:nodeId/receipts` endpoint.

## Required next implementation

To use the GitHub protocol without weakening verification, ARCHANGEL needs a separate, explicit adapter rather than a database update:

1. Register one exact node ID, endpoint, public key, and signed-manifest identity hash.
2. Fetch only the approved HTTPS `/health` endpoint after operator authorization.
3. Verify the signed manifest, identity hash, payload hash, and Ed25519 signature.
4. Verify the signed health payload, artifact hash, manifest CID, timestamp, and service signature.
5. Create a new versioned ARCHANGEL evidence record that identifies the source contract as `NEXINUS_ATMOS_SIGNED_HEALTH/v1`.
6. Preserve the distinction between read-only HEAD probe evidence and cryptographically verified signed health evidence.
7. Keep nodes with missing manifests, missing keys, mismatched hashes, or stale health responses in `pending` or `rejected` state.

No adapter was enabled during this audit, and no unverified receipt was promoted.

## Audit conclusion

The GitHub work is real and materially improves the signing design. It does not, based on the reviewed files, prove that all eleven nodes are verified, and it does not match ARCHANGEL’s current challenge-bound receipt wire format. The truthful current state remains one accepted ARCHANGEL receipt, with the revised ATMOS protocol ready for a separately implemented and tested ingestion adapter.

## Evidence locations

- `XINUS-Tesseract-A/docs/atmos-gates-1-to-3-protocol.md`
- `XINUS-Tesseract-A/server/atmos-health.ts`
- `XINUS-Tesseract-A/server/atmos-manifest.ts`
- `XINUS-Tesseract-A/scripts/atmos-sync-all.mjs`
- `XINUS-Tesseract-A/manifests/atmos-1.1.1/atmos-operator-input.json`
- ARCHANGEL `server/nodeReceiptRoutes.ts`
- ARCHANGEL `server/conductor.ts`
