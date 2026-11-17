# ARCHANGEL All-Node Enrollment and Verification Runbook

This runbook enrolls each runtime through the same bounded contract used by VALKYRIE:

1. The node keeps its own Ed25519 private key.
2. ARCHANGEL stores only the node's public key, endpoint, and approved scope.
3. ARCHANGEL issues a five-minute, single-use challenge.
4. The node signs a canonical health receipt locally.
5. ARCHANGEL verifies the nonce, timestamps, public-key binding, Ed25519 signature, and replay state.
6. A verified receipt becomes durable node evidence and an append-only audit event.

This is signed status enrollment, not SSH access, arbitrary shell access, firewall control, or remote execution. A node is not considered verified because its URL answers HTTP or because a public site exists; it is verified only after ARCHANGEL accepts a real signed receipt.

## Current node matrix

| Node ID | Display name | Current posture | Enrollment action |
|---|---|---|---|
| `root-gate` | Root-Gate | Declared running, pending | Register the public key, then submit a receipt from the Root-Gate runtime |
| `tesseract-terminus` | Tesseract-Terminus / Sovereign Provenance Console | Declared running, pending | Register the public key, then submit a receipt |
| `xinus-clarity` | XinUS-Clarity | Declared running, pending | Register the public key, then submit a receipt |
| `kether-gate` | Monarch-OS | Declared running, pending | Register the public key, then submit a receipt |
| `tesseract-a` | Tesseract-A | Declared running, pending | Register the public key, then submit a receipt |
| `keira` | KEIRA | Declared running, pending | Register the public key, then submit a receipt |
| `project-reclaim` | Project Reclaim | Declared running, pending | Register the public key, then submit a receipt |
| `iwa-sage` | IWA Sage | Declared running, pending | Register the public key, then submit a receipt |
| `resonate-earth` | Resonate Earth | Planned; physical host unplaced | Do not enroll until a real runtime host exists |
| `exitus-lens` | Exitus Lens | Planned; physical host unplaced | Do not enroll until a real runtime host exists |
| `valkyrie-adjudication-entity` | VALKYRIE Adjudication Entity | **Verified** | First real receipt accepted; use it as the reference implementation |

The node IDs above are exact and case-sensitive. `kether-gate` is the node ID for the Monarch-OS role.

## 0. Constants

Run these on an operator workstation or node shell. Use the currently deployed ARCHANGEL base URL:

```bash
export ARCHANGEL_BASE='https://archangel.nexinus.net'
```

For production operations, replace it with the approved stable ARCHANGEL domain after that domain is confirmed to serve the same API contract.

## 1. Install the key-safe signer on a node

Use a trusted copy of `launch/submit-atmos-node-receipt.mjs` from the ARCHANGEL project. Do not download a JavaScript file from a custom domain that returns the application HTML shell. From an operator workstation with the ARCHANGEL checkout:

```bash
scp launch/submit-atmos-node-receipt.mjs \
  root@NODE_HOST:/usr/local/sbin/submit-atmos-node-receipt.mjs

ssh root@NODE_HOST \
  'chmod 0755 /usr/local/sbin/submit-atmos-node-receipt.mjs && node --check /usr/local/sbin/submit-atmos-node-receipt.mjs'
```

Node 18 or newer is required because the helper uses built-in `fetch`, Ed25519 signing, and base64url signatures.

## 2. Preserve or create the node key

If the node already has a signing key used by its runtime, use that key. Do not generate a replacement just to make a fingerprint match. The public key must correspond to the private key that the runtime actually uses.

If the node has no identity key yet, create one locally on that node:

```bash
install -d -m 700 /etc/archangel/identity
umask 077
openssl genpkey -algorithm Ed25519 \
  -out /etc/archangel/identity/receipt-private.pem
chmod 600 /etc/archangel/identity/receipt-private.pem
```

Derive a public key and non-secret fingerprint:

```bash
openssl pkey \
  -in /etc/archangel/identity/receipt-private.pem \
  -pubout \
  -out /tmp/archangel-receipt-public.pem

openssl pkey \
  -in /etc/archangel/identity/receipt-private.pem \
  -pubout -outform DER 2>/dev/null \
  | sha256sum
```

Share only `/tmp/archangel-receipt-public.pem` and the fingerprint with the ARCHANGEL operator. Never share the private PEM, a base64 private key, shell history containing secrets, or a complete environment dump.

## 3. Register the public key before submitting a receipt

For every node except the already-registered VALKYRIE integration, the operator must create or update an application integration record in the authenticated ARCHANGEL console. The registration must bind:

- the exact node/application ID from the matrix;
- the node's real public endpoint;
- the node's public Ed25519 PEM;
- the minimum approved scope, normally `read:health`;
- an explicit operator audit event.

Do not submit a receipt before registration. The challenge route will return `unknown_node` or the receipt will fail with a public-key mismatch if the registration is absent or stale.

After registration, verify the binding without exposing the key:

```bash
curl --fail --silent --show-error \
  -X POST "$ARCHANGEL_BASE/v1/atmos/nodes/NODE_ID/challenge" \
  -H 'content-type: application/json' \
  -d '{}' \
| python3 -m json.tool
```

The response includes `registeredPublicKeyFingerprint`. Compare it with the fingerprint derived locally from the node's private key. Do not continue until they match.

## 4. Submit a real receipt from each runtime

Run this on the actual node runtime, not from the ARCHANGEL sandbox. Set the path to the key that the runtime owns and uses:

```bash
export ATMOS_NODE_PRIVATE_KEY_FILE='/absolute/path/to/the/node-receipt-private.pem'
export NODE_ID='root-gate'                 # replace with one exact ID
export NODE_VERSION='actual-runtime-version'
export NODE_STATUS='ok'                    # use degraded/not_ready when truthful
export NODE_CAPABILITIES='health.check'

node /usr/local/sbin/submit-atmos-node-receipt.mjs \
  "$ARCHANGEL_BASE" \
  "$NODE_ID" \
  "$NODE_VERSION" \
  "$NODE_STATUS" \
  "$NODE_CAPABILITIES"
```

Do not type angle brackets. They are placeholders, not shell syntax. The helper requests its own fresh challenge, signs locally, submits the receipt, redacts the signature in its output, and exits non-zero on rejection.

Use additional capabilities only when the runtime really provides them, for example:

```bash
export NODE_CAPABILITIES='health.check,receipt.emit'
```

Do not claim `deploy`, `shell`, `firewall`, `mesh.activate`, or other execution capability merely because the node is reachable. The receipt describes observed runtime facts, not desired authority.

## 5. Per-node command blocks

After registering and verifying each public-key fingerprint, use one block on the corresponding runtime:

```bash
# Root-Gate
NODE_ID='root-gate'; NODE_VERSION='actual-root-gate-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Tesseract-Terminus / Sovereign Provenance Console
NODE_ID='tesseract-terminus'; NODE_VERSION='actual-tesseract-terminus-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# XinUS-Clarity
NODE_ID='xinus-clarity'; NODE_VERSION='actual-xinus-clarity-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Monarch-OS / Kether-Gate
NODE_ID='kether-gate'; NODE_VERSION='actual-monarch-os-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Tesseract-A
NODE_ID='tesseract-a'; NODE_VERSION='actual-tesseract-a-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# KEIRA
NODE_ID='keira'; NODE_VERSION='actual-keira-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Project Reclaim
NODE_ID='project-reclaim'; NODE_VERSION='actual-project-reclaim-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# IWA Sage
NODE_ID='iwa-sage'; NODE_VERSION='actual-iwa-sage-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"
```

For Resonate Earth and Exitus Lens, do not run an enrollment command until a real runtime host, key, endpoint, and version exist. A public URL or design record is not sufficient evidence.

## 6. Expected success response

Every accepted receipt returns HTTP 201 and a response shaped like:

```json
{
  "schema": "NEXINUS_ATMOS_RECEIPT_ACCEPTED/v1",
  "accepted": true,
  "nodeId": "root-gate",
  "applicationId": "root-identity",
  "receiptHash": "sha256:<hash>",
  "observedAt": "<timestamp>",
  "verifiedAt": "<timestamp>",
  "freshnessThresholdSeconds": 300
}
```

Record the redacted output and receipt hash in the change record. The private key must never appear in the record.

## 7. Failure map

- `unknown_node` / HTTP 404: the exact node ID is not in the ARCHANGEL registry, or the registration has not been created.
- `receipt_invalid` / signature verification failed: the runtime private key does not match the registered public key. Compare fingerprints; do not generate a replacement blindly.
- `receipt_invalid` / validity window exceeds five minutes: the node clock or signer is wrong. Use the current signer, which uses the server-issued `expiresAt`, and check NTP.
- `replay` / HTTP 409: do not reuse a challenge. Rerun the signer so it requests a fresh challenge.
- `expired` / HTTP 400: request a fresh challenge and check clock skew.
- `scope` or registration error: update the integration record through the authenticated operator workflow; do not bypass registration with a public write endpoint.

## 8. Completion criteria

A node is completely verified only when all of these are true:

- its exact node ID is registered;
- the live runtime's public-key fingerprint matches ARCHANGEL's registered fingerprint;
- the runtime submits a real challenge-bound receipt;
- ARCHANGEL returns HTTP 201 with `accepted: true`;
- the database contains `verificationState=verified`, `reachability=reachable`, the real version, and the receipt hash;
- the ATMOS Evidence panel shows the node as `VERIFIED` and the receipt is fresh;
- the append-only audit log contains `receipt.recorded`.

A verified receipt does not grant execution authority. Execution remains governed by the separate bounded mutation and operator-approval contracts.
