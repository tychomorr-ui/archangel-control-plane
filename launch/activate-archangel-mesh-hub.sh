#!/usr/bin/env bash
# Explicitly activate the reviewed ARCHANGEL WireGuard hub configuration on London.
# This does not alter archangel-control.service and does not enable execution.

set -Eeuo pipefail
IFS=$'\n\t'

readonly HUB_CONFIG="/etc/wireguard/wg-archangel.conf"

require_root() {
  [[ "$(id -u)" -eq 0 ]] || { echo "Run with sudo or as root." >&2; exit 1; }
}

require_observe_only_baseline() {
  local payload
  payload="$(curl --fail --silent --show-error http://127.0.0.1:8080/v1/capabilities)"
  PAYLOAD="${payload}" python3 - <<'PYTHON'
import json
import os

value = json.loads(os.environ["PAYLOAD"])
if value.get("execution_mode") != "observe-only" or value.get("node_enrollment") != "disabled" or any(value.get("capabilities", {}).values()):
    raise SystemExit("ARCHANGEL baseline safety boundary has changed; do not activate the hub.")
PYTHON
}

main() {
  require_root
  require_observe_only_baseline
  [[ -s "${HUB_CONFIG}" ]] || { echo "No rendered hub configuration exists. Install verified node admissions first." >&2; exit 1; }
  [[ "${1:-}" == "--activate" ]] || {
    cat <<'EOF'
Refusing to activate without --activate.

Before activation, confirm the host firewall permits UDP 51820 only from the
current public addresses of the authorized node hosts. This starts only the
private WireGuard transport and does not enable a public status, enrollment, or
command API.
EOF
    exit 2
  }
  systemctl enable --now wg-quick@wg-archangel.service
  wg show wg-archangel
  ip -brief address show dev wg-archangel
  echo "ARCHANGEL private transport is active. Receipt collection remains separate and disabled until its own reviewed deployment."
}

main "$@"
