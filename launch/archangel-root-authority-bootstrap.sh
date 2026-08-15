#!/usr/bin/env bash
# Root-Gate enrollment-authority preparation for ARCHANGEL/1.
# Run only on Root-Gate. This creates a node-admission signing identity locally.
# It does not open a network listener, enroll any node, or enable command execution.

set -Eeuo pipefail
IFS=$'\n\t'

readonly AUTHORITY_ROOT="/etc/archangel-root"
readonly KEY_ROOT="${AUTHORITY_ROOT}/keys"

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

install_dependencies() {
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install --yes --no-install-recommends ca-certificates openssl python3
}

create_authority_identity() {
  install -d -o root -g root -m 0700 "${KEY_ROOT}"
  if [[ ! -s "${KEY_ROOT}/admission-ed25519.key.pem" ]]; then
    umask 077
    openssl genpkey -algorithm ED25519 -out "${KEY_ROOT}/admission-ed25519.key.pem"
    openssl pkey -in "${KEY_ROOT}/admission-ed25519.key.pem" -pubout -out "${KEY_ROOT}/admission-ed25519.pub.pem"
  fi
  chmod 0600 "${KEY_ROOT}/admission-ed25519.key.pem"
  chmod 0644 "${KEY_ROOT}/admission-ed25519.pub.pem"

  local public_der fingerprint public_der_b64
  public_der="$(mktemp)"
  trap 'rm -f "${public_der}"' EXIT
  openssl pkey -pubin -in "${KEY_ROOT}/admission-ed25519.pub.pem" -outform DER -out "${public_der}"
  fingerprint="$(sha256sum "${public_der}" | awk '{print $1}')"
  public_der_b64="$(base64 --wrap=0 < "${public_der}")"

  cat > "${AUTHORITY_ROOT}/root-authority-manifest.json" <<EOF
{"protocol":"ARCHANGEL/1","kind":"root-admission-authority","authority_id":"root-gate","admission_ed25519_public_key_der_b64":"${public_der_b64}","admission_ed25519_public_key_sha256":"${fingerprint}"}
EOF
  chmod 0644 "${AUTHORITY_ROOT}/root-authority-manifest.json"
}

print_next_steps() {
  cat <<'EOF'

Root-Gate admission authority is prepared.

Safe to distribute to ARCHANGEL and authorized nodes:
  sudo cat /etc/archangel-root/root-authority-manifest.json
  sudo cat /etc/archangel-root/keys/admission-ed25519.pub.pem

Never copy, upload, or commit:
  /etc/archangel-root/keys/admission-ed25519.key.pem

This command did NOT open a port, enroll a node, configure WireGuard, or enable
remote execution. It only establishes the Root-Gate public identity that will
authorize short-lived node-admission packages through the existing terminal path.
EOF
}

main() {
  require_root
  require_ubuntu_24
  install_dependencies
  create_authority_identity
  print_next_steps
}

main "$@"
