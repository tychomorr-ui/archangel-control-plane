#!/usr/bin/env bash
# ARCHANGEL London bootstrap
# Purpose: establish a minimal, observe-only control-plane host baseline.
# This script deliberately does NOT enroll nodes, store secrets, open a public API,
# or provide remote command execution. Review before running as root on Ubuntu 24.

set -Eeuo pipefail
IFS=$'\n\t'

readonly SERVICE_USER="archangel"
readonly SERVICE_GROUP="archangel"
readonly INSTALL_ROOT="/opt/archangel"
readonly CONFIG_ROOT="/etc/archangel"
readonly STATE_ROOT="/var/lib/archangel"
readonly LOG_ROOT="/var/log/archangel"
readonly SERVICE_NAME="archangel-control"

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "Run this bootstrap with sudo or as root." >&2
    exit 1
  fi
}

require_ubuntu() {
  if [[ ! -r /etc/os-release ]]; then
    echo "Unable to verify operating system. This bootstrap supports Ubuntu 24 only." >&2
    exit 1
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" || "${VERSION_ID:-}" != "24.04" ]]; then
    echo "Expected Ubuntu 24.04 OS-only image; found ${PRETTY_NAME:-unknown}." >&2
    exit 1
  fi
}

install_baseline_packages() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install --yes --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    unattended-upgrades
}

create_service_identity() {
  if ! getent group "${SERVICE_GROUP}" >/dev/null; then
    groupadd --system "${SERVICE_GROUP}"
  fi

  if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
    useradd \
      --system \
      --gid "${SERVICE_GROUP}" \
      --home-dir "${STATE_ROOT}" \
      --create-home \
      --shell /usr/sbin/nologin \
      "${SERVICE_USER}"
  fi
}

create_directories() {
  install -d -o root -g root -m 0755 "${INSTALL_ROOT}/bin"
  install -d -o root -g "${SERVICE_GROUP}" -m 0750 "${CONFIG_ROOT}"
  install -d -o "${SERVICE_USER}" -g "${SERVICE_GROUP}" -m 0750 "${STATE_ROOT}"
  install -d -o "${SERVICE_USER}" -g "${SERVICE_GROUP}" -m 0750 "${LOG_ROOT}"
}

write_configuration_template() {
  if [[ ! -f "${CONFIG_ROOT}/archangel.env" ]]; then
    cat > "${CONFIG_ROOT}/archangel.env" <<'EOF'
# ARCHANGEL control-plane baseline configuration.
# Do not place private keys, provider credentials, or node credentials in this file.
ARCHANGEL_ROLE=control-plane
ARCHANGEL_EXECUTION_MODE=observe-only
ARCHANGEL_NODE_ENROLLMENT=disabled
ARCHANGEL_BIND_HOST=127.0.0.1
ARCHANGEL_BIND_PORT=8080
ARCHANGEL_RELEASE=bootstrap-1
EOF
    chown root:"${SERVICE_GROUP}" "${CONFIG_ROOT}/archangel.env"
    chmod 0640 "${CONFIG_ROOT}/archangel.env"
  fi
}

write_local_control_service() {
  cat > "${INSTALL_ROOT}/bin/archangel_control.py" <<'PYTHON'
#!/usr/bin/env python3
"""Minimal ARCHANGEL control-plane baseline.

The service only reports local health and declared safety boundaries. It binds to
loopback and deliberately has no node enrollment, command execution, credential
handling, or public API surface.
"""

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


ROLE = os.environ.get("ARCHANGEL_ROLE", "control-plane")
MODE = os.environ.get("ARCHANGEL_EXECUTION_MODE", "observe-only")
ENROLLMENT = os.environ.get("ARCHANGEL_NODE_ENROLLMENT", "disabled")
HOST = os.environ.get("ARCHANGEL_BIND_HOST", "127.0.0.1")
PORT = int(os.environ.get("ARCHANGEL_BIND_PORT", "8080"))
RELEASE = os.environ.get("ARCHANGEL_RELEASE", "bootstrap-1")


class Handler(BaseHTTPRequestHandler):
    server_version = "ARCHANGEL/0"

    def log_message(self, _format, *_args):
        # Deliberately avoid request payload logging at the bootstrap stage.
        return

    def do_GET(self):
        if self.path not in ("/healthz", "/readyz", "/v1/capabilities"):
            self.send_response(404)
            self.end_headers()
            return

        payload = {
            "service": "archangel-control",
            "role": ROLE,
            "release": RELEASE,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "execution_mode": MODE,
            "node_enrollment": ENROLLMENT,
            "capabilities": {
                "signed_status_ingest": False,
                "intent_execution": False,
                "remote_shell": False,
                "credential_storage": False,
            },
        }
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
PYTHON
  chown root:root "${INSTALL_ROOT}/bin/archangel_control.py"
  chmod 0755 "${INSTALL_ROOT}/bin/archangel_control.py"
}

write_systemd_unit() {
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=ARCHANGEL observe-only control-plane baseline
Documentation=file://${INSTALL_ROOT}/bin/archangel_control.py
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
EnvironmentFile=${CONFIG_ROOT}/archangel.env
ExecStart=/usr/bin/python3 ${INSTALL_ROOT}/bin/archangel_control.py
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
ReadWritePaths=${STATE_ROOT} ${LOG_ROOT}
UMask=0027

[Install]
WantedBy=multi-user.target
EOF
}

enable_service() {
  systemctl daemon-reload
  systemctl enable --now "${SERVICE_NAME}.service"
  systemctl --no-pager --full status "${SERVICE_NAME}.service"
}

print_security_boundary() {
  cat <<'EOF'

ARCHANGEL baseline is active.

Security boundary:
  - The service listens only on 127.0.0.1:8080.
  - Do not expose port 8080 in the host firewall.
  - Do not add private keys, provider credentials, or node credentials to archangel.env.
  - No node enrollment or remote execution is enabled by this bootstrap.
  - Configure the host network firewall separately: restrict SSH to trusted
    administrative source addresses; add HTTPS only after an approved reverse proxy,
    TLS certificate, and authentication boundary are ready.

Local verification command:
  curl --fail --silent http://127.0.0.1:8080/v1/capabilities
EOF
}

main() {
  require_root
  require_ubuntu
  install_baseline_packages
  create_service_identity
  create_directories
  write_configuration_template
  write_local_control_service
  write_systemd_unit
  enable_service
  print_security_boundary
}

main "$@"
