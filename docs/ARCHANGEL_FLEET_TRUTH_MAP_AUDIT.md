# ARCHANGEL Fleet Truth-Map Audit

## Purpose

This audit corrects the geographic model so the console maps **only what is actually known to be hosted**. Logical topology, strategic recommendations, public web applications, and future node ideas must not be rendered as if they were physical Lightsail instances.

## Verified Current Hosting Inventory

The following information comes from the owner’s current Lightsail inventory supplied on August 15, 2026. It describes eight application or role nodes and the dedicated London control-plane host.

| Physical host | Logical role | Region | Geographic-map treatment |
|---|---|---|---|
| `ROOT_SOVEREIGN-IDENTITY` | Root-Gate | N. Virginia · `us-east-1` | Current host |
| `IWA-SAGE-APP` | IWA Sage | Canada Central / Montreal · `ca-central-1` | Current host |
| `PROJECT-RECLAIM` | Project Reclaim | Oregon · `us-west-2` | Current host |
| `XinUS-Clarity` | XinUS-Clarity | Ireland · `eu-west-1` | Current host |
| `Sovereign_Provenance-Console` | Tesseract-Terminus | Spain · `eu-south-2` | Current host |
| `The_Portal` | KEIRA | São Paulo · `sa-east-1` | Current host |
| `Tesseract-A` | Tesseract-A | Frankfurt · `eu-central-1` | Current host |
| `Monarch-OS` | Monarch-OS / Kether-Gate logical role | Singapore · `ap-southeast-1` | Current host |
| `ARCHANGEL_CONTROL-PLANE` | ARCHANGEL | London · `eu-west-2` | Current host; **not** a triangle vertex |

## Corrections

| Item | Earlier presentation | Correct presentation now |
|---|---|---|
| Resonate Earth | Sydney physical node | A public front-door application with **no verified Lightsail host or region supplied**. It remains unplaced on the physical map. |
| Exitus Lens | Tokyo physical node | A planned Figma/application concept with **no deployed node or region supplied**. It remains unplaced on the physical map. |
| Sydney and Tokyo | Mapped as planned peer locations | Previous strategic recommendations only, not declared infrastructure. They are removed from the geographic projection. |
| ARCHANGEL crosshair | Could be read as a geographic center | A logical coordination symbol; London is shown as the actual physical host. |

The supplied Resonate Earth reference identifies it as a **public front-door / web anchor**. It does not establish an origin host or region. A direct public hostname check from the development environment did not resolve, so it cannot be used as geographic evidence. This audit deliberately makes no health, ownership, or hosting-location claim from that result.

## Map Rules Going Forward

The geographic map uses solid marks for declared physical hosts, marks the London ARCHANGEL host independently, and keeps unknown-location applications off the map. It uses a reproducible equirectangular projection of regional-city proxies for readability; these are not AWS facility coordinates. The logical topology continues to show trust and role relationships, not physical distance. Future placements may be kept in a **placement ledger** as recommendations, but they must never become map coordinates until an instance and region are explicitly supplied.
