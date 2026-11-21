# ARCHANGEL ↔ Tesseract-A Core Integration Boundary

**Status:** design and implementation boundary; no production connection or key movement performed  
**Canonical terms:** ARCHANGEL = control plane; ATMOS = signed environment/evidence contract; Tesseract-A Core = provenance probe/coordinator; Quantus = separate witness role; Pharo-Lapse = offline/queued transport layer.  
**Terminology rule:** the transport is **Pharo-Lapse** everywhere in code, receipts, documentation, and operator instructions.

## 1. What Tesseract-A Core currently is

The inspected private repository is `tychomorr-ui/tesseract-a-core`, revision `5b43dbc`.

Its current implementation does the following:

- probes explicitly configured HTTPS node targets;
- rejects redirects and does not retry automatically;
- verifies `NEXINUS_ATMOS_SIGNED_HEALTH/v1` using a configured public key;
- checks node identity, manifest CID, and artifact hash;
- emits `TESSERACT_A_HEALTH_RECEIPT/v1` after successful verification;
- binds its HTTP shell to `127.0.0.1` by default;
- keeps truth fidelity unavailable until a real signed receipt is verified.

The Tesseract-A Core implementation now includes a fail-closed local Ed25519 witness signer. Its generated `HealthReceipt` remains the embedded node observation, while the new `TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1` wrapper carries Tesseract-A’s separate signature. The private key is read only from `TESSERACT_A_WITNESS_PRIVATE_KEY_FILE`; it is never uploaded to ARCHANGEL.

The signer is an independently attestable witness layer, not a replacement for direct node receipt verification. This distinction must remain visible in the ARCHANGEL UI and audit trail.

## 2. The correct role separation

The desired ecosystem should use three distinct cryptographic roles:

### Tesseract-A Core: signer/coordinator role

Tesseract-A Core runs on the Tesseract-A host. It verifies signed health payloads from configured nodes and produces a canonical observation bundle. To become a trusted ARCHANGEL witness source, it must additionally sign that observation bundle with a Tesseract-A witness private key held only on the Tesseract-A host.

The Tesseract-A private key must never be uploaded to ARCHANGEL, Quantus, GitHub, a browser, or an environment pasted into chat. ARCHANGEL stores only the public key and its fingerprint.

### ARCHANGEL: control-plane verifier and audit authority

ARCHANGEL should not impersonate Tesseract-A Core or re-sign a Tesseract-A observation as though ARCHANGEL made the observation. ARCHANGEL should:

1. register Tesseract-A’s public witness key and exact endpoint;
2. issue a fresh challenge or request nonce;
3. receive a Tesseract-A-signed witness receipt;
4. verify the signature, challenge, timestamp, source identity, and evidence hashes;
5. store the receipt hash and verification outcome;
6. expose the evidence in the ATMOS panel and append-only audit log.

ARCHANGEL can separately verify each node’s own `NEXINUS_ATMOS_SIGNED_HEALTH/v1` receipt. A Tesseract-A witness receipt is an additional observation layer, not a replacement for node identity proof.

### Quantus: separate witness role

Quantus remains separate from Tesseract-A Core. It must have its own canonical node/application ID, public key, endpoint, evidence contract, and private key custody. Quantus must not share Tesseract-A’s private key, application identity, database, or signer process.

Quantus may independently witness selected evidence and sign a distinct witness receipt. ARCHANGEL can then compare independent witness receipts by hash and source identity. Quantus does not become the Tesseract-A signer merely because it observes the same node.

## 3. Current protocol mismatch

ARCHANGEL’s existing node receipt route accepts a body shaped as:

```json
{
  "challengeId": "...",
  "receipt": {
    "applicationId": "...",
    "nodeId": "...",
    "status": "ok",
    "version": "...",
    "issuedAt": "...",
    "expiresAt": "...",
    "nonce": "...",
    "capabilities": ["health.check"],
    "signature": "base64url-ed25519-signature"
  }
}
```

That route verifies the `receipt.signature` against the public key registered for the node/application integration and stores a verified `node_status_reports` row.

Tesseract-A Core currently emits a different object:

```json
{
  "schema": "TESSERACT_A_HEALTH_RECEIPT/v1",
  "nodeId": "...",
  "targetUrl": "https://...",
  "observedAt": "...",
  "responseHash": "sha256:...",
  "manifestCid": "sha256:...",
  "codeHash": "sha256:...",
  "serviceKeyReference": "...",
  "serviceSignatureVerified": true,
  "expectedManifestMatched": true,
  "expectedArtifactMatched": true,
  "boundary": "SIGNED_HEALTH_OBSERVATION_NOT_SERVICE_AUTHORITY"
}
```

The Tesseract-A receipt has no Tesseract-A signature field and is not accepted by ARCHANGEL’s node receipt route. Translating it into the node receipt shape would either discard its provenance meaning or require an unauthorized re-signing step. The correct solution is a separate versioned witness-receipt contract.

## 4. Target contract: Tesseract-A witness receipt

The proposed contract is intentionally separate from the node health receipt:

```json
{
  "schema": "TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1",
  "witnessNodeId": "tesseract-a",
  "applicationId": "tesseract-a",
  "challengeId": "ch_...",
  "nonce": "...",
  "issuedAt": "2026-11-19T00:00:00.000Z",
  "expiresAt": "2026-11-19T00:05:00.000Z",
  "observations": [
    {
      "nodeId": "valkyrie-adjudication-entity",
      "targetUrl": "https://valkyrie.nexinus.net/health",
      "responseHash": "sha256:...",
      "manifestCid": "sha256:...",
      "codeHash": "sha256:...",
      "serviceKeyReference": "...",
      "serviceSignatureVerified": true,
      "expectedManifestMatched": true,
      "expectedArtifactMatched": true
    }
  ],
  "observationSetHash": "sha256:...",
  "witnessKeyReference": "tesseract-a:witness",
  "boundary": "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY",
  "signature": "base64url-ed25519-signature"
}
```

The exact canonicalization is implemented in both projects and covered by a deterministic test vector. The signature covers all fields except `signature`, with sorted observation ordering and deterministic JSON. ARCHANGEL verifies:

- schema and witness identity;
- challenge ID and nonce;
- validity window and clock skew;
- observation-set hash;
- Tesseract-A public-key signature;
- each embedded node observation’s service signature status;
- manifest and artifact hash bindings;
- replay protection;
- the explicit non-authority boundary.

The receipt must not grant deployment, shell, firewall, credential, or arbitrary mutation authority.

## 5. Recommended integration flow

### Phase 1 — Preserve the current node path

Do not change the existing ARCHANGEL node receipt intake. Each runtime remains able to submit its own challenge-bound `NEXINUS_ATMOS_SIGNED_HEALTH/v1` receipt through the existing signer helper.

This provides direct node evidence:

```text
node runtime -> signed ATMOS health receipt -> ARCHANGEL node receipt intake
```

### Phase 2 — Tesseract-A Core witness signing locally

On the Tesseract-A host:

1. create or identify the Tesseract-A witness key owned by that host;
2. derive and publish only the public PEM and SHA-256 fingerprint;
3. keep the private PEM root-readable only on the Tesseract-A host;
4. call `POST /api/witness/receipt` on the loopback Tesseract-A Core runtime after all configured probes pass;
5. preserve rejected probe results as rejected evidence, never as healthy fallback values;
6. keep the runtime bound to loopback unless an authenticated private-overlay endpoint is explicitly added.

The signer must never sign a receipt for a node that Tesseract-A Core did not actually verify.

### Phase 3 — Register Tesseract-A as a witness integration

Through the authenticated ARCHANGEL operator workflow, register:

```text
applicationId: tesseract-a
nodeId:        tesseract-a
endpointUrl:   exact operator-controlled Tesseract-A endpoint
publicKeyPem:  Tesseract-A witness public PEM
scopes:        witness:health
status:        active only after fingerprint review
```

The current application atlas maps `tesseract-a` to the Tesseract-A node. The existing integration registration writes the public key, endpoint, scopes, active state, and an `integration.registered` audit event. It does not accept or store a private key.

### Phase 4 — Dedicated ARCHANGEL witness intake

The implementation provides `POST /v1/atmos/witnesses/tesseract-a/challenge` and `POST /v1/atmos/witnesses/tesseract-a/receipts`. Do not route this contract through the node receipt handler by changing the receipt shape.

The dedicated intake must:

- require an active Tesseract-A integration;
- issue or validate a five-minute single-use challenge;
- verify Tesseract-A’s signature;
- verify the observation-set hash;
- record a witness receipt hash and verification result;
- preserve each embedded observation as evidence metadata;
- write `witness.receipt.recorded` and `verification.outcome` audit events;
- reject replay, stale, mismatched, or unsigned receipts;
- avoid marking the observed node as directly verified solely because Tesseract-A observed it.

The ATMOS UI should display two separate states:

```text
Direct node receipt: VERIFIED / STALE / MISSING
Tesseract-A witness: VERIFIED / STALE / MISSING
```

A witness observation can corroborate direct evidence, but it must not silently replace it.

### Phase 5 — Add Quantus independently

Quantus now has a planned witness entry, reserved hostname, and an independently operator-confirmed public-key fingerprint (`c3e9568197203345e7094734515fd02e1a2ddfe3606e282541027d2bda70e9b7`). It remains un-enrolled: there is no active integration, ATMOS manifest/artifact binding, or live ARCHANGEL receipt intake. After the operator supplies and reviews the Quantus contract and endpoint evidence, Quantus can produce a distinct witness receipt over a defined observation set. ARCHANGEL may then show:

```text
Direct node evidence: 1
Tesseract-A witness: 1
Quantus witness: 1
Independent witnesses: 2
```

No quorum or “consensus” claim should be displayed until the threshold, distinct-key rule, freshness window, and disagreement behavior are implemented and tested.

### Phase 6 — Use Pharo-Lapse for offline forwarding where required

Pharo-Lapse is the queue/transport layer for disconnected or intermittently connected operation. It should carry signed witness receipts as opaque, content-addressed envelopes. It must not mutate the receipt or re-sign it while forwarding.

A Pharo-Lapse envelope should include at minimum:

- envelope schema and protocol version;
- source witness identity;
- destination ARCHANGEL identity;
- receipt hash;
- creation and expiry timestamps;
- sequence or replay identifier;
- the original signed receipt bytes;
- queue state and forwarding evidence.

ARCHANGEL verifies the original Tesseract-A signature after delivery. Queue forwarding is transport evidence, not witness authority.

## 6. Safe Tesseract-A Core validation commands

Run these on the Tesseract-A Core checkout before any integration work:

```bash
set -euo pipefail
cd /path/to/tesseract-a-core

pnpm check
pnpm test
pnpm validate:startup
```

The current startup posture should remain fail-closed:

```bash
curl --fail --silent http://127.0.0.1:4170/api/status | python3 -m json.tool
```

Expected characteristics include:

```json
{
  "project": "TESSERACT-A-CORE",
  "syntheticFallback": false,
  "truthFidelity": "UNAVAILABLE_WITHOUT_VERIFIED_RECEIPT"
}
```

Do not expose the unauthenticated `POST /api/probe` endpoint publicly. If ARCHANGEL must request a probe remotely, place it behind the private WireGuard address and add an authenticated, challenge-bound request contract first. The current loopback-only server is safer than adding an unauthenticated public route.

## 7. Key and signature inspection commands

On the Tesseract-A host, derive only public evidence:

```bash
KEY_FILE='/etc/tesseract-a/identity/witness-private.pem'

openssl pkey -in "$KEY_FILE" -noout
openssl pkey -in "$KEY_FILE" -pubout -out /tmp/tesseract-a-witness-public.pem
openssl pkey -in "$KEY_FILE" -pubout -outform DER 2>/dev/null | sha256sum
```

Do not print the private key, base64-encode it for transfer, or place it in ARCHANGEL environment variables.

On ARCHANGEL, compare only the registered public-key fingerprint with the fingerprint supplied by the Tesseract-A operator. A fingerprint mismatch is a hard stop.

## 8. What is and is not integrated today

### Already present

- ARCHANGEL verifies direct `NEXINUS_ATMOS_SIGNED_HEALTH/v1` node receipts.
- ARCHANGEL uses Ed25519 public-key bindings and five-minute challenge windows.
- Tesseract-A Core verifies signed ATMOS health payloads and artifact bindings.
- Tesseract-A Core emits a fail-closed `TESSERACT_A_HEALTH_RECEIPT/v1` observation.
- The two systems use compatible underlying Ed25519 verification primitives but different receipt contracts.

### Not yet present

- Tesseract-A Core does not currently sign its own witness receipt.
- ARCHANGEL does not currently have a dedicated Tesseract-A witness-receipt intake.
- Quantus is not declared in ARCHANGEL’s current source registries.
- There is no safe basis for a direct ARCHANGEL-to-Tesseract-A probe call while Tesseract-A’s `/api/probe` is loopback-bound and unauthenticated.
- Pharo-Lapse forwarding of witness receipts is not a live production connection in this repository.

## 9. Acceptance criteria for the integration milestone

The integration is complete only when all of the following are demonstrated in test scope and then on the approved hosts:

```text
[ ] Tesseract-A Core check, tests, and startup validation pass.
[ ] Tesseract-A witness key exists only on the Tesseract-A host.
[ ] ARCHANGEL stores only the Tesseract-A public key and fingerprint.
[ ] The witness receipt canonicalization has cross-project test vectors.
[ ] A fresh ARCHANGEL challenge is bound into the Tesseract-A witness receipt.
[ ] ARCHANGEL accepts HTTP 201 or equivalent success for the dedicated witness route.
[ ] A receipt replay is rejected.
[ ] A changed observation hash is rejected.
[ ] A changed embedded node field is rejected.
[ ] An unsigned Tesseract-A health receipt is rejected as non-authoritative.
[ ] Direct node evidence and witness evidence remain separate in the UI.
[ ] Quantus, if added, uses a separate key and separate witness identity.
[ ] Pharo-Lapse forwards original signed bytes without re-signing or mutation.
[ ] Audit records contain source identity, receipt hash, challenge ID, and outcome.
[ ] No remote shell, arbitrary command, firewall, or credential authority is introduced.
```

## 10. Bottom line

Tesseract-A Core should be incorporated into the ARCHANGEL architecture as a **separately keyed, signed evidence witness and probe coordinator**, not copied into ARCHANGEL as an unbounded internal signer. ARCHANGEL should verify and audit its signed observations. Quantus should remain an independent witness with an independent key and contract. Pharo-Lapse should transport the original signed evidence through offline queues without changing its authority or provenance.
