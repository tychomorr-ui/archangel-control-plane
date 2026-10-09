# ARCHANGEL Central Identity Directory

## Purpose

Use the existing ARCHANGEL Manus WebDev project as the **central identity directory**. The operator registers each project once; ARCHANGEL stores the declared public locus and periodically probes:

```text
https://PROJECT_HOST/.well-known/atmos-identity.json
```

This means the operator does not need to spend credits opening and editing every project merely to maintain a registry. A project is marked **cryptographically verified** only when it independently publishes a valid signed manifest. A URL entered into the central directory is never treated as proof by itself.

## Three trust states

| State | Meaning | What it proves |
|---|---|---|
| `declared` | Operator supplied the project name and URL | A planning record exists |
| `reachable` | The URL responds, but no valid signed manifest was found | Public reachability only |
| `verified` | The project returned a valid ATMOS/1 manifest with the expected node ID, locus, hash, and Ed25519 signature | The project controls the registered public key and published the signed identity |

The central directory can verify all projects that already expose manifests. It cannot manufacture independent proof for applications that do not publish a manifest or signed receipt. A central ARCHANGEL-signed copy would be an **owner attestation**, not an independent application identity.

## What is already implemented

- `manifests/node-identity-registry.json` — all 11 declared nodes and their current URL/source status.
- `launch/verify-node-directory.py` — public HTTPS probe and ATMOS signature verifier.
- `launch/atmos-identity.py` — project-side manifest generator and verifier.
- `docs/ARCHANGEL_NODE_IDENTITY_MANIFESTS.md` — per-project contract and onboarding instructions.

Run a directory verification report:

```bash
python3 launch/verify-node-directory.py \
  --registry manifests/node-identity-registry.json \
  --output /tmp/archangel-identity-report.json
```

The report never stores private keys and never writes to the projects being checked.

## Recommended Manus workflow

1. Keep the central directory and verifier in ARCHANGEL.
2. For each project already accessible without additional build credits, add its own manifest when convenient.
3. For projects that cannot currently be edited, register their URL as `declared` or `reachable`, never `verified`.
4. When a project is later published with a manifest, rerun the central verifier; no ARCHANGEL code change is required.
5. Only after a manifest is verified should ARCHANGEL accept that project's signed runtime receipt public key for health evidence.

## Why this is the best no-credit solution

- One Manus-hosted control-plane project owns the directory and verification UI.
- The public `.manus.space` sites remain valid targets.
- No browser takeover or per-project editing is required for central inventory.
- Cryptographic claims remain honest and auditable.
- The system can gradually upgrade a node from `declared` to `reachable` to `verified` as source access becomes available.

## Important limitation

A central service cannot prove that an arbitrary public site is the application it claims to be unless the site publishes a signed identity or provides an authenticated challenge response. DNS, HTML title, URL ownership, and a manually entered public key are useful metadata but are not equivalent to a node-generated cryptographic proof.
