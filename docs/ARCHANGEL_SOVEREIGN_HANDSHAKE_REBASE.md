# ARCHANGEL Sovereign Handshake Rebase

## Decision

The Universal Truth **ARCHANGEL/v0** material is the right *conceptual seed* for the next ARCHANGEL layer: a node identity, a challenge, a signed authorization, and a signed status receipt. It is **not** ready to be treated as the deployed control-plane capability. The correct rebuild is a rebase around its contract and language—not a copy of its browser enrollment behavior.

> A sovereign control plane must make a smaller claim than its interface suggests: it may show only what it can prove, and it must preserve a cryptographic and audit trail for every state transition.

## Assessment of the Supplied Implementation

| Surface or claim | What the inspected code actually does | Current treatment |
|---|---|---|
| Operator identity | Generates Ed25519 and X25519 material in the browser and saves the private material in `localStorage`. | **Prototype only.** Private administrator keys must not be browser-persistent root keys. |
| Fresh challenge | Generates random bytes locally. It does not obtain a challenge bound to a node, a purpose, or an expiry from a remote verifier. | **Not an enrollment challenge.** |
| Signed enrollment | Creates a local `ARCHANGEL/v0` object and an Ed25519 signature. | **Locally composed artifact.** It does not contact a node. |
| `POST {node}/archangel/enroll` contract | Rendered as reference text. The enrollment action contains no network request to that endpoint. | **Unimplemented transport.** |
| WireGuard configuration | Builds and downloads a local `.conf` file. | **Artifact generation only.** It neither applies the configuration nor proves a peer was accepted. |
| Node registry | Stores the node record in browser-local storage. | **Local workspace state, not an authoritative registry.** |
| Signed status | Provides a browser verification helper and status classifications, but no verified live node receipt was established in the supplied material. | **Protocol intent, not present fleet evidence.** |
| Go node daemon | The interface states that a `node-daemon/` reference daemon exists, but the inspected `cosmic-net` source tree did not include it. | **Source must be located and reviewed before relying on this claim.** |

The deployed London baseline remains more honest than the supplied surface: it reports `observe-only`, `node_enrollment: disabled`, and all active powers as false. That is the correct state until a separately reviewed private enrollment and receipt path exists.

## Sovereign Profile

ARCHANGEL will use three separate identities. The **operator authorization identity** approves or revokes node admission. The **node identity** is generated and retained on the node; only its public key is registered. The **ARCHANGEL service identity** verifies protocol messages and records immutable evidence. No browser session, database record, or console view stores an operator or node private key.

| Capability class | Meaning in the console | Required evidence |
|---|---|---|
| **Proven** | The capability has completed its defined verification path. | Signed envelope, known public-key fingerprint, freshness check, audit record. |
| **Configured but disabled** | The supporting code or host exists but the action is intentionally off. | Runtime capability response and configuration state. |
| **Planned** | A contract or interface exists but no trusted runtime path has been enabled. | Design record only; never styled as healthy or live. |
| **Unavailable** | No implementation, endpoint, or evidence exists. | Explicit unavailable state. |

An opaque network response is **reachability only**. It is never application health, enrollment, authority, or proof of a WireGuard peer. A failed fetch is likewise a transport observation, not proof that a node has failed.

## Required Protocol Revisions

The next version should supersede the browser-generated `ARCHANGEL/v0` flow with a versioned, server-verifiable contract. The protocol must define canonical serialization once and test it across the node daemon and control plane.

| Requirement | Sovereign rule |
|---|---|
| Node key custody | Generate the node signing key on the node. Register only its public key and fingerprint. |
| Operator key custody | Use a dedicated protected signing mechanism; do not use browser `localStorage` as the long-term operator root of trust. |
| Challenge | Issue it from the intended verifier, bind it to node ID, public key, purpose, and expiry, and consume it exactly once. |
| Admission | Require an operator-signed authorization plus a node proof-of-possession. Write an append-only enrollment receipt. |
| Status receipt | Include protocol version, node ID, sequence number, issue time, expiry, declared release, bounded health fields, and signature. Verify it server-side against the registered node key. |
| Replay control | Reject expired, reused, or stale messages and retain the rejection reason in the audit ledger. |
| Network boundary | Keep node protocol traffic inside a private overlay or another mutually authenticated private path. No publicly browsable enrollment API or remote-shell endpoint is introduced. |
| WireGuard | Treat overlay configuration as an optional network transport artifact, separate from identity admission and status verification. |
| Execution | Remains disabled. Enrollment and status receipt verification do not confer remote execution authority. |

## Viable Private Status Models

| Model | What happens | Strength | Trade-off |
|---|---|---|---|
| **Private receipt push** | A node agent sends its signed status receipt to ARCHANGEL through the private mesh. | No inbound node listener is required; nodes choose their reporting cadence. | Requires a narrowly scoped receiver at ARCHANGEL and replay protection. |
| **Private receipt pull** | ARCHANGEL requests a signed status document from a node service bound only to the private mesh interface. | Centralized collection and clear timeout behavior. | Each node must expose a private status listener and ARCHANGEL initiates connections. |

Both models preserve the existing rule that the console has no remote shell or execution authority. The current London host supports neither model yet; it is intentionally limited to the verified localhost capability service.

## Phased Rebuild

1. **Freeze the truth boundary.** Preserve the London observe-only host and relabel every inherited browser artifact as planned, local-only, or unavailable until proven.
2. **Define and test the versioned receipt schema.** Add canonical payload rules, public-key registration metadata, nonce/sequence handling, freshness limits, and rejection reasons. This is implementation work, but remains disabled by default.
3. **Build a one-node private pilot.** Install a reviewable, status-only daemon on one authorized node. It generates and keeps its own signing key, emits no credentials, and has no command handler.
4. **Enroll through dual proof.** Exchange public keys and consume a short-lived challenge. Record the signed enrollment receipt and the public fingerprint in the protected registry.
5. **Admit status receipts only.** Verify signature, key binding, node identity, and freshness before a console surface may say `verified`. Preserve raw receipt hashes and failures in the append-only audit ledger.
6. **Expand deliberately.** Add nodes one at a time, with key rotation and revocation before any optional private overlay or broader monitoring work.

## Current Authorization Needed

Before implementation begins, the operator must select either **private receipt push** or **private receipt pull**, name the first pilot node, and authorize the public-key exchange and private network path. No private keys, cloud credentials, or node passwords are required in this repository or in chat.
