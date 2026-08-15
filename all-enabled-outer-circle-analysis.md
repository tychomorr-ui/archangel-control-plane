# All-Enabled-Region Outer-Circle Analysis

The core is assumed to be Oregon, Spain, Ireland, Frankfurt, Singapore, São Paulo, with ARCHANGEL hosted in London. The new candidates include every enabled Region supplied by the user. Locations marked **EC2** are not currently supported by Lightsail, but are valid for a node created from scratch on EC2/VPC infrastructure. The score is a transparent geographic-diversity heuristic: 62% minimum separation among the three outer nodes and 38% average distance from the nearest core/control host.

## Highest geographic-diversity combinations

| Rank | Outer-circle set | Minimum pair separation (km) | Average nearest-core separation (km) | Score |
|---:|---|---:|---:|---:|
| 1 | N. Virginia (us-east-1; Lightsail or EC2) · Mumbai (ap-south-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 12,298 | 5,366 | 9,664 |
| 2 | Cape Town (af-south-1; EC2) · N. Virginia (us-east-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,180 | 9,647 |
| 3 | Cape Town (af-south-1; EC2) · Montreal (ca-central-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,176 | 9,646 |
| 4 | Ohio (us-east-2; Lightsail or EC2) · Mumbai (ap-south-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 12,298 | 5,195 | 9,599 |
| 5 | Cape Town (af-south-1; EC2) · Ohio (us-east-2; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,009 | 9,582 |
| 6 | Mexico Central (mx-central-1; EC2) · Bahrain (me-south-1; EC2) · Sydney (ap-southeast-2; Lightsail or EC2) | 12,515 | 4,787 | 9,578 |
| 7 | Cape Town (af-south-1; EC2) · N. Virginia (us-east-1; Lightsail or EC2) · Taipei (ap-east-2; EC2) | 12,647 | 4,457 | 9,535 |
| 8 | Cape Town (af-south-1; EC2) · Mexico Central (mx-central-1; EC2) · Taipei (ap-east-2; EC2) | 12,679 | 4,404 | 9,534 |
| 9 | Montreal (ca-central-1; Lightsail or EC2) · Mumbai (ap-south-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 12,075 | 5,362 | 9,524 |
| 10 | Mexico Central (mx-central-1; EC2) · UAE (me-central-1; EC2) · Sydney (ap-southeast-2; Lightsail or EC2) | 12,087 | 4,920 | 9,364 |
| 11 | Mexico Central (mx-central-1; EC2) · Tel Aviv (il-central-1; EC2) · Sydney (ap-southeast-2; Lightsail or EC2) | 12,473 | 4,287 | 9,363 |
| 12 | Mexico Central (mx-central-1; EC2) · Tel Aviv (il-central-1; EC2) · Melbourne (ap-southeast-4; EC2) | 12,473 | 4,206 | 9,332 |

## If Project Reclaim is assigned to Cape Town

| Rank | Outer-circle set | Minimum pair separation (km) | Average nearest-core separation (km) | Score |
|---:|---|---:|---:|---:|
| 1 | Cape Town (af-south-1; EC2) · N. Virginia (us-east-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,180 | 9,647 |
| 2 | Cape Town (af-south-1; EC2) · Montreal (ca-central-1; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,176 | 9,646 |
| 3 | Cape Town (af-south-1; EC2) · Ohio (us-east-2; Lightsail or EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 6,009 | 9,582 |
| 4 | Cape Town (af-south-1; EC2) · N. Virginia (us-east-1; Lightsail or EC2) · Taipei (ap-east-2; EC2) | 12,647 | 4,457 | 9,535 |
| 5 | Cape Town (af-south-1; EC2) · Mexico Central (mx-central-1; EC2) · Taipei (ap-east-2; EC2) | 12,679 | 4,404 | 9,534 |
| 6 | Cape Town (af-south-1; EC2) · Mexico Central (mx-central-1; EC2) · Seoul (ap-northeast-2; Lightsail or EC2) | 12,052 | 4,878 | 9,326 |
| 7 | Cape Town (af-south-1; EC2) · Ohio (us-east-2; Lightsail or EC2) · Taipei (ap-east-2; EC2) | 12,353 | 4,286 | 9,288 |
| 8 | Cape Town (af-south-1; EC2) · Calgary (ca-west-1; EC2) · Auckland (ap-southeast-6; EC2) | 11,772 | 5,215 | 9,281 |

## Interpretation

The pure score should not choose a human- and field-facing role by itself. Cape Town is a strategically strong Project Reclaim candidate because it establishes an Africa and southern-hemisphere outer-ring point, far from all six core Regions and London. If Cape Town is selected for Project Reclaim, the strongest complementary future sites should be chosen from North America and the Pacific/Asia to prevent the ring from becoming Europe-heavy.
