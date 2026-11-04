# ARCHANGEL first-party operator authentication

ARCHANGEL no longer depends on Manus OAuth for operator-console access. The console uses a server-side operator credential and an HttpOnly, SameSite, Secure signed session cookie.

## Configuration

Required project secret:

- `ARCHANGEL_OPERATOR_PASSWORD_HASH` — scrypt format `scrypt$N$r$p$saltHex$derivedKeyHex`.

Optional non-secret environment values:

- `ARCHANGEL_OPERATOR_USERNAME` — defaults to `operator`.
- `ARCHANGEL_OPERATOR_NAME` — defaults to `ARCHANGEL Operator`.
- `ARCHANGEL_OPERATOR_SESSION_TTL_SECONDS` — defaults to 8 hours.

The password is never sent to the browser except over the login request, is never stored in the database, and is never logged. The server verifies it with scrypt and constant-time comparison. The session is signed with the existing server cookie secret and is marked HttpOnly.

## Routes

- `GET /api/auth/local/config` — non-secret enabled/username status.
- `POST /api/auth/local/login` — accepts `{ username, password }`, sets the signed local session cookie.
- `POST /api/auth/local/logout` — clears the local session cookie.

The protected tRPC context accepts only a valid local ARCHANGEL session. Manus OAuth is not registered as a server route and is not used as an authentication fallback.

## Verification

The first-party auth unit test passed, and the full ARCHANGEL suite passed 52/52 after the cutover. The live preview renders the ARCHANGEL operator ID/passphrase form and labels the session as `ARCHANGEL local auth verified` after login.
