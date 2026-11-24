# Triangle–Circle Placement Validation

## Current deployment posture

The ARCHANGEL control plane is canonically deployed on UpCloud at
`https://archangel.nexinus.net`. The other application records use the
canonical `*.nexinus.net` names where an endpoint has been declared. A
canonical hostname is an inventory/configuration fact, not proof that the
service is reachable, synchronized, or currently producing a signed receipt.

This document describes logical placement and failure-domain intent only. It
must not be read as a live health report or as a claim that every node is
running on UpCloud. Current live status is established separately through
bounded HTTPS/TCP probes and signed ATMOS evidence.

## Decision scope

The core visual remains one upright triangle, one inverted triangle, and
ARCHANGEL at the shared center. The triangles express trust roles; they do not
assert physical geography or provider regions. Public application traffic
remains regional and must not be routed through the control plane merely
because ARCHANGEL coordinates signed evidence.

## Logical arrangement

| Layer | Logical members | Purpose | Authority rule |
|---|---|---|---|
| **Upright triangle** | Root-Gate, Tesseract-Terminus, XinUS-Clarity | Identity, provenance, and applied capability | No vertex may silently substitute for another. |
| **Inverted triangle** | Kether-Gate, Tesseract-A, KEIRA | Operating system, recovery continuity, and intelligence | Each vertex remains independently observable and auditable. |
| **Shared center** | ARCHANGEL | Signed status, intent, approval boundary, receipts, and audit | Coordinates and verifies; it does not become sovereign identity or a product-traffic relay. |
| **Enclosing circle** | Project Reclaim and future nodes | Field interfaces, witnesses, gateways, specialized applications, and recovery | Joining the circle does not grant core authority. |

## UpCloud canonicalization rule

UpCloud is the current declared hosting target for the sovereign deployment.
Do not infer a provider location, regional latency, service health, mesh
membership, synchronization, or authority from DNS alone. Each node must
supply its own signed identity and health evidence before the console can
promote it from declared/configured to verified. Missing or stale evidence
remains visible and fail-closed.

The active source uses exact canonical domains such as
`archangel.nexinus.net`, `rootgate.nexinus.net`, `terminus.nexinus.net`,
`clarity.nexinus.net`, `monarch.nexinus.net`, `tesseract.nexinus.net`,
`keira.nexinus.net`, `valkyrie.nexinus.net`, `quantus.nexinus.net`,
`reclaim-node.nexinus.net`, `iwa.nexinus.net`, and `resonate.nexinus.net`.
These are declared endpoints and require direct probe plus signed receipt
verification before any stronger claim is made.

## Acceptance boundary

A node is **verified** only when its signed evidence matches the registered
public verification values and the service-specific freshness and policy gates.
A node may be **reachable but not verified**, **unreachable**, or **not
supplied**. ARCHANGEL must not claim full synchronization or connectedness for
nodes lacking fresh, signed evidence. Private transport and PAM remain bounded,
read-only, and fail-closed; public SSH reachability does not justify exposing
private Ollama or internal evidence services.
