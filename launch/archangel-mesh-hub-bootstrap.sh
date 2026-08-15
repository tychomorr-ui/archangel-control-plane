#!/usr/bin/env bash
# ARCHANGEL private-mesh hub preparation.
# Run only on the London ARCHANGEL host after its observe-only baseline verified.
# This prepares a local WireGuard identity but does not activate an interface,
# open a firewall, enroll a node, or alter execution authority.

set -Eeuo pipefail
IFS=$'\n\t'

readonly MESH_ROOT="/etc/archangel/mesh"
readonly KEY_ROOT="${MESH_ROOT}/keys"
readonly HUB_ADDRESS="10.42.0.1/32"
readonly HUB_PORT="51820"

require_root() {
  [[ "$(id -u)" -eq 0 ]] || { echo "Run with sudo or as root." >&2; exit 1; }
}

require_ubuntu_24() {
  # shellcheck disable=SC1091
  source /etc/os-release
  [[ "${ID:-}" == "ubuntu" && "${VERSION_ID:-}" == "24.04" ]] || {
    echo "Expected Ubuntu 24.04; found ${PRETTY_NAME:-unknown}." >&2
    exit 1
  }
}

require_observe_only_baseline() {
  local payload
  payload="$(curl --fail --silent --show-error http://127.0.0.1:8080/v1/capabilities)"
  PAYLOAD="${payload}" python3 - <<'PYTHON'
import json
import os

capabilities = json.loads(os.environ["PAYLOAD"])
if capabilities.get("execution_mode") != "observe-only":
    raise SystemExit("ARCHANGEL baseline is not observe-only.")
if capabilities.get("node_enrollment") != "disabled":
    raise SystemExit("ARCHANGEL node enrollment is unexpectedly enabled.")
if any(capabilities.get("capabilities", {}).values()):
    raise SystemExit("ARCHANGEL baseline exposes an unexpected active capability.")
PYTHON
}

install_dependencies() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install --yes --no-install-recommends ca-certificates curl openssl python3 wireguard-tools
}

write_hub_identity() {
  install -d -o root -g root -m 0700 "${KEY_ROOT}"
  install -d -o root -g root -m 0700 "${MESH_ROOT}/registry"
  install -d -o root -g root -m 0700 "/etc/wireguard"

  if [[ ! -s "${KEY_ROOT}/wg-archangel.key" ]]; then
    umask 077
    wg genkey > "${KEY_ROOT}/wg-archangel.key"
    wg pubkey < "${KEY_ROOT}/wg-archangel.key" > "${KEY_ROOT}/wg-archangel.pub"
  fi

  chmod 0600 "${KEY_ROOT}/wg-archangel.key"
  chmod 0644 "${KEY_ROOT}/wg-archangel.pub"

  local public_key fingerprint
  public_key="$(<"${KEY_ROOT}/wg-archangel.pub")"
  fingerprint="$(sha256sum "${KEY_ROOT}/wg-archangel.pub" | awk '{print $1}')"

  cat > "${MESH_ROOT}/hub-manifest.json" <<EOF
{"protocol":"ARCHANGEL/1","kind":"hub-manifest","hub_id":"archangel","overlay_address":"${HUB_ADDRESS}","listen_port":${HUB_PORT},"wireguard_public_key":"${public_key}","wireguard_public_key_sha256":"${fingerprint}"}
EOF
  chmod 0644 "${MESH_ROOT}/hub-manifest.json"
}

print_next_steps() {
  cat <<'EOF'

ARCHANGEL private-mesh hub identity is prepared.

This command did NOT:
  - activate a WireGuard interface;
  - add a Lightsail firewall rule;
  - enroll a node or accept a status receipt;
  - alter archangel-control.service; or
  - enable remote execution.

Public hub manifest (safe to transfer through an administrative terminal):
  sudo cat /etc/archangel/mesh/hub-manifest.json

The WireGuard private key remains root-readable only at:
  /etc/archangel/mesh/keys/wg-archangel.key

Do not copy that private key to another host or commit it to a repository.
EOF
}

main() {
  require_root
  require_ubuntu_24
  require_observe_only_baseline
  install_dependencies
  write_hub_identity
  print_next_steps
}

main "$@"
