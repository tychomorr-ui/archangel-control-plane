# Sovereign Resonator Architecture Overview

**Status:** Target architecture / local-first staging design

**Version:** 0.1

**Purpose:** Define how offline sovereign resonator devices fit into the ARCHANGEL node mesh and Project Reclaim without making the devices, cloud services, or control plane a single point of failure.

## 1. Architectural intent

Sovereign resonator devices are field endpoints for local computation, private data handling, environmental observation, and delayed message delivery. Their central property is not a claimed ability to “neutralize” electromagnetic radiation. Their central property is that they can work locally, keep radios quiet unless deliberately enabled, and exchange signed information when a trustworthy path becomes available.

Project Reclaim is the field-activation layer. It is where the digital system meets local organizations, land, people, devices, and practical service work. The resonator device is therefore an instrument and communications endpoint within Project Reclaim, not the project itself and not a substitute for human judgment.

ARCHANGEL is the conductor and verification boundary. It maintains the declared node registry, accepts device enrollment, verifies signed observations, and returns evidence receipts. It does not own the application data of TruthTalk, IWA Sage, Valkyrie, Resonate Earth, or Project Reclaim. It also does not make local work impossible when ARCHANGEL, Root-Gate, Atmos, or the public internet is unavailable.

## 2. Layered model

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Applications and services                                           │
│ TruthTalk · IWA Sage · Valkyrie · Resonate Earth · KEIRA           │
│ Own their data; use scoped, versioned, auditable contracts          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ consented evidence / decisions
┌──────────────────────────────▼──────────────────────────────────────┐
│ ARCHANGEL control and verification                                  │
│ Enrollment · public-key registry · policy · signed health receipts  │
│ Conductor, not universal database and not arbitrary shell authority │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ optional discovery / receipt exchange
┌──────────────────────────────▼──────────────────────────────────────┐
│ Nexinus Atmos peer environment                                      │
│ Discovery · presence · rendezvous · topology · capability exchange  │
│ Optional coordination; not required for local operation             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ adapter boundary
┌──────────────────────────────▼──────────────────────────────────────┐
│ Pharo-Lapse transport                                               │
│ Signed envelopes · durable queues · deduplication · delayed relay   │
│ Uses an available carrier; is not itself the carrier                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ local-first field connectivity
┌──────────────────────────────▼──────────────────────────────────────┐
│ Sovereign resonator devices                                        │
│ Local compute · private storage · radio policy · sensors · queues   │
│ Core · Relay · Hub classes                                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ human deployment and stewardship
┌──────────────────────────────▼──────────────────────────────────────┐
│ Project Reclaim field layer                                         │
│ People · land · clinics · workshops · recovery · restoration work   │
│ Human consent, custody, safety, and operational accountability       │
└─────────────────────────────────────────────────────────────────────┘
```

The layers are intentionally separable. A device may perform local work without Atmos. Pharo-Lapse may carry a message over a local network without a cloud broker. ARCHANGEL may verify a receipt later rather than participate in every local transaction. An application may import a receipt without gaining access to the device or its private key.

## 3. Device-to-mesh lifecycle

### 3.1 Provisioning

A device is provisioned with a unique device ID, an Ed25519 keypair, a firmware and application manifest, and a declared capability set. The private key remains in the device or approved hardware-backed keystore. ARCHANGEL receives only the public key, key reference, manifest hash, artifact hash, and approved metadata.

The initial policy is `AIR_GAPPED`. The device must boot, store a local observation, and produce a local audit event without DNS, cloud access, NTP, Root-Gate, Atmos, or ARCHANGEL.

### 3.2 Local operation

In `AIR_GAPPED` mode, all radios are physically disabled. The device can collect locally permitted observations, queue encrypted records, inspect its own health, and export through a wired or removable-media procedure.

In `LOCAL_ONLY` mode, the device may exchange data with explicitly allowed local peers. It must not have an internet route. A local relay may forward signed envelopes, but it must not rewrite the sender’s identity or alter the signed payload.

### 3.3 Delayed delivery

When a peer or carrier becomes available, Pharo-Lapse-style delivery moves an envelope through the following states:

```text
created → signed → queued → offered → received → verified → acknowledged
```

A failed or unavailable path leaves the envelope queued. A restart must not erase the queue. A receiver persists the consumed message ID and payload hash before acknowledging it. A duplicate message is rejected or handled through an explicitly idempotent application contract.

### 3.4 Verification

When an operator authorizes a verification exchange, ARCHANGEL issues a fresh challenge for the exact device identity. The device signs a health observation containing the challenge, freshness window, runtime version, capability list, and payload hash. ARCHANGEL verifies the signature against the registered public key and returns a receipt that identifies the evidence boundary.

The receipt means **signed health observation accepted under the configured contract**. It does not mean that the device is safe for every environment, that its application is correct, that its sensor measurements are scientifically valid, or that the device has authority to execute arbitrary changes.

### 3.5 Revocation and recovery

A lost, tampered, or compromised device is placed in `EMERGENCY_DISABLE` where possible, physically disconnected from external carriers, and revoked in ARCHANGEL. A new keypair and a new enrollment record are required for replacement. The old identity is never silently rebound to a different private key.

## 4. Project Reclaim integration

Project Reclaim provides the operational context in which devices are useful. The architecture should support four field patterns.

### 4.1 Offline observation

A field worker can capture an observation, case note, inventory record, maintenance event, or environmental measurement while disconnected. The record is encrypted locally and associated with a device or operator identity according to the application’s policy.

The system should collect only the minimum data needed for the field task. Location, identity, health, justice, recovery, and community-service data require separate consent and retention rules. A device health receipt must not expose the content of field records.

### 4.2 Local team exchange

Nearby devices can exchange signed work packets over a local carrier. The local team can continue even if the public internet is unavailable. The carrier may be Ethernet, a local Wi-Fi network, Bluetooth, a removable-media exchange, or another approved IP-capable path. The architecture does not assume that a particular radio or mesh technology exists in every deployment.

### 4.3 Delayed synchronization

When a trusted path becomes available, a relay forwards queued envelopes. The relay does not become the owner of the data. It acts as a transport participant and records delivery metadata. Application records remain owned by their originating application or field program.

### 4.4 Evidence and adjudication

An application may submit a scoped evidence package to Valkyrie for adjudication after local consent and provenance checks. ARCHANGEL receipts can attest that a node observation was signed and accepted. They do not automatically authorize an adjudication, publish a social post, or make a claim about an individual. Valkyrie returns an attributable decision under its own contract and data boundary.

## 5. Control-plane responsibilities

ARCHANGEL should provide these responsibilities:

- maintain the canonical device and node registry;
- bind each device ID to one or more public-key versions and lifecycle state;
- issue challenge-bound verification requests;
- verify signatures, freshness, manifest hash, artifact hash, and replay state;
- return signed or auditable receipts;
- expose node evidence to authenticated operators;
- enforce scope and revocation policy;
- record registration, verification, rejection, replay, and revocation events.

ARCHANGEL should not:

- store device private keys;
- require continuous connectivity for local work;
- share application databases;
- probe field devices without an explicit contract;
- treat an HTTP response as cryptographic verification;
- silently enable radios or external uplinks;
- issue arbitrary shell commands to field hardware;
- convert a health receipt into a medical, ecological, or public-safety claim.

## 6. Data contracts

The first production contract should be small. Each device-to-control-plane exchange should carry:

- protocol schema and version;
- device ID and application ID;
- sender public-key reference;
- message or challenge ID;
- creation, expiry, and observed timestamps;
- payload hash;
- firmware and application artifact hashes where applicable;
- capability list;
- signature and canonicalization identifier;
- explicit evidence boundary;
- revocation and failure status where applicable.

Pharo-Lapse, Atmos, NEXAL, and ARCHANGEL must remain distinct names with explicit adapters. Pharo-Lapse is the offline message and queue contract. Atmos is the peer environment for discovery and coordination. NEXAL is the message format and routing convention. ARCHANGEL is the control-plane and verification service. Do not collapse them into one protocol by implication.

## 7. Topology and placement

The existing ARCHANGEL topology expresses trust roles, not geographic distance. Resonator devices should be modeled as field leaves or local relay clusters beneath Project Reclaim rather than as new sovereign authorities in the central triangle. A field device may be physically close to a Project Reclaim site while its verification receipt is processed later by ARCHANGEL.

Recommended logical topology:

```text
                         ARCHANGEL
                       /     |      \
                Root-Gate  Tesseract-A  Valkyrie
                    |          |          |
               Project Reclaim / Atmos rendezvous
                    |
          ┌─────────┼─────────┐
     Resonator A  Relay Hub  Resonator B
          |          |          |
       local work  queued      field team
       and data    envelopes   and sensors
```

This diagram is logical. It must not be rendered as a claim that the nodes share a physical LAN, that every declared application is online, or that a public hostname proves a live mesh connection.

## 8. Operational modes and failure behavior

| Condition | Local work | Peer exchange | External sync | Control-plane posture |
|---|---:|---:|---:|---|
| `AIR_GAPPED` | Allowed | No | No | Evidence waits locally |
| `LOCAL_ONLY` | Allowed | Allowed to allowlisted peers | No | Evidence can be queued |
| `SCHEDULED_SYNC` | Allowed | Allowed | Only in the configured window | Fresh challenge recommended |
| `UPLINK_ENABLED` | Allowed | Allowed | Allowed by explicit policy | Audit every transition |
| `EMERGENCY_DISABLE` | Read-only recovery | No | No | Revoke or investigate |
| ARCHANGEL unavailable | Allowed | Allowed if local path exists | Queue | Verify later |
| Atmos unavailable | Allowed | Established peers only | Queue | Discovery degraded |
| Root-Gate unavailable | Allowed | Existing peers only | Queue | Identity bootstrap paused |

The design objective is graceful degradation, not automatic self-healing. Any automatic repair action must be separately specified, signed, bounded, reversible, and operator-approved.

## 9. Staged implementation plan

### Stage 0: Local simulator

Run the local policy and queue suite with no sockets and no device hardware. Confirm state transitions, persistence, replay rejection, tamper rejection, FIFO behavior, and restart recovery.

### Stage 1: Single hardware prototype

Use one Core with radios physically disabled. Confirm boot, local storage, key custody, battery safety, and offline operation. Do not enroll it in a live mesh.

### Stage 2: Two-device local overlay

Use two devices on a controlled local carrier. Test signed envelopes, duplicate rejection, queue recovery, and operator-visible radio states. Treat Pharo-Lapse v1.1 as an experimental contract until its two-device executable gate is independently passed.

### Stage 3: Project Reclaim field pilot

Deploy a small number of devices under a named custodian, with explicit data classes, consent, recovery, and incident procedures. Keep external uplink disabled by default. Produce a pilot report with device IDs, software hashes, queue metrics, failure outcomes, and non-secret receipt hashes.

### Stage 4: ARCHANGEL evidence integration

Enroll approved device public keys. Run real challenge-bound health receipts. Verify that accepted receipts, stale receipts, replay attempts, wrong-key attempts, and revoked identities all appear distinctly in the control-plane audit surface.

### Stage 5: Application contracts

Only after the device and receipt path are stable should TruthTalk, IWA Sage, Valkyrie, Resonate Earth, or other applications consume scoped device evidence. Use explicit versioned contracts and preserve each application’s data ownership.

## 10. Success criteria

The architecture is ready for a limited field pilot when:

1. local operation works with every radio disabled;
2. queue state survives restart and simulated power failure;
3. duplicate, tampered, expired, and wrong-key messages are rejected;
4. local-only mode has no external route;
5. external sync requires an explicit operator action;
6. private keys never leave the device boundary;
7. ARCHANGEL can verify a real challenge-bound observation;
8. the receipt boundary is visible to operators and downstream applications;
9. Project Reclaim can continue field work during control-plane or internet outage;
10. no marketing or safety claim exceeds the available measurements and regulatory review.

## 11. Explicit non-goals

This architecture does not claim that resonator devices:

- block or neutralize all electromagnetic radiation;
- diagnose or treat illness;
- prove that communications towers cause ecological harm;
- replace medical, electrical, EMC, or environmental professionals;
- make a peer network anonymous or immune to compromise;
- make every application a live verified node;
- grant ARCHANGEL arbitrary execution authority.

The prototype goal is more concrete: local computation, controlled radio behavior, durable signed messages, and an auditable path from field device to verified evidence.

## References

[1]: https://github.com/tychomorr-ui/pharo-lapse "Pharo-Lapse repository and protocol reference"

[2]: https://github.com/tychomorr-ui/tesseract-a-core "Tesseract-A Core verification capability reference"

[3]: https://github.com/tychomorr-ui/pharo-lapse/blob/main/spec/PHARO-LAPSE-v1.1.0.md "Pharo-Lapse v1.1.0 specification"

## 12. Interactive queue-flow surface

The ARCHANGEL ATMOS interface includes an interactive queue-flow diagram labeled **Pharo-Lapse / Feralabs queue logic**. “Feralabs” is a field-work presentation label; it is not a new protocol. The transport contract remains Pharo-Lapse, while Project Reclaim supplies the field context.

The diagram exposes the stages `created → signed → queued → offered → received → verified → acknowledged`. Selecting a stage shows its boundary and the expected evidence: local creation, identity binding, durable storage, relay offer, receipt, signature verification, and acknowledgement after consumption is persisted. The diagram is explanatory and read-only; it does not dispatch messages, enable radios, or imply that any node is connected.

## 13. Hardware-driver test boundary

The local acceptance runner includes a deterministic fake GPIO board and physical radio-disable driver model. It verifies boot-time radio-off behavior, switch-enforced refusal, explicit release before radio enable, emergency override, and fail-closed recovery when the physical switch changes after enable. These tests do not access Linux GPIO, `/sys`, a serial port, a radio, or a hardware prototype. A real device must still pass electrical, firmware, EMC/RF, battery, and safety review before field use.
