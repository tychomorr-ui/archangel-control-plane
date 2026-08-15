#!/usr/bin/env python3
"""Verify and install one dual-proof node admission in the London hub registry.

Run on London after a node has accepted the Root-Gate admission package. It
installs public material only and renders a disabled hub WireGuard configuration.
It does not activate WireGuard or start receipt collection.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


MESH_ROOT = Path("/etc/archangel/mesh")
REGISTRY_ROOT = MESH_ROOT / "registry"
HUB_KEY = MESH_ROOT / "keys" / "wg-archangel.key"
HUB_CONFIG = Path("/etc/wireguard/wg-archangel.conf")
HUB_ADDRESS = "10.42.0.1/24"
HUB_PORT = 51820


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def verify(payload: dict, signature: str, public_key: Path) -> bool:
    with tempfile.TemporaryDirectory() as temp_dir:
        message = Path(temp_dir) / "payload.json"
        detached_signature = Path(temp_dir) / "signature.bin"
        message.write_bytes(canonical_json(payload))
        detached_signature.write_bytes(b64decode(signature))
        return subprocess.run(
            ["openssl", "pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", str(public_key), "-in", str(message), "-sigfile", str(detached_signature)],
            check=False,
            capture_output=True,
        ).returncode == 0


def public_fingerprint(public_key: Path) -> str:
    result = subprocess.run(["openssl", "pkey", "-pubin", "-in", str(public_key), "-outform", "DER"], capture_output=True, check=True)
    return hashlib.sha256(result.stdout).hexdigest()


def node_status_public_key(payload: dict) -> bytes:
    public_der = base64.b64decode(payload["status_ed25519_public_key_der_b64"], validate=True)
    if hashlib.sha256(public_der).hexdigest() != payload["status_ed25519_public_key_sha256"]:
        raise ValueError("Node status public-key fingerprint mismatch.")
    return public_der


def render_hub_config() -> None:
    if not HUB_KEY.is_file():
        raise ValueError("Hub WireGuard private key is missing; run the hub bootstrap first.")
    admissions = []
    for path in sorted(REGISTRY_ROOT.glob("*.admission.json")):
        admissions.append(json.loads(path.read_text(encoding="utf-8"))["payload"])
    seen_addresses: set[str] = set()
    lines = [
        "# Managed by install-archangel-node-admission.py. Do not edit by hand.",
        "[Interface]",
        f"Address = {HUB_ADDRESS}",
        f"ListenPort = {HUB_PORT}",
        f"PrivateKey = {HUB_KEY.read_text(encoding='utf-8').strip()}",
        "",
    ]
    for admission in admissions:
        address = admission["overlay_address"]
        if address in seen_addresses:
            raise ValueError(f"Duplicate overlay address in registry: {address}")
        seen_addresses.add(address)
        lines.extend([
            "[Peer]",
            f"# {admission['node_id']} · {admission['role']} · {admission['admission_id']}",
            f"PublicKey = {admission['wireguard_public_key']}",
            f"AllowedIPs = {address}",
            "",
        ])
    temporary = HUB_CONFIG.with_suffix(".conf.tmp")
    temporary.write_text("\n".join(lines), encoding="utf-8")
    os.chmod(temporary, 0o600)
    temporary.replace(HUB_CONFIG)


def main() -> int:
    parser = argparse.ArgumentParser(description="Install one verified ARCHANGEL node admission on the London hub.")
    parser.add_argument("--admission", required=True, type=Path)
    parser.add_argument("--acknowledgement", required=True, type=Path)
    parser.add_argument("--root-public-key", required=True, type=Path)
    args = parser.parse_args()

    admission = json.loads(args.admission.read_text(encoding="utf-8"))
    acknowledgement = json.loads(args.acknowledgement.read_text(encoding="utf-8"))
    payload = admission.get("payload")
    signature = admission.get("signature")
    ack_payload = acknowledgement.get("payload")
    ack_signature = acknowledgement.get("signature")
    if not isinstance(payload, dict) or not isinstance(signature, str) or not isinstance(ack_payload, dict) or not isinstance(ack_signature, str):
        raise ValueError("Malformed admission or acknowledgement envelope.")
    if payload.get("version") != "ARCHANGEL/1" or payload.get("type") != "node.admission" or payload.get("issuer") != "root-gate":
        raise ValueError("Unexpected Root-Gate admission package.")
    if payload.get("issuer_public_key_sha256") != public_fingerprint(args.root_public_key) or not verify(payload, signature, args.root_public_key):
        raise ValueError("Root-Gate admission verification failed.")
    if parse_time(str(payload.get("expires_at", ""))) <= datetime.now(timezone.utc):
        raise ValueError("Admission package has expired.")
    if ack_payload.get("version") != "ARCHANGEL/1" or ack_payload.get("type") != "node.admission.ack":
        raise ValueError("Unexpected node acknowledgement package.")
    for key in ("admission_id", "challenge_id", "node_id", "status_ed25519_public_key_sha256"):
        if ack_payload.get(key) != payload.get(key):
            raise ValueError(f"Node acknowledgement mismatch: {key}")
    with tempfile.TemporaryDirectory() as temp_dir:
        node_public_der = Path(temp_dir) / "node-status.pub.der"
        node_public_pem = Path(temp_dir) / "node-status.pub.pem"
        node_public_der.write_bytes(node_status_public_key(payload))
        converted = subprocess.run(["openssl", "pkey", "-pubin", "-inform", "DER", "-in", str(node_public_der), "-out", str(node_public_pem)], capture_output=True, check=False)
        if converted.returncode != 0 or not verify(ack_payload, ack_signature, node_public_pem):
            raise ValueError("Node proof-of-possession verification failed.")
        REGISTRY_ROOT.mkdir(parents=True, exist_ok=True)
        os.chmod(REGISTRY_ROOT, 0o700)
        (REGISTRY_ROOT / f"{payload['node_id']}.admission.json").write_bytes(canonical_json(admission))
        os.chmod(REGISTRY_ROOT / f"{payload['node_id']}.admission.json", 0o640)
        (REGISTRY_ROOT / f"{payload['node_id']}-status-ed25519.pub.pem").write_bytes(node_public_pem.read_bytes())
        os.chmod(REGISTRY_ROOT / f"{payload['node_id']}-status-ed25519.pub.pem", 0o644)
    render_hub_config()
    print(json.dumps({"installed": True, "node_id": payload["node_id"], "admission_id": payload["admission_id"], "wireguard_config": str(HUB_CONFIG), "activation": "pending-explicit-command"}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ARCHANGEL hub admission installation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
