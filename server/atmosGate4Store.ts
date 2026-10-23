import { and, eq, isNull } from "drizzle-orm";
import { auditEvents, atmosAuthorityChallenges, atmosAuthorityMutations } from "../drizzle/schema";
import type { Gate4Store, ChallengeRecord } from "./atmosGate4";
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
      const result = await db.update(atmosAuthorityChallenges).set({ usedAt: new Date(now) }).where(and(eq(atmosAuthorityChallenges.challengeId, challengeId), isNull(atmosAuthorityChallenges.usedAt)));
      return Number((result as { affectedRows?: number }).affectedRows ?? 0) === 1;
    },
    claimMutation: async record => {
      try {
        await db.insert(atmosAuthorityMutations).values({ mutationId: record.mutationId, challengeId: record.challengeId, createdAt: new Date(record.createdAt) });
        return true;
      } catch {
        return false;
      }
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
