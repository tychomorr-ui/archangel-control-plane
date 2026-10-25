import { and, eq, isNull } from "drizzle-orm";
import { auditEvents, atmosAuthorityChallenges, atmosAuthorityMutations, atmosControlPlaneState } from "../drizzle/schema";
import type { Gate4Store, ChallengeRecord, ControlPlaneMode } from "./atmosGate4";
import { getDb } from "./db";
import { nanoid } from "nanoid";

export async function createDurableGate4Store(): Promise<Gate4Store> {
  const db = await getDb();
  if (!db) throw new Error("Gate 4 durable store is unavailable.");
  return {
    createChallenge: async record => {
      await db.insert(atmosAuthorityChallenges).values({
        challengeId: record.challengeId,
        nonce: record.nonce,
        issuedAt: new Date(record.issuedAt),
        expiresAt: new Date(record.expiresAt),
        usedAt: null,
      });
    },
    getChallenge: async challengeId => {
      const rows = await db.select().from(atmosAuthorityChallenges).where(eq(atmosAuthorityChallenges.challengeId, challengeId)).limit(1);
      const row = rows[0];
      if (!row) return null;
      return { challengeId: row.challengeId, nonce: row.nonce, issuedAt: row.issuedAt.toISOString(), expiresAt: row.expiresAt.toISOString(), usedAt: row.usedAt?.toISOString() ?? null } satisfies ChallengeRecord;
    },
    consumeChallenge: async (challengeId, now) => {
      const consumedAt = new Date(now);
      const result = await db.update(atmosAuthorityChallenges).set({ usedAt: consumedAt }).where(and(eq(atmosAuthorityChallenges.challengeId, challengeId), isNull(atmosAuthorityChallenges.usedAt)));
      const metadata = result as { affectedRows?: number; rowsAffected?: number };
      const affectedRows = Number(metadata.affectedRows ?? metadata.rowsAffected ?? 0);
      if (affectedRows === 1) return true;
      // Some hosted MySQL-compatible adapters apply the update but omit ResultSetHeader metadata.
      // Re-read only to distinguish that case from an already-consumed challenge.
      const rows = await db.select({ usedAt: atmosAuthorityChallenges.usedAt }).from(atmosAuthorityChallenges).where(eq(atmosAuthorityChallenges.challengeId, challengeId)).limit(1);
      const observedValue = rows[0]?.usedAt as unknown;
      const observed = observedValue instanceof Date ? observedValue.getTime() : observedValue ? Date.parse(String(observedValue)) : undefined;
      return observed !== undefined && Math.abs(observed - consumedAt.getTime()) <= 2_000;
    },
    claimMutation: async record => {
      try {
        await db.insert(atmosAuthorityMutations).values({ mutationId: record.mutationId, challengeId: record.challengeId, createdAt: new Date(record.createdAt) });
        return true;
      } catch {
        return false;
      }
    },
    getControlPlaneMode: async () => {
      const rows = await db.select({ mode: atmosControlPlaneState.mode }).from(atmosControlPlaneState).where(eq(atmosControlPlaneState.stateKey, "ARCHANGEL_MODE")).limit(1);
      return (rows[0]?.mode ?? "ready") as ControlPlaneMode;
    },
    setControlPlaneMode: async (mode, now) => {
      await db.insert(atmosControlPlaneState).values({ stateKey: "ARCHANGEL_MODE", mode, updatedAt: new Date(now) }).onDuplicateKeyUpdate({ set: { mode, updatedAt: new Date(now) } });
      return mode;
    },
    audit: async event => {
      await db.insert(auditEvents).values({
        publicId: `aud_${nanoid(12)}`,
        nodeId: "ARCHANGEL",
        eventType: `authority.gate4.${event.code.toLowerCase()}`,
        outcome: event.outcome === "accepted" ? "accepted" : "failed",
        actorPseudonym: "gate4-operator",
        summary: `Gate 4 ${event.code}; hashes recorded without sensitive request contents.`,
        occurredAt: new Date(event.occurredAt),
      });
    },
  };
}
