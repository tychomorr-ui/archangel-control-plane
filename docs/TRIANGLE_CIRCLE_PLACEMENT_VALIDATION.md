# Triangle–Circle Placement Validation

## Decision Scope

This analysis addresses a **logical topology** and a **physical Region-placement plan** separately. The core visual remains one upright triangle, one inverted triangle, and **ARCHANGEL at the shared center**. Region selection does not redraw those triangles; it determines where their services are physically hosted.

The required constraints are that Tesseract-Terminus moves out of Oregon, and that **Tesseract-Terminus, ARCHANGEL, and Project Reclaim each use a different Region that is not already occupied** by Root-Gate, XinUS-Clarity, Tesseract-A, Kether-Gate, or KEIRA.

## Criteria

The recommended arrangement weighs four criteria. First, ARCHANGEL should be close to the geographic center of the active mesh because it coordinates small, signed control messages. Second, Tesseract-Terminus should be materially separated from Root-Gate because provenance and identity should not share a regional failure domain. Third, Project Reclaim should be a distinct extension that remains reasonably close to the center. Finally, all three new placements must preserve separate regional fault domains and leave public application traffic local rather than routing it through the control plane.

> This is a geographic control-message heuristic, not a claim about exact production latency. Real latency depends on routing, service design, and traffic path. The analysis uses approximate city-level great-circle distances and is reproducible in `scripts/revised-three-node-placement.mjs`.

## Preferred Arrangement

| Role | Recommended Region | Decision rationale |
|---|---|---|
| **Tesseract-Terminus** | **Spain (`eu-south-2`)** | Separates provenance and attestation from Root-Gate by approximately 8,697 km, creating a clear independent regional failure domain while remaining within the European control plane. |
| **ARCHANGEL host** | **London (`eu-west-2`)** | Is the nearest unused Region to the revised global center after the Terminus move, approximately 586 km away. It is a separate host and does not reuse Ireland. |
| **Project Reclaim** | **Paris (`eu-west-3`)** | Is a third unused Region and is approximately 838 km from the revised center, providing a nearby but independent bridge location. |

The closest alternative is **Tesseract-Terminus in Paris, ARCHANGEL in London, and Project Reclaim in Spain**. That arrangement places ARCHANGEL about 40 km closer to the geometric center, but makes Project Reclaim roughly 724 km farther from it and gives Tesseract-Terminus less separation from Root-Gate. Therefore, **Spain / London / Paris is the preferred balanced arrangement**, not an absolute physical-law optimum. It is optimal for the stated architecture priorities: independent provenance, central control messaging, and a nearby distinct bridge region.

## The Triangle, Inverted Triangle, and Circle

The two triangles remain the **core authority and capability model**. Their placement in the visual is intentionally symbolic and should remain stable as physical hosting changes.

| Layer | Logical members | Purpose | Authority rule |
|---|---|---|---|
| **Upright triangle** | Root-Gate, Tesseract-Terminus, XinUS-Clarity | Identity, provenance, and applied human-facing capability | No one vertex may silently substitute for the others. |
| **Inverted triangle** | Kether-Gate, Tesseract-A, KEIRA | Operating system, recovery continuity, and intelligence | Each vertex remains independently observable and auditable. |
| **Shared center** | ARCHANGEL | Signed status, intent, approval boundary, receipts, and audit | Coordinates and verifies; it does not become sovereign identity or a product-traffic relay. |
| **Enclosing circle** | Project Reclaim and future nodes | Expansion, field interfaces, regional witnesses, edge gateways, specialized applications, and recovery initiatives | Extends the mesh without gaining core authority simply by joining the circle. |

The circle is a strong model for growth because it lets additional nodes be placed by **function and regional need** without breaking the six core vertices. Future nodes may sit on the circle as field bridges, regional witnesses, archival replicas, partner gateways, or specialized applications. They should receive bounded permissions and send signed status inward to ARCHANGEL. The circle should **not** become an all-to-all traffic ring or a second authority center.

## Implications

This topology provides a clear separation of concerns. The triangles give the ecosystem stable meaning; the center gives it coordination; the circle gives it room to grow. Public service traffic remains regional. Control traffic stays small, signed, encrypted, and purpose-limited. A failure of a circle node should never change core identity, provenance, recovery, or approval authority.

AWS Regions are isolated from one another and cross-Region communication should be encrypted. Lightsail supports the selected Spain, London, and Paris Regions, subject to account Region availability and opt-in status where applicable. [1] [2]

## References

[1] [AWS Lightsail Regions and Availability Zones](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-regions-and-availability-zones-in-amazon-lightsail.html)

[2] [AWS Regions](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html)
