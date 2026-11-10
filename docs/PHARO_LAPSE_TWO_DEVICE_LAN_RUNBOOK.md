# Pharo-Lapse Two-Device LAN Runbook

**Status:** Prepared for witnessed execution. No physical device or production node was changed by creating this runbook.

## Objective

Prove on two physical devices, with public internet disconnected, that Device A signs and queues a minimum-necessary envelope, an allowlisted local carrier forwards it without rewriting sender or payload hash, Device B verifies and durably acknowledges it, and replay or tampering fails closed.

## Safety boundary

Use disposable test identities and test payloads. Do not use production private keys, ARCHANGEL operator keys, node enrollment keys, credentials, or real participant data. Disconnect WAN at the router or physical uplink before starting. Do not bridge the test LAN to a corporate, household, cloud, or cellular network.

## Matrix

| Test | Action | Expected evidence |
|---|---|---|
| LAN isolation | Verify both devices have only the private test subnet and no default route/WAN | `internet_disconnected=true` witnessed by operator |
| Identity setup | Generate ephemeral Device A and Device B Ed25519 keys locally | Public fingerprints only; private keys remain on devices |
| Sign and queue | Create an envelope with sender, recipient, expiry, payload hash, and signature | Queue record exists before relay |
| Local forward | Relay exact bytes over the allowlisted LAN address | Sender, recipient, expiry, and payload hash unchanged |
| Verify | Device B verifies signature, expiry, recipient, and hash | Accepted receipt is written locally |
| Replay | Send the same message ID again | Rejected as already consumed |
| Tamper | Change payload or recipient after signing | Signature/hash verification fails |
| Restart | Restart Device B after acknowledgement | Consumed message ID remains durable |
| WAN recheck | Confirm WAN is still disconnected after all tests | No public network path observed |

## Evidence package

Record timestamps, device IDs, public fingerprints, LAN interface names, test message IDs, payload hashes, disposition codes, and operator witness. Never record private-key bytes or participant content. Store the evidence locally until the operator approves a signed export.

## Exit criteria

The physical test is not complete unless all matrix rows pass, the LAN remains isolated, both devices preserve their replay state across restart, and the operator signs the evidence summary. Passing the local Node harness is protocol evidence only; it does not substitute for this physical test.
