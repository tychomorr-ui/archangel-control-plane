import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, operatorCredentials, operatorPasskeys, operatorWebauthnChallenges, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOperatorCredential(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operatorCredentials).where(eq(operatorCredentials.username, username)).limit(1);
  return result[0];
}

export async function ensureOperatorCredential(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await getOperatorCredential(username);
  if (existing) return existing;
  await db.insert(operatorCredentials).values({ username, passwordHash, sessionVersion: 1 });
  return getOperatorCredential(username);
}

export async function rotateOperatorCredential(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("database unavailable");
  await db.update(operatorCredentials)
    .set({ passwordHash, sessionVersion: sql`${operatorCredentials.sessionVersion} + 1` })
    .where(eq(operatorCredentials.username, username));
  return getOperatorCredential(username);
}

export async function listOperatorPasskeys(username: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operatorPasskeys).where(eq(operatorPasskeys.username, username));
}

export async function saveOperatorPasskey(input: {
  username: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("database unavailable");
  await db.insert(operatorPasskeys).values({
    username: input.username,
    credentialId: input.credentialId,
    publicKey: input.publicKey,
    counter: input.counter,
    transports: input.transports?.join(",") || null,
  });
  return db.select().from(operatorPasskeys).where(eq(operatorPasskeys.credentialId, input.credentialId)).limit(1);
}

export async function getOperatorPasskey(username: string, credentialId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operatorPasskeys)
    .where(sql`${operatorPasskeys.username} = ${username} AND ${operatorPasskeys.credentialId} = ${credentialId}`)
    .limit(1);
  return result[0];
}

export async function updateOperatorPasskeyCounter(credentialId: string, counter: number) {
  const db = await getDb();
  if (!db) throw new Error("database unavailable");
  await db.update(operatorPasskeys).set({ counter, lastUsedAt: new Date() }).where(eq(operatorPasskeys.credentialId, credentialId));
}

export async function saveWebauthnChallenge(input: { challenge: string; username: string; purpose: "registration" | "authentication"; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("database unavailable");
  await db.insert(operatorWebauthnChallenges).values(input);
}

export async function consumeWebauthnChallenge(challenge: string, purpose: "registration" | "authentication") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(operatorWebauthnChallenges)
    .where(sql`${operatorWebauthnChallenges.challenge} = ${challenge} AND ${operatorWebauthnChallenges.purpose} = ${purpose}`)
    .limit(1);
  const record = result[0];
  if (!record || record.usedAt || new Date(record.expiresAt).getTime() <= Date.now()) return undefined;
  await db.update(operatorWebauthnChallenges).set({ usedAt: new Date() }).where(eq(operatorWebauthnChallenges.challenge, challenge));
  return record;
}
