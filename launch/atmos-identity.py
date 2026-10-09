#!/usr/bin/env python3
"""Generate and verify signed ATMOS/1 per-project identity manifests.

The private key is generated and retained locally by the project owner. Only the
public manifest belongs under a project's public/.well-known directory. This
script never sends the private key or writes it into the public output tree.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

PROTOCOL = "ATMOS/1"
KIND = "identity-manifest"


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def b64url_decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def run(*args: str, input_bytes: bytes | None = None) -> bytes:
    result = subprocess.run(args, input=input_bytes, capture_output=True, check=True)
    return result.stdout


def public_der(private_key: Path) -> bytes:
    return run("openssl", "pkey", "-in", str(private_key), "-pubout", "-outform", "DER")


def public_pem(private_key: Path) -> str:
    return run("openssl", "pkey", "-in", str(private_key), "-pubout").decode()


def validate_locus(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError("canonicalLocus must be an https URL without query or fragment")


def identity_core(node_id: str, locus: str, public_key: str, capabilities: list[str]) -> dict:
    validate_locus(locus)
    return {
        "canonicalLocus": locus.rstrip("/"),
        "capabilities": sorted(set(capabilities)),
        "kind": KIND,
        "nodeId": node_id,
        "publicKey": public_key,
        "protocol": PROTOCOL,
    }


def sign(private_key: Path, payload: dict) -> str:
    with tempfile.TemporaryDirectory() as temp:
        message = Path(temp) / "message.json"
        signature = Path(temp) / "signature.bin"
        message.write_bytes(canonical(payload))
        run("openssl", "pkeyutl", "-sign", "-rawin", "-inkey", str(private_key), "-in", str(message), "-out", str(signature))
        return b64url(signature.read_bytes())


def generate(args: argparse.Namespace) -> int:
    private_key = args.private_key
    manifest = args.manifest
    private_key.parent.mkdir(parents=True, exist_ok=True)
    manifest.parent.mkdir(parents=True, exist_ok=True)
    if private_key.exists() and not args.force:
        raise SystemExit(f"Refusing to overwrite existing private key: {private_key} (use --force only for deliberate rotation)")
    if manifest.exists() and not args.force:
        raise SystemExit(f"Refusing to overwrite existing manifest: {manifest} (use --force only for deliberate rotation)")
    run("openssl", "genpkey", "-algorithm", "ED25519", "-out", str(private_key))
    os.chmod(private_key, 0o600)
    pub_pem = public_pem(private_key)
    core = identity_core(args.node_id, args.canonical_locus, pub_pem, args.capability)
    identity_hash = "sha256:" + hashlib.sha256(canonical(core)).hexdigest()
    now = datetime.now(timezone.utc).replace(microsecond=0)
    payload = {
        **core,
        "identityHash": identity_hash,
        "issuedAt": now.isoformat().replace("+00:00", "Z"),
    }
    envelope = {**payload, "signature": sign(private_key, payload)}
    manifest.write_text(json.dumps(envelope, indent=2) + "\n")
    os.chmod(manifest, 0o644)
    print(json.dumps({"manifest": str(manifest), "nodeId": args.node_id, "canonicalLocus": args.canonical_locus, "identityHash": identity_hash}, separators=(",", ":")))
    return 0


def verify(args: argparse.Namespace) -> int:
    envelope = json.loads(args.manifest.read_text())
    required = {"protocol", "nodeId", "canonicalLocus", "publicKey", "capabilities", "identityHash", "issuedAt", "signature"}
    missing = sorted(required - envelope.keys())
    if missing:
        raise SystemExit(f"Manifest missing required fields: {', '.join(missing)}")
    if envelope["protocol"] != PROTOCOL or envelope.get("kind", KIND) != KIND:
        raise SystemExit("Unexpected ATMOS protocol or manifest kind")
    if args.node_id and envelope["nodeId"] != args.node_id:
        raise SystemExit("Node identity mismatch")
    if args.canonical_locus and envelope["canonicalLocus"].rstrip("/") != args.canonical_locus.rstrip("/"):
        raise SystemExit("Canonical locus mismatch")
    core = identity_core(envelope["nodeId"], envelope["canonicalLocus"], envelope["publicKey"], envelope["capabilities"])
    expected_hash = "sha256:" + hashlib.sha256(canonical(core)).hexdigest()
    if envelope["identityHash"] != expected_hash:
        raise SystemExit("Identity hash mismatch")
    payload = {key: envelope[key] for key in envelope if key != "signature"}
    with tempfile.TemporaryDirectory() as temp:
        message = Path(temp) / "message.json"
        signature = Path(temp) / "signature.bin"
        public = Path(temp) / "public.pem"
        message.write_bytes(canonical(payload))
        signature.write_bytes(b64url_decode(envelope["signature"]))
        public.write_text(envelope["publicKey"])
        result = subprocess.run(["openssl", "pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", str(public), "-in", str(message), "-sigfile", str(signature)], capture_output=True)
    if result.returncode != 0:
        raise SystemExit("ATMOS identity signature verification failed")
    print(json.dumps({"verified": True, "nodeId": envelope["nodeId"], "canonicalLocus": envelope["canonicalLocus"], "identityHash": envelope["identityHash"]}, separators=(",", ":")))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or verify an ATMOS/1 identity manifest")
    sub = parser.add_subparsers(dest="command", required=True)
    g = sub.add_parser("generate")
    g.add_argument("--node-id", required=True)
    g.add_argument("--canonical-locus", required=True)
    g.add_argument("--private-key", type=Path, required=True)
    g.add_argument("--manifest", type=Path, required=True)
    g.add_argument("--capability", action="append", default=[])
    g.add_argument("--force", action="store_true")
    g.set_defaults(func=generate)
    v = sub.add_parser("verify")
    v.add_argument("--manifest", type=Path, required=True)
    v.add_argument("--node-id")
    v.add_argument("--canonical-locus")
    v.set_defaults(func=verify)
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
