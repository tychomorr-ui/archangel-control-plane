import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { applicationIntegrations, auditEvents, intents, meshNodes, nodeStatusReports, notifications, planningScenarios } from "../drizzle/schema";
import { APPLICATION_ATLAS, APPLICATION_IDS, AUDIT_EVENT_TYPES, FLEET_NODES, NODE_IDS, OPERATION_TYPES, PLANNING_POLICIES } from "../shared/archangel";
import { getDb } from "./db";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { ACTION_SCOPES, BOUNDED_APPLICATION_ACTIONS, actionPolicy, verifySignedHealthReceipt } from "./conductor";

const nodeIdSchema = z.enum(NODE_IDS);

export const intentProposalSchema = z.object({
  nodeId: nodeIdSchema,
  operationType: z.enum(OPERATION_TYPES),
  scope: z.string().trim().min(8).max(500),
  risk: z.enum(["low", "moderate", "high", "critical"]),
  expiresAt: z.date(),
  rollbackMethod: z.string().trim().min(8).max(500),
});

export const intentReviewSchema = z.object({
  publicId: z.string().regex(/^int_[A-Za-z0-9_-]{12}$/),
  decision: z.enum(["approved", "rejected"]),
});

export const evidenceRecordSchema = z.object({
  nodeId: nodeIdSchema,
  eventType: z.enum([AUDIT_EVENT_TYPES[2], AUDIT_EVENT_TYPES[3]]),
  outcome: z.enum(["verified", "failed"]),
  summary: z.string().trim().min(8).max(500),
});

export const plainLanguageCommandSchema = z.object({
  command: z.string().trim().min(24).max(900),
});

export const planningScenarioSchema = z.object({
  title: z.string().trim().min(4).max(160),
  objective: z.string().trim().min(12).max(1200),
  assumptions: z.string().trim().min(12).max(1800),
  affectedApplicationIds: z.array(z.enum(APPLICATION_IDS)).min(1).max(APPLICATION_IDS.length),
  risk: z.enum(["low", "moderate", "high", "critical"]),
  rollbackHypothesis: z.string().trim().min(12).max(1200),
});

export const scenarioPublicIdSchema = z.object({
  publicId: z.string().regex(/^scn_[A-Za-z0-9_-]{12}$/),
});

export const signedHealthReceiptSchema = z.object({
  applicationId: z.enum(APPLICATION_IDS),
  nodeId: nodeIdSchema,
  receipt: z.object({
    applicationId: z.string().trim().min(1).max(128),
    nodeId: z.string().trim().min(1).max(128),
    status: z.enum(["ok", "degraded", "not_ready"]),
    version: z.string().trim().min(1).max(128),
    issuedAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    nonce: z.string().trim().min(16).max(256),
    capabilities: z.array(z.string().trim().min(1).max(128)).max(32),
    signature: z.string().trim().min(16).max(512),
  }),
});

export const applicationIntegrationSchema = z.object({
  applicationId: z.enum(APPLICATION_IDS),
  nodeId: nodeIdSchema,
  endpointUrl: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".manus.space");
  }, "The integration endpoint must be an HTTPS *.manus.space hostname."),
  publicKeyPem: z.string().trim().min(80).max(1000),
  scopes: z.array(z.enum(["read:health", "read:deployment", "write:cache"])).min(1).max(3),
});

const plainCommandPattern = /^(deploy|restart|configuration promote|backup verify)\s+([a-z-]+)\s+scope="([^"\n]{8,300})"\s+risk=(low|moderate|high|critical)\s+rollback="([^"\n]{8,300})"\s+ttl=(15|30|60|120|240)m$/;
const commandNodeAliases: Record<string, (typeof NODE_IDS)[number]> = {
  "monarch-os": "kether-gate",
  "sovereign-provenance-console": "tesseract-terminus",
  "the-portal": "keira",
  "root-sovereign-identity": "root-gate",
  "iwa-sage-app": "iwa-sage",
};

export function parsePlainLanguageCommand(command: string) {
  const normalized = command.trim().replace(/\s+/g, " ");
  const match = normalized.match(plainCommandPattern);
  if (!match) return null;
  const [, operationType, suppliedNodeId, scope, risk, rollbackMethod, ttlMinutes] = match;
  const forbiddenShellSyntax = /(;|&&|\|\||\||`|\$\(|\$\{|\n|\r|\b(?:sudo|curl|wget|bash|sh|rm|chmod|chown)\b)/i;
  if (forbiddenShellSyntax.test(scope) || forbiddenShellSyntax.test(rollbackMethod)) return null;
  const nodeId = commandNodeAliases[suppliedNodeId] ?? suppliedNodeId;
  if (!NODE_IDS.includes(nodeId as (typeof NODE_IDS)[number])) return null;
  return {
    nodeId: nodeId as (typeof NODE_IDS)[number],
    operationType: operationType as (typeof OPERATION_TYPES)[number],
    scope,
    risk: risk as "low" | "moderate" | "high" | "critical",
    rollbackMethod,
    expiresAt: new Date(Date.now() + Number(ttlMinutes) * 60_000),
    normalized,
  };
}

const pendingStatus = (nodeId: string) => ({
  nodeId,
  observedAt: null,
  version: "No signed release reported",
  uptimeClass: "Awaiting secure agent",
  applicationReadiness: "unknown" as const,
  reachability: "unknown" as const,
  verificationState: "pending" as const,
  narrative: "Lightsail declared this node running in the current fleet inventory. ARCHANGEL has not yet received a signed status receipt, so it makes no live health claim.",
  signedReceiptHash: null,
});

async function getRequiredDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The protected control-plane registry is unavailable. Retry when the service recovers." });
  }
  return db;
}

async function latestStatusByNode() {
  const db = await getRequiredDb();
  const reports = await db.select().from(nodeStatusReports).orderBy(desc(nodeStatusReports.observedAt));
  const latest = new Map<string, (typeof reports)[number]>();
  for (const report of reports) {
    if (!latest.has(report.nodeId)) latest.set(report.nodeId, report);
  }
  return latest;
}

async function registryByNode() {
  const db = await getRequiredDb();
  const records = await db.select().from(meshNodes);
  return new Map(records.map(record => [record.nodeId, record]));
}

async function createIntentProposal(ctx: { user: { id: number } }, input: z.infer<typeof intentProposalSchema>) {
  if (input.expiresAt.getTime() <= Date.now()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The proposal expiry must be in the future." });
  }
  const db = await getRequiredDb();
  const node = FLEET_NODES.find(item => item.id === input.nodeId);
  if (!node) throw new TRPCError({ code: "NOT_FOUND" });
  const publicId = `int_${nanoid(12)}`;
  const occurredAt = new Date();
  const actorPseudonym = `operator-${ctx.user.id}`;
  await db.insert(intents).values({
    publicId,
    nodeId: input.nodeId,
    operationType: input.operationType,
    scope: input.scope,
    risk: input.risk,
    rollbackMethod: input.rollbackMethod,
    expiresAt: input.expiresAt,
    state: "proposed",
    createdBy: actorPseudonym,
  });
  await db.insert(auditEvents).values({
    publicId: `aud_${nanoid(12)}`,
    intentPublicId: publicId,
    nodeId: input.nodeId,
    eventType: "intent.proposed",
    outcome: "pending",
    actorPseudonym,
    summary: `${input.operationType} proposed for ${node.name}; execution remains unavailable until an approval and a node-side policy gate both succeed.`,
    occurredAt,
  });
  return { publicId, state: "proposed" as const };
}

function evaluateScenarioPolicy(scenario: { rollbackHypothesis: string; affectedApplicationIds: string }) {
  const affectedIds = JSON.parse(scenario.affectedApplicationIds) as string[];
  const affectedApplications = APPLICATION_ATLAS.filter(application => affectedIds.includes(application.id));
  const unplaced = affectedApplications.filter(application => application.hostPosture === "Physical host unplaced");
  const evidenceNeeded = affectedApplications.filter(application => application.evidencePosture === "evidence-needed");
  return {
    affectedApplications,
    blocking: unplaced.map(application => ({ policyId: "policy.host-evidence", severity: "blocking" as const, title: `${application.name} remains physically unplaced`, detail: "A review-ready scenario may model the role, but cannot treat an unplaced application as a deployed physical host. Declare a host separately before changing that posture." })),
    review: [{ policyId: "policy.rollback", severity: "review" as const, title: "Recovery hypothesis present", detail: scenario.rollbackHypothesis.trim().length >= 12 ? "A written return-to-present hypothesis is available for human review." : "A written rollback hypothesis is required." }],
    advisory: evidenceNeeded.map(application => ({ policyId: "policy.evidence", severity: "advisory" as const, title: `${application.name} needs evidence`, detail: "The application role is declared, but no signed runtime evidence exists. This remains visible in planning review." })),
    boundary: { policyId: "policy.no-execution", severity: "pass" as const, title: "Application-only boundary retained", detail: "This evaluation has no host connection, enrollment, firewall, mesh, or command-dispatch path." },
  };
}

export const archangelRouter = router({
  fleet: protectedProcedure.query(async () => {
    const [statuses, registry] = await Promise.all([latestStatusByNode(), registryByNode()]);
    return FLEET_NODES.map(node => {
      const report = statuses.get(node.id);
      const enrolled = registry.get(node.id);
      return {
        ...node,
        enrollmentStatus: enrolled?.enrollmentStatus ?? "pending",
        publicKeyFingerprint: enrolled?.publicKeyFingerprint ?? node.fingerprint,
        status: report ?? pendingStatus(node.id),
      };
    });
  }),

  node: protectedProcedure.input(z.object({ nodeId: nodeIdSchema })).query(async ({ input }) => {
    const node = FLEET_NODES.find(item => item.id === input.nodeId);
    if (!node) throw new TRPCError({ code: "NOT_FOUND" });
    const [statuses, registry] = await Promise.all([latestStatusByNode(), registryByNode()]);
    const enrolled = registry.get(node.id);
    return {
      ...node,
      enrollmentStatus: enrolled?.enrollmentStatus ?? "pending",
      publicKeyFingerprint: enrolled?.publicKeyFingerprint ?? node.fingerprint,
      status: statuses.get(node.id) ?? pendingStatus(node.id),
    };
  }),

  registry: protectedProcedure.query(async () => {
    const registry = await registryByNode();
    return FLEET_NODES.map(node => {
      const record = registry.get(node.id);
      return {
        ...node,
        enrollmentStatus: record?.enrollmentStatus ?? "pending",
        publicKeyFingerprint: record?.publicKeyFingerprint ?? node.fingerprint,
      };
    });
  }),

  audit: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    return db.select().from(auditEvents).orderBy(desc(auditEvents.occurredAt)).limit(100);
  }),

  alerts: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    return db.select().from(notifications).orderBy(desc(notifications.detectedAt)).limit(50);
  }),

  intents: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    return db.select().from(intents).orderBy(desc(intents.createdAt)).limit(100);
  }),

  commandPolicy: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    const registered = await db.select({ applicationId: applicationIntegrations.applicationId, status: applicationIntegrations.status }).from(applicationIntegrations);
    const activeApplications = registered.filter(record => record.status === "active").map(record => record.applicationId);
    return {
      version: "ARCHANGEL/1",
      executionMode: "bounded-auditable-conductor" as const,
      executionState: activeApplications.length ? "application-registered-awaiting-receipt" as const : "paused-until-application-registration" as const,
      registeredApplications: activeApplications,
      allowedOperations: OPERATION_TYPES,
      allowedApplicationActions: BOUNDED_APPLICATION_ACTIONS.map(action => actionPolicy(action)),
      requiredScopes: ACTION_SCOPES,
      requires: ["registered application endpoint", "registered Ed25519 public key", "fresh nonce", "idempotency key", "append-only audit record"],
      prohibited: ["arbitrary shell", "public command endpoint", "stored node private keys", "silent execution", "infrastructure mutation"],
    };
  }),

  integrations: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    const records = await db.select().from(applicationIntegrations).orderBy(desc(applicationIntegrations.updatedAt));
    return records.map(record => ({
      applicationId: record.applicationId,
      nodeId: record.nodeId,
      endpointUrl: record.endpointUrl,
      scopes: JSON.parse(record.scopes) as string[],
      status: record.status,
      publicKeyRegistered: Boolean(record.publicKeyPem),
      updatedAt: record.updatedAt,
    }));
  }),

  registerIntegration: adminProcedure.input(applicationIntegrationSchema).mutation(async ({ ctx, input }) => {
    const application = APPLICATION_ATLAS.find(item => item.id === input.applicationId);
    if (!application || application.nodeId !== input.nodeId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The application and node identity do not match the declared registry." });
    }
    const db = await getRequiredDb();
    const existing = await db.select().from(applicationIntegrations).where(eq(applicationIntegrations.applicationId, input.applicationId)).limit(1);
    const values = {
      applicationId: input.applicationId,
      nodeId: input.nodeId,
      endpointUrl: input.endpointUrl,
      publicKeyPem: input.publicKeyPem,
      scopes: JSON.stringify(input.scopes),
      status: "active" as const,
    };
    if (existing[0]) {
      await db.update(applicationIntegrations).set(values).where(eq(applicationIntegrations.id, existing[0].id));
    } else {
      await db.insert(applicationIntegrations).values(values);
    }
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      nodeId: input.nodeId,
      eventType: "integration.registered",
      outcome: "accepted",
      actorPseudonym: `operator-${ctx.user.id}`,
      summary: `${application.name} registered at ${input.endpointUrl} with ${input.scopes.length} bounded application scope(s). Private key remains outside ARCHANGEL.`,
      occurredAt: new Date(),
    });
    return { accepted: true as const, applicationId: input.applicationId, nodeId: input.nodeId, status: "active" as const };
  }),

  applications: protectedProcedure.query(() => APPLICATION_ATLAS.map(application => ({
    ...application,
    dependencies: application.dependencies.map(dependencyId => APPLICATION_ATLAS.find(item => item.id === dependencyId)).filter(Boolean),
  }))),

  policyConstellation: protectedProcedure.query(() => ({
    version: "ARCHANGEL/application-policy-1",
    executionState: "paused" as const,
    policies: PLANNING_POLICIES,
  })),

  scenarios: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    const records = await db.select().from(planningScenarios).orderBy(desc(planningScenarios.updatedAt)).limit(100);
    return records.map(record => ({ ...record, affectedApplicationIds: JSON.parse(record.affectedApplicationIds) as (typeof APPLICATION_IDS)[number][] }));
  }),

  scenarioPolicyPreview: protectedProcedure.input(scenarioPublicIdSchema).query(async ({ input }) => {
    const db = await getRequiredDb();
    const [scenario] = await db.select().from(planningScenarios).where(eq(planningScenarios.publicId, input.publicId)).limit(1);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "The planning scenario was not found." });
    return { publicId: scenario.publicId, posture: scenario.posture, ...evaluateScenarioPolicy(scenario) };
  }),

  briefing: protectedProcedure.query(async () => {
    const db = await getRequiredDb();
    const [scenarioRows, intentRows] = await Promise.all([
      db.select().from(planningScenarios).orderBy(desc(planningScenarios.updatedAt)).limit(100),
      db.select().from(intents).orderBy(desc(intents.createdAt)).limit(100),
    ]);
    const unplaced = APPLICATION_ATLAS.filter(application => application.hostPosture === "Physical host unplaced");
    const reviewReady = scenarioRows.filter(scenario => scenario.posture === "review-ready");
    const proposed = intentRows.filter(intent => intent.state === "proposed");
    return {
      executionState: "paused" as const,
      summary: {
        applications: APPLICATION_ATLAS.length,
        declaredApplications: APPLICATION_ATLAS.filter(application => application.lifecycle === "declared").length,
        plannedApplications: APPLICATION_ATLAS.filter(application => application.lifecycle === "planned").length,
        unplacedApplications: unplaced.length,
        scenarios: scenarioRows.length,
        reviewReadyScenarios: reviewReady.length,
        proposedIntents: proposed.length,
      },
      items: [
        ...unplaced.map(application => ({ kind: "evidence-needed" as const, title: `${application.name} requires physical placement`, detail: `${application.hostPosture}. Keep its role in the Application Atlas and Scenario Studio until a host is explicitly declared.`, applicationId: application.id })),
        ...APPLICATION_ATLAS.filter(application => application.evidencePosture === "evidence-needed").map(application => ({ kind: "evidence-needed" as const, title: `${application.name} has no signed evidence`, detail: "The role and host posture are declared application truth; no runtime or reachability claim is available.", applicationId: application.id })),
        ...reviewReady.map(scenario => ({ kind: "review-ready" as const, title: scenario.title, detail: "This application-only scenario has a written objective, assumptions, risk class, and rollback hypothesis. It remains planning material.", scenarioId: scenario.publicId })),
        ...proposed.map(intent => ({ kind: "policy-blocked" as const, title: `${intent.operationType} remains proposal-only`, detail: "The current application build keeps all node execution paths paused; this intent cannot dispatch.", intentId: intent.publicId })),
      ],
    };
  }),

  proposeIntent: protectedProcedure.input(intentProposalSchema).mutation(async ({ ctx, input }) => {
    return createIntentProposal(ctx, input);
  }),

  draftPlainLanguageIntent: protectedProcedure.input(plainLanguageCommandSchema).mutation(async ({ ctx, input }) => {
    const parsed = parsePlainLanguageCommand(input.command);
    if (!parsed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Command is not approved ARCHANGEL grammar. Use a named operation, declared node, quoted scope and rollback, risk, and an allowed TTL; arbitrary shell text is never accepted.",
      });
    }
    const { normalized: _normalized, ...proposal } = parsed;
    return createIntentProposal(ctx, proposal);
  }),

  createScenario: protectedProcedure.input(planningScenarioSchema).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const publicId = `scn_${nanoid(12)}`;
    const actorPseudonym = `operator-${ctx.user.id}`;
    await db.insert(planningScenarios).values({
      publicId,
      title: input.title,
      objective: input.objective,
      assumptions: input.assumptions,
      affectedApplicationIds: JSON.stringify(input.affectedApplicationIds),
      risk: input.risk,
      rollbackHypothesis: input.rollbackHypothesis,
      posture: "draft",
      createdBy: actorPseudonym,
    });
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      eventType: "planning.scenario.created",
      outcome: "accepted",
      actorPseudonym,
      summary: `Application-only scenario ${publicId} created. It contains no infrastructure action, enrollment request, or command dispatch.`,
      occurredAt: new Date(),
    });
    return { publicId, posture: "draft" as const };
  }),

  markScenarioReviewReady: protectedProcedure.input(scenarioPublicIdSchema).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [scenario] = await db.select().from(planningScenarios).where(eq(planningScenarios.publicId, input.publicId)).limit(1);
    if (!scenario) throw new TRPCError({ code: "NOT_FOUND", message: "The planning scenario was not found." });
    if (scenario.posture !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Only a draft scenario can move into planning review." });
    const evaluation = evaluateScenarioPolicy(scenario);
    if (evaluation.blocking.length) throw new TRPCError({ code: "BAD_REQUEST", message: "This scenario remains blocked by declared host-truth policy and cannot be marked review-ready." });
    await db.update(planningScenarios).set({ posture: "review-ready" }).where(eq(planningScenarios.id, scenario.id));
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      eventType: "planning.scenario.review-ready",
      outcome: "accepted",
      actorPseudonym: `operator-${ctx.user.id}`,
      summary: `Application-only scenario ${scenario.publicId} moved to planning review after deterministic policy evaluation. No host, node, or command was contacted.`,
      occurredAt: new Date(),
    });
    return { publicId: scenario.publicId, posture: "review-ready" as const, evaluation };
  }),

  reviewIntent: protectedProcedure.input(intentReviewSchema).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [intent] = await db.select().from(intents).where(eq(intents.publicId, input.publicId)).limit(1);
    if (!intent) throw new TRPCError({ code: "NOT_FOUND", message: "The proposed intent was not found." });
    if (intent.state !== "proposed") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Only a proposed intent can enter a separate review decision." });
    }
    const outcome = input.decision === "approved" ? "accepted" as const : "rejected" as const;
    const actorPseudonym = `operator-${ctx.user.id}`;
    const node = FLEET_NODES.find(item => item.id === intent.nodeId);
    await db.update(intents).set({ state: input.decision }).where(eq(intents.id, intent.id));
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      intentPublicId: intent.publicId,
      nodeId: intent.nodeId,
      eventType: "intent.approved",
      outcome,
      actorPseudonym,
      summary: `${input.decision === "approved" ? "Approval recorded" : "Proposal rejected"} for ${intent.operationType} on ${node?.name ?? intent.nodeId}. This record does not execute work or contact a node.`,
      occurredAt: new Date(),
    });
    return { publicId: intent.publicId, state: input.decision };
  }),

  recordEvidence: protectedProcedure.input(evidenceRecordSchema).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const node = FLEET_NODES.find(item => item.id === input.nodeId);
    if (!node) throw new TRPCError({ code: "NOT_FOUND" });
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      nodeId: input.nodeId,
      eventType: input.eventType,
      outcome: input.outcome,
      actorPseudonym: `operator-${ctx.user.id}`,
      summary: `${node.name}: ${input.summary}`,
      occurredAt: new Date(),
    });
    return { accepted: true as const };
  }),

  recordSignedHealthReceipt: protectedProcedure.input(signedHealthReceiptSchema).mutation(async ({ ctx, input }) => {
    const application = APPLICATION_ATLAS.find(item => item.id === input.applicationId);
    if (!application || application.nodeId !== input.nodeId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The application and node identity do not match the declared registry." });
    }
    if (input.receipt.applicationId !== input.applicationId || input.receipt.nodeId !== input.nodeId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The signed receipt identity does not match the declared application and node." });
    }
    const db = await getRequiredDb();
    const [integration] = await db.select().from(applicationIntegrations).where(eq(applicationIntegrations.applicationId, input.applicationId)).limit(1);
    if (!integration || integration.nodeId !== input.nodeId || integration.status !== "active") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This application has no active registered public key. Register the real Manus endpoint and Ed25519 public key before accepting receipts." });
    }
    const verification = verifySignedHealthReceipt(input.receipt, integration.publicKeyPem);
    if (!verification.valid) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Signed receipt rejected: ${verification.reason}` });
    }
    const observedAt = new Date(input.receipt.issuedAt);
    const readiness = input.receipt.status === "ok" ? "ready" : input.receipt.status === "degraded" ? "degraded" : "not_ready";
    await db.insert(nodeStatusReports).values({
      nodeId: input.nodeId,
      observedAt,
      version: input.receipt.version,
      uptimeClass: "Signed application receipt",
      applicationReadiness: readiness,
      reachability: "reachable",
      verificationState: "verified",
      narrative: `${application.name} presented a fresh Ed25519-signed health receipt. ARCHANGEL verified identity, freshness, canonical payload, and signature; this does not prove undeclared dependencies.`,
      signedReceiptHash: verification.receiptHash,
    });
    const actorPseudonym = `operator-${ctx.user.id}`;
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      nodeId: input.nodeId,
      eventType: "receipt.recorded",
      outcome: "verified",
      actorPseudonym,
      summary: `${application.name} signed health receipt accepted as ${verification.receiptHash}.`,
      occurredAt: new Date(),
    });
    await db.insert(auditEvents).values({
      publicId: `aud_${nanoid(12)}`,
      nodeId: input.nodeId,
      eventType: "verification.outcome",
      outcome: "verified",
      actorPseudonym,
      summary: `${application.name}: signature, freshness, nonce, and identity checks passed.`,
      occurredAt: new Date(),
    });
    return { accepted: true as const, nodeId: input.nodeId, applicationId: input.applicationId, receiptHash: verification.receiptHash, observedAt };
  }),
});
