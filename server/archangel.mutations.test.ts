import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { archangelRouter } from "./archangel";
import { auditEvents, applicationIntegrations, intents, nodeStatusReports, planningScenarios } from "../drizzle/schema";
import { getDb } from "./db";
import { canonicalHealthReceipt } from "./conductor";

type StoredIntent = Record<string, unknown> & { id: number; publicId: string; state: string };
type StoredAudit = Record<string, unknown> & { eventType: string; outcome: string };
type StoredScenario = Record<string, unknown> & { id: number; publicId: string; posture: string };

function createDbDouble() {
  const storedIntents: StoredIntent[] = [];
  const storedAudit: StoredAudit[] = [];
  const storedScenarios: StoredScenario[] = [];
  const storedIntegrations: Record<string, unknown>[] = [];
  const storedReports: Record<string, unknown>[] = [];
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
        if (table === applicationIntegrations) storedIntegrations.push({ ...value, id: storedIntegrations.length + 1 });
        if (table === nodeStatusReports) storedReports.push({ ...value, id: storedReports.length + 1 });
      },
    }),
    select: () => ({
      from: (table: unknown) => {
        if (table === intents) {
          return { where: () => ({ limit: async () => storedIntents }) };
        }
        if (table === applicationIntegrations) return { where: () => ({ limit: async () => storedIntegrations }) };
        if (table === planningScenarios) return { orderBy: () => ({ limit: async () => storedScenarios }), where: () => ({ limit: async () => storedScenarios }) };
        return { orderBy: async () => storedAudit };
      },
    }),
    update: (table: unknown) => ({
      set: (patch: Record<string, unknown>) => ({
        where: async () => {
          if (table === intents) Object.assign(storedIntents[0] ?? {}, patch);
          if (table === planningScenarios) Object.assign(storedScenarios[0] ?? {}, patch);
          if (table === applicationIntegrations) Object.assign(storedIntegrations[0] ?? {}, patch);
        },
      }),
    }),
  };

  return { db, storedIntents, storedAudit, storedScenarios, storedIntegrations, storedReports };
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

  it("binds a real public key before accepting a signed health receipt", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const registration = await caller.registerIntegration({
      applicationId: "iwa-sage",
      nodeId: "iwa-sage",
      endpointUrl: "https://iwa.nexinus.net",
      publicKeyPem,
      scopes: ["read:health", "write:cache"],
    });
    expect(registration).toMatchObject({ accepted: true, applicationId: "iwa-sage", status: "active" });

    const unsigned = {
      applicationId: "iwa-sage",
      nodeId: "iwa-sage",
      status: "ok" as const,
      version: "2026.09.27.1",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      nonce: "receipt-nonce-001",
      capabilities: ["health.check"],
    };
    const signature = sign(null, Buffer.from(canonicalHealthReceipt(unsigned)), privateKey).toString("base64url");
    const receipt = await caller.recordSignedHealthReceipt({ applicationId: "iwa-sage", nodeId: "iwa-sage", receipt: { ...unsigned, signature } });
    expect(receipt).toMatchObject({ accepted: true, applicationId: "iwa-sage", nodeId: "iwa-sage" });
    expect(state.storedReports[0]).toMatchObject({ nodeId: "iwa-sage", verificationState: "verified", reachability: "reachable" });
    expect(state.storedAudit.map(event => event.eventType)).toContain("integration.registered");
    expect(state.storedAudit.map(event => event.eventType)).toContain("verification.outcome");
  });

  it("accepts Valkyrie's exact canonical Nexinus endpoint but rejects an unapproved host", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);
    const { publicKey } = generateKeyPairSync("ed25519");
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();

    await expect(caller.registerIntegration({
      applicationId: "valkyrie-adjudication-entity",
      nodeId: "valkyrie-adjudication-entity",
      endpointUrl: "https://valkyrie.nexinus.net",
      publicKeyPem,
      scopes: ["read:health"],
    })).resolves.toMatchObject({ accepted: true, status: "active" });

    await expect(caller.registerIntegration({
      applicationId: "valkyrie-adjudication-entity",
      nodeId: "valkyrie-adjudication-entity",
      endpointUrl: "https://unapproved.example.com",
      publicKeyPem,
      scopes: ["read:health"],
    })).rejects.toThrow(/exact approved sovereign hostname/);
  });

  it("previews deterministic policy and marks a declared-host scenario review-ready with an audit record only", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);
    const scenario = await caller.createScenario({
      title: "KEIRA evidence review",
      objective: "Review the declared KEIRA evidence boundary before any future operating decision is considered.",
      assumptions: "No host connection, account access, or runtime evidence will be created by this planning record.",
      affectedApplicationIds: ["keira-intelligence"],
      risk: "low",
      rollbackHypothesis: "Keep the current declared posture and archive the planning record if it no longer supports review.",
    });

    const preview = await caller.scenarioPolicyPreview({ publicId: scenario.publicId });
    expect(preview.blocking).toHaveLength(0);
    expect(preview.advisory[0]?.policyId).toBe("policy.evidence");
    expect(preview.boundary.policyId).toBe("policy.no-execution");

    const transitioned = await caller.markScenarioReviewReady({ publicId: scenario.publicId });
    expect(transitioned.posture).toBe("review-ready");
    expect(state.storedScenarios[0]?.posture).toBe("review-ready");
    expect(state.storedAudit.at(-1)).toMatchObject({ eventType: "planning.scenario.review-ready", outcome: "accepted" });
    expect(JSON.stringify(state.storedAudit.at(-1))).toContain("No host, node, or command was contacted");
  });

  it("blocks review-ready transition when a scenario treats an unplaced application as a physical host candidate", async () => {
    const state = createDbDouble();
    vi.mocked(getDb).mockResolvedValue(state.db as never);
    const caller = archangelRouter.createCaller(operatorContext);
    const scenario = await caller.createScenario({
      title: "Exitus Lens placement question",
      objective: "Keep Exitus Lens placement as an explicit planning question until a physical host is declared.",
      assumptions: "The application remains unplaced, with no node connection and no change to current physical map truth.",
      affectedApplicationIds: ["exitus-lens"],
      risk: "moderate",
      rollbackHypothesis: "Retain the present unplaced posture and archive this planning scenario if its assumptions fail.",
    });

    const preview = await caller.scenarioPolicyPreview({ publicId: scenario.publicId });
    expect(preview.blocking).toHaveLength(1);
    await expect(caller.markScenarioReviewReady({ publicId: scenario.publicId })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.storedScenarios[0]?.posture).toBe("draft");
    expect(state.storedAudit.map(event => event.eventType)).toEqual(["planning.scenario.created"]);
  });
});
