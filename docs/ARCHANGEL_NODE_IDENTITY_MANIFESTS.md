# ARCHANGEL per-node identity manifests

Each project publishes its own signed identity manifest at:

```text
https://<project-host>/.well-known/atmos-identity.json
```

A `.manus.space` deployment is a valid public host. It is not a writable filesystem: the manifest must be added to that project's source under `public/.well-known/` or `client/public/.well-known/`, then redeployed.

## Manifest contract

The manifest is an `ATMOS/1` signed envelope:

```json
{
  "canonicalLocus": "https://project.manus.space",
  "capabilities": ["health.receipt"],
  "identityHash": "sha256:<64 lowercase hex characters>",
  "issuedAt": "2026-10-08T00:00:00Z",
  "kind": "identity-manifest",
  "nodeId": "project-node-id",
  "protocol": "ATMOS/1",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
  "signature": "base64url-ed25519-signature"
}
```

`identityHash` is SHA-256 over the canonical JSON of `canonicalLocus`, sorted `capabilities`, `kind`, `nodeId`, `protocol`, and `publicKey`. The signature is Ed25519 over the canonical JSON of the full manifest excluding `signature`. The generator uses sorted keys, compact separators, and ASCII JSON. Each project must have its **own keypair**; never reuse the Valkyrie key for another node.

## Per-node inventory

| Node | Application | Public locus | Manifest status | Required action |
|---|---|---|---|---|
| `root-gate` | Root-Gate | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `tesseract-terminus` | Sovereign Provenance Console | `https://tesseract.manus.space` supplied in project notes | Pending | Confirm this is the canonical deployment, then publish manifest |
| `xinus-clarity` | XinUS-Clarity | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `kether-gate` | Monarch-OS | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `tesseract-a` | Tesseract-A | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `keira` | KEIRA | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `project-reclaim` | Project Reclaim | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `iwa-sage` | IWA Sage | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `resonate-earth` | Resonate Earth | `https://resonateearth.live` supplied in project notes | Pending | Confirm the live project source and canonical HTTPS locus, then publish manifest |
| `exitus-lens` | Exitus Lens | Not supplied | Pending | Attach source and exact public URL; generate keypair and publish manifest |
| `valkyrie-adjudication-entity` | VALKYRIE Adjudication Entity | `https://xinusdash-doy5g86k.manus.space` | Registered in ARCHANGEL; manifest not yet published | Add the generated project-owned manifest to the Valkyrie source and redeploy |

No missing URL or source repository is invented by this package. A node remains `pending` until its manifest is fetched from the declared canonical locus and verified against the expected node ID.

## Per-project onboarding

1. Open or check out the individual project with edit/publish access.
2. Generate a unique Ed25519 keypair using `launch/atmos-identity.py`.
3. Store the private key only in that project's server-side secret store. Do not commit it and do not place it under `public/`.
4. Write the generated manifest to `public/.well-known/atmos-identity.json`.
5. Redeploy the project.
6. Verify the public artifact:

```bash
curl --fail --silent --show-error -L \
  -H 'Accept: application/json' \
  https://PROJECT.manus.space/.well-known/atmos-identity.json \
  > /tmp/atmos-identity.json
python3 launch/atmos-identity.py verify \
  --manifest /tmp/atmos-identity.json \
  --node-id NODE_ID \
  --canonical-locus https://PROJECT.manus.space
```

7. Register the verified public key and identity hash in ARCHANGEL. Do not issue a health receipt until the application also has a server-side receipt emitter using that same project-owned private key.

## Example generation

```bash
umask 077
python3 launch/atmos-identity.py generate \
  --node-id valkyrie-adjudication-entity \
  --canonical-locus https://xinusdash-doy5g86k.manus.space \
  --private-key /srv/valkyrie/secrets/atmos-ed25519-private.pem \
  --manifest ./public/.well-known/atmos-identity.json \
  --capability health.receipt
```

The command prints only public metadata. It never prints the private key.

## Initial public discovery

As of 2026-10-09 UTC, no valid manifest was accepted from the supplied public loci: `tesseract.manus.space` timed out during the probe, `resonateearth.live` did not resolve, and `xinusdash-doy5g86k.manus.space/.well-known/atmos-identity.json` returned the application HTML shell rather than JSON. These are discovery results only; no project was modified. Valkyrie still requires its source project to publish the generated manifest.
