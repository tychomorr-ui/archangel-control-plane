> **Historical planning record — superseded for active deployment.** This document contains earlier provider or placement assumptions. The current canonical deployment is UpCloud; use `docs/ARCHANGEL_UPCLOUD_CANONICALIZATION.md` and the active source declarations for present operations. Historical text is retained unchanged for auditability.

# ARCHANGEL Private Mesh: Authoritative Design

## Decision

ARCHANGEL will be built as a **private, terminal-managed control mesh**, not as a public fleet API and not as a browser-held key registry. The correct first topology is a **hub-and-spoke WireGuard overlay**: the London ARCHANGEL host is the private coordination hub, while every declared Lightsail node is a peer with one encrypted, authenticated path to that hub.

This is deliberately *not* a flat any-to-any network. A secure mesh is an identity-and-policy system, not a rule that every machine may freely reach every other machine. Hub-and-spoke gives every node a direct private relationship with ARCHANGEL while avoiding the unnecessary peer explosion, broad routing, and lateral-movement risk of a 10-node full mesh. Direct node-to-node application paths can be introduced later only where a named role requires them.

> **The sovereign rule:** every node owns its private keys; ARCHANGEL stores public identities, public WireGuard keys, receipt hashes, and audit evidence only. No remote shell, command queue, credential vault, or public enrollment endpoint is part of this design.

## Why This Is the Best Simple Sovereign Path

WireGuard gives each peer a distinct private/public keypair, a private interface address, peer-specific `AllowedIPs`, and a defined endpoint. Its peer model is suited to site-to-site networks, while `AllowedIPs` function as both routing selection and a receive-side access-control rule.[1] A spoke needs only the London endpoint; it does not need a public listening port. Lightsail supports custom UDP firewall rules and source restrictions, while its public firewall applies to public-IP inbound traffic and outbound traffic remains allowed.[2] [3]

| Design choice | Why it is selected | What it excludes |
|---|---|---|
| **London as hub** | One coordination endpoint, one audit point, one status collector, and one simple peer relationship per node. | Pairwise peer configuration among every node. |
| **WireGuard `wg-archangel` overlay** | Encrypted and authenticated private transport, configured entirely from terminal-managed files. | Public status and enrollment APIs. |
| **Central status pull over the overlay** | ARCHANGEL polls a read-only node agent at a private tunnel address. This is the least complex full-fleet operation model. | Inbound public listeners on spokes, browser polling, or node execution. |
| **Ed25519 signed status receipts** | The receipt remains independently attributable to the node even inside the encrypted overlay. | “HTTP 200 means healthy” claims. |
| **Root-Gate as enrollment authority** | It already has the declared sovereign-identity role. It authorizes public-key admission; ARCHANGEL independently verifies the authorization and node proof. | Browser-local root keys and silent node admission. |
| **Role-scoped future service paths** | Applications become interoperable through explicit registry contracts, not a wide-open LAN. | Accidental lateral network access. |

## Private Addressing and Peer Map

The private overlay uses a dedicated control-plane range. These addresses are not public DNS records and do not expose a service to the internet.

| Private address | Peer | Region | Role in the mesh |
|---|---|---|---|
| `10.42.0.1/32` | ARCHANGEL | London · `eu-west-2` | Private hub, receipt collector, audit writer, policy verifier |
| `10.42.0.11/32` | Root-Gate | N. Virginia · `us-east-1` · planned rebuild | Sovereign identity and enrollment authorization root |
| `10.42.0.12/32` | Sovereign Provenance Console | Spain · `eu-south-2` | Tesseract-Terminus provenance, anchoring, and attestation receipt role |
| `10.42.0.13/32` | XinUS-Clarity | Ireland · `eu-west-1` | Flagship application-layer status role |
| `10.42.0.14/32` | Monarch-OS | Singapore · `ap-southeast-1` | Kether-Gate / Monarch OS operating-system-layer status role |
| `10.42.0.15/32` | Tesseract-A | Frankfurt · `eu-central-1` | Recovery and mirror status role |
| `10.42.0.16/32` | KEIRA | São Paulo · `sa-east-1` | Intelligence-node status role |
| `10.42.0.17/32` | Project Reclaim | Oregon · `us-west-2` | Field-program status role, separate from Root-Gate |
| `10.42.0.18/32` | IWA Sage | Canada Central · `ca-central-1` · planned | Indigenous Wellness Alliance community wellness and service role |
| `10.42.0.19/32` | Resonate Earth | Sydney · `ap-southeast-2` · planned | Planetary witness and public-explanation evidence role |
| `10.42.0.20/32` | Exitus Lens | Tokyo · `ap-northeast-1` · planned | Read-only visual evidence and signed-summary inspection role |

Each spoke receives only `10.42.0.1/32` as a permitted initial destination. The hub maintains a distinct peer entry for each spoke, mapped to only that spoke’s `/32`. This enforces a private **control star**: every node can communicate with ARCHANGEL, but no node can route to another node merely because it joined the overlay.

## Terminal-Only Deployment Boundary

The deployment uses standard Ubuntu 24 and Debian 12+ packages, root-owned configuration files, systemd, and command-line verification. WireGuard keys are created in the terminal on the peer that owns them; the private key remains in a root-readable file on that peer. Ubuntu documents `/etc/wireguard/<interface>.conf` as the normal configuration location and `wg-quick` as the lifecycle tool for the interface.[4]

| Component | Runs where | Listens where | Authority |
|---|---|---|---|
| `wg-archangel` | London and every declared node | London accepts UDP on one fixed port; spokes initiate outbound | Transport membership only |
| `archangel-status-agent` | Every declared node | Its assigned `10.42.0.x` address only | Emits a signed, read-only receipt |
| `archangel-collector` | London only | `10.42.0.1` only | Pulls, verifies, stores, and audits receipts |
| Root enrollment signer | Root-Gate only | No network listener required | Signs public-key admission records |
| ARCHANGEL console | Protected web application | Existing authenticated console | Displays validated state; never executes node commands |

### Firewall Policy

Only the London hub needs a new public ingress rule: **UDP 51820**, restricted to the known public source addresses of the participating node hosts. Every spoke makes outbound UDP traffic to London and therefore needs no public WireGuard listener. The node status agent is bound to the WireGuard address and must be blocked on public interfaces with host firewall policy. Lightsail firewall rules must be reviewed independently for IPv4 and IPv6 because they are separate rule sets.[2]

SSH remains restricted to trusted administrative source addresses. No public port is opened for enrollment, status, or remote command. If a node’s public address changes, its source restriction must be updated before it can rejoin the overlay.

## Signed Status Protocol

ARCHANGEL will adopt a new versioned status receipt rather than reuse an unverified browser-side object. The canonical byte representation is defined once in test code and implemented identically by node agent and collector.

```json
{
  "version": "ARCHANGEL/1",
  "type": "node.status",
  "node_id": "tesseract-a",
  "sequence": 42,
  "issued_at": "2026-08-15T07:00:00Z",
  "expires_at": "2026-08-15T07:10:00Z",
  "agent_release": "1.0.0",
  "status": {
    "service": "ready",
    "uptime_seconds": 86400,
    "role": "recovery-and-mirror"
  },
  "signature": "base64url-ed25519-signature"
}
```

A receipt is admitted only when all of the following conditions are true: the node ID exists in the declared registry, the receipt verifies against that node’s enrolled public key, the `issued_at` and `expires_at` values are within the allowed window, the sequence number advances, the declared role matches the node contract, and the private overlay source matches the assigned peer address. Any failure is stored as a rejected evidence event with its exact reason. A reachability timeout is displayed as **unreachable or stale**, never as an application failure.

## Enrollment Protocol

Admission is a two-proof exchange conducted from terminals. It does **not** require a browser key wallet, an uploaded private key, or an open internet endpoint.

1. A node generates two local keypairs: WireGuard transport and Ed25519 receipt-signing. The terminal exposes only the two public keys and their fingerprints.
2. Root-Gate signs a short-lived authorization record containing the node ID, the two public-key fingerprints, assigned overlay address, expiration, and a random one-time challenge identifier.
3. The node signs the authorization identifier and its own public keys to prove possession.
4. ARCHANGEL verifies Root-Gate’s authorization and the node proof, then adds only public data to the protected registry and writes an append-only enrollment audit event.
5. The WireGuard peer configuration is installed. `wg show wg-archangel` and a private-address status request are the terminal evidence that the peer is reachable.

The first rollout may use a manually transferred, signed enrollment package through the existing administrative terminal channels. This is deliberate: it avoids inventing a public enrollment API. Later, the same signed package can be moved through the private overlay without changing the trust model.

## Full-Fleet Rollout Order

All declared nodes are part of the architecture. The order below is an operational safety sequence, not a request to leave any node behind.

| Stage | Nodes | Objective | Must be true before continuing |
|---|---|---|---|
| 1 | ARCHANGEL, rebuilt Root-Gate | Establish hub and identity authority | London baseline remains observe-only except the newly reviewed private collector; the N. Virginia Root-Gate authorization key is present and its public fingerprint is registered. |
| 2 | Sovereign Provenance Console, XinUS-Clarity | Validate Alpha’s provenance and application receipts | Two independently signed and fresh receipts verify over the private overlay. |
| 3 | Monarch-OS, Tesseract-A, KEIRA | Complete Beta’s operating-system, recovery, and intelligence receipt paths | Each node joins with a distinct keypair and correct declared role; Monarch-OS follows the Debian-compatible node path. |
| 4 | Project Reclaim | Join the field-program bridge as its own Oregon host | It has a distinct `10.42.0.17` peer, keypair, receipt stream, and no inherited Root-Gate authority. |
| 5 | IWA Sage, Resonate Earth | Join the role-specific outer circle after their distinct applications are deployed | Each peer remains optional to core health and receives only its named registry and evidence contracts. |
| 6 | All 10 nodes | Enforce steady-state collection and rotation | Every console state is tied to a current verified receipt or explicitly shown as stale/pending. |

## What “Connected Apps and Roles” Means

The first live layer is **identity, transport, registry, and evidence**. It makes the ecosystem real in the way that matters first: ARCHANGEL knows which node is speaking, whether it is currently reporting, what role it declares, and whether the declaration verifies. It does not silently become a universal command center.

Once the seven current receipt paths verify, and later as the three planned nodes join, individual applications may be connected through a registry of explicit contracts: an application name, owning node, private address, protocol, audience, data classification, and a narrow allow-list. The first permitted cross-node link should be a read-only, role-specific data contract—for example, a signed provenance receipt from Tesseract-Terminus to ARCHANGEL—not blanket app-to-app reachability.

## Non-Negotiable Safety Boundary

This design never grants execution authority as a side effect of enrollment. An approved intent in the console remains a record only. Any future command capability would require a separate protocol version, policy engine, node-side allow-list, human approval record, expiry, rollback declaration, and a signed outcome receipt. It is out of scope for the mesh rollout.

## References

[1]: https://ubuntu.com/server/docs/explanation/intro-to/wireguard-vpn/ "Ubuntu Server: Introduction to WireGuard VPN"
[2]: https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-firewall-and-port-mappings-in-amazon-lightsail.html "AWS Lightsail: Control instance traffic with firewalls"
[3]: https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-editing-firewall-rules.html "AWS Lightsail: Add firewall rules to Lightsail instances"
[4]: https://www.wireguard.com/quickstart/ "WireGuard Quick Start"
