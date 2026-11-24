# ARCHANGEL UpCloud Canonicalization and Verification Boundary

**Recorded:** 2026-11-24 UTC  
**Scope:** source declarations, DNS/TCP/HTTPS probes, and signed-evidence boundary

## Canonical deployment

ARCHANGEL is deployed at `https://archangel.nexinus.net` on the declared
UpCloud host `94.237.74.250`. A fresh public probe returned HTTP 200 for the
site edge and the previously verified public health route returned `ok: true`.
The private PAM evidence contract remains fail-closed: an unauthorised public
caller receives `403`, `state: UNKNOWN`, `authority: none`, and
`mutatesRemoteState: false`.

## Live endpoint matrix

The following matrix is a network observation from this workspace, not a
signed ATMOS receipt. `Reachable but not verified` means DNS/TCP or an HTTP edge
responded, but this repository did not obtain and validate a current signed
health receipt for that node. It must not be read as synchronized or connected.

| Node | Canonical endpoint | DNS / address | Probe observation | Honest state |
|---|---|---:|---|---|
| ARCHANGEL | `archangel.nexinus.net` | `94.237.74.250` | TCP 443 reachable; HTTPS 200 | **verified for deployment edge; signed node health not asserted here** |
| ROOT-GATE | `rootgate.nexinus.net` | `94.237.117.88` | TCP 443 reachable; TLS handshake failed | **reachable but not verified** |
| TESSERACT-TERMINUS | `terminus.nexinus.net` | `95.111.216.247` | TCP 443 reachable; HTTP 200 | **reachable but not verified** |
| XINUS-CLARITY | `clarity.nexinus.net` | `5.22.209.72` | TCP 443 reachable; TLS handshake failed | **reachable but not verified** |
| MONARCH-OS | `monarch.nexinus.net` | unresolved | No DNS answer | **not supplied** |
| TESSERACT-A | `tesseract.nexinus.net` | `87.58.156.120` | TCP 443 reachable; HTTP 200 | **reachable but not verified** |
| KEIRA | `keira.nexinus.net` | `87.58.152.89` | TCP 443 reachable; HTTP 200 | **reachable but not verified** |
| VALKYRIE | `valkyrie.nexinus.net` | `94.237.57.16` | TCP 443 reachable; HTTPS 200 | **reachable but not verified by this probe** |
| QUANTUS | `quantus.nexinus.net` | `95.111.215.92` | TCP 443 reachable; HTTPS 200 | **reachable but not verified** |
| PROJECT-RECLAIM | `reclaim-node.nexinus.net` | `165.227.29.23` | TCP 443 reachable; TLS connection timed out | **reachable but not verified** |
| IWA-SAGE | `iwa.nexinus.net` | unresolved | No DNS answer | **not supplied** |
| RESONATE-EARTH | `resonate.nexinus.net` | unresolved | No DNS answer | **not supplied** |

## What this source update does and does not claim

Active graph and atlas copy now use UpCloud target language and exact canonical
Nexinus hostnames. Historical AWS/Lightsail planning records remain in the
repository for auditability but are explicitly superseded; they are not active
deployment instructions. AWS SDK dependencies are retained until a separate
runtime dependency audit proves whether storage code still requires them.

No live node has been promoted to synchronized, connected, or verified solely
because its DNS name resolves or its HTTPS edge answers. Signed public keys,
receipts, freshness, and policy checks remain the authority boundary.
