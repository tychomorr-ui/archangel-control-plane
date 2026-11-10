# ATMOS / Pharo-Lapse Anti-Rogue Control Model

**Status:** Application-only control model and visual simulator; no autonomous node dispatch enabled.

## Position

ATMOS is not presented as proof that an AI system can never behave unexpectedly. It is a control environment designed to make authority bounded, behavior observable, and unsafe or unauthorized proposals fail closed. Pharo-Lapse is the signed, durable, local-first transport contract. A valid Pharo-Lapse signature proves origin and integrity; it does not grant permission.

## Six control questions

The operator posture panel evaluates the control model as separate questions rather than a single safety badge:

1. **Identity bound:** Is the sender, device, model, or operator tied to a known public-key identity and evidence record?
2. **Capability bounded:** Is the requested operation covered by a narrow, expiring capability envelope?
3. **Transport constrained:** Is the envelope moving through an approved Pharo-Lapse path with replay and expiry protection?
4. **Human approval:** Is the required operator approval present for the risk level?
5. **Rollback declared:** Is there an operation-specific inverse or recovery procedure?
6. **Physical stop:** Is the hardware interlock available and physically validated, rather than merely simulated?

A missing answer is not silently converted into “safe.” It remains pending, held, quarantined, rejected, or otherwise visible.

## Adversarial dispositions

The ATMOS simulator demonstrates four expected dispositions without sending requests:

- Scope escalation: hold and reject capability expansion.
- Replay attempt: reject the consumed message ID.
- Unknown destination: quarantine because signature is not permission.
- Physical stop: remove power from the illustrated AI and radio rails; physical validation remains a separate hardware gate.

The simulator is explanatory UI only. It does not invoke GPIO, dispatch to nodes, mutate infrastructure, or create production evidence.

## Provenance chain

A meaningful AI proposal should be traceable through model proposal, capability envelope, Pharo-Lapse envelope, ATMOS policy decision, and final evidence outcome. The chain should preserve model/version identifiers, policy version, input/output hashes where appropriate, capability scope, approval identity, envelope hash, and disposition. Sensitive application content remains under the owning application’s data and consent boundary.

## Sovereignty claims

The architecture supports local-first operation, operator-held keys, delayed synchronization, explicit scopes, evidence-preserving queues, and physical fail-closed controls. These are engineering properties and design objectives, not blanket guarantees of safety, legal compliance, scientific validity, or immunity from compromise. Regulatory and safety claims require review against the actual device, deployment, jurisdiction, and witnessed test evidence.

## Next engineering gate

The two-device internet-disconnected Pharo-Lapse overlay remains the primary proof: Device A signs and queues, forwards over an allowlisted local carrier, Device B verifies and durably acknowledges, replay and tampering fail closed, and no public internet path is available during the exchange.
