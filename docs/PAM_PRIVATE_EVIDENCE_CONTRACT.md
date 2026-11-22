# PAM private-path evidence contract

PAM is a local assistant, not an ATMOS node and not an authority. ARCHANGEL exposes one bounded endpoint:

```text
POST /v1/pam/evidence
```

The request must be exactly `NEXINUS_PAM_EVIDENCE_REQUEST/v1`:

```json
{
  "schema": "NEXINUS_PAM_EVIDENCE_REQUEST/v1",
  "requestId": "pam_<8-96 safe characters>",
  "target": "keira | valkyrie",
  "operation": "version | evidence",
  "requestedAt": "2026-11-22T22:00:00.000Z",
  "purpose": "human-readable retrieval purpose"
}
```

Only `keira` and `valkyrie` are accepted. There is no command, mutation, signing, enrollment, restart, or authorization field. Unknown fields are rejected.

A successful response is `NEXINUS_PAM_EVIDENCE_RESPONSE/v1` with `state: "FETCHED"`, `authority: "none"`, and `mutatesRemoteState: false`. If the caller is not explicitly allow-listed, the response is HTTP 403 with `state: "UNKNOWN"`. If the private endpoint is absent, invalid, unreachable, or returns a non-2xx response, the response is `state: "UNKNOWN"`; it is never treated as acceptance.

## Private-path configuration

The route is fail-closed until all of the following are explicitly configured on the ARCHANGEL host:

```text
PAM_CONSOLE_UTILITY_IP=<exact Sydney console utility IPv4 address>
PAM_KEIRA_EVIDENCE_URL=http://<private-keira-address>:<port>/<read-only-path>
PAM_VALKYRIE_EVIDENCE_URL=http://<private-valkyrie-address>:<port>/<read-only-path>
```

Configured endpoints must use HTTP(S) and a loopback or RFC1918 IPv4 address. Public endpoints are rejected. The route makes a bounded GET request with a three-second timeout and sends only `x-pam-request-id`; it does not forward prompts, private keys, operator credentials, or unpublished evidence by default.

The current source does not claim that either remote service is reachable. Endpoint configuration and firewall allowlisting require separate operator-controlled deployment work.

## Sydney console repair status

The supplied operator report identifies a syntax error in `/opt/tesseract-terminus/src/lib/pam-chat.server.ts` caused by an earlier patch. ARCHANGEL has not repaired that file because the Sydney host rejected the available SSH authentication with `Permission denied (publickey)`. No remote file, service, firewall, or model was changed.

After authenticated access is available, the repair must be performed on the Sydney console by the operator, using the host's existing repository history or the documented backup. The repair is not complete until the repository status and the project’s own type/build checks are clean. Do not replace `pam-core`, restart the service, or allow KEIRA traffic before that validation.
