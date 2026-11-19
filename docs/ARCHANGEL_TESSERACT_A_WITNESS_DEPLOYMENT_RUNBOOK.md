# ARCHANGEL · Tesseract-A Witness Deployment Runbook

This runbook deploys Tesseract-A Core as a local probe-and-witness adapter. It does not merge Tesseract-A source into ARCHANGEL, expose the probe API publicly, or grant node mutation authority.

## Boundary

- Tesseract-A probes configured node endpoints and signs only verified observations.
- The witness private key remains on the UpCloud host at `/etc/tesseract-a/keys/witness-private.pem`.
- ARCHANGEL stores only the public PEM, its SHA-256 SPKI/DER fingerprint, endpoint metadata, and the bounded `witness:health` scope.
- ARCHANGEL issues a short-lived challenge; Tesseract-A binds the challenge into its signed receipt; ARCHANGEL verifies the receipt and stores isolated witness evidence.
- Direct ATMOS node health receipts and Tesseract-A witness receipts remain separate evidence classes.

## 1. Prepare the host

Copy the reviewed Tesseract-A Core source to `/opt/tesseract-a-core` and create a real, reviewed production node configuration at `/opt/tesseract-a-core/config/nodes.json`. Do not copy the example file without replacing every placeholder, public-key path, endpoint, manifest hash, and artifact hash.

The configuration must reference public keys only. Never place a node private key in `nodes.json`.

## 2. Provision the local service

From the ARCHANGEL source checkout, copy `launch/deploy-tesseract-a-witness.sh` to the UpCloud host and run it as root:

```bash
sudo bash /path/to/deploy-tesseract-a-witness.sh
```

The script:

1. refuses to run without the reviewed source and `config/nodes.json`;
2. creates an Ed25519 witness key only if `/etc/tesseract-a/keys/witness-private.pem` does not already exist;
3. derives the public PEM and prints only the public PEM and SHA-256 fingerprint;
4. writes a root-readable environment file without private-key contents in shell output;
5. installs a loopback-only Tesseract-A systemd service;
6. verifies `GET http://127.0.0.1:4170/api/status`.

The service must not be published through Caddy or any public firewall rule. The bounded ARCHANGEL adapter calls it locally on the same host.

## 3. Register the public key in ARCHANGEL

Use the authenticated ARCHANGEL operator console’s integration registration flow with these values:

```text
applicationId: tesseract-a
nodeId:        tesseract-a
endpointUrl:   http://127.0.0.1:4170
publicKeyPem:  the public PEM printed by the provisioning script
scopes:        ["witness:health"]
```

Verify that the displayed fingerprint equals the provisioning script’s SHA-256 line. Do not submit a private PEM, API credential, or complete environment file.

The registration mutation is operator-protected and records an audit event. It does not issue node credentials and does not activate remote execution.

## 4. Execute one bounded witness flow

After registration, run from the ARCHANGEL checkout on the same host as Tesseract-A:

```bash
node launch/submit-tesseract-a-witness-receipt.mjs \
  https://archangel.nexinus.net \
  http://127.0.0.1:4170
```

The adapter performs exactly this sequence:

```text
ARCHANGEL challenge
  -> Tesseract-A loopback probe/sign endpoint
  -> ARCHANGEL witness receipt intake
```

The output must show the challenge ID, registered public-key fingerprint, probe result count, verified result count, receipt hash, and ARCHANGEL acceptance response. It must not print the witness signature or private key.

## 5. Verify locally

```bash
systemctl is-active tesseract-a-core
curl --fail --silent http://127.0.0.1:4170/api/status | jq .
node launch/submit-tesseract-a-witness-receipt.mjs \
  https://archangel.nexinus.net \
  http://127.0.0.1:4170
```

A successful ARCHANGEL response uses the dedicated witness schema and evidence path. A direct node receipt endpoint must not be used for this witness contract.

## Failure handling

- `WITNESS_SIGNING_NOT_CONFIGURED`: the local private-key path is absent or unreadable; do not paste a key into chat or ARCHANGEL.
- Fingerprint mismatch: stop. The registered public key does not correspond to the local private key. Do not rotate blindly.
- `receipt_invalid`: inspect the challenge expiry, observation-set hash, canonicalization, and public-key match. Do not retry a used challenge.
- No verified observations: Tesseract-A must return a fail-closed witness result; ARCHANGEL must not record a successful witness receipt.
- Public reachability of port 4170: remove the exposure immediately. The witness endpoint is a local adapter boundary, not a public API.

## Production status

This repository contains the deployment and adapter scripts, but they are not executed against UpCloud by the sandbox. Production provisioning, key generation, public-key registration, and the first live witness receipt require execution on the actual UpCloud host with the real reviewed node configuration.
