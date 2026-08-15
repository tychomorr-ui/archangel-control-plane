# ARCHANGEL Regional Topology Decision

## Decision

ARCHANGEL remains a **logical control-plane center**, represented by the topology crosshair. It is not an additional sovereign identity or a seventh physical vertex. The first physical ARCHANGEL host should be a **dedicated Lightsail instance in Ireland (`eu-west-1`)**, separate from XinUS-Clarity and, where selectable, in a different Availability Zone. The dedicated host handles only signed status, intent, approval, audit, and receipt coordination; it must not proxy public application traffic.

Project Reclaim is a **separate planned physical–digital bridge node** in **London (`eu-west-2`)**. This creates the closest new-region extension to the real five-region crosshair without duplicating an existing node Region. The regional choice is a default architecture decision, not a substitute for locating field-facing services near the first real-world programs. If field work later concentrates in another geography, deploy a local Project Reclaim edge service there while retaining the London host as the bridge authority and audit origin.

> The crosshair is logical. **Ireland is its first physical host.** Project Reclaim does not belong at the crosshair: **London is its first physical bridge location.**

## Why Ireland for the ARCHANGEL Host

The calculation treats the **five unique deployed regions** as equal-weight geographic points: Oregon, Ireland, Frankfurt, Singapore, and São Paulo. Root-Gate and Tesseract-Terminus are co-located in Oregon and therefore count once in geography, while remaining separate logical nodes. Using approximate city-level great-circle distance, the regional centroid is near **56.44° N, 11.56° W**, a conceptual North Atlantic point west of Ireland with no corresponding AWS Region. Among the available locations, Ireland has the lowest mean distance to the five unique regions: roughly **5,832 km** and is roughly **482 km** from the calculated center. London is the strongest non-existing-region option at roughly **5,871 km** mean distance and roughly **925 km** from the calculated center.

This is a **control-message placement heuristic**, not a latency guarantee. Real latency depends on routing and congestion. It is sufficient for ARCHANGEL because signed receipts, intents, and audit events are small control messages. User-facing services should remain regional and should not transit through ARCHANGEL.

| Placement | Region | Role | Operating boundary |
|---|---|---|---|
| Root-Gate | Oregon (`us-west-2`) | Sovereign identity | Issues/anchors authority; does not become the mesh bottleneck |
| ARCHANGEL host | Ireland (`eu-west-1`) | Logical-center implementation | Dedicated control host; status, intent, approval, receipt, and audit only |
| Project Reclaim | London (`eu-west-2`) | Physical–digital bridge | New regional node; field-program intake, partner integration, and grounded outcomes |

## Traffic and Resilience Rules

| Traffic type | Path | Reason |
|---|---|---|
| Public application traffic | User to nearest application node | Keeps latency low and avoids routing normal usage through the control plane |
| Signed node status | Node to ARCHANGEL host in Ireland | Centralizes verification and audit without carrying product traffic |
| Intent and approval | Operator to ARCHANGEL; receipt back to ARCHANGEL | Preserves the proposal, approval, and verification boundary |
| Project Reclaim field data | Field systems to London bridge, then signed summary to ARCHANGEL | Keeps physical-system integration separate from sovereign identity and control authority |
| Identity assertions | Root-Gate to approved control-plane services | Root-Gate stays the authority anchor rather than a global traffic relay |

Each AWS Region is isolated from the others, and cross-Region communications require appropriate encryption. Lightsail supports the selected Ireland and London Regions, and AWS advises locating resources close to the users they serve. These facts support regional applications for local users, a centrally balanced control host for small messages, and a new regional bridge node for Project Reclaim. [1] [2]

## Initial Project Reclaim Footprint

Start Project Reclaim as a **dedicated London Lightsail instance** only if its first responsibilities are an HTTPS application, an operator-facing field gateway, and signed event forwarding. Keep it isolated from KEIRA, Root-Gate, and ARCHANGEL through separate credentials, a separate node keypair, limited inbound firewall rules, and no public administrative access. Permit only required HTTPS ingress and authenticated, encrypted egress to its approved control-plane interface.

Move Project Reclaim to **EC2 in a VPC in `eu-west-2`** when it needs private partner connectivity, multiple internal services, device/network segmentation, long-lived processors, or more elaborate AWS networking. That migration changes its implementation footprint, not its declared bridge role.

## References

[1] [AWS Lightsail Regions and Availability Zones](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-regions-and-availability-zones-in-amazon-lightsail.html)

[2] [AWS Regions](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html)
