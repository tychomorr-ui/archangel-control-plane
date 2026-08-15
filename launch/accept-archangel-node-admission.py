#!/usr/bin/env python3
"""Verify Root-Gate node admission and produce node proof-of-possession.

Run on the node that created the enrollment manifest. The script verifies the
Root-Gate signature, confirms every public field matches the local identity, and
signs an acknowledgement using the node-owned status key. It opens no port and
does not activate WireGuard.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


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
            capture_output=True,
            check=False,
        ).returncode == 0


def sign(payload: dict, private_key: Path) -> str:
    with tempfile.NamedTemporaryFile() as message:
        message.write(canonical_json(payload))
        message.flush()
        result = subprocess.run(
            ["openssl", "pkeyutl", "-sign", "-rawin", "-inkey", str(private_key), "-in", message.name],
            capture_output=True,
            check=True,
        )
    return b64url(result.stdout)


def public_fingerprint(public_key: Path) -> str:
    result = subprocess.run(["openssl", "pkey", "-pubin", "-in", str(public_key), "-outform", "DER"], capture_output=True, check=True)
    return hashlib.sha256(result.stdout).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description="Accept a Root-Gate signed ARCHANGEL node-admission package.")
    parser.add_argument("--admission", required=True, type=Path)
    parser.add_argument("--root-public-key", required=True, type=Path)
    parser.add_argument("--node-manifest", required=True, type=Path)
    parser.add_argument("--node-status-private-key", required=True, type=Path)
    parser.add_argument("--node-status-public-key", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    admission = json.loads(args.admission.read_text(encoding="utf-8"))
    manifest = json.loads(args.node_manifest.read_text(encoding="utf-8"))
    payload = admission.get("payload")
    signature = admission.get("signature")
    if not isinstance(payload, dict) or not isinstance(signature, str):
        raise ValueError("Malformed admission envelope.")
    if payload.get("version") != "ARCHANGEL/1" or payload.get("type") != "node.admission":
        raise ValueError("Unexpected admission version or type.")
    if payload.get("issuer") != "root-gate":
        raise ValueError("Admission issuer is not Root-Gate.")
    if payload.get("issuer_public_key_sha256") != public_fingerprint(args.root_public_key):
        raise ValueError("Root-Gate public-key fingerprint mismatch.")
    if not verify(payload, signature, args.root_public_key):
        raise ValueError("Root-Gate admission signature verification failed.")
    if parse_time(str(payload.get("expires_at", ""))) <= datetime.now(timezone.utc):
        raise ValueError("Admission package has expired.")

    for key in ("node_id", "role", "overlay_address", "wireguard_public_key", "status_ed25519_public_key_der_b64", "status_ed25519_public_key_sha256"):
        if payload.get(key) != manifest.get(key):
            raise ValueError(f"Admission does not match local node manifest field: {key}")
    if payload.get("status_ed25519_public_key_sha256") != public_fingerprint(args.node_status_public_key):
        raise ValueError("Local node status key does not match admission package.")

    acknowledgement = {
        "version": "ARCHANGEL/1",
        "type": "node.admission.ack",
        "admission_id": payload["admission_id"],
        "challenge_id": payload["challenge_id"],
        "node_id": payload["node_id"],
        "status_ed25519_public_key_sha256": payload["status_ed25519_public_key_sha256"],
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
    envelope = {"payload": acknowledgement, "signature": sign(acknowledgement, args.node_status_private_key)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(canonical_json(envelope))
    args.output.chmod(0o640)
    print(json.dumps({"accepted": True, "node_id": acknowledgement["node_id"], "admission_id": acknowledgement["admission_id"], "acknowledgement": str(args.output)}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ARCHANGEL node admission was not accepted: {error}", file=sys.stderr)
        raise SystemExit(1)
