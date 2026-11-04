import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

export const LOCAL_AUTH_COOKIE = "archangel_operator_session";
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;

type LocalSession = { username: string; name: string; role: "admin" };

function secretKey() { return new TextEncoder().encode(ENV.cookieSecret); }
function configuredUsername() { return process.env.ARCHANGEL_OPERATOR_USERNAME?.trim() || "operator"; }
function configuredName() { return process.env.ARCHANGEL_OPERATOR_NAME?.trim() || "ARCHANGEL Operator"; }
function configuredPasswordHash() { return process.env.ARCHANGEL_OPERATOR_PASSWORD_HASH?.trim() || ""; }

/** Format: scrypt$N$r$p$saltHex$derivedKeyHex. Never store a plaintext password. */
export function verifyOperatorPassword(password: string): boolean {
  const encoded = configuredPasswordHash();
  if (!encoded || !password) return false;
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

export function isLocalAuthConfigured() { return Boolean(ENV.cookieSecret && configuredPasswordHash()); }
export function localOperatorUsername() { return configuredUsername(); }

export async function issueLocalSession(username = configuredUsername()) {
  const ttl = Number(process.env.ARCHANGEL_OPERATOR_SESSION_TTL_SECONDS || DEFAULT_TTL_SECONDS);
  return new SignJWT({ authMode: "local", username, name: configuredName(), role: "admin" })
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
    return { username: payload.username, name: typeof payload.name === "string" ? payload.name : configuredName(), role: "admin" };
  } catch { return null; }
}

export function localAuthCookieOptions(req: Request) { return { ...getSessionCookieOptions(req), httpOnly: true, maxAge: DEFAULT_TTL_SECONDS * 1000 }; }

export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/auth/local/config", (_req: Request, res: Response) => {
    res.json({ enabled: isLocalAuthConfigured(), username: isLocalAuthConfigured() ? configuredUsername() : null });
  });
  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!isLocalAuthConfigured() || username !== configuredUsername() || !verifyOperatorPassword(password)) {
      res.status(401).json({ error: "invalid operator credentials" });
      return;
    }
    const token = await issueLocalSession(username);
    res.cookie(LOCAL_AUTH_COOKIE, token, localAuthCookieOptions(req));
    res.json({ authenticated: true, user: { name: configuredName(), username, role: "admin" } });
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

export function fingerprintPasswordHash(hash: string) { return createHash("sha256").update(hash).digest("hex"); }
