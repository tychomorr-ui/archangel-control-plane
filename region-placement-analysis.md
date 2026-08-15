# Regional Placement Analysis

This comparison uses the five unique current geographic regions as a transparent great-circle-distance proxy. Root-Gate and Tesseract-Terminus are co-located in Oregon and therefore count once for geographic placement. This is not a latency measurement: routing, network congestion, and service architecture affect actual round-trip time.

The equal-weight geographic centroid of the five unique deployed regions is approximately **56.44°, -11.56°**. It is a conceptual point, not an AWS deployment location.

| Candidate | Region | Mean distance to five current regions (km) | Distance to geographic centroid (km) | Furthest current region (km) | Existing-node region? |
|---|---:|---:|---:|---:|---|
| Ireland | eu-west-1 | 5,832 | 482 | 11,199 | Yes |
| London | eu-west-2 | 5,871 | 925 | 10,848 | No |
| Frankfurt | eu-central-1 | 5,914 | 1,511 | 10,258 | Yes |
| Paris | eu-west-3 | 5,927 | 1,257 | 10,729 | No |
| Stockholm | eu-north-1 | 6,239 | 1,766 | 10,927 | No |
| Spain | eu-south-2 | 6,272 | 1,870 | 11,381 | No |
| Montreal | ca-central-1 | 7,463 | 4,346 | 14,799 | No |
| Virginia | us-east-1 | 7,784 | 5,050 | 15,538 | No |
| Ohio | us-east-2 | 7,843 | 5,329 | 15,369 | No |
| Oregon | us-west-2 | 7,961 | 6,998 | 13,091 | Yes |
| Mumbai | ap-south-1 | 8,901 | 7,913 | 13,774 | No |
| Seoul | ap-northeast-2 | 9,793 | 8,857 | 18,342 | No |
| Malaysia | ap-southeast-5 | 10,030 | 11,111 | 15,924 | No |
| Hong Kong | ap-east-1 | 10,036 | 9,894 | 18,046 | No |
| Singapore | ap-southeast-1 | 10,107 | 11,403 | 15,987 | Yes |
| Tokyo | ap-northeast-1 | 10,112 | 9,418 | 18,537 | No |
| Jakarta | ap-southeast-3 | 10,659 | 12,297 | 15,629 | No |
| Sydney | ap-southeast-2 | 13,140 | 17,183 | 17,214 | No |

## Selected interpretation

The lowest mean-distance candidate is **Ireland (eu-west-1)** at approximately 5,832 km. The ranking is a control-message placement heuristic only; user-facing workloads should remain local to their users.

For a new, non-duplicative Project Reclaim region, preference should go to a candidate that adds a failure domain and serves the planned physical work rather than merely minimizing the mean-distance score.
