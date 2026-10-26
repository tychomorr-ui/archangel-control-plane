# ARCHANGEL Canonical Verification Posture

## Atmos interface

The authenticated `/atmos` tab is the evidence directory for ARCHANGEL. It consolidates the latest stored `node_status_reports`, application integration bindings, and recent append-only `audit_events` records. It displays every declared node, including nodes with no receipt, as `pending` rather than inferring health from deployment declarations or URL reachability.

The evidence directory exposes the boundary `stored-receipts-and-audit-only`. A green state means a verified stored receipt exists; it does not mean the application is safe to mutate or that infrastructure is reachable.

## Canonical verification

A node is canonical only when its identity, enrolled public key, endpoint binding, challenge freshness, signed payload, receipt signature, and audit record agree. The current interface tracks these as separate facts:

- declared identity and role;
- enrollment or revocation state;
- receipt verification state;
- observed timestamp and receipt hash;
- application readiness and reachability;
- append-only audit outcome.

Missing or stale facts remain visible as `pending`, `unknown`, or `failed`. No UI path promotes them to `verified` by implication.

## Apex posture

ARCHANGEL uses “Apex” as an internal design posture, not as an external certification or compliance claim. The posture means the control plane is the highest policy coordination layer for this declared ecosystem while remaining bounded by operator signatures, target-specific allowlists, replay protection, auditability, and explicit external-mutation gates.

No regulatory, industry, or third-party “Apex compliance” certification is claimed. If a formal compliance target is later selected, it must be named, scoped, mapped to controls, and independently assessed.

## Sovereignty boundary

The system is sovereign in the limited technical sense of controlling its own identity and policy artifacts without storing node private keys or delegating arbitrary shell authority. It is not an absolute or metaphysical sovereignty claim. External applications and nodes remain sovereign participants until they are explicitly enrolled, and the current posture keeps `externalMutation: DISABLED`.

The first active mutation remains `SET_CONTROL_PLANE_MODE`, which changes only ARCHANGEL's own durable mode. Node-side mutation is not active. The next safe candidate is the read-only `REFRESH_SIGNED_STATUS` operation, subject to enrollment, preconditions, rollback semantics, revocation, and signed post-execution evidence.
