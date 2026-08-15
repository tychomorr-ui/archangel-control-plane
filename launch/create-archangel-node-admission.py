#!/usr/bin/env python3
"""Create a Root-Gate signed ARCHANGEL/1 node-admission package locally.

This program is intended to run only on Root-Gate. It consumes a node's public
manifest, validates its declared address, signs a short-lived admission package,
and writes no private material outside Root-Gate.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path


DECLARED_NODES = {
    "root-gate": {"address": "10.42.0.11/32", "role": "sovereign-identity"},
    "tesseract-terminus": {"address": "10.42.0.12/32", "role": "provenance-and-attestation"},
    "xinus-clarity": {"address": "10.42.0.13/32", "role": "flagship-application-layer"},
    "kether-gate": {"address": "10.42.0.14/32", "role": "monarch-os"},
    "tesseract-a": {"address": "10.42.0.15/32", "role": "recovery-and-mirror"},
    "keira": {"address": "10.42.0.16/32", "role": "intelligence-analysis"},
    "project-reclaim": {"address": "10.42.0.17/32", "role": "field-activation"},
    "iwa-sage": {"address": "10.42.0.18/32", "role": "indigenous-wellness-alliance"},
    "resonate-earth": {"address": "10.42.0.19/32", "role": "planetary-witness"},
}


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def public_key_fingerprint(public_key: Path) -> str:
    result = subprocess.run(
        ["openssl", "pkey", "-pubin", "-in", str(public_key), "-outform", "DER"],
        check=True,
        capture_output=True,
    )
    return hashlib.sha256(result.stdout).hexdigest()


def sign(payload: dict, private_key: Path) -> str:
    with tempfile.NamedTemporaryFile() as message:
        message.write(canonical_json(payload))
        message.flush()
        result = subprocess.run(
            ["openssl", "pkeyutl", "-sign", "-rawin", "-inkey", str(private_key), "-in", message.name],
            check=True,
            capture_output=True,
        )
    return b64url(result.stdout)


def load_node_manifest(path: Path) -> dict:
    manifest = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "protocol", "kind", "node_id", "role", "overlay_address", "wireguard_public_key",
        "status_ed25519_public_key_der_b64", "status_ed25519_public_key_sha256",
    }
    missing = sorted(required - set(manifest))
    if missing:
        raise ValueError(f"Node manifest is missing: {', '.join(missing)}")
    if manifest["protocol"] != "ARCHANGEL/1" or manifest["kind"] != "node-enrollment-request":
        raise ValueError("Unexpected node manifest protocol or kind.")
    node_id = manifest["node_id"]
    declared = DECLARED_NODES.get(node_id)
    if not declared:
        raise ValueError(f"Node {node_id!r} is not in the declared registry.")
    if manifest["overlay_address"] != declared["address"] or manifest["role"] != declared["role"]:
        raise ValueError("Node manifest role or overlay address conflicts with the declared registry.")
    status_key = base64.b64decode(manifest["status_ed25519_public_key_der_b64"], validate=True)
    if hashlib.sha256(status_key).hexdigest() != manifest["status_ed25519_public_key_sha256"]:
        raise ValueError("Node status public-key fingerprint does not match its key material.")
    if not isinstance(manifest["wireguard_public_key"], str) or len(manifest["wireguard_public_key"].strip()) < 40:
        raise ValueError("Node WireGuard public key is malformed.")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a short-lived Root-Gate signed node-admission package.")
    parser.add_argument("--node-manifest", required=True, type=Path)
    parser.add_argument("--root-private-key", required=True, type=Path)
    parser.add_argument("--root-public-key", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--valid-for-minutes", type=int, default=30)
    args = parser.parse_args()

    if not 1 <= args.valid_for_minutes <= 60:
        raise SystemExit("valid-for-minutes must be between 1 and 60.")
    if not args.root_private_key.is_file() or not args.root_public_key.is_file():
        raise SystemExit("Root-Gate key material is missing.")

    manifest = load_node_manifest(args.node_manifest)
    now = datetime.now(timezone.utc)
    payload = {
        "version": "ARCHANGEL/1",
        "type": "node.admission",
        "admission_id": f"adm_{uuid.uuid4().hex}",
        "issuer": "root-gate",
        "issuer_public_key_sha256": public_key_fingerprint(args.root_public_key),
        "node_id": manifest["node_id"],
        "role": manifest["role"],
        "overlay_address": manifest["overlay_address"],
        "wireguard_public_key": manifest["wireguard_public_key"].strip(),
        "status_ed25519_public_key_der_b64": manifest["status_ed25519_public_key_der_b64"],
        "status_ed25519_public_key_sha256": manifest["status_ed25519_public_key_sha256"],
        "issued_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=args.valid_for_minutes)).isoformat(),
        "challenge_id": uuid.uuid4().hex,
    }
    envelope = {"payload": payload, "signature": sign(payload, args.root_private_key)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(canonical_json(envelope))
    args.output.chmod(0o640)
    print(json.dumps({
        "created": str(args.output),
        "admission_id": payload["admission_id"],
        "node_id": payload["node_id"],
        "expires_at": payload["expires_at"],
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ARCHANGEL admission creation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
