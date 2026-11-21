# ARCHANGEL Alignment Runbook

**Status:** operator-controlled, read-only alignment procedure  
**Control plane:** ARCHANGEL  
**Environment:** ATMOS-1.1.1  
**Transport:** Pharo-Lapse

This runbook verifies whether a node checkout or runtime is aligned with the public ARCHANGEL contract. It does not enroll a node, change a database, rotate a key, restart a service, or submit a receipt.

## Alignment means

A target is aligned only when the exact node identity, protocol markers, protected terminology, local verifier contract, and public-key binding agree with ARCHANGEL. A successful TCP or HTTPS response is not cryptographic proof. A receipt is not submitted by this tool.

The private key remains on the originating host. The checker derives and prints only a SHA-256 fingerprint of the public half. Use the checker on Quantus, KEIRA, VALKYRIE, and Tesseract Mirror hosts, and use `--verifier` for the Tesseract-A Core checkout.

## Install the checker without copying keys

From a reviewed ARCHANGEL checkout, transfer only the public checker script and target metadata:

```bash
scp launch/archangel-align-node.mjs root@NODE_HOST:/usr/local/sbin/archangel-align-node.mjs
scp manifests/archangel-alignment-targets.json root@NODE_HOST:/etc/archangel-alignment-targets.json
ssh root@NODE_HOST 'chmod 0755 /usr/local/sbin/archangel-align-node.mjs'
```

Do not transfer a private key, `.env` file, database dump, or shell history.

## Run on each project

```bash
set -euo pipefail

node /usr/local/sbin/archangel-align-node.mjs \
  --node-id valkyrie-adjudication-entity \
  --repo /opt/valkyrie/current \
  --private-key /etc/valkyrie/identity/receipt-private.pem \
  --probe-endpoint \
  --json
```

For KEIRA:

```bash
node /usr/local/sbin/archangel-align-node.mjs \
  --node-id keira \
  --repo /opt/keira/current \
  --private-key /etc/keira/identity/receipt-private.pem \
  --probe-endpoint \
  --json
```

For Tesseract Mirror and Tesseract-A Core:

```bash
node /usr/local/sbin/archangel-align-node.mjs \
  --node-id tesseract-a \
  --repo /opt/tesseract-a-core \
  --private-key /etc/tesseract-a/identity/witness-private.pem \
  --verifier \
  --probe-endpoint \
  --json
```

The `--verifier` check requires the local project to expose the signed witness contract marker, the witness key environment name, and the expected `check`, `test`, and `validate:startup` package scripts. It does not execute those scripts; run them separately under the project's own change control.

For Quantus, the correct result is currently planned/unregistered. Do not invent an endpoint, fingerprint, or application ID:

```bash
node /usr/local/sbin/archangel-align-node.mjs \
  --node-id quantus \
  --repo /opt/quantus \
  --allow-planned \
  --json
```

Without `--allow-planned`, an unregistered target exits non-zero. That is intentional: “aligned” cannot mean “silently admitted.” Quantus becomes eligible only after a reviewed registry change defines its exact identity, endpoint, public key, evidence contract, and lifecycle.

## Results and disposition

The report includes:

- `identity`: exact canonical or planned status;
- `protocol`: ATMOS version and receipt markers;
- `terminology`: protected names and forbidden historical aliases;
- `keyBinding`: derived public fingerprint, if a local key was supplied, compared to the registry;
- `verifier`: Tesseract-A witness-contract checks when requested;
- `endpoint`: optional read-only endpoint status;
- `overall`: `ALIGNED`, `PLANNED_NOT_CANONICAL`, or `FAILED`.

A `FAILED` result is a hard stop. Do not rotate a key or edit the registry to make a result pass. Compare the exact node ID, local runtime key, manifest, and source commit first. A `PLANNED_NOT_CANONICAL` result is expected for Quantus until the operator approves and releases a canonical entry.

## Final operator record

For each run, retain the redacted JSON report with:

```text
node_id:
project_path:
source_commit:
checker_sha256:
protocol:
overall:
derived_public_fingerprint:
endpoint_status:
verifier_contract_status:
operator:
observed_at_utc:
```

Never retain private-key contents or unredacted signatures. Alignment is a prerequisite to enrollment; it is not enrollment itself.
