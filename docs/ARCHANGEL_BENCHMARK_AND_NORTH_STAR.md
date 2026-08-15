# ARCHANGEL Benchmark Study and North-Star Strategy

## Positioning

ARCHANGEL should not imitate a generic cloud dashboard. Its differentiator is a **sovereign evidence fabric** for a heterogeneous Lightsail ecosystem: one place where the operator can understand the real fleet, its roles, authority boundaries, intended changes, proofs, and verified outcomes without collapsing those different truths into a falsely “green” screen.

The product goal is an immersive control room that feels like an active intelligence while remaining operationally honest. Visual intensity, motion, and a living topology must amplify the operator’s understanding; they must never imply connectivity, health, or execution that has not been cryptographically established.

> **North star:** ARCHANGEL makes a complex distributed ecosystem feel alive because every meaningful state transition has an origin, an owner, a policy boundary, evidence, and a visible consequence.

## Market Benchmark Synthesis

| Benchmark pattern | What established systems demonstrate | ARCHANGEL response |
|---|---|---|
| **Chronological auditing** | Kubernetes frames audit as a security-relevant chronology answering what happened, who initiated it, what it affected, and where it was observed.[1] | Implement an **Evidence Spine**: every observation, intent, approval, envelope, execution result, and recovery becomes a linked, tamper-evident event. |
| **Desired-versus-actual reconciliation** | Argo CD compares live state with declared target state and can invoke bounded lifecycle actions.[2] | Present a **Truth Delta** for each node and application: declared role, observed signed state, drift, proposed correction, policy result, and verified result. |
| **Software ownership graph** | Backstage centers a catalog on ownership and metadata, making software discoverable across an ecosystem.[3] | Replace a flat node list with an **Ecosystem Graph** connecting applications, hosts, roles, repositories, evidence sources, and accountable owners. |
| **Composable control-plane APIs** | Crossplane is a platform-engineering control-plane framework with operations, managed resources, packages, APIs, and a CLI.[4] | Keep ARCHANGEL’s command grammar small and composable: declarative intent objects and node-local handlers rather than a giant remote-shell abstraction. |
| **Private agent pull model** | Rancher Fleet uses controller and per-cluster agents; managed agents initiate communication, which supports private networks and NAT, and its registration path uses narrow, temporary credentials.[5] | Retain the private WireGuard mesh, node-owned keys, one-time admission, and least-privilege status/command agents. No public enrollment endpoint. |
| **Policy before apply** | HCP Terraform validates plans with policies and can stop a run, while recommending version-controlled policy for standardization, security, and auditability.[6] | Add **Policy Constellations**: visible, versioned checks over a proposed intent before approval, with explicit policy failure rather than a vague error. |
| **Scoped access control** | Portainer makes resource visibility and management contingent on administrator, team, or user access boundaries.[7] | Model authority by role, node, application, action, and risk. No operator receives fleet-wide generic command authority. |
| **Multi-signal observability** | OpenTelemetry distinguishes traces, metrics, logs, baggage, events, and profiles as complementary signals.[8] | Use a **Signal Prism** that lets the operator move among signed status, audits, intent history, app receipts, and later metrics/logs without conflating them. |

## The ARCHANGEL Advantage

Most tools dominate one layer: GitOps reconciliation, container management, a service graph, infrastructure policy, or an internal developer catalog. ARCHANGEL can combine their strongest ideas around a more personal premise: **a sovereign, role-defined network of distinct applications and hosts whose truth must be demonstrated, not merely displayed.**

The product should exceed conventional dashboards in five ways.

| ARCHANGEL capability | Interaction consequence | Safety boundary |
|---|---|---|
| **Truth Map** | The geographic map distinguishes current physical hosts, unplaced applications, recommendations, and logical topology at a glance. | A dot is never drawn without an owner-supplied host and region. Lines never imply traffic unless verified. |
| **Ecosystem Graph** | Nodes, applications, roles, provenance, public front doors, field programs, and evidence form an explorable constellation. | The graph differentiates declared, observed, verified, stale, and unknown states. |
| **Command Spine** | A plain-language request becomes a normalized, policy-checked, reviewable operational intent. | There is no free-form shell path; every future execution requires a signed expiring envelope and a named node-local handler. |
| **Evidence Spine** | The operator can travel backward from any current state to the receipt, action, approval, and actor that produced it. | Evidence is append-only and signed where possible; missing evidence stays visibly missing. |
| **Living Control Room** | Motion, resonance, signal pulses, layered depth, and responsive geometry express state changes and attention. | Animation is restrained, accessible, and never substitutes for a verifiable state label. |

## Compound Upgrade Architecture

The redesign is organized as five mutually reinforcing surfaces rather than isolated pages.

| Surface | Primary question | Signature interaction |
|---|---|---|
| **Command Nexus** | “What do I need to decide or do?” | Plain-language intent composer that previews normalized scope, policy constellation, approval path, and expected proof. |
| **Ecosystem Graph** | “What exists and how is it related?” | Multi-layer graph toggling between logical roles, physical hosts, application ownership, and evidence dependencies. |
| **Truth Map** | “Where are confirmed hosts, and what is still unplaced?” | Evidence-first regional map with a physical layer, a separate logical layer, and an explicit placement ledger. |
| **Evidence Observatory** | “Why does ARCHANGEL believe this?” | Event spine with receipt inspection, freshness, signature state, provenance links, and before/after comparison. |
| **Attention Field** | “What requires me now?” | A prioritized operational horizon organized by risk, blocked policy, stale proof, drift, and pending human decision. |

## Visual and Interaction Direction

ARCHANGEL should feel **celestial, recursive, and technical**, not theatrical. The visual language uses deep-space black, electrically restrained cyan for verified control signals, violet for logical/analytical relationships, amber for declared-but-unverified state, and rose only for specific failure or denial. The center is a responsive “archangelic” aperture: a layered circular geometry whose state is derived from real proof coverage, not a decorative spinner.

The interface should employ parallax depth sparingly, animated connection particles only for verified or intentionally simulated visual states, keyboard-first command invocation, and progressive disclosure. The first screen answers “what is true?”; each deeper layer answers “why?”, “who owns it?”, “what can change it?”, and “what evidence will prove the result?”. All nonessential motion must respect reduced-motion settings.

## Implementation Priorities

| Priority | Upgrade | Readiness condition |
|---|---|---|
| **P0: Truth foundation** | Finish the physical-versus-logical map separation, placement ledger, node/application metadata model, and evidence state vocabulary. | No unverified geographic or health claim remains in the console. |
| **P1: Control room** | Replace page-by-page navigation with a command-first central workspace, signal horizon, context rail, and quick travel to graph, map, intent, and evidence. | The operator can understand the fleet and reach any relevant evidence in two interactions. |
| **P2: Policy constellation** | Version policy checks for each operation type, surface pass/fail explanations, and bind approvals to an immutable intent digest. | A proposal cannot progress with unmet policy conditions. |
| **P3: Receipt fabric** | Enroll all current hosts for signed status; correlate freshness, topology, receipt history, and drift. | “Verified” is backed by a current signed receipt. |
| **P4: Bounded execution** | Install reviewed node-local handlers beginning with a non-mutating backup verification operation. | Every dispatch is signed, expiring, allow-listed, approved, and independently verified. |
| **P5: Application federation** | Add Resonate Earth and Exitus Lens only after their physical host, role contract, and evidence interface are known. | The map and graph can show both as real, bounded nodes without speculation. |

## References

[1]: https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/ "Kubernetes: Auditing"
[2]: https://argo-cd.readthedocs.io/en/stable/operator-manual/architecture/ "Argo CD: Architectural Overview"
[3]: https://backstage.io/docs/features/software-catalog/ "Backstage: Software Catalog"
[4]: https://docs.crossplane.io/latest/ "Crossplane Documentation"
[5]: https://fleet.rancher.io/explanations/architecture "Rancher Fleet: Architecture"
[6]: https://developer.hashicorp.com/terraform/cloud-docs/workspaces/policy-enforcement "HCP Terraform: Policy Enforcement Overview"
[7]: https://docs.portainer.io/advanced/access-control "Portainer: Access Control"
[8]: https://opentelemetry.io/docs/concepts/signals/ "OpenTelemetry: Signals"
