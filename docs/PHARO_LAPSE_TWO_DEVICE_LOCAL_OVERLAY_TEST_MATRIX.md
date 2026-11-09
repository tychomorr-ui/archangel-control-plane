# Pharo-Lapse Two-Device Local Overlay Test Matrix

**Status:** Ready for controlled hardware execution; not yet executed

## Objective

Prove that Device A can create and sign an envelope, queue it without public internet, forward it over an allowlisted local carrier, and let Device B verify and durably acknowledge it. The test must demonstrate the transport contract and physical network boundary, not merely a simulated function call.

## Test topology

- Device A: sender, private key retained locally.
- Device B: receiver, registered public key for the test identity retained locally.
- One isolated local network: direct Ethernet or an isolated Wi-Fi access point with no WAN/uplink.
- Public internet: disconnected and independently verified before each run.
- ARCHANGEL: unavailable during the local exchange; used only later for optional evidence import.
- Pharo-Lapse version: `1.1.x` test build, exact commit recorded in the run sheet.

## Preconditions

| ID | Check | Pass condition |
|---|---|---|
| P-01 | Device identities | A and B have distinct IDs and Ed25519 keypairs; private keys never leave devices. |
| P-02 | Firmware/software | Exact build hashes recorded for both devices. |
| P-03 | Radio policy | Both devices start in `LOCAL_ONLY`; WAN route, DNS fallback, cellular, and cloud credentials are disabled. |
| P-04 | Carrier | Only the allowlisted local interface and peer address are enabled. |
| P-05 | Time | Clock behavior and allowed freshness window are recorded; test does not depend on public NTP. |
| P-06 | Storage | Queue and audit directories are writable and durable; free space is recorded. |
| P-07 | Kill switch | Physical radio-disable behavior has passed the separate hardware gate, or the test is explicitly marked transport-only. |
| P-08 | Reset | Both devices start with empty pending and consumed sets, or the baseline is hashed and attached. |

## Execution matrix

| ID | Action | Expected evidence |
|---|---|---|
| T-01 | Disconnect public internet and verify no default route/WAN association. | Captured route table and connectivity-failure result. |
| T-02 | Start A and B in `LOCAL_ONLY`. | Local policy events and radio/power status. |
| T-03 | Create a minimum-necessary test payload on A. | Payload hash and message ID; no participant data. |
| T-04 | Sign the canonical envelope on A. | Signature verifies locally; private key is not exported. |
| T-05 | Force the local carrier unavailable before send. | Envelope remains `queued`; restart does not lose it. |
| T-06 | Restart A. | Same message ID, payload hash, and signature remain pending. |
| T-07 | Restore only the local carrier. | A sees B as an allowlisted peer; no WAN path appears. |
| T-08 | Forward the envelope A → B. | B receives exact bytes and records `received`. |
| T-09 | Verify on B. | Signature, sender ID, payload hash, expiry, and replay state pass. |
| T-10 | Acknowledge on B and persist before response. | B records `acknowledged`; consumed ID and hash are durable. |
| T-11 | Replay the identical envelope. | B rejects it as replay without creating a second application record. |
| T-12 | Tamper with one payload byte and resend using a fresh message ID. | B rejects hash/signature mismatch. |
| T-13 | Simulate B restart after receive and before acknowledgement. | B recovers the pending envelope exactly once. |
| T-14 | Re-enable WAN only after teardown approval. | Test ends with explicit policy transition and audit record. |

## Acceptance criteria

The test passes only if all of the following are true:

- no public internet path was available during T-02 through T-13;
- A’s private key never appeared in logs, packets, removable media, or the test operator terminal;
- B verified the original signature and payload hash over the exact received bytes;
- queue state survived at least one restart and one carrier interruption;
- duplicate delivery was rejected or handled by an explicitly idempotent contract;
- tampering was rejected fail-closed;
- the final evidence bundle contains hashes, timestamps, policy transitions, and non-secret logs only.

## Evidence bundle

```text
run-metadata.json
connectivity-before-after.txt
A/policy-events.json
A/envelope-public.json
A/queue-before-after-restart.json
B/receipt-public.json
B/replay-rejection.json
B/tamper-rejection.json
B/power-failure-recovery.json
checksums.sha256
```

Do not include private keys, passphrases, seed phrases, raw participant data, or full sensitive payloads. This matrix proves local signed-envelope exchange only; it does not prove physical RF safety, ecological effects, production readiness, or ARCHANGEL enrollment.
