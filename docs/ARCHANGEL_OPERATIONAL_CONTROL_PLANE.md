> **Historical planning record — superseded for active deployment.** This document contains earlier provider or placement assumptions. The current canonical deployment is UpCloud; use `docs/ARCHANGEL_UPCLOUD_CANONICALIZATION.md` and the active source declarations for present operations. Historical text is retained unchanged for auditability.

# ARCHANGEL Operational Control Plane

## Decision

ARCHANGEL is the **private coordination, policy, audit, and verification plane** for the ecosystem. It is more than a status dashboard: it will accept a plainly worded, bounded operational request; convert that request into a specific intent; require review; send a signed and expiring command envelope over the private mesh; and accept a signed outcome receipt.

It is **not** an unrestricted remote-shell broker. No operator prompt may become arbitrary shell text on a node. That boundary is what makes the control plane safe enough to become authoritative: a node executes only a small, versioned allow-list that it already owns and can independently reject.

> **Control means accountable orchestration:** ARCHANGEL decides whether a declared operation is permitted, records who approved it, carries it only through the private mesh, and verifies the node’s signed outcome. A node remains the local authority for its own process manager, filesystem, private keys, and safety checks.

## The Recommended Sovereign Path

The chosen model is a **private WireGuard command fabric with node-owned command agents**. It uses the established London hub, Root-Gate admission authority, node-owned keys, and a narrow command protocol. WireGuard supplies encrypted peer transport and peer-specific allowed destinations; its standard command line utilities expose deliberate lifecycle and inspection actions.[1]

AWS Systems Manager is intentionally **not** the primary ARCHANGEL execution path. AWS documents that Systems Manager is not directly available to Lightsail and requires hybrid activation for Lightsail instances.[2] It is acceptable as an independent emergency or recovery option if the owner chooses it later, but it would introduce AWS-managed command authority and activation credentials that are not necessary for the sovereign control plane. AWS CLI remains suitable for the owner’s separate infrastructure actions—such as Lightsail snapshots or instance creation—from a local administrative terminal or CloudShell, with scoped AWS credentials; it must not be embedded in ARCHANGEL or copied to every node.[3]

| Layer | Authority | Prohibited capability |
|---|---|---|
| **Root-Gate** | Signs public-key admission and publishes the enrollment-authority fingerprint. | No workload command dispatch; no node private-key collection. |
| **ARCHANGEL, London** | Receives plain-language intent drafts, evaluates policy, records approvals, emits signed command envelopes, and verifies signed outcomes. | No arbitrary `ssh`, no generic shell endpoint, no stored node private keys. |
| **Node command agent** | Validates the hub signature, command TTL, target identity, explicit operation type, local allow-list, and preconditions; runs a named local handler. | No arbitrary command string, no lateral node routing, no execution without a valid envelope. |
| **Operator terminal** | Creates and reviews a plain-language request, sees the exact normalized operation and rollback plan, and explicitly confirms approval. | No silent approval; no hidden execution. |
| **Lightsail administration** | Creates, snapshots, and reconfigures the cloud hosts through owner-controlled AWS Console, CloudShell, or local CLI. | No AWS root credentials in ARCHANGEL or node agents. |

## Plain-Language Command Lifecycle

The terminal language is deliberately small. It should feel direct to the operator while compiling to a deterministic, reviewable object. It does not interpret open-ended natural language as a command.

| Stage | Operator language | System action | Evidence required |
|---|---|---|---|
| 1. Observe | `archangel status all` | Reads private signed status receipts and produces an honest fleet summary. | Fresh receipt or explicit `stale` / `unreachable` state. |
| 2. Draft | `archangel propose restart tesseract-a service=mirror-api reason="…"` | Creates an intent with a target, named operation, exact scope, TTL, risk, and rollback. | Intent ID and immutable audit event. |
| 3. Review | `archangel review INT-…` | Displays the normalized node handler, preconditions, blast radius, and rollback. | Exact execution digest. |
| 4. Approve | `archangel approve INT-… --confirm <digest>` | Records human approval for the unchanged digest. | Approval record and expiring authorization. |
| 5. Execute | `archangel execute INT-… --confirm <digest>` | Sends one signed command envelope over the private overlay. | Dispatch receipt; no success claim yet. |
| 6. Verify | `archangel verify INT-…` | Verifies the node’s signed outcome and expected postcondition. | Verified, rejected, failed, or expired outcome event. |

The approved vocabulary initially remains the project’s exact operational labels: **`deploy`**, **`restart`**, **`configuration promote`**, and **`backup verify`**. Each label maps to a node-local, versioned handler, not a free-form shell command. A later assistant interface may help draft an intent, but it must show the normalized operation before it can be approved.

## Command Envelope and Node Safeguards

An execution envelope is a signed JSON object delivered only to a node’s WireGuard address. It must contain the intent ID, node ID, operation type, handler version, whitelisted scope parameters, issuance time, expiry, approval digest, rollback declaration, and a unique nonce. The command agent rejects an envelope if any binding is invalid.

| Mandatory node check | Why it exists |
|---|---|
| Hub signature verifies against the registered ARCHANGEL command public key | Prevents another peer from impersonating the control plane. |
| Node ID and private overlay source match | Prevents cross-target replay. |
| Intent is unexpired and nonce has never been accepted | Prevents delayed or repeated execution. |
| Operation and parameters match the node’s local handler manifest | Prevents arbitrary shell input and unexpected scope growth. |
| Required local preconditions are true | Stops unsafe operations when disk, backup, health, or maintenance constraints fail. |
| A rollback declaration is present for a mutating operation | Makes recovery part of the request, not an afterthought. |
| Outcome receipt is signed by the node | Keeps verification independent from the dispatch claim. |

The only exceptional path is a **local break-glass terminal** on the target node. It remains outside ARCHANGEL’s remote command channel, requires local administrative access, and must be logged in the node’s own evidence record afterward. This preserves recovery even if the control mesh is unavailable.

## Application and Node Roles

| Node or application | Region | Initial permitted mesh role | Not permitted by default |
|---|---|---|---|
| Root-Gate / `ROOT_SOVEREIGN-IDENTITY` | N. Virginia | Enrollment authority, identity receipt, public-key rotation authorization. | Application workload control or secret distribution. |
| Tesseract-Terminus / Sovereign Provenance Console | Spain | Provenance and attestation receipt; signed evidence publication. | Executing commands on peer applications. |
| XinUS-Clarity | Ireland | Application-layer health and declared-service receipt. | Accessing community or intelligence data outside named contracts. |
| Monarch-OS / Kether-Gate logical role | Singapore | Operating-system health receipt and named local maintenance handlers. | Becoming a fleet-wide superuser. |
| Tesseract-A | Frankfurt | Recovery and mirror health, backup verification handler. | Identity issuance or arbitrary workload control. |
| KEIRA / The_Portal | São Paulo | Intelligence-health receipt and read-only evidence analysis. | Treating generated analysis as execution authority. |
| Project Reclaim | Oregon | Field-program status and narrowly named field-data synchronization handlers. | Sharing Root-Gate authority or credentials. |
| IWA Sage | Canada Central / Montreal | Wellness-service health and governed service receipt. | Blanket ecosystem data access. |
| Resonate Earth | Sydney | Optional public-witness status and public explanation evidence. | Core health dependency, authority, or secret access. |
| Exitus Lens | Tokyo | Read-only visual evidence and signed-summary inspection surface. | Command, identity, or data-origin authority. |

## Rollout Order

The system becomes operational in deliberate increments, but all declared nodes are part of the target design.

| Increment | Deliverable | Control boundary before advancing |
|---|---|---|
| A | Complete private admission and signed status for the eight currently running node hosts plus London. | Every state is backed by a fresh signed receipt, not a ping. |
| B | Add **dry-run** command envelopes and node-side validation. | Agents reject any envelope that is unapproved, expired, mis-targeted, or unsupported. |
| C | Enable one non-mutating handler: `backup verify` on Tesseract-A. | Dispatch and signed verification work end to end; failure has no workload impact. |
| D | Enable named `restart` handlers on a per-node basis, with health preconditions and rollback. | No generic shell appears; every handler is reviewed and versioned. |
| E | Add `configuration promote` and controlled `deploy` handlers only where exact application manifests exist. | A precondition, approval digest, rollback path, and outcome verification are mandatory. |
| F | Enroll Resonate Earth and Exitus Lens only when their hosts exist and their role contracts are written. | Both remain outer-circle, read-only or optional surfaces. |

## References

[1]: https://www.wireguard.com/quickstart/ "WireGuard Quick Start"
[2]: https://repost.aws/knowledge-center/add-lightsail-to-systems-manager "AWS re:Post: Add a Lightsail instance to Systems Manager"
[3]: https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-set-up-and-configure-aws-cli.html "AWS Lightsail: Set up and configure the AWS CLI"
