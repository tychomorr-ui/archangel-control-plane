# ARCHANGEL Active Mutation and Voice Policy

## Implemented Gate 4 operation

`SET_CONTROL_PLANE_MODE` is the first active operation. It accepts only `ready` or `maintenance`, targets `ARCHANGEL`, persists the state in `atmos_control_plane_state`, and returns a control-plane-signed `APPLIED` receipt containing `previousMode`, `newMode`, `rollbackOperation`, `payloadHash`, and replay metadata. The inverse request is the rollback.

This operation does not contact a node, run a process, change a firewall, alter cloud infrastructure, or mutate an external application. The authenticated console can prepare and confirm the action, but the operator private key remains on the operator terminal. The terminal signer is the execution boundary.

## Next node-side operation proposal

The next operation should be `REFRESH_SIGNED_STATUS`, not restart, deploy, shell, or firewall mutation. It should request a fresh signed health/status receipt from one enrolled application endpoint.

### Enrollment prerequisites

- A unique node/application identity and public key are registered in ARCHANGEL.
- The endpoint is HTTPS and belongs to an explicitly allowed host/domain.
- The endpoint publishes its supported operation set and protocol version.
- ARCHANGEL stores only the public verification key and endpoint metadata.
- The node verifies the ARCHANGEL control-plane public key and operator authorization before responding.
- Enrollment is pending until a real challenge-response handshake succeeds.

### Preconditions

- Target is enrolled and not revoked.
- Operation is allowlisted for that target.
- Request has a fresh challenge, expiry, nonce binding, payload hash, and unique mutation ID.
- Node status receipt is not already fresh within the requested freshness window.
- No conflicting mutation is in progress.
- Operator approval covers the exact target, operation, payload, and expiry.

### Rollback

`REFRESH_SIGNED_STATUS` is read-only and therefore rolls back by invalidating the pending request and recording `CANCELLED_BEFORE_DISPATCH`; it never attempts to reverse an external side effect. Any future state-changing operation must define a concrete inverse operation before it can be allowlisted.

### Post-execution evidence

The node returns a signed receipt containing the operation, target identity, request ID, challenge ID, payload hash, start/end times, result, resulting status hash, and node signature. ARCHANGEL verifies it against the enrolled public key, stores only the metadata and receipt hash in audit, and marks the evidence `verified`, `failed`, or `expired`.

## Voice-assisted operator verification

Voice can be useful as an operator-presence and intent-confirmation layer, but it must not replace the Ed25519 private key. Voiceprints and spoken passwords are replayable, recordable, and vulnerable to synthesis, coercion, and false acceptance.

Recommended policy:

1. The terminal displays a short, random, one-time phrase bound to the challenge ID and operation digest.
2. The operator reads the phrase aloud or speaks an intent phrase.
3. Local speech recognition converts audio to text locally where possible; raw audio is not uploaded or retained by default.
4. The terminal compares the transcript to the expected phrase, checks freshness, and optionally checks a local voice-presence signal.
5. The operator still signs the exact canonical request with the Ed25519 private key.
6. ARCHANGEL receives only the signed request plus non-sensitive voice-confirmation metadata such as `voiceConfirmation: local-match`, never the voiceprint or raw audio.
7. A mismatch, timeout, replayed phrase, or uncertain transcript blocks signing.

Voice must not be accepted as a standalone bearer credential, a recovery mechanism for the private key, or a way to bypass challenge binding. For high-risk operations, require a second human approval or hardware-backed key in addition to the local voice confirmation.

## Activation gates for node-side mutation

Do not activate node-side state-changing operations until enrollment, target-specific allowlists, preconditions, inverse operations, signed post-execution receipts, revocation, and adversarial tests are complete. The current implementation keeps `externalMutation: DISABLED` while the control-plane-only operation is active.
