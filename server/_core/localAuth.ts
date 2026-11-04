import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { SignJWT, jwtVerify } from "jose";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

export const LOCAL_AUTH_COOKIE = "archangel_operator_session";
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type LocalSession = { username: string; name: string; role: "admin"; sessionVersion: number };
type AttemptState = { count: number; firstAttemptAt: number };
const attempts = new Map<string, AttemptState>();

function secretKey() { return new TextEncoder().encode(ENV.cookieSecret); }
function configuredUsername() { return process.env.ARCHANGEL_OPERATOR_USERNAME?.trim() || "operator"; }
function configuredName() { return process.env.ARCHANGEL_OPERATOR_NAME?.trim() || "ARCHANGEL Operator"; }
function configuredPasswordHash() { return process.env.ARCHANGEL_OPERATOR_PASSWORD_HASH?.trim() || ""; }
function configuredBootstrapPassword() { return process.env.ARCHANGEL_OPERATOR_PASSWORD || ""; }
function configuredRpId(req: Request) { return process.env.ARCHANGEL_WEBAUTHN_RP_ID?.trim() || req.hostname; }
function configuredOrigin(req: Request) { return process.env.ARCHANGEL_WEBAUTHN_ORIGIN?.trim() || `${req.protocol}://${req.get("host")}`; }
function clientAddress(req: Request) { return req.ip || req.socket.remoteAddress || "unknown"; }
function toBytes(value: string) { return new Uint8Array(Buffer.from(value, "base64url")); }
function toBase64Url(value: Uint8Array) { return Buffer.from(value).toString("base64url"); }

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now });
    return false;
  }
  current.count += 1;
  return current.count > MAX_LOGIN_ATTEMPTS;
}
function clearFailedAttempts(key: string) { attempts.delete(key); }

/** Format: scrypt$N$r$p$saltHex$derivedKeyHex. Never store a plaintext password. */
export function verifyPasswordHash(password: string, encoded: string): boolean {
  if (!encoded || !password) return false;
  // Backward-compatible bootstrap only: the prior secret configuration stored
  // a bare SHA-256 digest. A successful login is immediately upgraded to
  // salted scrypt in the durable credential row below.
  if (/^[a-f0-9]{64}$/i.test(encoded)) {
    const actual = createHash("sha256").update(password, "utf8").digest();
    const expected = Buffer.from(encoded, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  }
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]); const r = Number(parts[2]); const p = Number(parts[3]);
  if (!Number.isSafeInteger(N) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || N < 1024 || r < 1 || p < 1) return false;
  try {
    const salt = Buffer.from(parts[4], "hex"); const expected = Buffer.from(parts[5], "hex");
    if (salt.length < 16 || expected.length < 16) return false;
    const actual = scryptSync(password, salt, expected.length, { N, r, p, maxmem: Math.max(32 * 1024 * 1024, 128 * N * r + 1024) });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function verifyOperatorPassword(password: string): boolean {
  const bootstrapPassword = configuredBootstrapPassword();
  if (bootstrapPassword) return password.length === bootstrapPassword.length && timingSafeEqual(Buffer.from(password), Buffer.from(bootstrapPassword));
  return verifyPasswordHash(password, configuredPasswordHash());
}
export function isLocalAuthConfigured() { return Boolean(ENV.cookieSecret && configuredUsername() && (configuredPasswordHash() || configuredBootstrapPassword())); }
export function localOperatorUsername() { return configuredUsername(); }

async function effectiveCredential(username: string) {
  const stored = await db.getOperatorCredential(username);
  if (stored) return stored;
  const fallbackHash = configuredPasswordHash();
  if (!fallbackHash || !isLocalAuthConfigured()) return undefined;
  return { username, passwordHash: fallbackHash, sessionVersion: 1 };
}
async function verifyCurrentPassword(username: string, password: string) {
  const credential = await effectiveCredential(username);
  if (credential && verifyPasswordHash(password, credential.passwordHash)) return true;
  const bootstrapPassword = configuredBootstrapPassword();
  return Boolean(!credential && bootstrapPassword && password.length === bootstrapPassword.length && timingSafeEqual(Buffer.from(password), Buffer.from(bootstrapPassword)));
}

export async function issueLocalSession(username = configuredUsername(), sessionVersion?: number) {
  const credential = sessionVersion === undefined ? await effectiveCredential(username) : undefined;
  const version = sessionVersion ?? credential?.sessionVersion ?? 1;
  const ttl = Number(process.env.ARCHANGEL_OPERATOR_SESSION_TTL_SECONDS || DEFAULT_TTL_SECONDS);
  return new SignJWT({ authMode: "local", username, name: configuredName(), role: "admin", sessionVersion: version })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(`local:${username}`)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + (Number.isFinite(ttl) && ttl > 0 ? ttl : DEFAULT_TTL_SECONDS))
    .sign(secretKey());
}

export async function verifyLocalSession(token: string | undefined): Promise<LocalSession | null> {
  if (!token || !ENV.cookieSecret) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.authMode !== "local" || typeof payload.username !== "string" || payload.username !== configuredUsername()) return null;
    const credential = await db.getOperatorCredential(payload.username);
    const sessionVersion = typeof payload.sessionVersion === "number" ? payload.sessionVersion : 1;
    if (credential && credential.sessionVersion !== sessionVersion) return null;
    return { username: payload.username, name: typeof payload.name === "string" ? payload.name : configuredName(), role: "admin", sessionVersion };
  } catch { return null; }
}

export function localAuthCookieOptions(req: Request) { return { ...getSessionCookieOptions(req), httpOnly: true, maxAge: DEFAULT_TTL_SECONDS * 1000 }; }
function requireLocalSession(req: Request) { return verifyLocalSession(req.cookies?.[LOCAL_AUTH_COOKIE] || req.headers.cookie?.match(new RegExp(`${LOCAL_AUTH_COOKIE}=([^;]+)`))?.[1]); }
function badAuth(res: Response, message = "Authentication failed. Check your operator ID and passphrase.") { res.status(401).json({ error: "authentication_failed", message }); }

export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/auth/local/config", async (_req: Request, res: Response) => {
    const passkeys = isLocalAuthConfigured() ? await db.listOperatorPasskeys(configuredUsername()) : [];
    res.json({ enabled: isLocalAuthConfigured(), username: isLocalAuthConfigured() ? configuredUsername() : null, passkeyEnabled: isLocalAuthConfigured() && process.env.ARCHANGEL_WEBAUTHN_ENABLED !== "false", passkeyCount: passkeys.length });
  });

  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    const key = clientAddress(req);
    if (recordFailedAttempt(key)) { res.status(429).json({ error: "too_many_attempts", message: "Too many failed attempts. Wait 15 minutes before trying again." }); return; }
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!isLocalAuthConfigured() || username !== configuredUsername() || !(await verifyCurrentPassword(username, password))) { badAuth(res); return; }
    clearFailedAttempts(key);
    const storedCredential = await db.getOperatorCredential(username);
    if (!storedCredential) {
      await db.ensureOperatorCredential(username, generatePasswordHash(password));
    } else if (/^[a-f0-9]{64}$/i.test(storedCredential.passwordHash)) {
      await db.rotateOperatorCredential(username, generatePasswordHash(password));
    }
    const credential = await db.getOperatorCredential(username);
    const token = await issueLocalSession(username, credential?.sessionVersion ?? 1);
    res.cookie(LOCAL_AUTH_COOKIE, token, localAuthCookieOptions(req));
    res.json({ authenticated: true, user: { name: configuredName(), username, role: "admin" }, passkeyAvailable: (await db.listOperatorPasskeys(username)).length > 0 });
  });

  app.post("/api/auth/local/login/passkey/options", async (req: Request, res: Response) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const passkeys = username === configuredUsername() ? await db.listOperatorPasskeys(username) : [];
    if (!isLocalAuthConfigured() || username !== configuredUsername() || passkeys.length === 0) { badAuth(res, "No passkey is registered for this operator."); return; }
    const options = await generateAuthenticationOptions({ rpID: configuredRpId(req), allowCredentials: passkeys.map(key => ({ id: key.credentialId, transports: key.transports?.split(",").filter(Boolean) })) , userVerification: "required" });
    await db.saveWebauthnChallenge({ challenge: options.challenge, username, purpose: "authentication", expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) });
    res.json(options);
  });

  app.post("/api/auth/local/login/passkey/verify", async (req: Request, res: Response) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const response = req.body?.response as AuthenticationResponseJSON | undefined;
    const challenge = typeof req.body?.challenge === "string" ? req.body.challenge : "";
    if (!response || username !== configuredUsername() || !challenge) { badAuth(res); return; }
    const challengeRecord = await db.consumeWebauthnChallenge(challenge, "authentication");
    const stored = response.id ? await db.getOperatorPasskey(username, response.id) : undefined;
    if (!challengeRecord || !stored) { badAuth(res, "That passkey sign-in request is expired or invalid. Try again."); return; }
    try {
      const verification = await verifyAuthenticationResponse({ response, expectedChallenge: challengeRecord.challenge, expectedOrigin: configuredOrigin(req), expectedRPID: configuredRpId(req), requireUserVerification: true, credential: { id: stored.credentialId, publicKey: toBytes(stored.publicKey), counter: stored.counter, transports: stored.transports?.split(",").filter(Boolean) } });
      if (!verification.verified) { badAuth(res, "The passkey could not verify this operator."); return; }
      await db.updateOperatorPasskeyCounter(stored.credentialId, verification.authenticationInfo.newCounter);
      const credential = await db.getOperatorCredential(username);
      const token = await issueLocalSession(username, credential?.sessionVersion ?? 1);
      res.cookie(LOCAL_AUTH_COOKIE, token, localAuthCookieOptions(req));
      res.json({ authenticated: true, user: { name: configuredName(), username, role: "admin" } });
    } catch { badAuth(res, "The passkey response was not accepted by ARCHANGEL."); }
  });

  app.post("/api/auth/local/rotate-password", async (req: Request, res: Response) => {
    const session = await requireLocalSession(req);
    if (!session) { res.status(401).json({ error: "authentication_required", message: "Sign in again before rotating the passphrase." }); return; }
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (!(await verifyCurrentPassword(session.username, currentPassword))) { badAuth(res, "The current passphrase is incorrect."); return; }
    if (newPassword.length < 14 || newPassword.length > 256) { res.status(400).json({ error: "weak_passphrase", message: "Use a passphrase between 14 and 256 characters." }); return; }
    const existing = await db.getOperatorCredential(session.username);
    if (!existing) await db.ensureOperatorCredential(session.username, generatePasswordHash(currentPassword));
    const rotated = await db.rotateOperatorCredential(session.username, generatePasswordHash(newPassword));
    if (!rotated) { res.status(503).json({ error: "database_unavailable", message: "Passphrase rotation is temporarily unavailable." }); return; }
    const token = await issueLocalSession(session.username, rotated.sessionVersion);
    res.cookie(LOCAL_AUTH_COOKIE, token, localAuthCookieOptions(req));
    res.json({ rotated: true, sessionsInvalidated: true, message: "Passphrase updated. Other operator sessions were invalidated." });
  });

  app.post("/api/auth/local/passkey/register/options", async (req: Request, res: Response) => {
    const session = await requireLocalSession(req);
    if (!session) { res.status(401).json({ error: "authentication_required", message: "Sign in before registering a passkey." }); return; }
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    if (!(await verifyCurrentPassword(session.username, currentPassword))) { badAuth(res, "Re-enter your current passphrase to register a passkey."); return; }
    const passkeys = await db.listOperatorPasskeys(session.username);
    const options = await generateRegistrationOptions({ rpName: "ARCHANGEL Control Plane", rpID: configuredRpId(req), userName: session.username, userDisplayName: configuredName(), attestationType: "none", authenticatorSelection: { residentKey: "preferred", userVerification: "required" }, excludeCredentials: passkeys.map(key => ({ id: key.credentialId, transports: key.transports?.split(",").filter(Boolean) })) });
    await db.saveWebauthnChallenge({ challenge: options.challenge, username: session.username, purpose: "registration", expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) });
    res.json(options);
  });

  app.post("/api/auth/local/passkey/register/verify", async (req: Request, res: Response) => {
    const session = await requireLocalSession(req);
    const response = req.body?.response as RegistrationResponseJSON | undefined;
    const challenge = typeof req.body?.challenge === "string" ? req.body.challenge : "";
    if (!session || !response || !challenge) { res.status(400).json({ error: "invalid_request", message: "The passkey registration request is incomplete." }); return; }
    const challengeRecord = await db.consumeWebauthnChallenge(challenge, "registration");
    if (!challengeRecord || challengeRecord.username !== session.username) { res.status(400).json({ error: "challenge_invalid", message: "The passkey registration request expired. Start again." }); return; }
    try {
      const verification = await verifyRegistrationResponse({ response, expectedChallenge: challengeRecord.challenge, expectedOrigin: configuredOrigin(req), expectedRPID: configuredRpId(req), requireUserVerification: true });
      if (!verification.verified) { res.status(400).json({ error: "passkey_invalid", message: "ARCHANGEL could not verify that passkey." }); return; }
      const credential = verification.registrationInfo.credential;
      await db.saveOperatorPasskey({ username: session.username, credentialId: credential.id, publicKey: toBase64Url(credential.publicKey), counter: credential.counter, transports: credential.transports });
      res.json({ registered: true, passkeyCount: (await db.listOperatorPasskeys(session.username)).length });
    } catch { res.status(400).json({ error: "passkey_invalid", message: "The passkey registration was not accepted." }); }
  });

  app.post("/api/auth/local/logout", (req: Request, res: Response) => {
    const options = localAuthCookieOptions(req);
    res.clearCookie(LOCAL_AUTH_COOKIE, { ...options, maxAge: -1 });
    res.json({ success: true });
  });
}

export function generatePasswordHash(password: string) {
  const N = 16384; const r = 8; const p = 1; const salt = randomBytes(16); const key = scryptSync(password, salt, 32, { N, r, p, maxmem: 32 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}
