#!/usr/bin/env python3
"""Verify a private ARCHANGEL/1 node status receipt from the terminal.

The verifier accepts a node's public Ed25519 PEM key, fetches one private status
receipt, recreates canonical JSON, and verifies the detached signature. It does
not accept credentials, execute commands, or write node state.
"""

from __future__ import annotations

import argparse
import base64
import json
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def canonical_json(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def decode_signature(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify one private ARCHANGEL signed-status receipt.")
    parser.add_argument("--url", required=True, help="Private node URL, e.g. http://10.42.0.15:8787/v1/status")
    parser.add_argument("--public-key", required=True, type=Path, help="Registered node Ed25519 public PEM file")
    parser.add_argument("--node-id", required=True, help="Expected declared node identifier")
    args = parser.parse_args()

    if not args.public_key.is_file():
        raise SystemExit(f"Public key not found: {args.public_key}")
    with urllib.request.urlopen(args.url, timeout=10) as response:
        envelope = json.loads(response.read().decode("utf-8"))
    payload = envelope.get("payload")
    signature = envelope.get("signature")
    if not isinstance(payload, dict) or not isinstance(signature, str):
        raise SystemExit("Malformed ARCHANGEL receipt envelope.")
    if payload.get("version") != "ARCHANGEL/1" or payload.get("type") != "node.status":
        raise SystemExit("Unexpected ARCHANGEL receipt version or type.")
    if payload.get("node_id") != args.node_id:
        raise SystemExit(f"Node identity mismatch: expected {args.node_id!r}, received {payload.get('node_id')!r}.")
    now = datetime.now(timezone.utc)
    issued_at = parse_time(str(payload.get("issued_at", "")))
    expires_at = parse_time(str(payload.get("expires_at", "")))
    if issued_at > now or expires_at <= now:
        raise SystemExit("Receipt is not currently fresh.")

    with tempfile.TemporaryDirectory() as temp_dir:
        message_path = Path(temp_dir) / "message.json"
        signature_path = Path(temp_dir) / "signature.bin"
        message_path.write_bytes(canonical_json(payload))
        signature_path.write_bytes(decode_signature(signature))
        result = subprocess.run(
            [
                "openssl", "pkeyutl", "-verify", "-rawin", "-pubin",
                "-inkey", str(args.public_key), "-in", str(message_path),
                "-sigfile", str(signature_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
    if result.returncode != 0:
        raise SystemExit("Signature verification failed.")

    print(json.dumps({
        "verified": True,
        "node_id": payload["node_id"],
        "sequence": payload.get("sequence"),
        "issued_at": payload["issued_at"],
        "expires_at": payload["expires_at"],
        "role": payload.get("role"),
        "status": payload.get("status"),
    }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ARCHANGEL receipt verification failed: {error}", file=sys.stderr)
        raise SystemExit(1)
