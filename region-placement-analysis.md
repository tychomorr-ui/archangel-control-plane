# Regional Placement Analysis

This comparison uses approximate city-level great-circle distance as a transparent geographic proxy. It is not a latency measurement: routing, network congestion, and service architecture affect actual round-trip time.

The equal-weight geographic centroid of the six declared nodes is approximately **65.30°, -44.39°**. It is a conceptual point, not an AWS deployment location.

| Candidate | Region | Mean distance to six current nodes (km) | Distance to geographic centroid (km) | Furthest current node (km) | Existing-node region? |
|---|---:|---:|---:|---:|---|
| Ireland | eu-west-1 | 6,107 | 2,481 | 11,199 | Yes |
| London | eu-west-2 | 6,210 | 2,912 | 10,848 | No |
| Paris | eu-west-3 | 6,314 | 3,251 | 10,729 | No |
| Frankfurt | eu-central-1 | 6,327 | 3,436 | 10,258 | Yes |
| Stockholm | eu-north-1 | 6,502 | 3,154 | 10,927 | No |
| Oregon | us-west-2 | 6,634 | 4,999 | 13,091 | Yes |
| Spain | eu-south-2 | 6,676 | 3,766 | 11,381 | No |
| Montreal | ca-central-1 | 6,847 | 2,818 | 14,799 | No |
| Ohio | us-east-2 | 7,080 | 3,726 | 15,369 | No |
| Virginia | us-east-1 | 7,116 | 3,602 | 15,538 | No |
| Mumbai | ap-south-1 | 9,528 | 9,267 | 13,774 | No |
| Seoul | ap-northeast-2 | 9,569 | 8,553 | 18,342 | No |
| Tokyo | ap-northeast-1 | 9,726 | 8,782 | 18,537 | No |
| Hong Kong | ap-east-1 | 10,120 | 10,102 | 18,046 | No |
| Malaysia | ap-southeast-5 | 10,535 | 11,926 | 15,924 | No |
| Singapore | ap-southeast-1 | 10,604 | 12,175 | 15,987 | Yes |
| Jakarta | ap-southeast-3 | 11,143 | 13,071 | 15,629 | No |
| Sydney | ap-southeast-2 | 13,007 | 16,367 | 17,214 | No |

## Selected interpretation

The lowest mean-distance candidate is **Ireland (eu-west-1)** at approximately 6,107 km. The ranking is a control-message placement heuristic only; user-facing workloads should remain local to their users.

For a new, non-duplicative Project Reclaim region, preference should go to a candidate that adds a failure domain and serves the planned physical work rather than merely minimizing the mean-distance score. The selected default is **Montreal (`ca-central-1`)**, while the finalized ARCHANGEL host is **Ireland (`eu-west-1`)**.
