import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { archangelRouter } from "./archangel";
import { auditEvents, intents } from "../drizzle/schema";
import { getDb } from "./db";

type StoredIntent = Record<string, unknown> & { id: number; publicId: string; state: string };
type StoredAudit = Record<string, unknown> & { eventType: string; outcome: string };

function createDbDouble() {
  const storedIntents: StoredIntent[] = [];
  const storedAudit: StoredAudit[] = [];
  let nextIntentId = 1;

  const db = {
    insert: (table: unknown) => ({
      values: async (value: Record<string, unknown>) => {
        if (table === intents) {
          storedIntents.push({ ...value, id: nextIntentId++, publicId: value.publicId as string, state: value.state as string });
        }
        if (table === auditEvents) {
          storedAudit.push(value as StoredAudit);
        }
      },
    }),
    select: () => ({
      from: (table: unknown) => {
        if (table === intents) {
          return { where: () => ({ limit: async () => storedIntents }) };
        }
        return { orderBy: async () => storedAudit };
      },
    }),
    update: () => ({
      set: (patch: Record<string, unknown>) => ({
        where: async () => {
          Object.assign(storedIntents[0] ?? {}, patch);
        },
      }),
    }),
  };

  return { db, storedIntents, storedAudit };
}

describe("ARCHANGEL protected mutations", () => {
  const operatorContext = {
    user: { id: 7, openId: "operator", role: "admin" },
  } as TrpcContext;

  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated intent mutation attempts", async () => {
    const caller = archangelRouter.createCaller({ user: null } as TrpcContext);
    await expect(caller.proposeIntent({
      nodeId: "root-gate",
      operationType: "deploy",
      scope: "Deploy the declared Root-Gate application release.",
      risk: "moderate",
      rollbackMethod: "Restore the previously verified release artifact.",
      expiresAt: new Date(Date.now() + 60_000),
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("records proposal, approval, receipt, and verification outcomes as append-only audit events", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);

    const proposal = await caller.proposeIntent({
      nodeId: "root-gate",
      operationType: "deploy",
      scope: "Deploy the declared Root-Gate application release.",
      risk: "moderate",
      rollbackMethod: "Restore the previously verified release artifact.",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await caller.reviewIntent({ publicId: proposal.publicId, decision: "approved" });
    await caller.recordEvidence({ nodeId: "root-gate", eventType: "receipt.recorded", outcome: "verified", summary: "A signed deployment receipt was received and stored." });
    await caller.recordEvidence({ nodeId: "root-gate", eventType: "verification.outcome", outcome: "verified", summary: "The signed receipt passed freshness and integrity checks." });

    expect(state.storedIntents[0]?.state).toBe("approved");
    expect(state.storedAudit.map(event => event.eventType)).toEqual([
      "intent.proposed",
      "intent.approved",
      "receipt.recorded",
      "verification.outcome",
    ]);
    expect(state.storedAudit.every(event => ["pending", "accepted", "verified"].includes(event.outcome))).toBe(true);
  });
});
