# ARCHANGEL Sovereign Runtime Refactor Checklist

## Objective

Run ARCHANGEL on operator-controlled infrastructure without a Manus runtime, Manus telemetry, Manus OAuth, Manus storage, Manus API, or Manus-hosted node authority dependency. The UpCloud deployment is the production target. The control plane must boot, authenticate an operator, verify signed ATMOS evidence, and enforce bounded authority while disconnected from third-party service endpoints.

## Completed in this tranche

- [x] Removed the browser Manus debug collector and its `/__manus__/logs` development middleware.
- [x] Removed the hosted analytics script from `client/index.html`.
- [x] Removed the `vite-plugin-manus-runtime` development dependency and plugin registration.
- [x] Restricted Vite development hosts to localhost and loopback addresses.
- [x] Removed the browser OAuth entry point and preview session-storage bearer fallback.
- [x] Removed the unused Manus OAuth route module and SDK module.
- [x] Removed the unused Manus dialog component.
- [x] Removed the Manus storage proxy registration and module.
- [x] Made the shared logout procedure clear only the first-party ARCHANGEL operator cookie.
- [x] Removed `*.manus.space` from the integration endpoint authority policy.
- [x] Updated the endpoint policy to require HTTPS on the exact canonical sovereign hostname for the node.
- [x] Updated Valkyrie registry copy from Manus-hosted to sovereign-hosted.
- [x] Updated affected regression fixtures to use canonical Nexinus hostnames.
- [x] Preserved first-party scrypt authentication, durable operator credentials, session rotation, and optional WebAuthn/passkeys.

## Phase 1 — Build and source boundary

- [x] No active Manus references remain in `client`, `server`, `shared`, `package.json`, `vite.config.ts`, or `Dockerfile` after excluding historical documentation and evidence files.
- [x] TypeScript compilation passes.
- [x] Protected terminology guard passes.
- [ ] Add a CI guard that fails if active source reintroduces `manus.space`, `manus.im`, `__manus__`, `BUILT_IN_FORGE`, `VITE_FRONTEND_FORGE`, or Manus OAuth imports.
- [ ] Remove obsolete template-only dependencies after confirming no feature requires them.

## Phase 2 — Local service adapters

- [ ] Replace the Manus Forge LLM fallback with an explicit local Ollama adapter. Default endpoint: `http://127.0.0.1:11434`; no remote fallback.
- [ ] Make LLM unavailability fail closed and record a local audit event.
- [ ] Replace Manus image generation with a local adapter or remove the capability from the production build.
- [ ] Replace Manus voice transcription with local Whisper or remove the capability from the production build.
- [ ] Replace the Manus maps proxy with self-hosted geocoding/tiles or remove the map capability.
- [ ] Replace Manus notifications with local SMTP, local webhook relay, or an operator-visible local audit queue.
- [ ] Replace Manus heartbeat scheduling with a local systemd timer or application scheduler.
- [ ] Replace Manus storage with local filesystem or MinIO; do not expose `/manus-storage/*`.
- [ ] Document each adapter’s network destinations and default-deny behavior.

## Phase 3 — Data and deployment

- [ ] Use an UpCloud-managed MySQL/PostgreSQL database under operator credentials.
- [ ] Use operator-managed Redis on the private network for queues and rate limits.
- [ ] Run migrations from a reviewed release artifact, not from a hosted build service.
- [ ] Store secrets in `/root/archangel-production.env` or an operator-controlled secret manager with mode `0600`.
- [ ] Confirm the Docker image contains no `.env`, private key, API key, or Manus runtime asset.
- [ ] Build and scan the image locally on the UpCloud host.
- [ ] Use Caddy or Nginx only as the operator-controlled TLS reverse proxy.
- [ ] Confirm Caddy/Nginx routes exact ATMOS JSON paths before the SPA fallback.
- [ ] Keep `/health` fail-closed unless its signature binds the currently running artifact.

## Phase 4 — Network sovereignty

- [ ] Default outbound traffic to deny from the ARCHANGEL application container.
- [ ] Permit only DNS, certificate renewal if using a public CA, approved node endpoints, database, Redis, and operator administration.
- [ ] Verify no requests are sent to Manus, Forge, OAuth, analytics, or hosted storage domains.
- [ ] Verify no browser requests are sent to `/__manus__/*` or `/manus-storage/*`.
- [ ] Verify no endpoint allowlist accepts `*.manus.space`.
- [ ] Verify DNS records point to operator-controlled hosts.

## Phase 5 — Evidence and acceptance

- [ ] Verify `/.well-known/atmos-identity.json` returns signed JSON, not the React shell.
- [ ] Verify `/.well-known/atmos-artifact.json` returns the current artifact descriptor.
- [ ] Verify `/governance` returns the signed governance policy.
- [ ] Generate a new signed health receipt for the deployed artifact hash.
- [ ] Verify `/health` returns HTTP 200 only after the current artifact is signed.
- [ ] Run the two-device offline Pharo-Lapse test with the public internet disconnected.
- [ ] Run Gate 4 NOOP and bounded mutation tests with operator private keys kept off the server.
- [ ] Verify audit records capture source IP, operator identity, request hash, receipt hash, and verification result.
- [ ] Perform an offline boot test with all Manus-related environment variables absent.
- [ ] Produce a release manifest containing source commit, image digest, database migration set, and toolchain versions.

## Release blockers

The release is not sovereign-ready if any of the following are true:

1. A production code path calls a Manus, Forge, OAuth, analytics, or hosted-storage endpoint.
2. An unsigned or stale health response claims `status: ok` for the current artifact.
3. The integration endpoint validator accepts a non-canonical host or wildcard hosted domain.
4. Operator private keys are required by the server for external authorization.
5. ARCHANGEL cannot boot and authenticate while disconnected from third-party services.
6. The browser sends telemetry outside the operator-controlled origin.
