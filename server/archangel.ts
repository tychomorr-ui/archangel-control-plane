import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { auditEvents, intents, meshNodes, nodeStatusReports, notifications } from "../drizzle/schema";
import { AUDIT_EVENT_TYPES, FLEET_NODES, NODE_IDS, OPERATION_TYPES } from "../shared/archangel";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

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

  proposeIntent: protectedProcedure.input(intentProposalSchema).mutation(async ({ ctx, input }) => {
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
});
