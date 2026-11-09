# Project Reclaim Field-Pilot Data and Consent Contract

**Status:** Draft for review; not an authorization to collect live data

**Version:** 0.1

**Scope:** A limited, local-first pilot of sovereign resonator devices supporting Project Reclaim field work.

## 1. Purpose and boundary

This contract defines what the pilot may collect, why it may collect it, who may access it, how it is stored offline, and how a participant may decline or withdraw. It is designed for a staging or pilot review before any live deployment.

The pilot evaluates local operation, queue durability, controlled radio policy, device stewardship, and practical field workflows. It does not establish medical efficacy, ecological causation, electromagnetic protection, public-safety certification, or a general-purpose surveillance capability.

ARCHANGEL may verify device identity and signed device-health observations. A verification receipt is evidence of a signed observation under a stated contract; it is not approval of the participant, the field work, or the content of a case record.

## 2. Roles

| Role | Responsibility | Default data access |
|---|---|---|
| Participant | Chooses whether to participate and what optional information to provide | Their own submitted records and consent history |
| Field operator | Explains the pilot, operates the device, records field events, and reports incidents | Assigned pilot records only |
| Project Reclaim steward | Approves sites, custodians, retention, and field procedures | Pilot aggregate and assigned operational records |
| Device custodian | Maintains physical custody, charging, radio switch, and incident log | Device health and custody records |
| ARCHANGEL operator | Maintains device registry and verifies signed health observations | Device identity, evidence metadata, and receipts; not participant content by default |
| Application owner | Owns any application-specific records imported through a scoped contract | Only the minimum approved fields |
| Independent reviewer | Reviews safety, consent, and pilot outcomes | De-identified or explicitly authorized review set |

No role receives a universal right to inspect every application database. TruthTalk, IWA Sage, Valkyrie, and other applications retain separate data ownership and access controls.

## 3. Data classes

### 3.1 Device operational data

Collected by default for device safety and testability:

- device identifier and public-key reference;
- firmware, software, and manifest versions;
- radio-policy state and physical-switch state;
- queue depth, message IDs, payload hashes, delivery outcomes, and replay outcomes;
- battery, charging, storage, temperature, and fault indicators;
- operator, custodian, and maintenance event identifiers;
- signed health receipt metadata, freshness, and verification outcome.

This class should exclude participant content. Message IDs and hashes are metadata and must not be treated as proof that the underlying content is harmless or correct.

### 3.2 Field-program data

Collected only when necessary for the approved field activity:

- activity type, date range, site or service area at the minimum useful precision;
- non-sensitive work status, inventory, maintenance, or restoration observations;
- referral or service-completion status without unnecessary narrative detail;
- incident and safety records.

Exact location, free-text narrative, images, audio, health information, justice information, minors’ data, biometric information, or third-party personal information require a separate documented justification and consent path.

### 3.3 Optional participant information

Optional information must be clearly marked optional. Examples include a preferred contact channel, accessibility need, language preference, or participant-provided story. Declining optional information must not prevent access to a service that does not require it.

### 3.4 Prohibited pilot collection

The pilot must not collect:

- private keys, passphrases, recovery codes, or seed phrases;
- continuous audio or video without a separate explicit protocol;
- covert location tracking;
- contact lists or unrelated device contents;
- health or biometric data unless the pilot is separately reviewed and approved for that data;
- data about non-participants merely because they are nearby;
- electromagnetic or ecological claims inferred from network status alone.

## 4. Consent requirements

Consent must be obtained before collecting participant or field-program data. The consent explanation must be available in plain language and, where appropriate, the participant’s preferred language or an accessible format.

The operator must explain:

1. the purpose of the pilot;
2. what device and field data will be collected;
3. what is optional and what is necessary for the activity;
4. that local operation may continue while the device is offline;
5. when data may be synchronized and who may receive it;
6. that ARCHANGEL receipts verify device observations, not personal claims or outcomes;
7. foreseeable risks, including loss, unauthorized access, incorrect attribution, delayed delivery, and device failure;
8. how to decline, withdraw, request deletion where technically possible, or raise a concern;
9. the expected retention period;
10. the name and contact method for the field steward.

Consent is recorded separately from field content and includes:

```json
{
  "schema": "PROJECT_RECLAIM_PILOT_CONSENT/v1",
  "consentId": "consent-identifier",
  "participantRef": "pseudonymous-reference",
  "pilotId": "pilot-identifier",
  "dataScopes": ["device.health", "field.inventory"],
  "optionalScopesDeclined": ["precise.location"],
  "language": "en",
  "consentedAt": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2026-02-01T00:00:00.000Z",
  "withdrawalMethod": "field-steward-or-local-device",
  "consentVersion": "0.1"
}
```

The example is a schema illustration only. Do not use the identifiers or timestamps as pilot data.

## 5. Withdrawal and correction

A participant may withdraw future collection at any time through the field steward or device-local consent control. Withdrawal stops new collection under the withdrawn scope. It does not necessarily erase immutable audit metadata, signed receipts, legal retention records, or already exported records; those limitations must be explained at consent time.

Where technically and legally appropriate, the steward should delete or de-identify participant content while retaining only the minimum audit record needed to prove that the request was handled. Corrections must be appended as new records rather than silently rewriting signed history.

## 6. Offline and queue behavior

The device may create encrypted local records while offline. Records remain in a durable queue until a permitted carrier and policy state are available. A queued record must carry an expiry or retention decision. Expired records must be quarantined or deleted according to the approved retention policy, not transmitted automatically.

The queue may expose operational metadata such as message ID, payload hash, age, and delivery state to the device custodian. It must not expose participant content to an unauthenticated viewer. A relay may forward an envelope but may not rewrite the sender identity, participant reference, or signed payload.

## 7. Access and sharing

Access is scoped by data class and purpose. The default sharing path is:

```text
participant / field operator
        │ minimum necessary field data
        ▼
Project Reclaim field store
        │ scoped evidence package, with consent
        ├──► ARCHANGEL: device identity and signed health metadata
        └──► approved application or Valkyrie: explicit, versioned fields only
```

ARCHANGEL should receive device evidence metadata rather than participant content. Valkyrie receives only an approved evidence package and returns an attributable decision under its own contract. No direct database sharing is implied.

## 8. Security and incident response

Private device keys remain on the device or in an approved hardware-backed keystore. They must never be copied into a browser, shared archive, field form, application database, or ARCHANGEL configuration.

If a device is lost, tampered with, or reports unsafe behavior:

1. place it in `EMERGENCY_DISABLE` if physically possible;
2. disconnect external carriers;
3. preserve the non-secret incident and custody metadata;
4. notify the Project Reclaim steward;
5. revoke the device identity in ARCHANGEL if enrollment exists;
6. do not silently rebind the old identity to a new key;
7. review participant impact and notify affected people when required.

A health receipt must not be used to conceal an incident, override consent, or certify a field outcome.

## 9. Retention schedule draft

| Data class | Draft retention | Disposal / review |
|---|---:|---|
| Device health and queue metadata | 90 days after pilot close | Aggregate, then delete or de-identify |
| Signed ARCHANGEL receipts | Per control-plane audit policy | Preserve hash and verification result if needed for audit |
| Field activity records | 90 days after service completion | Steward review before deletion |
| Incident and safety records | 2 years or applicable requirement | Restricted review; legal hold overrides |
| Consent and withdrawal records | Pilot duration plus accountability period | Retain minimum proof of consent handling |
| Unsent expired content | Immediate quarantine, then deletion per policy | Record only a non-content disposition event |

The steward must approve final retention periods with legal, community, and safety review before live collection.

## 10. Pilot gates

The pilot may proceed only after these gates are signed off:

- hardware radio-disable and fail-safe tests pass;
- offline queue restart and simulated power-loss tests pass;
- two-device local exchange is tested in a controlled environment;
- data fields and consent language are reviewed by the Project Reclaim steward;
- participant support and withdrawal paths are operational;
- device custody and loss procedures are understood;
- any battery, EMC, RF, or environmental safety review required for the prototype is complete;
- ARCHANGEL receipt verification is tested with non-production staging identities;
- the pilot remains clearly labeled as a pilot, not a validated product or clinical intervention.

## 11. Approval record

```text
Pilot ID: ______________________________
Field steward: _________________________
Community / site review: _______________
Data protection review: _________________
Safety review: _________________________
Device custodian: ______________________
ARCHANGEL staging boundary approved: ___
Start date: ____________________________
End date: ______________________________
Decision:  [ ] approved  [ ] revise  [ ] declined
```

## 12. Explicit limitations

This draft is an operational and data-governance starting point, not legal advice, an IRB determination, a medical consent form, or an environmental permit. Before live deployment, obtain the appropriate legal, community, safety, privacy, and technical approvals for the jurisdiction and the actual data collected.
