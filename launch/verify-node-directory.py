#!/usr/bin/env python3
"""Verify the public ATMOS-1.1.1 identity and signed-health directory.

The verifier performs public HTTPS GETs only. It never writes to a node, signs a
manifest, or treats reachability alone as cryptographic proof. VERIFIED requires
the served public-key fingerprint, manifest payload hash, signed health response,
and measured artifact hash to match the operator-supplied registry.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def canonical_json(value: object) -> bytes:
    # ATMOS canonicalJson follows JSON.stringify: UTF-8 characters remain literal;
    # keys are recursively sorted and no insignificant whitespace is emitted.
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def public_key_fingerprint(public_key_pem: str) -> str:
    with tempfile.TemporaryDirectory() as temp:
        key = Path(temp) / "public.pem"
        key.write_text(public_key_pem)
        result = subprocess.run(["openssl", "pkey", "-pubin", "-in", str(key), "-outform", "DER"], capture_output=True, check=True)
    return hashlib.sha256(result.stdout).hexdigest()


def verify_signature(public_key_pem: str, payload: bytes, signature_b64: str) -> bool:
    try:
        signature = base64.urlsafe_b64decode(signature_b64 + "=" * (-len(signature_b64) % 4))
    except Exception:
        return False
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        (root / "public.pem").write_text(public_key_pem)
        (root / "payload.json").write_bytes(payload)
        (root / "signature.bin").write_bytes(signature)
        result = subprocess.run(["openssl", "pkeyutl", "-verify", "-rawin", "-pubin", "-inkey", str(root / "public.pem"), "-in", str(root / "payload.json"), "-sigfile", str(root / "signature.bin")], capture_output=True)
    return result.returncode == 0


def verify_manifest(manifest: dict, expected: dict, node_id: str, locus: str) -> tuple[bool, str]:
    required = {"schema", "manifestVersion", "declaredCanonicalUrl", "identity", "payloadHash", "signature"}
    if not required.issubset(manifest):
        return False, "manifest-missing-fields"
    if manifest["schema"] != "NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v1" or manifest["manifestVersion"] != "ATMOS-1.1.1":
        return False, "manifest-protocol-mismatch"
    if manifest["declaredCanonicalUrl"].rstrip("/") != locus.rstrip("/"):
        return False, "manifest-locus-mismatch"
    identity = manifest.get("identity") or {}
    public_key = identity.get("publicKeyPem")
    if not isinstance(public_key, str):
        return False, "manifest-public-key-missing"
    try:
        fingerprint = public_key_fingerprint(public_key)
    except Exception:
        return False, "manifest-public-key-invalid"
    if fingerprint != expected.get("publicKeyFingerprintSha256"):
        return False, "public-key-fingerprint-mismatch"
    unsigned = {key: value for key, value in manifest.items() if key not in {"signature", "payloadHash"}}
    if manifest.get("payloadHash") != expected.get("manifestPayloadSha256"):
        return False, "manifest-payload-hash-mismatch"
    if not verify_signature(public_key, canonical_json(unsigned), manifest["signature"]):
        return False, "manifest-signature-invalid"
    return True, "verified"


def verify_health(health: dict, manifest: dict, expected: dict) -> tuple[bool, str]:
    required = {"schema", "status", "manifestCid", "codeHash", "serviceSignature"}
    if not required.issubset(health):
        return False, "health-missing-fields"
    if health["schema"] != "NEXINUS_ATMOS_SIGNED_HEALTH/v1" or health["status"] != "ok":
        return False, "health-status-invalid"
    if health["manifestCid"] != "sha256:" + expected.get("manifestPayloadSha256", ""):
        return False, "health-manifest-cid-mismatch"
    if health["codeHash"] != "sha256:" + expected.get("artifactSha256", ""):
        return False, "health-artifact-hash-mismatch"
    unsigned = {key: value for key, value in health.items() if key != "serviceSignature"}
    public_key = (manifest.get("identity") or {}).get("publicKeyPem")
    if not isinstance(public_key, str) or not verify_signature(public_key, canonical_json(unsigned), health["serviceSignature"]):
        return False, "health-signature-invalid"
    return True, "verified"


def fetch_json(url: str, timeout: float) -> dict:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "ARCHANGEL-ATMOS-Verifier/2"})
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read(256 * 1024).decode("utf-8"))


def probe(node: dict, timeout: float) -> dict:
    locus = node.get("canonicalLocus")
    result = {**node, "verification": "unverified", "reason": "canonical-locus-missing"}
    if not locus:
        return result
    try:
        manifest = fetch_json(locus.rstrip("/") + "/.well-known/atmos-identity.json", timeout)
        manifest_ok, manifest_reason = verify_manifest(manifest, node, node["nodeId"], locus)
        if not manifest_ok:
            result["reason"] = manifest_reason
            return result
        health = fetch_json(locus.rstrip("/") + "/health", timeout)
        health_ok, health_reason = verify_health(health, manifest, node)
        result["verification"] = "verified" if health_ok else "unverified"
        result["reason"] = health_reason
        result["manifestPayloadSha256"] = node.get("manifestPayloadSha256")
        result["artifactSha256"] = node.get("artifactSha256")
    except HTTPError as error:
        result["reason"] = f"http-{error.code}"
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        result["reason"] = error.__class__.__name__
    except Exception as error:
        result["reason"] = f"probe-failed:{error.__class__.__name__}"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify public ATMOS-1.1.1 manifests and signed health responses")
    parser.add_argument("--registry", type=Path, default=Path("manifests/node-identity-registry.json"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--timeout", type=float, default=10)
    args = parser.parse_args()
    registry = json.loads(args.registry.read_text())
    report = {
        "protocol": "ARCHANGEL/identity-directory/2",
        "atmosProtocol": registry["protocol"],
        "verificationBoundary": registry["verificationBoundary"],
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "nodes": [probe(node, args.timeout) for node in registry["nodes"]],
    }
    report["counts"] = {
        "verified": sum(item["verification"] == "verified" for item in report["nodes"]),
        "unverified": sum(item["verification"] != "verified" for item in report["nodes"]),
    }
    encoded = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.write_text(encoded)
    print(encoded, end="")
    return 0 if report["counts"]["unverified"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
