#!/usr/bin/env bash
# ARCHANGEL private-mesh node preparation.
# Run once on an authorized Ubuntu 24 Lightsail node. It creates node-owned keys
# and a disabled private-only signed-status service. It does not create a public
# listener, join a mesh, grant remote shell access, or execute remote commands.

set -Eeuo pipefail
IFS=$'\n\t'

readonly NODE_USER="archangel-node"
readonly NODE_GROUP="archangel-node"
readonly CONFIG_ROOT="/etc/archangel-node"
readonly KEY_ROOT="${CONFIG_ROOT}/keys"
readonly STATE_ROOT="/var/lib/archangel-node"
readonly INSTALL_ROOT="/opt/archangel-node"
readonly STATUS_PORT="8787"

node_id=""
node_role=""
overlay_address=""

usage() {
  cat <<'EOF'
Usage:
  sudo bash archangel-mesh-node-bootstrap.sh \
    --node-id <declared-node-id> \
    --node-role <declared-role> \
    --overlay-address <10.42.0.x/32>

This only prepares node-owned cryptographic identities and a disabled private
status agent. A separate signed authorization and hub configuration are required
before this node joins the ARCHANGEL private mesh.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --node-id) node_id="${2:-}"; shift 2 ;;
    --node-role) node_role="${2:-}"; shift 2 ;;
    --overlay-address) overlay_address="${2:-}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

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

validate_inputs() {
  [[ "${node_id}" =~ ^(root-gate|tesseract-terminus|xinus-clarity|kether-gate|tesseract-a|keira|project-reclaim)$ ]] || {
    echo "Node ID is not in the declared ARCHANGEL registry." >&2
    exit 2
  }
  [[ -n "${node_role}" && "${node_role}" != *$'\n'* ]] || { echo "A one-line node role is required." >&2; exit 2; }
  [[ "${overlay_address}" =~ ^10\.42\.0\.([1-9]|1[0-9]|2[0-5])/32$ && "${overlay_address}" != "10.42.0.1/32" ]] || {
    echo "Use a unique non-hub overlay address in 10.42.0.0/24, formatted as x.x.x.x/32." >&2
    exit 2
  }
}

install_dependencies() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install --yes --no-install-recommends ca-certificates curl openssl python3 wireguard-tools
}

create_service_identity() {
  getent group "${NODE_GROUP}" >/dev/null || groupadd --system "${NODE_GROUP}"
  id "${NODE_USER}" >/dev/null 2>&1 || useradd --system --gid "${NODE_GROUP}" --home-dir "${STATE_ROOT}" --create-home --shell /usr/sbin/nologin "${NODE_USER}"
}

create_node_identity() {
  install -d -o root -g "${NODE_GROUP}" -m 0750 "${KEY_ROOT}"
  install -d -o "${NODE_USER}" -g "${NODE_GROUP}" -m 0750 "${STATE_ROOT}"
  install -d -o root -g root -m 0755 "${INSTALL_ROOT}/bin"
  install -d -o root -g root -m 0700 "/etc/wireguard"

  if [[ ! -s "${KEY_ROOT}/wg-archangel.key" ]]; then
    umask 077
    wg genkey > "${KEY_ROOT}/wg-archangel.key"
    wg pubkey < "${KEY_ROOT}/wg-archangel.key" > "${KEY_ROOT}/wg-archangel.pub"
  fi
  if [[ ! -s "${KEY_ROOT}/status-ed25519.key.pem" ]]; then
    openssl genpkey -algorithm ED25519 -out "${KEY_ROOT}/status-ed25519.key.pem"
    openssl pkey -in "${KEY_ROOT}/status-ed25519.key.pem" -pubout -out "${KEY_ROOT}/status-ed25519.pub.pem"
  fi

  chown root:"${NODE_GROUP}" "${KEY_ROOT}"/*
  chmod 0640 "${KEY_ROOT}/wg-archangel.key" "${KEY_ROOT}/status-ed25519.key.pem"
  chmod 0644 "${KEY_ROOT}/wg-archangel.pub" "${KEY_ROOT}/status-ed25519.pub.pem"
}

write_agent_configuration() {
  cat > "${CONFIG_ROOT}.tmp" <<EOF
ARCHANGEL_NODE_ID=${node_id}
ARCHANGEL_NODE_ROLE=${node_role}
ARCHANGEL_OVERLAY_ADDRESS=${overlay_address%/32}
ARCHANGEL_STATUS_PORT=${STATUS_PORT}
ARCHANGEL_STATUS_KEY=${KEY_ROOT}/status-ed25519.key.pem
ARCHANGEL_STATUS_PUBLIC_KEY=${KEY_ROOT}/status-ed25519.pub.pem
ARCHANGEL_STATUS_STATE=${STATE_ROOT}/sequence
ARCHANGEL_STATUS_RELEASE=1.0.0-pre-enrollment
EOF
  install -o root -g "${NODE_GROUP}" -m 0640 "${CONFIG_ROOT}.tmp" "${CONFIG_ROOT}/agent.env"
  rm -f "${CONFIG_ROOT}.tmp"
}

write_status_agent() {
  cat > "${INSTALL_ROOT}/bin/status_agent.py" <<'PYTHON'
#!/usr/bin/env python3
"""Private-only ARCHANGEL signed status agent.

The agent exposes a single read-only endpoint after the WireGuard interface is
active. It has no command handler, credential API, enrollment endpoint, or
public bind address.
"""

import base64
import fcntl
import json
import os
import subprocess
import time
import tempfile
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


NODE_ID = os.environ["ARCHANGEL_NODE_ID"]
ROLE = os.environ["ARCHANGEL_NODE_ROLE"]
BIND_ADDRESS = os.environ["ARCHANGEL_OVERLAY_ADDRESS"]
PORT = int(os.environ["ARCHANGEL_STATUS_PORT"])
PRIVATE_KEY = os.environ["ARCHANGEL_STATUS_KEY"]
PUBLIC_KEY = os.environ["ARCHANGEL_STATUS_PUBLIC_KEY"]
SEQUENCE_FILE = os.environ["ARCHANGEL_STATUS_STATE"]
RELEASE = os.environ["ARCHANGEL_STATUS_RELEASE"]


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def next_sequence() -> int:
    os.makedirs(os.path.dirname(SEQUENCE_FILE), exist_ok=True)
    with open(SEQUENCE_FILE, "a+", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        handle.seek(0)
        try:
            previous = int(handle.read().strip() or "0")
        except ValueError:
            previous = 0
        current = previous + 1
        handle.seek(0)
        handle.truncate()
        handle.write(str(current))
        handle.flush()
        os.fsync(handle.fileno())
        return current


def signing_fingerprint() -> str:
    result = subprocess.run(["openssl", "pkey", "-pubin", "-in", PUBLIC_KEY, "-outform", "DER"], check=True, capture_output=True)
    digest = subprocess.run(["sha256sum"], input=result.stdout, check=True, capture_output=True).stdout.decode("utf-8")
    return digest.split()[0]


def sign(payload: dict) -> str:
    with tempfile.NamedTemporaryFile() as message:
        message.write(canonical_json(payload))
        message.flush()
        result = subprocess.run(
            ["openssl", "pkeyutl", "-sign", "-rawin", "-inkey", PRIVATE_KEY, "-in", message.name],
            check=True,
            capture_output=True,
        )
    return base64.urlsafe_b64encode(result.stdout).decode("ascii").rstrip("=")


def build_receipt() -> dict:
    now = datetime.now(timezone.utc)
    uptime_seconds = int(float(open("/proc/uptime", encoding="utf-8").read().split()[0]))
    payload = {
        "version": "ARCHANGEL/1",
        "type": "node.status",
        "node_id": NODE_ID,
        "sequence": next_sequence(),
        "issued_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=10)).isoformat(),
        "agent_release": RELEASE,
        "node_public_key_sha256": signing_fingerprint(),
        "role": ROLE,
        "status": {"service": "ready", "uptime_seconds": uptime_seconds, "load_1m": round(os.getloadavg()[0], 2)},
    }
    return {"payload": payload, "signature": sign(payload)}


class Handler(BaseHTTPRequestHandler):
    server_version = "ARCHANGEL-Node/1"

    def log_message(self, _format: str, *_args: object) -> None:
        return

    def do_GET(self) -> None:
        if self.path != "/v1/status":
            self.send_response(404)
            self.end_headers()
            return
        try:
            body = canonical_json(build_receipt())
        except Exception:
            self.send_response(503)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


ThreadingHTTPServer((BIND_ADDRESS, PORT), Handler).serve_forever()
PYTHON
  chown root:root "${INSTALL_ROOT}/bin/status_agent.py"
  chmod 0755 "${INSTALL_ROOT}/bin/status_agent.py"
}

write_systemd_unit() {
  cat > /etc/systemd/system/archangel-status-agent.service <<EOF
[Unit]
Description=ARCHANGEL private signed-status agent
After=network-online.target wg-quick@wg-archangel.service
Wants=network-online.target
Requires=wg-quick@wg-archangel.service

[Service]
Type=simple
User=${NODE_USER}
Group=${NODE_GROUP}
EnvironmentFile=${CONFIG_ROOT}/agent.env
ExecStart=/usr/bin/python3 ${INSTALL_ROOT}/bin/status_agent.py
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
ReadOnlyPaths=${KEY_ROOT}
ReadWritePaths=${STATE_ROOT}
UMask=0027

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
}

write_public_manifest() {
  local wg_public status_public_der status_fingerprint
  wg_public="$(<"${KEY_ROOT}/wg-archangel.pub")"
  status_public_der="$(openssl pkey -pubin -in "${KEY_ROOT}/status-ed25519.pub.pem" -outform DER | base64 --wrap=0)"
  status_fingerprint="$(openssl pkey -pubin -in "${KEY_ROOT}/status-ed25519.pub.pem" -outform DER | sha256sum | awk '{print $1}')"
  cat > "${STATE_ROOT}/enrollment-manifest.json" <<EOF
{"protocol":"ARCHANGEL/1","kind":"node-enrollment-request","node_id":"${node_id}","role":"${node_role}","overlay_address":"${overlay_address}","wireguard_public_key":"${wg_public}","status_ed25519_public_key_der_b64":"${status_public_der}","status_ed25519_public_key_sha256":"${status_fingerprint}"}
EOF
  chown "${NODE_USER}:${NODE_GROUP}" "${STATE_ROOT}/enrollment-manifest.json"
  chmod 0640 "${STATE_ROOT}/enrollment-manifest.json"
}

print_next_steps() {
  cat <<EOF

ARCHANGEL node preparation is complete for ${node_id}.

This command did NOT:
  - open any Lightsail or host firewall port;
  - activate WireGuard;
  - start the status agent;
  - enroll this node; or
  - create a remote command path.

Copy only this public enrollment manifest through an approved administrative
terminal channel:
  sudo cat ${STATE_ROOT}/enrollment-manifest.json

Do not copy these node-owned private keys:
  ${KEY_ROOT}/wg-archangel.key
  ${KEY_ROOT}/status-ed25519.key.pem
EOF
}

main() {
  require_root
  require_ubuntu_24
  validate_inputs
  install_dependencies
  create_service_identity
  create_node_identity
  install -d -o root -g "${NODE_GROUP}" -m 0750 "${CONFIG_ROOT}"
  write_agent_configuration
  write_status_agent
  write_systemd_unit
  write_public_manifest
  print_next_steps
}

main "$@"
