# ARCHANGEL operator security

ARCHANGEL uses first-party operator authentication. The configured operator ID is `Tyler-Morris`; the passphrase is represented only by a server-side scrypt hash.

## Password rotation

After signing in, open **Manage security** in the operator panel. Enter the current passphrase, a new passphrase of at least 14 characters, and the confirmation. ARCHANGEL verifies the current credential, writes the new salted scrypt hash to the durable `operator_credentials` table, increments the session version, issues a fresh session for the current browser, and invalidates other active sessions.

No plaintext passphrase is logged or stored. The old environment hash remains only as the bootstrap fallback for a database with no operator credential row; after the first successful login, the durable row is authoritative.

## Passkeys

Passkeys use WebAuthn through `@simplewebauthn/server` and `@simplewebauthn/browser`. Registration requires an authenticated session and re-entry of the current passphrase. The server creates a five-minute, one-time challenge, requires user verification, stores only the credential ID, public key, counter, and transports, and rejects replayed or expired challenges.

On a supported laptop, **Register this device passkey** can bind a platform authenticator such as Windows Hello, Touch ID, a device PIN, or the browser’s passkey provider. On subsequent sign-ins, **Use passkey** invokes the platform authenticator; ARCHANGEL never receives the laptop passcode or biometric data.

The WebAuthn relying-party ID defaults to the request hostname. For a fixed production deployment, set:

- `ARCHANGEL_WEBAUTHN_RP_ID` — the registrable production hostname.
- `ARCHANGEL_WEBAUTHN_ORIGIN` — the exact HTTPS origin used by operators.
- `ARCHANGEL_WEBAUTHN_ENABLED=false` — optional emergency disable switch.

## Abuse controls

Failed password attempts are rate-limited per client address: eight attempts within fifteen minutes triggers a temporary rejection window. Error messages distinguish actionable conditions without revealing whether a username exists or which credential component failed.

Validation: TypeScript checks pass and the full ARCHANGEL suite passes 54/54 tests.
