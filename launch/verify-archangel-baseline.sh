#!/usr/bin/env bash
# Verify the local, observe-only ARCHANGEL baseline after bootstrap.
# Run on the ARCHANGEL host: sudo bash verify-archangel-baseline.sh

set -Eeuo pipefail

readonly SERVICE_NAME="archangel-control.service"
readonly CAPABILITIES_URL="http://127.0.0.1:8080/v1/capabilities"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this verification with sudo or as root." >&2
  exit 1
fi

systemctl is-active --quiet "${SERVICE_NAME}"
payload="$(curl --fail --silent --show-error "${CAPABILITIES_URL}")"

PAYLOAD="${payload}" python3 - <<'PYTHON'
import json
import os
import sys

payload = json.loads(os.environ["PAYLOAD"])
expected = {
    "service": "archangel-control",
    "role": "control-plane",
    "execution_mode": "observe-only",
    "node_enrollment": "disabled",
}

for key, value in expected.items():
    if payload.get(key) != value:
        raise SystemExit(f"Unexpected {key}: {payload.get(key)!r}")

capabilities = payload.get("capabilities", {})
for key in ("signed_status_ingest", "intent_execution", "remote_shell", "credential_storage"):
    if capabilities.get(key) is not False:
        raise SystemExit(f"Unsafe capability state for {key}: {capabilities.get(key)!r}")

print("ARCHANGEL baseline verification passed.")
print(json.dumps(payload, separators=(",", ":")))
PYTHON
