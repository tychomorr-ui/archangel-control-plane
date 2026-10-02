# ARCHANGEL Valkyrie Registration

**Registration status:** Active integration record created and verified on 2026-10-02 UTC.

| Field | Value |
|---|---|
| Application | VALKYRIE Adjudication Entity |
| Application ID | `valkyrie-adjudication-entity` |
| Node ID | `valkyrie-adjudication-entity` |
| Endpoint | `https://xinusdash-doy5g86k.manus.space` |
| Scope | `read:health` |
| Integration status | `active` |
| Public-key fingerprint | `b0287c4ff19d51452c337bddd2471fb26be06b21aa0c1333fe941249a5e41491` |
| Audit event | `aud_valkyrie_registered_20261001` |

## Verification

The protected ARCHANGEL console was refreshed after registration and showed an eleven-node declared ecosystem, with **VALKYRIE Adjudication Entity** listed as an outer-circle peer. The Command Center showed **Endpoint registered · awaiting signed receipt** and reported one registered application endpoint.

The registration record is limited to the endpoint, Ed25519 public key, and `read:health` scope. No request was sent to the Valkyrie endpoint, no health claim was recorded, and no private key was stored in ARCHANGEL. Dispatch remains gated on a fresh signed receipt, idempotency key, and append-only audit record. Node enrollment, mesh activation, firewall changes, shell access, and infrastructure mutation remain disabled.
