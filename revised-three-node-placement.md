# Revised Three-Node Placement Analysis

This calculation treats Root-Gate, XinUS-Clarity, Tesseract-A, Kether-Gate, and KEIRA as fixed. Tesseract-Terminus, ARCHANGEL, and Project Reclaim must all occupy **different, currently unused Regions**. It uses approximate city-level great-circle distance as a geographic proxy, not measured network latency.

| Tesseract-Terminus candidate | Distance from Root-Gate (km) | Resulting geographic center | Nearest unused ARCHANGEL candidate | Distance to center (km) | Next distinct Project Reclaim candidate | Distance to center (km) |
|---|---:|---|---|---:|---|---:|
| Paris (eu-west-3) | 8,248 | 54.31°, -6.81° | London (eu-west-2) | 546 | Spain (eu-south-2) | 1,562 |
| Spain (eu-south-2) | 8,697 | 51.64°, -8.61° | London (eu-west-2) | 586 | Paris (eu-west-3) | 838 |
| Mumbai (ap-south-1) | 12,662 | 53.53°, 23.17° | Stockholm (eu-north-1) | 716 | Paris (eu-west-3) | 1,534 |
| Stockholm (eu-north-1) | 7,818 | 58.03°, -3.17° | London (eu-west-2) | 751 | Paris (eu-west-3) | 1,082 |
| London (eu-west-2) | 7,906 | 55.06°, -7.80° | Paris (eu-west-3) | 977 | Stockholm (eu-north-1) | 1,617 |
| Malaysia (ap-southeast-5) | 13,060 | 57.18°, 34.91° | Stockholm (eu-north-1) | 1,011 | London (eu-west-2) | 2,328 |
| Sydney (ap-southeast-2) | 12,342 | 68.47°, 15.94° | Stockholm (eu-north-1) | 1,022 | London (eu-west-2) | 2,072 |
| Hong Kong (ap-east-1) | 10,540 | 65.46°, 34.44° | Stockholm (eu-north-1) | 1,079 | London (eu-west-2) | 2,486 |
| Jakarta (ap-southeast-3) | 13,561 | 56.74°, 36.25° | Stockholm (eu-north-1) | 1,105 | London (eu-west-2) | 2,410 |
| Seoul (ap-northeast-2) | 8,451 | 71.30°, 26.45° | Stockholm (eu-north-1) | 1,383 | London (eu-west-2) | 2,568 |
| Tokyo (ap-northeast-1) | 7,796 | 74.78°, 23.69° | Stockholm (eu-north-1) | 1,733 | London (eu-west-2) | 2,803 |
| Montreal (ca-central-1) | 3,765 | 56.87°, -32.78° | London (eu-west-2) | 2,183 | Paris (eu-west-3) | 2,488 |
| Virginia (us-east-1) | 3,777 | 55.55°, -35.59° | London (eu-west-2) | 2,359 | Paris (eu-west-3) | 2,653 |
| Ohio (us-east-2) | 3,264 | 56.69°, -37.27° | London (eu-west-2) | 2,457 | Paris (eu-west-3) | 2,759 |

## Interpretation

The table is an input to architecture judgment rather than an automatic placement decision. Tesseract-Terminus is a provenance and attestation role, so the preferred move should add a meaningful failure domain away from Root-Gate while preserving reasonable control-message distances. ARCHANGEL should then use the nearest remaining region to the revised center, and Project Reclaim should take the next distinct candidate unless field-program geography dictates otherwise.
