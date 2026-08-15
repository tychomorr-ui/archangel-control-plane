#!/usr/bin/env python3
"""Exercise revised ARCHANGEL admission identities without live infrastructure.

The test creates temporary Root-Gate and node key material, then drives the
real admission-generator and node-acceptance programs for the planned
N. Virginia Root-Gate and active Debian Monarch-OS (logical Kether-Gate) peers.
No data is sent to a Lightsail host and all temporary keys are deleted.
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
CREATE_ADMISSION = PROJECT / "launch" / "create-archangel-node-admission.py"
ACCEPT_ADMISSION = PROJECT / "launch" / "accept-archangel-node-admission.py"


def command(*parts: str, cwd: Path) -> None:
    subprocess.run(list(parts), cwd=cwd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def public_der_b64_and_fingerprint(public_key: Path, cwd: Path) -> tuple[str, str]:
    public_der = subprocess.run(
        ["openssl", "pkey", "-pubin", "-in", str(public_key), "-outform", "DER"],
        cwd=cwd,
        check=True,
        capture_output=True,
    ).stdout
    return base64.b64encode(public_der).decode("ascii"), hashlib.sha256(public_der).hexdigest()


def exercise(node_id: str, role: str, address: str, workdir: Path, root_private: Path, root_public: Path) -> dict:
    node_private = workdir / f"{node_id}-status-private.pem"
    node_public = workdir / f"{node_id}-status-public.pem"
    command("openssl", "genpkey", "-algorithm", "ED25519", "-out", str(node_private), cwd=workdir)
    command("openssl", "pkey", "-in", str(node_private), "-pubout", "-out", str(node_public), cwd=workdir)
    status_key, status_fingerprint = public_der_b64_and_fingerprint(node_public, workdir)
    manifest = workdir / f"{node_id}-manifest.json"
    manifest.write_text(json.dumps({
        "protocol": "ARCHANGEL/1",
        "kind": "node-enrollment-request",
        "node_id": node_id,
        "role": role,
        "overlay_address": address,
        "wireguard_public_key": "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdEFg=",
        "status_ed25519_public_key_der_b64": status_key,
        "status_ed25519_public_key_sha256": status_fingerprint,
    }), encoding="utf-8")
    admission = workdir / f"{node_id}-admission.json"
    acknowledgement = workdir / f"{node_id}-acknowledgement.json"
    command(
        "python3", str(CREATE_ADMISSION), "--node-manifest", str(manifest),
        "--root-private-key", str(root_private), "--root-public-key", str(root_public),
        "--output", str(admission), cwd=workdir,
    )
    command(
        "python3", str(ACCEPT_ADMISSION), "--admission", str(admission),
        "--root-public-key", str(root_public), "--node-manifest", str(manifest),
        "--node-status-private-key", str(node_private), "--node-status-public-key", str(node_public),
        "--output", str(acknowledgement), cwd=workdir,
    )
    admission_payload = json.loads(admission.read_text(encoding="utf-8"))["payload"]
    acknowledgement_payload = json.loads(acknowledgement.read_text(encoding="utf-8"))["payload"]
    assert admission_payload["node_id"] == node_id
    assert admission_payload["role"] == role
    assert admission_payload["overlay_address"] == address
    assert acknowledgement_payload["admission_id"] == admission_payload["admission_id"]
    assert acknowledgement_payload["challenge_id"] == admission_payload["challenge_id"]
    return {"node_id": node_id, "role": role, "overlay_address": address, "admission_id": admission_payload["admission_id"]}


def main() -> None:
    workdir = Path(tempfile.mkdtemp(prefix="archangel-revised-admission-"))
    try:
        root_private = workdir / "root-private.pem"
        root_public = workdir / "root-public.pem"
        command("openssl", "genpkey", "-algorithm", "ED25519", "-out", str(root_private), cwd=workdir)
        command("openssl", "pkey", "-in", str(root_private), "-pubout", "-out", str(root_public), cwd=workdir)
        results = [
            exercise("root-gate", "sovereign-identity", "10.42.0.11/32", workdir, root_private, root_public),
            exercise("kether-gate", "monarch-os", "10.42.0.14/32", workdir, root_private, root_public),
            exercise("iwa-sage", "indigenous-wellness-alliance", "10.42.0.18/32", workdir, root_private, root_public),
            exercise("resonate-earth", "planetary-witness", "10.42.0.19/32", workdir, root_private, root_public),
            exercise("exitus-lens", "read-only-evidence-inspection", "10.42.0.20/32", workdir, root_private, root_public),
        ]
        print(json.dumps({"verified": True, "identities": results}, separators=(",", ":")))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main()
