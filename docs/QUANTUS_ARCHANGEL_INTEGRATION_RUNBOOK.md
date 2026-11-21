# Quantus ↔ ARCHANGEL Integration Runbook

**Current state:** planned witness; public-key pin confirmed; not an active ARCHANGEL integration.  
**Quantus endpoint:** `https://quantus.nexinus.net`  
**Node identity:** `QUANTUS` / route ID `quantus`  
**Status contract:** `QUANTUS_WITNESS_STATUS/v1`  
**Receipt contract:** `QUANTUS_SIGNED_WITNESS_RECEIPT/v1`

## Promotion gate

Quantus must not be promoted to an ATMOS canonical node or active ARCHANGEL integration until the Quantus agent supplies a real signed ATMOS manifest and a real artifact hash. The already confirmed key fingerprint is:

```text
c3e9568197203345e7094734515fd02e1a2ddfe3606e282541027d2bda70e9b7
```

The required public evidence is:

```text
nodeId: QUANTUS
canonicalEndpoint: https://quantus.nexinus.net
publicKeyFingerprintSha256: c3e9568197203345e7094734515fd02e1a2ddfe3606e282541027d2bda70e9b7
manifestKind: NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v1
protocol: ATMOS-1.1.1
manifestPayloadSha256: sha256:<real-digest>
artifactSha256: sha256:<real-digest>
manifestSignature: <redacted in reports; verified from the pinned public key>
status: VERIFIED only after independent verification
```

Do not fill either digest with a placeholder. A valid Quantus status signature alone remains artifact-unbound.

## Dedicated receipt contract

Quantus does not submit through the direct node-health receipt route. The dedicated receipt is challenge-bound and signs the canonical JSON of every field except `signature`:

```json
{
  "schema": "QUANTUS_SIGNED_WITNESS_RECEIPT/v1",
  "witnessNodeId": "quantus",
  "applicationId": "quantus",
  "challengeId": "wch_...",
  "nonce": "...",
  "issuedAt": "2026-11-21T00:00:00.000Z",
  "expiresAt": "2026-11-21T00:05:00.000Z",
  "status": "READY",
  "statusSchema": "QUANTUS_WITNESS_STATUS/v1",
  "statusPayloadHash": "sha256:<hash of raw signed status body>",
  "manifestPayloadSha256": "sha256:<verified manifest payload>",
  "artifactSha256": "sha256:<verified artifact>",
  "publicKeyFingerprintSha256": "c3e9568197203345e7094734515fd02e1a2ddfe3606e282541027d2bda70e9b7",
  "boundary": "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY",
  "signature": "base64url-ed25519-signature"
}
```

`READY` and `DEGRADED` are authentic signed statuses; neither grants deployment, shell, firewall, credential, adjudication, or arbitrary mutation authority. The raw status body is hashed before parsing so numeric representation and signed bytes remain intact.

The deterministic contract implementation is `shared/quantusWitness.ts`, with test coverage in `server/quantusWitness.test.ts`. This is contract/vector coverage; a production Quantus intake route remains a separate reviewed change and must not be inferred from this test.

## Safe source deployment to ARCHANGEL

These commands deploy the reviewed source to the UpCloud ARCHANGEL host as a staged candidate. They do not recreate secrets, modify the database, or expose a new public port. Replace only `RELEASE` after reviewing the GitHub commit.

From the operator workstation:

```bash
set -euo pipefail
export ARCHANGEL_HOST='94.237.74.250'
export RELEASE='95dcc6b'
ssh root@"$ARCHANGEL_HOST" "install -d -m 0755 /opt/archangel/releases/archangel-$RELEASE"
ssh root@"$ARCHANGEL_HOST" "git clone --no-checkout https://github.com/tychomorr-ui/archangel-control-plane.git /opt/archangel/releases/archangel-$RELEASE/repo"
ssh root@"$ARCHANGEL_HOST" "cd /opt/archangel/releases/archangel-$RELEASE/repo && git checkout $RELEASE && pnpm install --frozen-lockfile && pnpm check && pnpm test && pnpm build"
```

If the release directory already exists, do not overwrite it blindly. Verify its commit first:

```bash
ssh root@94.237.74.250 'git -C /opt/archangel/releases/archangel-95dcc6b/repo rev-parse HEAD'
```

Build a candidate image while preserving the existing environment file. Never copy `/root/archangel-production.env` into Git or into the source tree:

```bash
ssh root@94.237.74.250 <<'REMOTE'
set -euo pipefail
RELEASE='95dcc6b'
APP="/opt/archangel/releases/archangel-${RELEASE}/repo"
ENV_FILE='/root/archangel-production.env'
test -s "$ENV_FILE"
test "$(git -C "$APP" rev-parse HEAD)" = "$RELEASE"
docker build --tag "archangel-console:${RELEASE}" "$APP"
docker rm -f archangel-quantus-candidate 2>/dev/null || true
docker run --detach \
  --name archangel-quantus-candidate \
  --network archangel-net \
  --publish 127.0.0.1:3002:3000 \
  --env-file "$ENV_FILE" \
  --restart=no \
  "archangel-console:${RELEASE}"
sleep 3
curl --fail --silent http://127.0.0.1:3002/api/trpc/system.health \
  --get --data-urlencode 'input={"json":{"timestamp":0}}'
printf '\n'
docker logs --tail=80 archangel-quantus-candidate
REMOTE
```

Only after the candidate health response and logs are reviewed should the operator use the existing host promotion procedure to make this image active. Preserve the current container and Caddy configuration as rollback points. Do not run `db:push`; this source change does not authorize a production migration.

## Quantus host handoff boundary

The Quantus agent must run its own verifier on `95.111.215.92`, keep `/etc/quantus/identity/witness-private.pem` on that host, and return only:

1. the signed ATMOS manifest JSON with the signature intact;
2. the independently verified `manifestPayloadSha256`;
3. the independently verified `artifactSha256`;
4. the exact running commit/image digest that the artifact hash covers;
5. a redacted `QUANTUS_WITNESS_STATUS/v1` response and its raw-body hash;
6. the result of the deterministic receipt-vector test;
7. confirmation that no private key was transferred.

ARCHANGEL should then verify the manifest and artifact binding independently before any registry promotion or active integration registration.
