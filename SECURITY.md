# Security Policy

## Scope

This policy covers the ARCHANGEL control plane, ATMOS signed-evidence verification, direct node receipt intake, Tesseract-A witness intake, alignment tooling, and repository automation.

## Reporting a vulnerability

Please do not open a public issue for an unpatched security vulnerability. Contact the repository maintainers privately through the security contact configured for the GitHub repository, or through the operator-controlled project owner account. Include:

- affected commit, component, or deployment;
- a concise impact statement;
- reproducible steps or a minimal proof of concept;
- whether private-key material, credentials, or production data were exposed;
- any suggested mitigation and a safe contact channel.

Do not include private keys, `.env` files, passwords, session cookies, database URLs, or unredacted signed payloads in a report.

## Security invariants

- Private keys remain on their originating host and are never submitted to ARCHANGEL or committed to GitHub.
- Public-key fingerprints are compared before a node is treated as aligned.
- Signed receipts are challenge-bound, freshness-checked, and replay-protected.
- Direct node health evidence and Tesseract-A witness evidence remain separate.
- Pharo-Lapse forwards original signed evidence without silently changing or re-signing it.
- Unknown nodes, unapproved endpoints, malformed data, and missing configuration fail closed.
- Alignment tooling is read-only; it does not rotate keys, enroll nodes, send receipts, modify databases, or restart services.

## Supported versions

The default supported branch is the latest release on the repository's default branch. Operators should pin deployments to a reviewed commit or tag and retain the corresponding source, image, schema, and toolchain hashes.

## Disclosure process

Maintainers will acknowledge a valid report, reproduce it in an isolated environment, assess impact, prepare a fix and regression test, and coordinate disclosure after affected operators have a practical mitigation. Emergency issues involving active key compromise or production authorization bypass should be marked urgent in the private report.
