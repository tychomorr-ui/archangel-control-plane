import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { archangelRouter } from "./archangel";
import { auditEvents, intents, planningScenarios } from "../drizzle/schema";
import { getDb } from "./db";

type StoredIntent = Record<string, unknown> & { id: number; publicId: string; state: string };
type StoredAudit = Record<string, unknown> & { eventType: string; outcome: string };
type StoredScenario = Record<string, unknown> & { id: number; publicId: string; posture: string };

function createDbDouble() {
  const storedIntents: StoredIntent[] = [];
  const storedAudit: StoredAudit[] = [];
  const storedScenarios: StoredScenario[] = [];
  let nextIntentId = 1;
  let nextScenarioId = 1;

  const db = {
    insert: (table: unknown) => ({
      values: async (value: Record<string, unknown>) => {
        if (table === intents) {
          storedIntents.push({ ...value, id: nextIntentId++, publicId: value.publicId as string, state: value.state as string });
        }
        if (table === auditEvents) {
          storedAudit.push(value as StoredAudit);
        }
        if (table === planningScenarios) {
          storedScenarios.push({ ...value, id: nextScenarioId++, publicId: value.publicId as string, posture: value.posture as string });
        }
      },
    }),
    select: () => ({
      from: (table: unknown) => {
        if (table === intents) {
          return { where: () => ({ limit: async () => storedIntents }) };
        }
        if (table === planningScenarios) return { orderBy: () => ({ limit: async () => storedScenarios }) };
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

  return { db, storedIntents, storedAudit, storedScenarios };
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

  it("normalizes an approved plain-language command into the same protected proposal and audit path", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);

    const proposal = await caller.draftPlainLanguageIntent({
      command: 'backup verify tesseract-a scope="Verify the current mirror backup evidence." risk=low rollback="No mutation is made during verification." ttl=30m',
    });

    expect(proposal.state).toBe("proposed");
    expect(state.storedIntents[0]).toMatchObject({ nodeId: "tesseract-a", operationType: "backup verify", risk: "low", state: "proposed" });
    expect(state.storedAudit[0]).toMatchObject({ eventType: "intent.proposed", outcome: "pending" });
    await expect(caller.draftPlainLanguageIntent({
      command: 'restart tesseract-a scope="Restart service; rm -rf /" risk=critical rollback="No rollback provided here." ttl=30m',
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.storedIntents).toHaveLength(1);
  });

  it("records an application-only scenario without reaching any node or creating executable work", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);

    const scenario = await caller.createScenario({
      title: "Resonate Earth placement alternatives",
      objective: "Compare declared hosting postures for the Resonate Earth public front door.",
      assumptions: "No host is created, contacted, or represented as physically deployed by this planning scenario.",
      affectedApplicationIds: ["resonate-earth", "sovereign-provenance-console"],
      risk: "moderate",
      rollbackHypothesis: "Archive the scenario and retain the current unplaced application posture if the assumptions no longer hold.",
    });

    expect(scenario.posture).toBe("draft");
    expect(state.storedScenarios[0]).toMatchObject({ posture: "draft", risk: "moderate" });
    expect(state.storedScenarios[0]?.affectedApplicationIds).toBe(JSON.stringify(["resonate-earth", "sovereign-provenance-console"]));
    expect(state.storedAudit[0]).toMatchObject({ eventType: "planning.scenario.created", outcome: "accepted" });
    expect(JSON.stringify(state.storedAudit[0])).toContain("no infrastructure action");
  });
});
