# Outer-Circle Expansion Analysis

The six core vertices are assumed to be Oregon, Spain, Ireland, Frankfurt, Singapore, and São Paulo. Three outer-circle candidates must be unused Regions. The score is a transparent geographic-diversity heuristic: 62% minimum separation among the three added nodes, and 38% average distance from the nearest core node. It is not a network-latency measurement or an automatic deployment decision.

| Rank | Three-node outer-circle set | Minimum distance between added nodes (km) | Average nearest-core separation (km) | Diversity score |
|---:|---|---:|---:|---:|
| 1 | Virginia (us-east-1) · Mumbai (ap-south-1) · Sydney (ap-southeast-2) | 10,157 | 4,662 | 8,069 |
| 2 | Montreal (ca-central-1) · Mumbai (ap-south-1) · Sydney (ap-southeast-2) | 10,157 | 4,658 | 8,067 |
| 3 | Ohio (us-east-2) · Mumbai (ap-south-1) · Sydney (ap-southeast-2) | 10,157 | 4,491 | 8,004 |
| 4 | Virginia (us-east-1) · Sydney (ap-southeast-2) · Seoul (ap-northeast-2) | 8,329 | 4,919 | 7,033 |
| 5 | Montreal (ca-central-1) · Sydney (ap-southeast-2) · Seoul (ap-northeast-2) | 8,329 | 4,914 | 7,032 |
| 6 | Ohio (us-east-2) · Sydney (ap-southeast-2) · Seoul (ap-northeast-2) | 8,329 | 4,747 | 6,968 |
| 7 | Virginia (us-east-1) · Sydney (ap-southeast-2) · Tokyo (ap-northeast-1) | 7,826 | 5,132 | 6,802 |
| 8 | Montreal (ca-central-1) · Sydney (ap-southeast-2) · Tokyo (ap-northeast-1) | 7,826 | 5,128 | 6,800 |
| 9 | Ohio (us-east-2) · Sydney (ap-southeast-2) · Tokyo (ap-northeast-1) | 7,826 | 4,961 | 6,737 |
| 10 | Paris (eu-west-3) · Sydney (ap-southeast-2) · Seoul (ap-northeast-2) | 8,329 | 3,819 | 6,615 |
| 11 | London (eu-west-2) · Sydney (ap-southeast-2) · Seoul (ap-northeast-2) | 8,329 | 3,814 | 6,613 |
| 12 | Stockholm (eu-north-1) · Sydney (ap-southeast-2) · Tokyo (ap-northeast-1) | 7,826 | 4,268 | 6,474 |

## Interpretation

A pure geographic-diversity score tends to favor an eastern North American node, a Pacific node, and a South Asian node. Role assignment should override this score when a node has a more specific operating purpose. Project Reclaim should be assigned to the outer-circle location closest to its actual field partnerships and physical programs; a central control or witness role should not be assigned to it merely because a point scores well on separation.
