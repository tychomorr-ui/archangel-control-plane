# ARCHANGEL Canonical Mesh Synchronization Runbook

**Document status:** execution runbook  
**Scope:** operator-controlled synchronization, canonicalization, signed ATMOS verification, and private transport meshing  
**Control plane:** ARCHANGEL  
**Environment:** ATMOS 1.1.1  
**Transport terminology:** Pharo-Lapse is the application-level offline/queued transport concept; `wg-archangel` is the private WireGuard control overlay described here. They are separate layers.  
**Authority model:** operator-held keys, public-key registration, challenge-bound signed receipts, and append-only audit evidence.  
**Execution posture:** observe-only for node operations unless a separately approved bounded operation contract is active.

> This runbook does not create private keys centrally, copy private keys between hosts, open a public enrollment API, grant SSH authority, or turn ARCHANGEL into an arbitrary remote-shell system. Each node keeps its own private keys. ARCHANGEL receives public identities and signed evidence only.

---

## 1. Objective and completion definition

The objective is to bring the declared ARCHANGEL ecosystem into one verifiable state without confusing four different claims:

1. **Canonical identity:** the node ID, application ID, role, endpoint, and public-key fingerprint match the ARCHANGEL registry.
2. **Signed ATMOS evidence:** the runtime proves possession of the registered Ed25519 private key by signing a fresh ARCHANGEL challenge.
3. **Private mesh membership:** the host has an encrypted WireGuard path to the ARCHANGEL hub and can reach only the destinations permitted by its peer policy.
4. **Application synchronization:** an explicitly named, read-only application contract exists between two nodes. WireGuard membership alone does not imply application access.

A node is **fully synchronized for the current rollout** only when all of the following are true:

- its exact case-sensitive node ID is declared;
- its application ID maps to that node ID;
- its endpoint is the exact approved sovereign hostname;
- its runtime private key derives to the registered public-key fingerprint;
- ARCHANGEL issues a fresh challenge and accepts an HTTP 201 signed receipt;
- the receipt is stored with `verificationState=verified`, `reachability=reachable`, a real version, and a receipt hash;
- its WireGuard peer is up and its assigned private address responds to a read-only status check;
- the audit record contains the registration and receipt events;
- any cross-node application path is separately allow-listed and tested read-only.

A URL returning HTTP 200, a successful SSH login, or a WireGuard handshake by itself is not signed runtime proof.

---

## 2. Canonical registry: use these identities exactly

The ARCHANGEL source contains two related registries. `shared/atmos.ts` is the signed ATMOS evidence roster; `shared/archangel.ts` is the application/fleet atlas. Do not invent aliases during enrollment.

### 2.1 ATMOS signed-evidence roster

| Exact node ID | Display name | Role | Canonical endpoint | Assigned overlay address |
|---|---|---|---|---|
| `ROOT-GATE` in ATMOS manifests / `root-gate` in fleet routes | Root-Gate | Identity anchor and public front door | `https://rootgate.nexinus.net` | `10.42.0.11/32` |
| `TESSERACT-TERMINUS` / `tesseract-terminus` | Tesseract-Terminus | Provenance, anchoring, mirror | `https://terminus.nexinus.net` | `10.42.0.12/32` |
| `XINUS-CLARITY` / `xinus-clarity` | XinUS-Clarity | Clarity application layer | `https://clarity.nexinus.net` | `10.42.0.13/32` |
| `MONARCH-OS` / `kether-gate` | Monarch-OS / Kether-Gate role | Sovereign OS layer | `https://monarch.nexinus.net` | `10.42.0.14/32` |
| `TESSERACT-A` / `tesseract-a` | Tesseract Mirror | Truth substrate and recovery mirror | `https://tesseract.nexinus.net` | `10.42.0.15/32` |
| `KEIRA` / `keira` | KEIRA | Intelligence and truth analysis | `https://keira.nexinus.net` | `10.42.0.16/32` |
| `VALKYRIE-ADJUDICATION-ENTITY` / `valkyrie-adjudication-entity` | VALKYRIE | Adjudication and evidence decision layer | `https://valkyrie.nexinus.net` | outer/adjudication role |
| `ARCHANGEL` / `archangel` | ARCHANGEL | Control plane and mesh governance | `https://archangel.nexinus.net` | `10.42.0.1/32` |
| `PROJECT-RECLAIM` / `project-reclaim` | Project Reclaim | Field activation and real-world impact | `https://reclaim-node.nexinus.net` | `10.42.0.17/32` |
| `IWA-SAGE` / `iwa-sage` | IWA Sage | Community wellness and service | `https://iwa.nexinus.net` | `10.42.0.18/32` |
| `RESONATE-EARTH` / `resonate-earth` | Resonate Earth | Public front door / evidence role | `https://resonate.nexinus.net` | `10.42.0.19/32` |

The current source uses lowercase fleet route IDs for the HTTP receipt route and uses the reconciled lowercase ID `valkyrie-adjudication-entity` for the production receipt row. Preserve that exact route spelling when invoking the signer.

### 2.2 Quantus status

**Quantus is not present in the current `ATMOS_CANONICAL_NODES`, `FLEET_NODES`, or `APPLICATION_ATLAS` source registries.** There is no canonical Quantus node ID, application ID, endpoint, public-key fingerprint, or receipt registration contract in this repository. Do not enroll it under an invented alias such as `quantus`, `quantus-node`, or `quantus.nexinus.net`.

Quantus may be added only through a reviewed registry change that defines:

- exact node ID and application ID;
- role and lifecycle (`declared` or `planned`);
- canonical endpoint;
- region and overlay address;
- public-key fingerprint and manifest hash;
- application dependencies and narrow scopes;
- tests, migration/release record, and operator approval.

Until that exists, Quantus is **out of scope for live synchronization** and may only be documented as a planned integration.

---

## 3. Authority and key custody rules

| Key | Location | May ARCHANGEL store it? | Purpose |
|---|---|---:|---|
| Node Ed25519 private key | The node runtime only | No | Signs ATMOS health receipts |
| Node Ed25519 public PEM | ARCHANGEL integration record | Yes | Verifies node receipts |
| ARCHANGEL control-plane signing private key | ARCHANGEL secret store/runtime | Yes, operator-controlled | Signs ARCHANGEL-issued control-plane artifacts |
| Operator private key | Operator terminal or hardware-backed signer | No | Signs operator authorization requests externally |
| Operator public key | ARCHANGEL configuration | Yes | Verifies operator authorization |
| WireGuard private key | The host that owns the peer | No central copy | Establishes encrypted transport |
| WireGuard public key | Peer configuration | Yes | Identifies transport peer |

Never paste private PEM contents, base64 private-key material, `.env` files, shell history, or complete process environments into chat, tickets, GitHub, or the ARCHANGEL console.

---

## 4. Global operator workstation preparation

Run these commands on the operator workstation that has a trusted checkout of ARCHANGEL. Do not run them on a node unless the node is also the approved administrative workstation.

```bash
set -euo pipefail

export ARCHANGEL_BASE='https://archangel.nexinus.net'
export ARCHANGEL_REPO='/path/to/archangel-control-plane'
export SIGNER="$ARCHANGEL_REPO/launch/submit-atmos-node-receipt.mjs"

node --version
node --check "$SIGNER"
test -s "$SIGNER"

printf 'ARCHANGEL_BASE=%s\n' "$ARCHANGEL_BASE"
printf 'signer=%s\n' "$SIGNER"
```

Node.js 18 or newer is required by the signer because it uses built-in `fetch`, Ed25519 signing, and base64url signatures.

If the production deployment is intentionally being tested from an operator-controlled alternate origin, set `ARCHANGEL_BASE` to that approved origin. Do not download the signer from a URL that may return the React HTML shell. Transfer it from the reviewed checkout with `scp`, or verify the file hash before installing it.

Transfer the signer to each node without transferring a private key:

```bash
scp "$SIGNER" root@NODE_HOST:/usr/local/sbin/submit-atmos-node-receipt.mjs
ssh root@NODE_HOST \
  'chmod 0755 /usr/local/sbin/submit-atmos-node-receipt.mjs && node --check /usr/local/sbin/submit-atmos-node-receipt.mjs'
```

---

## 5. Preflight checks on every node

Run the following on the actual runtime host. Replace only the public host label and the private-key path. Do not use a placeholder path in an execution attempt.

```bash
set -euo pipefail

command -v node
node --version
hostname -f || hostname
uname -a

test -r /usr/local/sbin/submit-atmos-node-receipt.mjs
node --check /usr/local/sbin/submit-atmos-node-receipt.mjs

# Confirm time synchronization; do not proceed with a drifting clock.
timedatectl show -p NTPSynchronized --value 2>/dev/null || true
date -u

# List candidate key filenames only; do not print key contents.
find /etc/archangel /etc/valkyrie /opt /root -maxdepth 5 -type f \
  \( -iname '*receipt*.pem' -o -iname '*identity*.pem' -o -iname '*private*.pem' \) \
  -printf '%p\n' 2>/dev/null || true
```

If the runtime already has a signing key, use the key actually used by that runtime. Do not generate a replacement merely to match a stale registry value.

If no key exists, create it on that node only:

```bash
install -d -m 700 /etc/archangel/identity
umask 077
openssl genpkey -algorithm Ed25519 \
  -out /etc/archangel/identity/receipt-private.pem
chmod 600 /etc/archangel/identity/receipt-private.pem
```

Derive public evidence without revealing the private key:

```bash
KEY_FILE='/absolute/path/to/receipt-private.pem'

openssl pkey -in "$KEY_FILE" -noout
openssl pkey -in "$KEY_FILE" -pubout -out /tmp/archangel-receipt-public.pem
openssl pkey -in "$KEY_FILE" -pubout -outform DER 2>/dev/null | sha256sum

printf 'public_pem=%s\n' /tmp/archangel-receipt-public.pem
```

Transfer only `/tmp/archangel-receipt-public.pem` and the SHA-256 fingerprint to the ARCHANGEL operator. Remove the temporary public file after the operator records it if local policy requires:

```bash
rm -f /tmp/archangel-receipt-public.pem
```

---

## 6. ARCHANGEL registration procedure

Registration is an authenticated operator action, not a public `curl` endpoint in the current contract. Use the authenticated ARCHANGEL console’s application/integration registration workflow.

For each node, enter:

- the exact `applicationId` from the application atlas;
- the exact lowercase route `nodeId` used by `FLEET_NODES` and the receipt endpoint;
- the node’s real HTTPS endpoint;
- the public Ed25519 PEM from the node;
- the minimum scope, normally `read:health`;
- status `active` only after the operator has reviewed the endpoint and fingerprint.

The server-side registration contract requires that the application’s declared `nodeId` match the submitted node ID. It stores the endpoint, public key, JSON-encoded scopes, and active status, then writes an `integration.registered` audit event. It does not store the private key.

Recommended registration mapping:

| Node | Application ID | Scope |
|---|---|---|
| Root-Gate | `root-identity` | `read:health` |
| Tesseract-Terminus | `sovereign-provenance-console` | `read:health` |
| XinUS-Clarity | `xinus-clarity-suite` | `read:health` |
| Monarch-OS / Kether-Gate | `monarch-os` | `read:health` |
| Tesseract-A | `tesseract-a` | `read:health` |
| KEIRA | `keira-intelligence` | `read:health` |
| Valkyrie | `valkyrie-adjudication-entity` | `read:health` |
| Project Reclaim | `project-reclaim` | `read:health` |
| IWA Sage | `iwa-sage` | `read:health` |
| Resonate Earth | `resonate-earth` | `read:health` only after a real host exists |

Do not register Exitus Lens or Quantus until each has a declared runtime host, canonical registry entry, public key, and reviewed contract.

After registration, request a challenge from the operator workstation:

```bash
export NODE_ID='root-gate' # replace exactly
curl --fail --silent --show-error \
  -X POST "$ARCHANGEL_BASE/v1/atmos/nodes/$NODE_ID/challenge" \
  -H 'content-type: application/json' \
  -d '{}' | python3 -m json.tool
```

The challenge response must include `applicationId`, `nodeId`, `nonce`, `issuedAt`, `expiresAt`, `challengeId`, and `registeredPublicKeyFingerprint`. Compare that fingerprint to the node-derived fingerprint before submitting a receipt. A mismatch is a hard stop: do not rotate keys blindly and do not submit repeated failed receipts.

---

## 7. Signed ATMOS receipt submission

Run the signer on the node whose private key is being used. The signer requests its own fresh challenge, signs the canonical receipt locally, submits it, redacts the signature in its output, and exits non-zero if ARCHANGEL rejects the receipt.

```bash
set -euo pipefail

export ATMOS_NODE_PRIVATE_KEY_FILE='/absolute/path/to/the/node-receipt-private.pem'
export NODE_ID='root-gate'
export NODE_VERSION='actual-runtime-version'
export NODE_STATUS='ok'
export NODE_CAPABILITIES='health.check'

ATMOS_NODE_PRIVATE_KEY_FILE="$ATMOS_NODE_PRIVATE_KEY_FILE" \
node /usr/local/sbin/submit-atmos-node-receipt.mjs \
  "$ARCHANGEL_BASE" \
  "$NODE_ID" \
  "$NODE_VERSION" \
  "$NODE_STATUS" \
  "$NODE_CAPABILITIES"
```

Use `degraded` or `not_ready` when that is the actual state. Do not claim capabilities that are not implemented. `health.check` is the baseline. Do not claim `deploy`, `shell`, `firewall`, `mesh.activate`, or arbitrary execution merely because the host is reachable.

An accepted receipt returns HTTP 201 with a response of this form:

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

Record the redacted output, node ID, version, status, timestamp, and receipt hash in the change record. Never record the private key or the unredacted signature.

### Per-node invocation blocks

Use the same command with the exact ID and runtime version on each actual host:

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

# Tesseract-A / Mirror
NODE_ID='tesseract-a'; NODE_VERSION='actual-tesseract-a-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# KEIRA / Kira application
NODE_ID='keira'; NODE_VERSION='actual-keira-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# VALKYRIE
NODE_ID='valkyrie-adjudication-entity'; NODE_VERSION='actual-valkyrie-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Project Reclaim
NODE_ID='project-reclaim'; NODE_VERSION='actual-project-reclaim-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# IWA Sage
NODE_ID='iwa-sage'; NODE_VERSION='actual-iwa-sage-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"

# Resonate Earth: only after a real host and integration exist.
NODE_ID='resonate-earth'; NODE_VERSION='actual-resonate-earth-version'; NODE_STATUS='ok'; NODE_CAPABILITIES='health.check'
node /usr/local/sbin/submit-atmos-node-receipt.mjs "$ARCHANGEL_BASE" "$NODE_ID" "$NODE_VERSION" "$NODE_STATUS" "$NODE_CAPABILITIES"
```

Do not execute the Resonate Earth block while its host remains unplaced. Do not create blocks for Exitus Lens or Quantus until their registry and runtime contracts exist.

---

## 8. Private WireGuard control-star mesh

The intended private topology is hub-and-spoke, not unrestricted any-to-any routing:

- ARCHANGEL hub: `10.42.0.1/32`, London;
- each spoke has one unique `/32`;
- each spoke initially receives only `10.42.0.1/32` in `AllowedIPs`;
- the hub maps each peer to only that peer’s `/32`;
- node status agents bind to the WireGuard address, not the public interface;
- no public status or enrollment listener is opened;
- WireGuard UDP 51820 is allowed only at the hub and restricted to known source addresses where the provider firewall supports it.

### 8.1 Generate transport keys on each host

On each host, never reuse an Ed25519 receipt key as a WireGuard key:

```bash
install -d -m 700 /etc/wireguard
umask 077
wg genkey | tee /etc/wireguard/wg-archangel-private.key | wg pubkey > /etc/wireguard/wg-archangel-public.key
chmod 600 /etc/wireguard/wg-archangel-private.key
chmod 644 /etc/wireguard/wg-archangel-public.key

printf 'wireguard_public_key='
cat /etc/wireguard/wg-archangel-public.key
```

Transfer only the public key to the ARCHANGEL operator. The private WireGuard key stays on the host.

### 8.2 Hub configuration template

Create `/etc/wireguard/wg-archangel.conf` on the ARCHANGEL host. Replace placeholders with real values obtained from the node hosts; do not paste this template unchanged into production.

```ini
[Interface]
Address = 10.42.0.1/24
ListenPort = 51820
PrivateKey = <ARCHANGEL_WIREGUARD_PRIVATE_KEY>

# One peer block per approved node.
[Peer]
PublicKey = <ROOT_GATE_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.11/32

[Peer]
PublicKey = <TESSERACT_TERMINUS_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.12/32

[Peer]
PublicKey = <XINUS_CLARITY_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.13/32

[Peer]
PublicKey = <MONARCH_OS_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.14/32

[Peer]
PublicKey = <TESSERACT_A_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.15/32

[Peer]
PublicKey = <KEIRA_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.16/32

[Peer]
PublicKey = <PROJECT_RECLAIM_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.17/32

[Peer]
PublicKey = <IWA_SAGE_WIREGUARD_PUBLIC_KEY>
AllowedIPs = 10.42.0.18/32
```

Apply only after backup and syntax review:

```bash
install -m 600 /etc/wireguard/wg-archangel.conf /etc/wireguard/wg-archangel.conf.reviewed
wg-quick strip wg-archangel >/tmp/wg-archangel.normalized.conf
systemctl enable wg-quick@wg-archangel
systemctl start wg-quick@wg-archangel
wg show wg-archangel
```

If the host is already serving a different WireGuard interface, stop and reconcile the existing configuration rather than creating a competing interface.

### 8.3 Spoke configuration template

On each node, install a configuration containing only the hub as the initial destination:

```ini
[Interface]
Address = 10.42.0.11/32
PrivateKey = <THIS_NODE_WIREGUARD_PRIVATE_KEY>

[Peer]
PublicKey = <ARCHANGEL_WIREGUARD_PUBLIC_KEY>
Endpoint = archangel.nexinus.net:51820
AllowedIPs = 10.42.0.1/32
PersistentKeepalive = 25
```

Change `Address` per node according to the peer map. Do not add another node’s address to `AllowedIPs` until a separately reviewed role-specific application contract requires it.

```bash
chmod 600 /etc/wireguard/wg-archangel.conf
systemctl enable wg-quick@wg-archangel
systemctl start wg-quick@wg-archangel
wg show wg-archangel
ping -c 3 -W 2 10.42.0.1
```

A successful ping is transport evidence only. It does not verify the node’s Ed25519 identity.

### 8.4 Firewall policy

At the ARCHANGEL host/provider firewall:

- allow UDP 51820 only from known node public source addresses where feasible;
- keep SSH restricted to trusted administrative addresses;
- do not expose the node status agent publicly;
- do not expose database, Redis, WireGuard management, or internal APIs publicly;
- review IPv4 and IPv6 rules separately;
- record every firewall change and rollback command.

At each spoke:

- permit outbound UDP to the ARCHANGEL hub;
- permit the private status-agent listener only on the assigned WireGuard address;
- deny the status-agent port on public interfaces;
- do not open an inbound public “enrollment” port.

---

## 9. Read-only node status agent contract

The private mesh is not complete until a node can expose a read-only status endpoint on its assigned WireGuard address. The agent must:

- bind only to the assigned `10.42.0.x` address;
- return the node’s exact canonical ID and runtime version;
- report status truthfully as `ok`, `degraded`, or `not_ready`;
- never return a private key;
- never execute a request body as shell text;
- never accept arbitrary commands;
- emit or make available the signed receipt through the approved signer path;
- log rejected requests locally without logging secrets.

Example local checks:

```bash
curl --fail --silent --show-error http://10.42.0.11:8080/health | python3 -m json.tool
ss -lntup
sudo nft list ruleset
```

The exact port and service name are deployment-specific and must be recorded after the agent is actually installed. Do not claim that a status agent exists merely because WireGuard is up.

---

## 10. Synchronization order for the named ecosystem

Use this order to minimize ambiguity and preserve rollback points.

### Stage A — ARCHANGEL and Root-Gate

1. Confirm ARCHANGEL operator login and database connectivity.
2. Confirm Gate 4 remains fail-closed and operator private keys remain off-server.
3. Confirm the ARCHANGEL public signing fingerprint and operator public fingerprint from logs/configuration without printing private material.
4. Establish the hub WireGuard interface and verify `10.42.0.1` locally.
5. Register Root-Gate only if its rebuilt host, public key, and endpoint are real.
6. Submit one fresh Root-Gate receipt.
7. Confirm the audit events `integration.registered` and `receipt.recorded`.

Root-Gate is an identity role, not a license for ARCHANGEL to silently admit other nodes. Each node still proves possession of its own key.

### Stage B — Tesseract-Terminus and Tesseract-A

Tesseract-Terminus is the provenance/anchoring role. Tesseract-A is the mirror/recovery role. Keep their application IDs, node IDs, keys, and receipts separate.

```bash
# On Tesseract-Terminus
export NODE_ID='tesseract-terminus'

# On Tesseract-A
export NODE_ID='tesseract-a'
```

Register each separately, verify its challenge fingerprint, submit its signed receipt, then add its distinct WireGuard peer. Do not use a Tesseract-Terminus key for Tesseract-A or vice versa.

### Stage C — KEIRA

KEIRA is the intelligence/truth-analysis application role. Enrollment proves only identity, freshness, and the declared health capability. It does not prove model quality, truthfulness of generated content, or external data correctness.

```bash
export NODE_ID='keira'
export NODE_CAPABILITIES='health.check'
```

If local Ollama is used by KEIRA, treat Ollama as a local dependency and report only a truthful application status. Do not grant ARCHANGEL model execution authority through a health receipt.

### Stage D — VALKYRIE

VALKYRIE is the reconciled reference implementation. Its exact route identity is `valkyrie-adjudication-entity`, while its display name is `VALKYRIE`.

```bash
export NODE_ID='valkyrie-adjudication-entity'
```

The registered public key must match the private key installed on the Valkyrie runtime. A successful receipt proves the signed health path; it does not prove that every adjudication output is correct.

### Stage E — Project Reclaim and IWA Sage

Project Reclaim and IWA Sage are separate role-specific nodes. Do not inherit Root-Gate credentials, KEIRA credentials, or a generic “ecosystem” key.

```bash
# Project Reclaim
export NODE_ID='project-reclaim'

# IWA Sage
export NODE_ID='iwa-sage'
```

Their first application contract should be read-only health/evidence reporting. Any field data or community data path requires a separate data-classification, consent, retention, and access-control review.

### Stage F — Quantus and future nodes

Stop at the registry boundary for Quantus. Do not create a key registration or receipt call until the canonical registry and application atlas are updated through a reviewed release. The same applies to Exitus Lens and any other planned application without a declared host.

---

## 11. Verification and audit queries

Use the authenticated console for routine evidence review. If direct database access is explicitly approved, use read-only queries first and redact sensitive endpoint/key data in records.

### 11.1 Receipt distribution

```sql
SELECT nodeId, verificationState, COUNT(*) AS reports, MAX(observedAt) AS latest
FROM node_status_reports
GROUP BY nodeId, verificationState
ORDER BY latest DESC
LIMIT 50;
```

### 11.2 Active integration inventory

```sql
SELECT applicationId, nodeId, status, endpointUrl, scopes, updatedAt
FROM application_integrations
WHERE status = 'active'
ORDER BY nodeId
LIMIT 50;
```

Do not include `publicKeyPem` in routine pasted output. If a fingerprint comparison is required, derive a fingerprint from the public PEM in a controlled script and print only the digest.

### 11.3 Receipt challenge state

```sql
SELECT challengeId, nodeId, issuedAt, expiresAt, usedAt
FROM atmos_node_receipt_challenges
ORDER BY issuedAt DESC
LIMIT 20;
```

A used challenge must never be reused. A challenge older than five minutes must be discarded.

### 11.4 Audit evidence

```sql
SELECT nodeId, eventType, outcome, actorPseudonym, summary, occurredAt
FROM audit_events
WHERE eventType IN ('integration.registered', 'receipt.recorded', 'verification.outcome')
ORDER BY occurredAt DESC
LIMIT 100;
```

### 11.5 Overlay evidence

On the ARCHANGEL host:

```bash
sudo wg show wg-archangel
ip -brief address show wg-archangel
ip route show table main | grep '10.42.0.' || true
```

On each spoke:

```bash
sudo wg show wg-archangel
ip -brief address show wg-archangel
ping -c 3 -W 2 10.42.0.1
```

A recent WireGuard handshake is transport evidence. It must be correlated with a fresh signed ATMOS receipt for application evidence.

---

## 12. Failure handling and rollback

| Symptom | Meaning | Correct response |
|---|---|---|
| HTTP 404 `unknown_node` | ID is not declared or spelling/case is wrong | Stop; compare the exact registry ID. Do not invent an alias. |
| HTTP 412 `not_enrolled` | No active integration or application/node mismatch | Register the exact application, node, endpoint, public key, and scope through the authenticated operator workflow. |
| HTTP 400 signature failure | Runtime private key does not match registered public key | Derive the public fingerprint locally and compare. Do not rotate blindly. |
| HTTP 400 validity window | Clock skew or malformed signer | Check NTP and use the current submitter; do not manually reuse a receipt. |
| HTTP 409 replay | Challenge already used | Request a fresh challenge and rerun the signer. |
| HTTP 410 expired challenge | Challenge exceeded the five-minute TTL | Request a fresh challenge; inspect clock synchronization. |
| WireGuard handshake absent | Transport path or firewall/endpoint issue | Check `wg show`, UDP 51820, provider firewall, public source IP, and host firewall. Do not weaken all firewall rules. |
| WireGuard up but signed receipt fails | Transport identity and application identity are independent and inconsistent | Fix the Ed25519 integration binding; do not replace the WireGuard key to solve an Ed25519 mismatch. |
| HTML returned from an evidence path | Reverse proxy routed to SPA fallback | Fix the operator-controlled proxy route before claiming JSON evidence. |
| Quantus has no route | Quantus is not currently declared | Stop and request a reviewed registry addition; do not enroll it under a guessed ID. |

Rollback for a newly joined peer:

```bash
# On the spoke
sudo wg-quick down wg-archangel
sudo systemctl disable wg-quick@wg-archangel

# On the hub, remove only the reviewed peer block after backup
sudo cp -a /etc/wireguard/wg-archangel.conf \
  "/root/wg-archangel.conf.before-peer-removal.$(date -u +%Y%m%dT%H%M%SZ)"
sudo wg syncconf wg-archangel <(sudo wg-quick strip wg-archangel)
```

Do not delete signed receipts, challenge history, or audit records to make a failed rollout appear clean. Revoke or deactivate an integration through the authenticated operator workflow and preserve the evidence.

---

## 13. Bounded control-plane operations

Enrollment and WireGuard membership do not grant execution authority. The current ARCHANGEL design keeps planning execution paused and separates operator authorization from node behavior.

The first acceptable operational capability is a narrowly scoped, read-only status refresh using the versioned `ARCHANGEL_REFRESH_SIGNED_STATUS/v1` contract:

- exact target node;
- exact `read:health` scope;
- operator-approved authorization context;
- short validity window;
- ARCHANGEL dispatch signature;
- node-signed receipt bound to the dispatch hash and challenge;
- audit events for authorization, dispatch, execution, receipt, and final decision.

Do not turn this runbook into a generic command runner. Operations such as deploy, restart, firewall changes, shell access, key rotation, or arbitrary configuration mutation require a separate versioned contract with node-side allow-listing, explicit human approval, expiry, rollback, and signed outcome evidence. Gate 4 must remain fail-closed until that contract is independently reviewed.

---

## 14. Release and change-record template

For every node synchronization, record:

```text
change_id:
operator:
archangel_base:
node_id:
application_id:
canonical_endpoint:
region:
wireguard_address:
wireguard_public_key_fingerprint:
ed25519_public_key_fingerprint:
private_key_location: [path recorded locally, never copied into ticket]
registered_scope:
registration_timestamp_utc:
challenge_id:
receipt_http_status:
receipt_hash:
receipt_observed_at_utc:
receipt_verified_at_utc:
wireguard_latest_handshake_utc:
status_agent_private_address:
rollback_command:
operator_notes:
```

Attach only redacted signer output, public fingerprints, configuration hashes, and audit IDs. Never attach private keys or complete environment files.

---

## 15. Final acceptance checklist

```text
[ ] ARCHANGEL operator authentication succeeds locally and over the approved origin.
[ ] ARCHANGEL database is reachable with operator-managed credentials.
[ ] Gate 4 is configured fail-closed and operator private keys remain off-server.
[ ] The node ID and application ID match the canonical registry exactly.
[ ] The endpoint is the exact approved sovereign hostname.
[ ] The registered Ed25519 public fingerprint matches the runtime private key.
[ ] A fresh challenge was issued and consumed once.
[ ] The signer returned HTTP 201 and accepted=true.
[ ] The database row is verificationState=verified and reachability=reachable.
[ ] The audit log contains integration.registered and receipt.recorded.
[ ] The WireGuard peer has a recent handshake.
[ ] The spoke can reach only the assigned hub address by initial policy.
[ ] The status agent is not exposed on a public interface.
[ ] No private key was copied to ARCHANGEL or another node.
[ ] No arbitrary command or remote-shell authority was enabled.
[ ] Planned nodes remain visibly planned until real hosts and evidence exist.
[ ] Quantus remains unregistered until its canonical registry contract exists.
[ ] The release manifest records source commit, image digest, schema state, and toolchain.
```

**Operational conclusion:** the ecosystem is synchronized when identity, signed evidence, private transport, and explicit application contracts agree. It is not synchronized merely because all URLs are reachable or because all servers can ping one another.
