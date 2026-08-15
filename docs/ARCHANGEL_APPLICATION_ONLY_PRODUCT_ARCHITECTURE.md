# ARCHANGEL Application-Only Product Architecture

## Operating Boundary

ARCHANGEL remains an **application under construction**, not an active infrastructure operator. All node enrollment, firewall changes, private-mesh activation, remote commands, and host data collection are paused. The product may represent **declared facts**, **planning assumptions**, **policies**, **scenarios**, and **unresolved evidence**, but it must not portray any of those as observed live state.

> **Application rule:** a planning object can explain a future action, but it can never dispatch, enroll, connect, configure, probe, or authenticate a host.

## Product Surfaces

| Surface | Operator question | Data it owns | Explicit non-capability |
|---|---|---|---|
| **Application Atlas** | “What applications make up the ecosystem and what do they depend on?” | Application role, public front door, host posture, declared dependency, evidence source, readiness posture. | It does not claim application health or connect to any endpoint. |
| **Policy Constellation** | “Would this bounded plan be allowed, blocked, or require human review?” | Versioned planning checks and clear explanations. | It does not approve or execute a plan. |
| **Scenario Studio** | “What changes if I place, connect, or sequence this future role differently?” | Assumption-led scenarios, topology sketches, risk notes, and rollback hypotheses. | It does not reserve capacity, create an instance, or change the topology. |
| **Command Center** | “How do I express a precise operational intent?” | Bounded command draft, normalized target, risk, rollback, policy preview, evidence need. | It cannot reach a node or become a terminal. |
| **Control Briefing** | “What is known, missing, blocked, or worth planning next?” | Deterministic synthesis of declared catalog, scenario, policy, and evidence state. | It does not invent telemetry, recommendations from invisible data, or status claims. |

## Canonical Domain Model

| Entity | Key attributes | Relationship |
|---|---|---|
| **Application** | ID, name, role, public front door, state, host posture, owner, evidence posture. | May depend on applications and may be hosted by a declared node only when explicitly known. |
| **Application dependency** | Source application, target application, relationship type, declared/assumed state. | Powers Atlas and scenario graph edges. |
| **Policy check** | Policy ID, version, scope, severity, explanation, deterministic evaluation. | Evaluates a draft plan or scenario without mutating data. |
| **Scenario** | ID, title, purpose, assumptions, affected applications/nodes, intended outcome, rollback hypothesis, lifecycle. | Exists entirely in the planning plane until separately promoted later. |
| **Briefing item** | Category, source entity, truth status, evidence needed, recommended planning action. | Derived from declared product objects; never written as telemetry. |

## Truth Vocabulary

The user interface uses one vocabulary across every surface: **declared**, **planned**, **assumed**, **unplaced**, **policy-blocked**, **review-required**, **evidence-needed**, **observed**, and **verified**. The last two remain unavailable to new app-only objects until future signed integrations exist. This is deliberate: visual confidence must never exceed the available proof.

## Initial Application Atlas

| Application | Role | Current product posture | Host posture |
|---|---|---|---|
| Root-Gate | Sovereign identity and authority anchor | Declared service role | Declared N. Virginia host |
| Sovereign Provenance Console | Provenance, anchoring, hashing, and sovereign attestation | Declared service role | Declared Spain host |
| XinUS-Clarity | Flagship reflective-intelligence application suite | Declared service role | Declared Ireland host |
| Monarch-OS | Debian-inspired sovereign operating-system program | Declared service role | Declared Singapore host |
| Tesseract-A | Recovery portal and Tesseract mirror | Declared service role | Declared Frankfurt host |
| KEIRA | Intelligence application | Declared service role | Declared São Paulo host |
| Project Reclaim | Lake and Mendocino field-program bridge | Declared service role | Declared Oregon host |
| IWA Sage | Indigenous Wellness Alliance community and wellness application | Declared service role | Declared Montreal host |
| Resonate Earth | Earth-resonance public-front-door application | Planned application role | Physical host unplaced |
| Exitus Lens | Read-only visual-evidence application concept | Planned application role | Physical host unplaced |

## Delivery Sequence

The next build sequence is Application Atlas first, then Policy Constellation, Scenario Studio, contextual Command Center planning, and the deterministic Control Briefing. The private-mesh materials remain in the repository as reviewed future infrastructure work, but no application surface may ask the user to connect a terminal or start enrollment while this product sequence is unfinished.
