# ARCHANGEL ATMOS System Compliance Report

**Audit date:** 2026-10-27 (records include observations timestamped through 2026-10-28 UTC)  
**Scope:** Read-only synthesis of the 11 supplied node-audit results. No new research, authentication, challenge response, mutation, credential submission, or synthetic receipt was performed.  
**Control plane:** https://archangelcp-sbwmjhce.manus.space

## Executive determination

**Overall status: NON-COMPLIANT / CRYPTOGRAPHIC ATTESTATION UNVERIFIED.**

No node in the supplied results has cryptographically verified deployed signed health. The public ARCHANGEL control plane is reachable, but its fleet state, signed receipts, registry detail, and audit records are authentication-gated. Consequently, the roster could not be reconciled against an authenticated ARCHANGEL registry or pinned-key/receipt state.

For the purposes of this report, the mutually exclusive summary counts are:

- **Cryptographically verified deployed signed health:** 0 of 11.
- **Partial/supporting evidence:** 10 of 11. These nodes have some combination of endpoint reachability, public client declarations, GitHub source/provenance, unsigned manifests, generic health, or a claimed-but-unverified signed payload.
- **Unavailable/unresolved evidence:** 1 of 11 (IWA-SAGE), for which no matching public GitHub evidence, signed manifest, signed health, receipt, or public ARCHANGEL reconciliation was found.

HTTP 200, HEAD success, HTML SPA fallbacks, generic `status=ok`, ordinary PWA manifests, GitHub implementation code, artifact hashes, and deployment documentation are not cryptographic proof of deployed signed health. A receipt hash is treated as a receipt only when the supplied record identifies it as a receipt tied to the node; artifact/manifest/code hashes are not promoted to receipt evidence.

## Evidence classification rules

1. **Cryptographically verified deployed signed health:** requires a deployed signed health payload, an applicable public key or pinned key binding, a signature algorithm/canonicalization context, and a successful verification result, preferably reconciled to an ARCHANGEL receipt/roster record. None met all requirements.
2. **GitHub-only evidence:** source code, protocol specifications, deployment notes, bootstrap records, operator claims, fixtures, or historical repository data. This is not deployment proof.
3. **Manifest-only evidence:** an unsigned or unverified manifest, manifest CID, code hash, or generic web/PWA manifest without a verified signed binding.
4. **HEAD-only/endpoint reachability:** HTTPS/HEAD/GET reachability or HTML application responses without machine-readable signed health.
5. **Unavailable or contradictory evidence:** required cryptographic or roster evidence was inaccessible, absent, or contradicted by another supplied source.

## Node-by-node compliance record

### 1. ROOT-GATE

- **Endpoint:** https://rootgate.manus.space
- **Endpoint outcome:** HEAD and GET returned HTTP 200 HTML. `/health`, `/api/health`, `/manifest.json`, `/manifest`, `/api/manifest`, and `/.well-known/manifest.json` returned HTML fallbacks; `/healthz` returned 404. This establishes HTTPS/HEAD reachability only.
- **ARCHANGEL comparison:** The public ARCHANGEL client declares `root-gate` / Root-Gate as `declared_pending` and `enrollable: true`; authenticated fleet state was unavailable. No evidence supports active, verified, or healthy roster status.
- **Signed health/manifest:** No signed health or signed manifest found. No public key, signature, receipt ID, or receipt hash found.
- **Algorithm and verification:** Ed25519 is referenced by the ARCHANGEL client as the node signature model, but no ROOT-GATE payload was available. **Not cryptographically verified.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability plus public client declaration; authenticated ARCHANGEL and GitHub evidence unavailable.
- **Unresolved mismatches:** `declared_pending` client state cannot be reconciled to an authenticated ARCHANGEL registry; HTML fallback paths must not be treated as health or manifest APIs.

### 2. TESSERACT-TERMINUS

- **Endpoint:** https://universaltruth.life
- **Endpoint outcome:** Root, `/status`, `/ops`, `/audit`, `/proof-fulcrum`, and `/nebula` returned HTTP 200 HTML. The site identifies TESSERACT-TERMINUS at `34.216.185.65`, but reports `DOCTRINE/NO-PROBE`; `/proof-fulcrum` reports standby/no first signed fleet receipt; `/nebula` reports zero registered relays and zero measured.
- **ARCHANGEL comparison:** Public `pharo-lapse` roster names canonical `peer_id tesseract-terminus`, but status is `PENDING_APPLY`, locus `PENDING_OPERATOR_HARDWARE`, public key `PENDING_KEY`, and `via_peer_ids` is empty. This does not reconcile to a deployed keyed live node.
- **Signed health/manifest:** No deployed signed ARCHANGEL/v0 health payload or signed manifest found. The deployed `/ops` exposed only an ellipsized manifest CID.
- **Algorithm and verification:** Ed25519; ARCHANGEL/v0 specifies lowercase-hex signatures. No public key/signature/verifiable envelope was found. **Not cryptographically verified.**
- **Receipt IDs:** `ots-verify:golden-truth.manifest.json`; `ots-verify:truth-substrate-ledger-01-1.mhtml`; `ots-verify:GO_OMNI_GO-001.txt`; `ots-verify:trc-feasibility-001.txt`; `signed-status:terminus-tesseractus`; `manifest_version:cmap.final-manifest/v1`.
- **Receipt/artifact hashes supplied:** `e53a1476254301804e25b5f27787f64dc882dee0bca0b3865ace40b6ead285a9`; `325037bda158c135794fb097f365822e7c5da01147282cb3cde032bc5e251f02`; `0faeb10d3cf69ec65907f3de833d413f132a935aa7dd90d3557e7d5a18838ec3`; `ffd582ed528d2f7cba4fceefbddbe876f5a8d7f2adf6b81b8ff36698e42ad0a1`; `bafybeicjixsytlbbqvbnsh3uhk7lbtuxnt3atuanroow3urbyntgyslbda`.
- **Evidence classification:** HEAD/GET reachability plus GitHub-only implementation/historical provenance and manifest/reference evidence.
- **Unresolved mismatches:** `signed-status:terminus-tesseractus` is explicitly DOCTRINE/no probe, while `xinus-monarch` is the example recorded as MEASURED; listed hashes are provenance/OTS or manifest artifacts, not proof of deployed TESSERACT-TERMINUS health or receipts.

### 3. XINUS-CLARITY

- **Endpoint:** https://exonissuite-ceruhtwo.manus.space
- **Endpoint outcome:** Root returned HTTP 200 HTML. `/health` and `/api/health` returned SPA HTML; `/healthz` returned 404. `/site.webmanifest` and `/__manus/pwa/manifest.webmanifest` returned unsigned JSON manifests.
- **ARCHANGEL comparison:** No public signed roster or control-plane record linked XINUS-CLARITY to ARCHANGEL; the control plane was authentication-gated.
- **Signed health/manifest:** No signed health or signed manifest; only unsigned web/PWA manifests.
- **Algorithm and verification:** GitHub attestation doctrine specifies Ed25519, but also states `STANDBY` and that no node signs yet. **Not cryptographically verified.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability, manifest-only unsigned evidence, and GitHub-only design/source evidence.
- **Unresolved mismatches:** Deployed health routes are HTML fallbacks rather than JSON; ordinary manifests cannot be treated as signed node manifests; GitHub doctrine is not proof of this deployment.

### 4. MONARCH-OS

- **Endpoint:** https://schedtool-7vbikw4h.manus.space
- **Endpoint outcome:** Root identifies NX XinUS MonarchOS Sovereign operations desktop, runtime `0.3.0`, and 10 registered nodes, while reporting Remote Mesh Health not probed. `/health` returned plain-text `ok`; common API/manifest paths returned the application shell; `/healthz` returned 404.
- **ARCHANGEL comparison:** Deployed UI labels the Archangel record standby and uses user-supplied inventory. GitHub registry describes `monarch-os` as `endpoint_pending` and not an enrolled ROOT credential issuer/peer. Public ARCHANGEL roster was unavailable.
- **Signed health/manifest:** No current public signed health, signed manifest, receipt ID, or receipt hash.
- **Algorithm and verification:** Ed25519 appears in GitHub implementation and test code. **No deployed cryptographic verification.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** Endpoint reachability only, GitHub-only implementation/deployment evidence, and reference/inventory evidence.
- **Unresolved mismatches:** UI count of 10 registered nodes and standby labels cannot be cryptographically reconciled; plain-text `ok` is not signed health.

### 5. TESSERACT-A (repository identifier: `tesseract-a`)

- **Endpoint:** https://tesseract.manus.space; documented alternate https://nexinus.net/health
- **Endpoint outcome:** `tesseract.manus.space` root and HEAD `/health` returned HTTP 200, but GET `/health` returned an HTML 404 page. `nexinus.net` failed DNS resolution during safe HEAD. The bootstrap snapshot reports down/unreachable at `2026-06-20T03:53:06Z`.
- **ARCHANGEL comparison:** Public mesh status reports zero draft, locally prepared, verified, active, unavailable, or revoked nodes and no trusted nodes registered. GitHub registry contains a Tesseract-A record (`id tesseract-a`, Frankfurt AWS Lightsail, claimed host `35.156.127.49`) but says signing is an operator claim until a signed receipt verifies.
- **Signed health/manifest:** None found.
- **Algorithm and verification:** Ed25519 is documented in GitHub bootstrap/protocol sources; the documented public key path was unavailable. **Not verified.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability, GitHub-only registry/protocol evidence, and stale bootstrap evidence.
- **Unresolved mismatches:** Deployed `tesseract.manus.space` does not match the documented `nexinus.net/health` surface; stale bootstrap says down; no deployed signed envelope or public key was obtained.

### 6. KEIRA

- **Endpoint:** https://sovereignapp-hkcgwye7.manus.space
- **Endpoint outcome:** HEAD/GET root returned HTTP 200 HTML (`KEIRA / Awaiting Contact`). `/robots.txt`, `/health`, `/api/health`, `/manifest.json`, `/.well-known/manifest.json`, `/api/manifest`, and `/api/status` returned HTML SPA fallbacks; `/favicon.ico` returned HTTP 200 PNG.
- **ARCHANGEL comparison:** Unavailable; public ARCHANGEL exposes no unauthenticated roster, and KEIRA exposes no signed deployed identity or health payload.
- **Signed health/manifest:** None found.
- **Algorithm and verification:** No Ed25519 or other signing algorithm evidence in the public KEIRA repository or deployed response. **Not verifiable.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability and GitHub-only deployment/source evidence.
- **Unresolved mismatches:** KEIRA deployment documentation references the subdomain as an example and references a separate repository; this does not prove source-to-deployment identity. SPA fallbacks are not health or manifest evidence.

### 7. VALKYRIE

- **Endpoint:** https://valkyrie.nexinus.net/
- **Endpoint outcome:** Root returned HTTP 200 HTML. `/health` returned HTTP 200 `application/json`, ETag `"6ae1060a-20a"`, Last-Modified `Tue, 27 Oct 2026 20:14:02 GMT`. Other tested common paths returned SPA HTML fallbacks.
- **Deployed health fields:** `status=ok`; `nodeId=VALKYRIE`; `manifestCid=sha256:0108ceb871960fc1121e3bc307c5f9e425030d0d8642bfba7ce001f5ea217635`; `codeHash=sha256:182d785866276bb5ea2fcbad2eafc4c992c3a06e1240866e613d6f45c86d897f`; `artifactKind=running-node-bundle`; `artifactPath=/opt/valkyrie/current/dist/index.js`; `signedAt=2026-10-27T20:15:00Z`; `serviceSignature=u7byE70hQVgmMGHLGNtyVZ6tqv49fdzWD3qh+xk2bmqGNnrKUVszjWNe0pV7X/6LKs3qwIskO2HDhaLlpYq/Ag==`.
- **ARCHANGEL comparison:** Node appears in deployed health and GitHub bootstrap references, but authenticated ARCHANGEL roster was unavailable.
- **Signed health/manifest:** The endpoint claims `NEXINUS_ATMOS_SIGNED_HEALTH/v1` and provides manifest/code hashes plus a signature-looking value. This is an unverified signed-health claim, not verified health. The manifest CID and code hash are manifest/artifact hashes, not receipt IDs.
- **Algorithm and verification:** Public ARCHANGEL/v0 documentation specifies Ed25519, but the live value is 64-byte base64, with no public key, key identifier, canonical bytes, or binding. **NOT CRYPTOGRAPHICALLY VERIFIED.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** Claimed deployed signed health plus manifest-only evidence, GitHub-only evidence, and endpoint reachability.
- **Unresolved mismatches:** GitHub `public/llms.txt` labels Valkyrie `UNSIGNED, awaiting bootstrap`; live endpoint claims signed health. Live format does not match documented ARCHANGEL/v0 lowercase-hex `sig_ed25519` envelope. This contradiction prevents promotion to verified status.

### 8. ARCHANGEL

- **Endpoint:** https://archangelcp-sbwmjhce.manus.space
- **Endpoint outcome:** HEAD and GET returned HTTP 200 over HTTPS. Health, manifest, signed-manifest, robots, and sitemap probes returned the SPA shell. The console states that fleet state, signed receipts, registry detail, and audit records are visible only to authenticated operators.
- **ARCHANGEL comparison:** This is the control-plane endpoint itself; no public deployed roster, signed health, receipt, pinned key, or verification-state payload was available.
- **Signed health/manifest:** None publicly available.
- **Algorithm and verification:** Unavailable; no public ARCHANGEL signed artifact or verification result found. **Not performed/not possible.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability only plus public shell/client declarations.
- **Unresolved mismatches:** Control-plane reachability must not be interpreted as fleet health; authentication gating prevents roster and receipt reconciliation.

### 9. PROJECT-RECLAIM

- **Endpoint:** https://reclaimporta-gsio8jvp.manus.space
- **Endpoint outcome:** Root returned HTTP 200 public HTML. `/health` and `/manifest.json` returned application 404 pages on GET; safe HEAD probes returned HTTP 200 HTML. `/impact` states that no field metrics have been published and verified records are not yet available.
- **ARCHANGEL comparison:** Unavailable; no public roster or GitHub binding to a signed roster entry.
- **Signed health/manifest:** None found.
- **Algorithm and verification:** Unavailable for this node; no signed payload, key binding, receipt, or verification result. **Not verifiable.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** Endpoint reachability and public HTML plus GitHub-only generic infrastructure documentation.
- **Unresolved mismatches:** HEAD 200 versus GET application 404 on health/manifest routes is a routing response, not evidence of health or manifest; impact page expressly says verified field records are not available.

### 10. IWA-SAGE

- **Endpoint:** https://iwawellness-khqgjzqe.manus.space
- **Endpoint outcome:** Root returned HTTP 200 HTML. Guessed manifest/health routes returned SPA HTML; `/healthz` returned 404; `/api/health` returned 503 Service Unavailable.
- **ARCHANGEL comparison:** Unavailable; no unauthenticated IWA-SAGE roster or verification data.
- **Signed health/manifest:** None found.
- **Algorithm and verification:** Unavailable; no public Ed25519 or other signing evidence. **Not verified.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/HTTPS reachability only. No GitHub-only evidence, manifest-only evidence, or cryptographic evidence was found.
- **Unresolved mismatches:** Root reachability coexists with `/api/health` 503 and SPA fallbacks; no public evidence binds the endpoint to an ARCHANGEL node.

### 11. RESONATE-EARTH (`resonate-earth`)

- **Endpoint:** https://resonate-earth.live
- **Endpoint outcome:** Root returned HTTP 200. `/api/health` returned generic unsigned JSON: `{"status":"ok","service":"resonate-earth","timestamp":"2026-10-28T02:11:20.513Z","uptime":1793153480.513,"version":"1.0.0"}`. Other tested status/manifest paths returned HTML fallbacks.
- **ARCHANGEL/GitHub comparison:** GitHub roster identifies `resonate-earth`, provider `resonate-earth.live`, declared state `ATTESTED · HTTPS reachability`, probe kind `no-cors-head`, and says `No signed /status yet; probed by opaque HEAD only`. Public `llms.txt` separately says `UNSIGNED, awaiting bootstrap`.
- **Signed health/manifest:** No signed deployed health, signed manifest, receipt, or pinned key. Generic `/api/health` is not cryptographic health.
- **Algorithm and verification:** Ed25519 is specified in GitHub ARCHANGEL/v0 code, but no node key or signed payload was found. **NOT VERIFIED.**
- **Receipt IDs/hashes:** None.
- **Evidence classification:** HEAD/GET reachability, generic unsigned health, and GitHub-only protocol/roster evidence.
- **Unresolved mismatches:** GitHub `ATTESTED · HTTPS reachability` and `UNSIGNED, awaiting bootstrap` are not equivalent to cryptographic attestation; deployed service-name match confirms reachability/identity hint only, not verified ARCHANGEL/v0 state.

## Cross-cutting unresolved issues

1. **ARCHANGEL access boundary:** The same public control-plane behavior is reported across the audits: HTTP reachability is available, but fleet state, signed receipts, manifests, registry detail, and audit records require authentication. No credentials or challenge were attempted, so the requested roster reconciliation remains unavailable.
2. **Zero verified receipts:** No supplied node has a receipt ID and hash pair that is demonstrably tied to a deployed node and cryptographically verified against a public/pinned key. TESSERACT-TERMINUS has listed provenance/OTS identifiers and hashes, but the supplied evidence expressly does not establish deployed health or receipts.
3. **Signature-format gap:** Ed25519 is common in the GitHub ARCHANGEL/v0 materials, but VALKYRIE's live base64 `serviceSignature` lacks public-key and canonicalization context and does not match the documented lowercase-hex envelope. No other deployed signature was available for verification.
4. **Manifest ambiguity:** Ordinary PWA manifests, HTML fallback responses, manifest CIDs, code hashes, and implementation-level final-manifest code are not signed deployed node manifests absent a verifiable signature/key binding.
5. **Source/deployment identity:** GitHub source, bootstrap records, operator claims, stale snapshots, and deployment documentation do not prove that the currently reachable endpoint runs that source or has the claimed node identity.
6. **Contradictory public declarations:** VALKYRIE's live endpoint claims signed health while public GitHub says `UNSIGNED, awaiting bootstrap`; RESONATE-EARTH is described as `ATTESTED · HTTPS reachability` while also explicitly `UNSIGNED`; TESSERACT-A's public registry claim conflicts with a down/unreachable bootstrap snapshot and a different deployed surface.
7. **Reachability overstatement risk:** HTTP 200/HEAD success, generic `ok`, HTML SPA fallback, and application 404/503 behavior must remain classified as reachability/application behavior, not signed health.

## Final compliance conclusion

The supplied evidence supports a fleet of publicly reachable or publicly documented applications, but it does not support a claim of cryptographically verified deployed signed health for any of the 11 audited nodes. The control plane itself is reachable but cannot be used for unauthenticated roster reconciliation. The next compliant decision point requires authenticated ARCHANGEL evidence containing the authoritative roster, pinned node public keys, node-specific signed health/manifest payloads, canonicalization rules, successful signature-verification results, and receipt IDs/hashes bound to each deployed node. Until then, all nodes remain unverified, with the evidence distinctions recorded above.
