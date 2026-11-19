#!/usr/bin/env bash
set -euo pipefail

# Run this script as root on the UpCloud host that will run Tesseract-A Core.
# It never prints or transfers the witness private key.

INSTALL_ROOT="${TESSERACT_A_INSTALL_ROOT:-/opt/tesseract-a-core}"
KEY_ROOT="${TESSERACT_A_KEY_ROOT:-/etc/tesseract-a/keys}"
ENV_FILE="${TESSERACT_A_ENV_FILE:-/etc/tesseract-a/witness.env}"
SERVICE_NAME="${TESSERACT_A_SERVICE_NAME:-tesseract-a-core}"
PORT="${TESSERACT_A_PORT:-4170}"
ARCHANGEL_BASE_URL="${ARCHANGEL_BASE_URL:-https://archangel.nexinus.net}"
SOURCE_DIR="${TESSERACT_A_SOURCE_DIR:-$INSTALL_ROOT}"

if [[ "$(id -u)" != "0" ]]; then
  echo "ERROR: run as root" >&2
  exit 1
fi

for command in node pnpm openssl systemctl sha256sum; do
  command -v "$command" >/dev/null || { echo "ERROR: missing command: $command" >&2; exit 1; }
done
PNPM_BIN="$(command -v pnpm)"

if [[ ! -f "$SOURCE_DIR/package.json" || ! -f "$SOURCE_DIR/src/server.ts" ]]; then
  cat >&2 <<EOF
ERROR: Tesseract-A Core source not found at $SOURCE_DIR.
Populate that directory from the reviewed Tesseract-A Core source before rerunning.
No source download is performed by this script.
EOF
  exit 1
fi
if [[ ! -f "$SOURCE_DIR/config/nodes.json" ]]; then
  echo "ERROR: $SOURCE_DIR/config/nodes.json is missing; do not start a witness with placeholder or empty production identities." >&2
  exit 1
fi

install -d -m 700 "$KEY_ROOT"
install -d -m 755 /etc/tesseract-a

if [[ ! -s "$KEY_ROOT/witness-private.pem" ]]; then
  umask 077
  openssl genpkey -algorithm Ed25519 -out "$KEY_ROOT/witness-private.pem"
fi
openssl pkey -in "$KEY_ROOT/witness-private.pem" -pubout -out "$KEY_ROOT/witness-public.pem"
chmod 600 "$KEY_ROOT/witness-private.pem"
chmod 644 "$KEY_ROOT/witness-public.pem"

PUBLIC_FINGERPRINT="$(openssl pkey -in "$KEY_ROOT/witness-private.pem" -pubout -outform DER | sha256sum | awk '{print $1}')"

cat >"$ENV_FILE" <<EOF
TESSERACT_A_NODE_CONFIG=$INSTALL_ROOT/config/nodes.json
TESSERACT_A_WITNESS_PRIVATE_KEY_FILE=$KEY_ROOT/witness-private.pem
TESSERACT_A_WITNESS_KEY_REFERENCE=tesseract-a:witness
PORT=$PORT
EOF
chmod 600 "$ENV_FILE"

cd "$SOURCE_DIR"
pnpm install --frozen-lockfile --prod=false
pnpm check

cat >"/etc/systemd/system/$SERVICE_NAME.service" <<EOF
[Unit]
Description=Tesseract-A Core probe and signed witness adapter
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_ROOT
EnvironmentFile=$ENV_FILE
ExecStart=$PNPM_BIN start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_ROOT /run /tmp
ReadOnlyPaths=$KEY_ROOT/witness-private.pem

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
sleep 2
curl --fail --silent --show-error "http://127.0.0.1:$PORT/api/status" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const v=JSON.parse(s);if(v.project!=="TESSERACT-A-CORE")process.exit(1);console.log(JSON.stringify(v,null,2));})'

printf '\nTESSERACT_A_WITNESS_PROVISIONED=yes\n'
printf 'witness_public_key_path=%s\n' "$KEY_ROOT/witness-public.pem"
printf 'witness_fingerprint_sha256=%s\n' "$PUBLIC_FINGERPRINT"
printf 'service=%s\n' "$SERVICE_NAME"
printf 'loopback_endpoint=http://127.0.0.1:%s\n' "$PORT"
printf 'archangel_base_url=%s\n' "$ARCHANGEL_BASE_URL"
printf '\n--- PUBLIC PEM FOR AUTHENTICATED ARCHANGEL REGISTRATION ---\n'
cat "$KEY_ROOT/witness-public.pem"
printf '%s\n' '--- PRIVATE KEY REMAINS ON THIS HOST ---'
