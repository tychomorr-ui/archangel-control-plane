> **Historical planning record — superseded for active deployment.** This document contains earlier provider or placement assumptions. The current canonical deployment is UpCloud; use `docs/ARCHANGEL_UPCLOUD_CANONICALIZATION.md` and the active source declarations for present operations. Historical text is retained unchanged for auditability.

# ARCHANGEL Revised Fleet and Outer Circle

## Current Authoritative Inventory

The fleet below supersedes the former Oregon Root-Gate assumption. **Root-Gate no longer exists in Oregon.** Project Reclaim is now the Oregon node, and the physical Root-Gate host must be rebuilt in a distinct region before mesh enrollment starts.

| Logical role | Current physical host | Region | Operating system | Mesh disposition |
|---|---|---|---|---|
| Sovereign provenance | `Sovereign_Provenance-Console` | Spain · `eu-south-2` | Ubuntu | Existing Alpha vertex; retains the Tesseract-Terminus provenance role. |
| ARCHANGEL hub | `ARCHANGEL_CONTROL-PLANE` | London · `eu-west-2` | Ubuntu | Existing private-mesh hub; logical center, not a core application vertex. |
| Clarity application layer | `XinUS-Clarity` | Ireland · `eu-west-1` | Ubuntu | Existing Alpha vertex. |
| Recovery and mirror | `Tesseract-A` | Frankfurt · `eu-central-1` | Ubuntu | Existing Beta vertex. |
| Intelligence layer | `The_Portal` | São Paulo · `sa-east-1` | Ubuntu | Existing Beta vertex; retain **KEIRA** as the intelligence identity in the registry. |
| Monarch OS | `Monarch-OS` | Singapore · `ap-southeast-1` | Debian | Existing Beta vertex; replace the former physical Kether-Gate host label with the current Monarch-OS host identity. |
| Field activation | `PROJECT-RECLAIM` | Oregon · `us-west-2` | Ubuntu | Existing bridge node, distinct from the deleted Root-Gate. |
| Sovereign identity | `ROOT_SOVEREIGN-IDENTITY` | N. Virginia · `us-east-1` | Ubuntu | Active Alpha vertex and Root-Gate enrollment authority. |
| Indigenous Wellness Alliance | `IWA-SAGE-APP` | Canada Central / Montreal · `ca-central-1` | Ubuntu | Active outer-circle wellness and community-service node. |
| Resonate Earth | **Resonate Earth to be created** | **Sydney · `ap-southeast-2`** | Ubuntu 24 OS-only | Outer-circle planetary-witness and public-explanation node. |

## Placement Decision

### Root-Gate: N. Virginia (`us-east-1`)

**N. Virginia is the correct Root-Gate location.** The active `ROOT_SOVEREIGN-IDENTITY` host restores the identity authority to North America without recreating the Oregon single-region dependency, remains materially separated from Project Reclaim, and gives the ecosystem an eastern United States anchor. AWS also places Lightsail DNS zones and distributions in N. Virginia, so the region can support global naming and distribution functions if you later choose to use them; that convenience must not turn Root-Gate into an unnecessary command or application bottleneck.[1]

Root-Gate’s specific function is limited and clear: maintain the public enrollment-authority identity, authorize new node public keys, publish the authority fingerprint, and provide a separate signed identity receipt. It does **not** control application workloads and does not receive node private keys.

### IWA Sage: Canada Central (`ca-central-1`)

**Canada Central is the correct home for IWA Sage.** The active `IWA-SAGE-APP` host gives the ecosystem a distinct Canadian region and failure domain while keeping the wellness service geographically close to the North American field layer. It is deliberately outside Oregon, London, and N. Virginia so it does not inherit the field, hub, or identity authority role. The selected location is a technical placement; any future data-residency or community-governance policy should be separately written before handling sensitive program data.

IWA Sage belongs to the **outer circle**, not either core triangle. Its initial allowed mesh relationship should be read-only identity and evidence exchange with ARCHANGEL. It should not receive blanket access to KEIRA, Root-Gate, or other application data merely by joining the private overlay.

### Resonate Earth: Sydney (`ap-southeast-2`)

**Sydney is the right placement for Resonate Earth.** It gives the outer circle the strongest new South Pacific separation among the current Lightsail regions without duplicating Singapore. The geographic analysis places Sydney at least 6,306 km from the nearest current site and gives it the highest mean separation from the revised fleet among the tested candidate placements. Its role is explicitly a low-criticality witness and public-explanation surface, not a source of fleet authority or a condition for core-mesh health.

Resonate Earth should be modeled as **optional witness evidence**. If it is absent or stale, ARCHANGEL records that condition but does not degrade the verified state of the identity, provenance, recovery, intelligence, or field layers.

### Exitus Lens: Tokyo (`ap-northeast-1`)

**Tokyo is the recommended future placement for Exitus Lens.** Resonate Earth already establishes the South Pacific outer-circle position in Sydney; Tokyo adds a distinct North Pacific view without duplicating the active Singapore Monarch-OS host. Exitus Lens is defined as a read-only visual evidence and inspection surface. It may request specifically approved, signed summaries from ARCHANGEL, but it is not an identity authority, data origin, or command channel.

## Revised Logical Geometry

The core remains two opposing triangles. The geographic map remains separate from the relationship geometry.

| Layer | Vertices and role |
|---|---|
| **Alpha · upright triangle** | XinUS-Clarity (Ireland) at the apex; Root-Gate (N. Virginia) and Sovereign Provenance Console / Tesseract-Terminus (Spain) at the lower vertices. |
| **Beta · inverted triangle** | Monarch-OS (Singapore) and Tesseract-A (Frankfurt) at the upper vertices; KEIRA / The_Portal (São Paulo) at the lower vertex. |
| **Shared center** | ARCHANGEL (London): private transport hub, signature verifier, protected registry, and audit coordinator. |
| **Bridge** | Project Reclaim (Oregon): a separate field activation host beneath the logical center. |
| **Outer circle** | IWA Sage (Canada Central, active), Resonate Earth (Sydney, planned), Exitus Lens (Tokyo, planned), then future expansion. |

## Future Outer-Circle Order

| Priority | Region | Reason |
|---|---|---|
| 1 | Canada Central · `ca-central-1` | IWA Sage; now active, providing North American geographic and jurisdictional diversity separate from the Oregon field node and N. Virginia identity authority. |
| 2 | Sydney · `ap-southeast-2` | Resonate Earth; South Pacific public-witness separation from Singapore. |
| 3 | Tokyo · `ap-northeast-1` | Exitus Lens; North Pacific visual-evidence surface, separate from the Singapore Monarch-OS host. |
| 4 | Mumbai · `ap-south-1` | Future South Asia service node; useful only when there is a concrete audience or application requirement. |

Stockholm is not an early outer-circle priority because it is geographically close to the existing European core. Africa (Cape Town) is an AWS Region but is not in the current Lightsail region list; use EC2 rather than assume a Lightsail deployment if a future African site is required.[1] [2]

## Analysis Boundary

The companion `revised_fleet_placement_metrics.json` uses representative city-centre Haversine distance. It describes geographic separation, **not** user latency, legal data residency, network quality, or application suitability. AWS recommends choosing regions close to an application’s users and using multiple Availability Zones when fault tolerance is required.[1]

## References

[1]: https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-regions-and-availability-zones-in-amazon-lightsail.html "AWS Lightsail: Regions and Availability Zones"
[2]: https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-lightsail-aws-regions/ "AWS: Lightsail availability in additional AWS Regions"
