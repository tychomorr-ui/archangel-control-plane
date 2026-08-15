#!/usr/bin/env bash
# Isolated check for the active Debian Monarch-OS preparation path.
# This never installs packages, writes system configuration, or requires root.

set -Eeuo pipefail
IFS=$'\n\t'

readonly PROJECT="/home/ubuntu/archangel-control-plane"
readonly WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT

cat > "${WORKDIR}/debian-12-os-release" <<'EOF'
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
ID=debian
EOF

bash "${PROJECT}/launch/archangel-mesh-node-bootstrap.sh" --validate-os-file "${WORKDIR}/debian-12-os-release" | grep -F "Supported ARCHANGEL node operating system: Debian GNU/Linux 12 (bookworm)."

echo "Debian Monarch-OS preparation-path validation passed."
