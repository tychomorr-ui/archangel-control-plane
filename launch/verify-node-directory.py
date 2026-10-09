#!/usr/bin/env python3
"""Probe a central node registry and verify published ATMOS identity manifests.

This tool performs public HTTPS GETs only. It never writes to a project, signs a
manifest, or treats an owner-entered URL as cryptographic proof. Missing or
non-JSON manifests remain explicitly unverified.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def verify_manifest(manifest: dict, node_id: str, locus: str) -> tuple[bool, str]:
    required = {"protocol", "kind", "nodeId", "canonicalLocus", "capabilities", "identityHash", "publicKey", "issuedAt", "signature"}
    if not required.issubset(manifest):
        return False, "manifest-missing-fields"
    if manifest["protocol"] != "ATMOS/1" or manifest["kind"] != "identity-manifest":
        return False, "manifest-protocol-mismatch"
    if manifest["nodeId"] != node_id or manifest["canonicalLocus"].rstrip("/") != locus.rstrip("/"):
        return False, "manifest-identity-mismatch"
    unsigned = {key: value for key, value in manifest.items() if key != "signature"}
    # Match the canonicalization used by launch/atmos-identity.py.
    import hashlib
    core = {
        "canonicalLocus": manifest["canonicalLocus"].rstrip("/"),
        "capabilities": sorted(set(manifest["capabilities"])),
        "kind": manifest["kind"],
        "nodeId": manifest["nodeId"],
        "publicKey": manifest["publicKey"],
        "protocol": manifest["protocol"],
    }
    canonical = json.dumps(core, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    expected = "sha256:" + hashlib.sha256(canonical).hexdigest()
    if manifest["identityHash"] != expected:
        return False, "identity-hash-mismatch"
    payload = json.dumps(unsigned, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    import base64
    try:
        signature = base64.urlsafe_b64decode(manifest["signature"] + "=" * (-len(manifest["signature"]) % 4))
    except Exception:
        return False, "signature-encoding-invalid"
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        (root / "payload.json").write_bytes(payload)
        (root / "signature.bin").write_bytes(signature)
        (root / "public.pem").write_text(manifest["publicKey"])
        result = subprocess.run(["openssl", "pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", str(root / "public.pem"), "-in", str(root / "payload.json"), "-sigfile", str(root / "signature.bin")], capture_output=True)
    return (True, "verified") if result.returncode == 0 else (False, "signature-invalid")


def probe(node: dict, timeout: float) -> dict:
    locus = node.get("canonicalLocus")
    result = {**node, "checkedUrl": f"{locus.rstrip('/')}/.well-known/atmos-identity.json" if locus else None, "verification": "unverified", "reason": "canonical-locus-missing"}
    if not locus:
        return result
    try:
        parsed = Request(result["checkedUrl"], headers={"Accept": "application/json", "User-Agent": "ARCHANGEL-Identity-Directory/1"})
        with urlopen(parsed, timeout=timeout) as response:
            body = response.read(128 * 1024)
        manifest = json.loads(body.decode("utf-8"))
        valid, reason = verify_manifest(manifest, node["nodeId"], locus)
        result["verification"] = "verified" if valid else "unverified"
        result["reason"] = reason
        if valid:
            result["identityHash"] = manifest["identityHash"]
            result["issuedAt"] = manifest["issuedAt"]
    except HTTPError as error:
        result["reason"] = f"http-{error.code}"
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        result["reason"] = error.__class__.__name__
    except Exception as error:
        result["reason"] = f"probe-failed:{error.__class__.__name__}"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify public ATMOS manifests for the ARCHANGEL node directory")
    parser.add_argument("--registry", type=Path, default=Path("manifests/node-identity-registry.json"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--timeout", type=float, default=10)
    args = parser.parse_args()
    registry = json.loads(args.registry.read_text())
    report = {"protocol": "ARCHANGEL/identity-directory/1", "manifestPath": registry["manifestPath"], "checkedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(), "nodes": [probe(node, args.timeout) for node in registry["nodes"]]}
    encoded = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.write_text(encoded)
    print(encoded, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
