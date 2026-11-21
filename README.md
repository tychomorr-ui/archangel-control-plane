# ARCHANGEL

ARCHANGEL is a sovereign, operator-controlled fleet operations control plane for the ATMOS environment. It verifies node identity and signed health evidence, records auditable outcomes, and keeps bounded orchestration separate from arbitrary remote execution.

## Canonical terminology

- **ARCHANGEL** — the control plane and audit authority.
- **ATMOS** — the signed identity and evidence environment, currently `ATMOS-1.1.1`.
- **Pharo-Lapse** — the offline/queued transport concept for forwarding original signed evidence without mutation or re-signing.
- **Tesseract-A Core** — a separately keyed verifier/witness coordinator; its private witness key remains on its originating host.
- **Quantus** — an independent witness role. It is planned until a reviewed canonical identity, endpoint, public key, and contract exist.

## Security boundary

Private keys never enter ARCHANGEL, GitHub, a browser, or a ticket. Nodes sign locally; ARCHANGEL stores public keys and verifies challenge-bound receipts. Tesseract-A Core signs its own witness receipts locally, and ARCHANGEL verifies the resulting `TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1` contract through a dedicated intake separate from direct node health.

The system is fail-closed: a missing integration, unknown node ID, stale challenge, key fingerprint mismatch, malformed receipt, replay, or unapproved endpoint is rejected rather than treated as healthy.

## Repository layout

```text
client/                         Operator console
server/                         ARCHANGEL API, receipt intake, witness verification
shared/                         Canonical ATMOS and ARCHANGEL registries
docs/                           Security, synchronization, and deployment runbooks
launch/                         Read-only alignment and bounded submission tools
manifests/                      Public identity and alignment metadata
drizzle/                        Database schema and reviewed migrations
```

## Local validation

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The terminology guard rejects protected-protocol drift. Do not add private keys, `.env` files, production database dumps, or unredacted signatures to this repository.

## Alignment checks

Run the checker from each node's own host or trusted checkout. It performs read-only checks for the exact canonical node ID, ATMOS protocol markers, protected terminology, public-key fingerprint binding, and optional endpoint evidence. It never copies keys or sends a receipt.

```bash
node launch/archangel-align-node.mjs \
  --node-id valkyrie-adjudication-entity \
  --repo /opt/valkyrie/current \
  --private-key /etc/valkyrie/identity/receipt-private.pem \
  --probe-endpoint
```

For Tesseract-A Core, add `--verifier` to check its witness contract and local verifier scripts:

```bash
node launch/archangel-align-node.mjs \
  --node-id tesseract-a \
  --repo /opt/tesseract-a-core \
  --private-key /etc/tesseract-a/identity/witness-private.pem \
  --verifier
```

Quantus is intentionally reported as `PLANNED_NOT_CANONICAL` until its reviewed registry entry exists:

```bash
node launch/archangel-align-node.mjs --node-id quantus --repo /opt/quantus --allow-planned
```

The full operator procedure is in [`docs/ARCHANGEL_ALIGNMENT_RUNBOOK.md`](docs/ARCHANGEL_ALIGNMENT_RUNBOOK.md).

## License and reporting

ARCHANGEL is released under the MIT License. Security issues should be reported privately according to [`SECURITY.md`](SECURITY.md), not opened as public issues before remediation coordination.
