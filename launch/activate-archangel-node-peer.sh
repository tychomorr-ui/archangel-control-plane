#!/usr/bin/env bash
# Render and optionally activate a node's private peer configuration.
# The node connects only to ARCHANGEL London; it is not a public WireGuard server.

set -Eeuo pipefail
IFS=$'\n\t'

readonly CONFIG_ROOT="/etc/archangel-node"
readonly KEY_ROOT="${CONFIG_ROOT}/keys"
readonly NODE_ENV="${CONFIG_ROOT}/agent.env"
readonly WIREGUARD_CONFIG="/etc/wireguard/wg-archangel.conf"

hub_manifest=""
hub_endpoint=""
admission=""
root_public_key=""
activate="false"

usage() {
  cat <<'EOF'
Usage:
  sudo bash activate-archangel-node-peer.sh \
    --hub-manifest <safe-hub-manifest.json> \
    --hub-endpoint <london-public-host-or-ip:51820> \
    --admission <root-signed-node-admission.json> \
    --root-public-key <root-gate-admission-ed25519.pub.pem> [--activate]

Without --activate, the command writes a root-only WireGuard configuration for
inspection but does not start the tunnel or status agent.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hub-manifest) hub_manifest="${2:-}"; shift 2 ;;
    --hub-endpoint) hub_endpoint="${2:-}"; shift 2 ;;
    --admission) admission="${2:-}"; shift 2 ;;
    --root-public-key) root_public_key="${2:-}"; shift 2 ;;
    --activate) activate="true"; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

require_root() {
  [[ "$(id -u)" -eq 0 ]] || { echo "Run with sudo or as root." >&2; exit 1; }
}

validate_required_files() {
  [[ -f "${NODE_ENV}" && -f "${KEY_ROOT}/wg-archangel.key" ]] || { echo "Run the node bootstrap first." >&2; exit 1; }
  [[ -f "${hub_manifest}" && -f "${admission}" && -f "${root_public_key}" ]] || { echo "Hub manifest, Root-Gate public key, or signed admission file is missing." >&2; exit 1; }
  [[ "${hub_endpoint}" =~ ^[^[:space:]]+:[0-9]{1,5}$ ]] || { echo "Hub endpoint must be host-or-IP:port." >&2; exit 2; }
}

load_and_validate_public_data() {
  # agent.env is root-owned output from the node bootstrap, not operator-supplied shell input.
  # shellcheck disable=SC1090
  source "${NODE_ENV}"
  eval "$(python3 - "${hub_manifest}" "${admission}" "${root_public_key}" "${ARCHANGEL_NODE_ID}" "${ARCHANGEL_NODE_ROLE}" "${ARCHANGEL_OVERLAY_ADDRESS}" <<'PYTHON'
import base64
import hashlib
import json
import shlex
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

hub = json.load(open(sys.argv[1], encoding="utf-8"))
envelope = json.load(open(sys.argv[2], encoding="utf-8"))
root_public_key = sys.argv[3]
admission = envelope.get("payload", {})
signature = envelope.get("signature")
node_id, node_role, overlay = sys.argv[4:]
if not isinstance(admission, dict) or not isinstance(signature, str):
    raise SystemExit("Malformed Root-Gate admission envelope.")
if admission.get("version") != "ARCHANGEL/1" or admission.get("type") != "node.admission" or admission.get("issuer") != "root-gate":
    raise SystemExit("Unexpected Root-Gate admission package.")
canonical = json.dumps(admission, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
try:
    signature_bytes = base64.urlsafe_b64decode(signature + "=" * (-len(signature) % 4))
    issued_at = datetime.fromisoformat(admission["issued_at"].replace("Z", "+00:00")).astimezone(timezone.utc)
    expires_at = datetime.fromisoformat(admission["expires_at"].replace("Z", "+00:00")).astimezone(timezone.utc)
except Exception as error:
    raise SystemExit(f"Malformed admission signature or timestamps: {error}")
if issued_at > datetime.now(timezone.utc) or expires_at <= datetime.now(timezone.utc):
    raise SystemExit("Root-Gate admission is not currently valid.")
with tempfile.TemporaryDirectory() as temp_dir:
    message = f"{temp_dir}/payload.json"
    detached_signature = f"{temp_dir}/signature.bin"
    open(message, "wb").write(canonical)
    open(detached_signature, "wb").write(signature_bytes)
    verified = subprocess.run(["openssl", "pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", root_public_key, "-in", message, "-sigfile", detached_signature], capture_output=True, check=False)
if verified.returncode != 0:
    raise SystemExit("Root-Gate admission signature verification failed.")
public_der = subprocess.run(["openssl", "pkey", "-pubin", "-in", root_public_key, "-outform", "DER"], capture_output=True, check=True).stdout
if admission.get("issuer_public_key_sha256") != hashlib.sha256(public_der).hexdigest():
    raise SystemExit("Root-Gate admission public-key fingerprint mismatch.")
if hub.get("protocol") != "ARCHANGEL/1" or hub.get("kind") != "hub-manifest" or hub.get("hub_id") != "archangel" or hub.get("overlay_address") != "10.42.0.1/32":
    raise SystemExit("Hub manifest does not describe the declared ARCHANGEL private hub.")
if not isinstance(hub.get("wireguard_public_key"), str) or len(hub["wireguard_public_key"].strip()) < 40:
    raise SystemExit("Hub WireGuard public key is malformed.")
for key, expected in (("node_id", node_id), ("role", node_role), ("overlay_address", f"{overlay}/32")):
    if admission.get(key) != expected:
        raise SystemExit(f"Admission mismatch for {key}.")
if not isinstance(admission.get("wireguard_public_key"), str):
    raise SystemExit("Admission lacks a node WireGuard public key.")
print("HUB_PUBLIC_KEY=" + shlex.quote(hub["wireguard_public_key"].strip()))
PYTHON
)"
}

write_peer_config() {
  install -d -o root -g root -m 0700 /etc/wireguard
  cat > "${WIREGUARD_CONFIG}" <<EOF
# Managed by activate-archangel-node-peer.sh. No spoke-to-spoke routes are permitted.
[Interface]
Address = ${ARCHANGEL_OVERLAY_ADDRESS}/32
PrivateKey = $(<"${KEY_ROOT}/wg-archangel.key")

[Peer]
# ARCHANGEL London hub
PublicKey = ${HUB_PUBLIC_KEY}
Endpoint = ${hub_endpoint}
AllowedIPs = 10.42.0.1/32
PersistentKeepalive = 25
EOF
  chown root:root "${WIREGUARD_CONFIG}"
  chmod 0600 "${WIREGUARD_CONFIG}"
}

activate_peer() {
  systemctl enable --now wg-quick@wg-archangel.service
  systemctl enable --now archangel-status-agent.service
  wg show wg-archangel
  curl --fail --silent --show-error "http://${ARCHANGEL_OVERLAY_ADDRESS}:${ARCHANGEL_STATUS_PORT}/v1/status" >/dev/null
  echo "Private peer and read-only signed-status agent are active. No public status endpoint or command service was enabled."
}

main() {
  require_root
  validate_required_files
  load_and_validate_public_data
  write_peer_config
  if [[ "${activate}" == "true" ]]; then
    activate_peer
  else
    echo "Private peer configuration rendered at ${WIREGUARD_CONFIG}; not activated. Review then re-run with --activate."
  fi
}

main "$@"
