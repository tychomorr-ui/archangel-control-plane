# Offline Sovereign Resonator Devices
## Technical Specification and Deployment Runbook

**Document status:** Design baseline / staging-ready

**Version:** 0.1

**Owner:** Nexinus / ARCHANGEL ecosystem

**Scope:** Offline-first field devices that preserve local computation, private data handling, and delayed message delivery while minimizing unnecessary radio transmissions.

## 1. Purpose and safety position

The term **sovereign resonator** is used here for an offline-capable device that can sense, store, verify, and forward signed information without depending on a hosted service. The device is not specified as a medical device, therapeutic product, radiation shield, or proven treatment for electromagnetic sensitivity.

The initial engineering goal is narrower and testable: reduce unnecessary radio activity through local-first computation, explicit radio policy, queued store-and-forward delivery, and a visible physical disconnect. A device may reduce its own transmissions or avoid adding a transmitter to an environment. That is different from claiming that it reduces ambient electromagnetic fields or protects people from health effects. The World Health Organization describes electromagnetic fields as spanning static fields through radiofrequency and optical bands and maintains an international program to assess evidence and support exposure standards [1]. ICNIRP’s 2020 RF guidelines address human exposure from 100 kHz to 300 GHz and require assessment against frequency-dependent restrictions; they do not validate an unspecified “resonator” effect [2].

Any future claim about exposure reduction must be supported by calibrated measurements, a defined frequency range, a defined distance and duty cycle, a controlled baseline, and review by an appropriately qualified EMC/RF professional. The product should use the language **“radio-quiet,” “offline-first,” and “reduces device-originated transmissions when configured”** rather than “blocks radiation,” “neutralizes 5G,” or “protects against electromagnetic illness.”

## 2. System role in the sovereign mesh

A resonator is a local endpoint in the wider ecosystem, not a replacement for ARCHANGEL, Root-Gate, Valkyrie, or the application databases.

- **ARCHANGEL** remains the control-plane and evidence-verification role. It may register device identities, verify signed observations, and return receipts. It must not become a mandatory runtime dependency for local work.
- **Nexinus Atmos** may provide discovery, presence, rendezvous, and capability exchange when available. Loss of Atmos must not erase local records or prevent established peers from operating.
- **Pharo-Lapse** is the offline store-and-forward transport boundary. It carries signed envelopes over an available carrier such as a local network, wired link, Bluetooth Low Energy, Wi-Fi Direct, LoRa-class radio, or removable media. The carrier is an implementation choice and must not be confused with the message protocol [5].
- **Project Reclaim** is the field-activation and real-world deployment role. It may operate devices in locations with intermittent power or connectivity.
- **TruthTalk, IWA Sage, and other applications** receive only versioned, scoped messages or receipts. They do not receive private device keys and do not share a database with the device registry or adjudication store.

The design follows the supplied role-map boundary: a hosted page is a delivery surface, not the identity authority; local execution should continue without centralized computation; and node verification requires signed evidence rather than a hostname or HTTP 200 alone [6].

## 3. Device classes

### 3.1 Resonator Core

The Core is the smallest trusted computing unit. It provides:

- secure boot or measured boot where the selected hardware supports it;
- encrypted local storage;
- an Ed25519 device identity key held in a hardware-backed keystore when available;
- a monotonic counter or protected sequence store for replay defense;
- a local append-only event journal;
- a radio policy controller;
- a signed health-observation producer;
- wired maintenance access that is disabled by default.

A Core can run without Wi-Fi, cellular service, Bluetooth, GPS, a cloud broker, or a central certificate authority.

### 3.2 Field Relay

The Field Relay adds a configurable local carrier and durable queue. It is intended for Project Reclaim, clinics, field teams, workshops, and temporary deployments. It must support:

- queueing when no peer is available;
- signed end-to-end envelopes;
- duplicate detection by message ID and payload hash;
- bounded queue size with explicit overflow behavior;
- operator-visible radio state;
- delayed forwarding without re-signing another party’s message;
- optional multi-hop forwarding only when the operator has enabled it.

### 3.3 Community Hub

The Hub is an optional local service for a building, vehicle, workshop, or community site. It can provide a local web UI and local peer discovery, but it must not silently become a cloud gateway. The Hub should expose a local-only status page and require an explicit operator action before enabling an external uplink.

## 4. Reference architecture

```text
                 optional HTTPS uplink
                         │
                   [Local Hub]
                  /      │      \
          wired LAN   local RF   removable media
             │          │          │
       [Resonator Core]─[Field Relay]─[Resonator Core]
             │              │
       encrypted store   signed queue
             │              │
        local health     Pharo-Lapse envelopes
             └───────┬──────┘
                     ▼
       optional ARCHANGEL receipt submission
```

The data path and the control path are separate. Device data stays local unless a user-authorized application contract permits export. Control-plane receipts contain signed observations and metadata; they do not grant shell access, arbitrary command execution, or access to application databases.

## 5. Minimum hardware specification

The first prototype should use commercially supported hardware rather than custom RF circuitry.

- 64-bit ARM or x86 processor with at least two cores.
- 2 GB RAM for a Core; 4 GB recommended for a Relay or Hub.
- 32 GB industrial-grade eMMC or SSD minimum; use a higher-endurance drive for queue-heavy deployments.
- Hardware random-number source or a documented entropy initialization procedure.
- Secure element or TPM 2.0 where available. If absent, document that the device identity key is software-protected and downgrade its assurance level.
- USB-C or DC input with protected charging circuitry.
- Replaceable storage only if the threat model accepts physical removal; otherwise use sealed storage.
- Physical radio-disable control that removes power from or disables the radio module, not merely a software icon.
- Status indicators for power, storage pressure, queue state, verification state, and radio policy.
- Optional Ethernet for commissioning and maintenance.

For lithium batteries, select cells and packs with documented safety testing. IEC 62133-2:2017+A1:2021 covers safe operation and reasonably foreseeable misuse of portable sealed secondary lithium cells and batteries [4]. Do not build an unprotected battery pack for field deployment. Include over-current, over-voltage, under-voltage, over-temperature, short-circuit, and mechanical protection.

## 6. Radio and environmental specification

The safe default is **radio disabled**. When a carrier is enabled, the device must use the lowest practical transmit power, the shortest practical duty cycle, and the narrowest permitted channel configuration consistent with reliable delivery.

The firmware must expose these states:

1. `AIR_GAPPED`: all radios physically disabled; wired or removable-media maintenance only.
2. `LOCAL_ONLY`: local peer communication permitted; no internet route.
3. `SCHEDULED_SYNC`: external uplink permitted only during an operator-defined window.
4. `UPLINK_ENABLED`: an explicit, logged policy permits external connectivity.
5. `EMERGENCY_DISABLE`: immediate radio and external-uplink shutdown.

No mode may claim to reduce ambient EMF. The device can only control its own emissions and its network behavior. Any enclosure, grounding, shielding, filter, or antenna change must be tested for unintended effects. A shielded enclosure can impair emergency communication, increase transmitter power demand, create heat-management problems, and interfere with safety systems.

For the United States, RF devices generally require the applicable FCC equipment authorization before marketing, importation, or use. The FCC distinguishes intentional radiators, such as Wi-Fi and Bluetooth transmitters, from other digital devices and identifies Supplier’s Declaration of Conformity or Certification as applicable procedures [3]. Other jurisdictions may require CE, UKCA, ISED, or local approvals. Use pre-certified radio modules only as a starting point; the final assembled product still requires an assessment of the host configuration, antenna, enclosure, and emissions.

## 7. Software and security requirements

### Identity

Each device receives a unique device ID and an Ed25519 keypair generated on the device or in an approved provisioning environment. The private key must never enter a browser bundle, shared repository, application database, or ARCHANGEL configuration file. Store only the public key, key reference, manifest hash, and revocation metadata in the control-plane registry.

### Signed observations

A health observation should contain at least:

```json
{
  "schema": "NEXINUS_ATMOS_SIGNED_HEALTH/v1",
  "nodeId": "device-identifier",
  "applicationId": "project-reclaim-field-unit",
  "status": "ok",
  "runtimeVersion": "0.1.0",
  "capabilities": ["queue.store", "peer.forward", "health.check"],
  "issuedAt": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2026-01-01T00:05:00.000Z",
  "nonce": "challenge-bound-random-value",
  "payloadHash": "sha256:...",
  "signature": "base64url-ed25519-signature"
}
```

The exact canonicalization must be versioned. Do not assume that recursive key sorting, RFC 8785 JSON Canonicalization Scheme, and a language runtime’s default JSON serializer produce the same bytes. The verifier must bind the signature to the exact bytes, node identity, challenge or nonce, freshness window, manifest hash, and artifact hash.

### Queue and replay protection

Every envelope must include a globally unique message ID, sender identity, recipient identity or group identifier, creation time, expiry time, payload hash, protocol version, and signature. A receiver must persist the consumed message ID and payload hash before acknowledging delivery. On restart or power loss, the device must reject a previously accepted message and must not deliver a message twice unless the application explicitly supports idempotent redelivery.

### Local data protection

- Encrypt sensitive data at rest.
- Separate operational logs from user content.
- Avoid collecting location data unless the application requires it and the operator has enabled it.
- Keep clocks and time quality visible. If time cannot be trusted, use challenge nonces and monotonic counters rather than treating wall-clock time as authoritative.
- Implement secure deletion only where the storage medium and threat model make it meaningful; otherwise document the limitation.
- Make export explicit and auditable.

## 8. Acceptance tests

A device is not ready for field deployment until it passes these tests:

1. **Boot integrity:** an unsigned or altered firmware image is rejected.
2. **Key custody:** the private key cannot be exported through the local UI, API, logs, or backup bundle.
3. **Offline operation:** the device can create, store, inspect, and verify a local record with every network interface disabled.
4. **Queue durability:** a queued message survives process restart and simulated power loss.
5. **Replay rejection:** the same signed envelope is accepted once and rejected on replay.
6. **Tamper rejection:** one changed byte in the signed payload produces a verification failure.
7. **Expiry rejection:** an expired challenge or envelope is rejected.
8. **Radio policy:** `AIR_GAPPED` disables all configured transmitters and prevents software-only re-enablement.
9. **Uplink boundary:** no external traffic occurs in `LOCAL_ONLY` mode.
10. **Receipt correctness:** ARCHANGEL receives a real challenge-bound signed observation and returns an auditable receipt without granting execution authority.
11. **Power safety:** charging, thermal, short-circuit, and enclosure tests pass for the selected battery and power supply.
12. **EMC/RF review:** emissions and immunity are assessed by a qualified lab or engineer before any public or clinical deployment.

## 9. Deployment runbook

This runbook is for a staging device first. Do not connect an unvalidated prototype to a live field network.

### 9.1 Prepare the build environment

```bash
set -euo pipefail
sudo apt-get update
sudo apt-get install -y ca-certificates curl git openssl jq
node --version
pnpm --version
```

Pin the firmware and application source to a reviewed commit. Record the commit hash, toolchain versions, board revision, radio-module model, antenna model, and battery pack identifier in the release manifest.

### 9.2 Build and test the device software

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Do not continue if tests fail. Generate a release manifest containing the firmware hash, application artifact hash, dependency lockfile hash, and configuration schema version. Do not include private keys in the manifest.

### 9.3 Provision a device identity

Run provisioning locally or in the approved manufacturing environment. The following is a pattern, not a substitute for the project’s exact signer:

```bash
umask 077
install -d -m 700 ./provisioned-device
openssl genpkey -algorithm ED25519 \
  -out ./provisioned-device/device-private.pem
openssl pkey \
  -in ./provisioned-device/device-private.pem \
  -pubout \
  -out ./provisioned-device/device-public.pem
openssl pkey \
  -in ./provisioned-device/device-private.pem \
  -pubout -outform DER | sha256sum
```

If the hardware has a secure element, generate the key inside that element instead and record the secure-element key handle. Never paste or upload the private key. The public fingerprint is safe to record in the device manifest.

### 9.4 Install with radios disabled

1. Power the device with the physical radio-disable control engaged.
2. Install the signed image from local media or a wired maintenance link.
3. Confirm that no Wi-Fi, cellular, Bluetooth, or other radio interface is powered.
4. Set the initial policy to `AIR_GAPPED`.
5. Create a local operator account or bind the device to the approved local provisioning authority.
6. Verify that the local UI is reachable only through the commissioning interface.

The first boot must not require DNS, a cloud API, NTP, an external identity provider, or ARCHANGEL.

### 9.5 Configure local storage and queue policy

Set the queue limits before importing field data:

```text
maximum_queue_bytes:        1073741824
maximum_message_bytes:      10485760
maximum_message_age:        30d
replay_retention:           90d
export_requires_operator:   true
external_uplink_default:    disabled
radio_policy_default:       AIR_GAPPED
```

Choose values appropriate for the hardware and data class. When the queue is full, fail closed for new external forwarding and preserve a clear local warning. Never silently delete the oldest evidence.

### 9.6 Run the local acceptance suite

```bash
./bin/device-self-test --offline
./bin/device-self-test --replay
./bin/device-self-test --power-failure
./bin/device-self-test --radio-policy
./bin/device-self-test --storage-pressure
```

Save the non-secret test report beside the release manifest. The report should include test names, timestamps, software hashes, device ID, and pass/fail status. It must not include private keys, user content, or raw secrets.

### 9.7 Register the public identity with ARCHANGEL

Registration is an operator action. Submit only:

- device ID;
- application ID;
- public key or public-key fingerprint;
- manifest hash;
- artifact hash;
- supported capability list;
- approved endpoint or local-contact metadata;
- requested scope;
- operator approval record.

ARCHANGEL should return a registration record or reject the request. A hostname, page load, or local health screen is not sufficient proof of identity.

### 9.8 Perform a real challenge-bound receipt test

With the device still in a controlled staging environment:

1. Request a fresh challenge for the exact registered device ID.
2. Have the device sign its current health observation with its own private key.
3. Submit the observation over the approved staging path.
4. Confirm that ARCHANGEL returns an accepted receipt.
5. Confirm that a changed payload, reused nonce, expired challenge, and wrong public key are rejected.
6. Record the receipt ID, receipt hash, verification time, freshness threshold, and evidence boundary.

The receipt should say that it is a **signed health observation**, not proof of service authority, medical safety, or arbitrary execution capability.

### 9.9 Field installation

Before installation, the operator should document:

- physical location and responsible custodian;
- device ID and release hash;
- power source and battery pack;
- radio policy;
- permitted carriers and peers;
- data classes allowed on the device;
- maintenance window;
- emergency shutdown procedure;
- contact and recovery procedure.

Mount the device away from moisture, excessive heat, flammable material, and locations where a damaged battery could injure someone. If the device is placed near people, animals, medical equipment, or sensitive industrial systems, obtain the appropriate safety and EMC review first.

### 9.10 Enable a carrier only when needed

Move through policy states deliberately:

```text
AIR_GAPPED → LOCAL_ONLY → SCHEDULED_SYNC → UPLINK_ENABLED
```

At every transition, emit a signed local audit event. Require an operator confirmation for an external uplink. Configure allowlisted peers and destinations. Do not expose an administrative port to the public internet. If a service is proxied through Nginx, bind the application to loopback and verify the proxy configuration before reloading it.

### 9.11 Recovery and incident response

Use `EMERGENCY_DISABLE` if there is evidence of key compromise, unexpected transmission, repeated signature failures, queue corruption, abnormal heat, battery swelling, or unauthorized physical access.

The recovery sequence is:

1. Physically disable radios and disconnect the external uplink.
2. Preserve the local audit journal and volatile evidence if safe.
3. Record the device ID, release hash, last verified receipt, and observed time.
4. Revoke the device identity in ARCHANGEL.
5. Do not reuse the device key after suspected compromise.
6. Reimage or replace the device through the approved provisioning process.
7. Re-register a new public identity and repeat the acceptance suite.

Do not “fix” a signature mismatch by replacing the registered public key until the cause is independently established and the rotation is approved. A key rotation is a security event and must produce a new registration and audit record.

## 10. Claims and language policy

Approved language:

- “offline-first device”;
- “radio-quiet mode”;
- “reduces unnecessary device-originated transmissions when configured”;
- “local storage and delayed delivery”;
- “signed, challenge-bound observations”;
- “does not require continuous cloud connectivity.”

Unapproved without independent evidence and regulatory review:

- “blocks all radiation”;
- “neutralizes 5G or Wi-Fi”;
- “prevents cancer, illness, or electromagnetic sensitivity”;
- “protects bees by reducing tower radiation”;
- “zero electromagnetic exposure”;
- “medical-grade protection.”

The device may support environmental research, including controlled measurements of RF power density, spectrum occupancy, duty cycle, noise floor, temperature, and battery state. Such data must be labeled as measurements. It must not be converted into a health or ecological conclusion without an appropriate study design and expert review.

## References

[1]: https://www.who.int/health-topics/electromagnetic-fields "World Health Organization electromagnetic fields overview"

[2]: https://www.icnirp.org/cms/upload/publications/ICNIRPrfgdl2020.pdf "ICNIRP Guidelines for Limiting Exposure to Electromagnetic Fields 100 kHz to 300 GHz"

[3]: https://www.fcc.gov/oet/ea/rfdevice "FCC Equipment Authorization RF Device guidance"

[4]: https://webstore.iec.ch/en/publication/70017 "IEC 62133-2 consolidated lithium battery safety standard"

[5]: https://github.com/tychomorr-ui/pharo-lapse "Pharo-Lapse repository and protocol reference"

[6]: https://github.com/tychomorr-ui/tesseract-a-core "Tesseract-A Core local health-probe and verification reference"
