# ARCHANGEL London Bootstrap Verification

## Verified Baseline Record

The London ARCHANGEL baseline was verified from the host after the reviewed bootstrap completed. This record preserves the observed state supplied by the host operator; it is not a substitute for later signed-status enrollment or independent monitoring.

| Field | Verified value |
|---|---|
| Host role | London ARCHANGEL control-plane baseline |
| Host image | Ubuntu 24 OS-only |
| Bootstrap SHA-256 | `1909e281f02c28204de6e5ddb02919b401a167d25c57b93a58eca7edcc46e9c5` |
| Service | `archangel-control.service` active |
| Observed capability timestamp | `2026-08-15T06:40:52.433125+00:00` |
| Execution mode | `observe-only` |
| Node enrollment | `disabled` |
| Signed-status ingest | `false` |
| Intent execution | `false` |
| Remote shell | `false` |
| Credential storage | `false` |

```json
{"service":"archangel-control","role":"control-plane","release":"bootstrap-1","timestamp":"2026-08-15T06:40:52.433125+00:00","execution_mode":"observe-only","node_enrollment":"disabled","capabilities":{"signed_status_ingest":false,"intent_execution":false,"remote_shell":false,"credential_storage":false}}
```

## Repeatable Post-Bootstrap Check

The corresponding `launch/verify-archangel-baseline.sh` script checks that the systemd service is active, reads the loopback-only capability endpoint, and fails if execution, enrollment, signed-status ingestion, remote shell, or credential storage has been enabled. It must be run locally on the host with:

```bash
sudo bash verify-archangel-baseline.sh
```

The expected result is a passing message followed by a capability response in `observe-only` mode. A failure means the baseline must be reviewed before making any integration change.
