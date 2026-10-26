import { createHash, createPublicKey, randomBytes, randomUUID } from "node:crypto";
import type { Express } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { applicationIntegrations, atmosNodeReceiptChallenges, auditEvents, nodeStatusReports } from "../drizzle/schema";
import { APPLICATION_ATLAS, FLEET_NODES } from "../shared/archangel";
import { verifySignedHealthReceipt, type SignedHealthReceipt } from "./conductor";

const CHALLENGE_TTL_MS = 5 * 60_000;

async function getRequiredDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured.");
  return db;
}

function nodeRecord(nodeId: string) {
  return FLEET_NODES.find(node => node.id === nodeId);
}

function isReceipt(value: unknown): value is SignedHealthReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Record<string, unknown>;
  return typeof receipt.applicationId === "string"
    && typeof receipt.nodeId === "string"
    && ["ok", "degraded", "not_ready"].includes(String(receipt.status))
    && typeof receipt.version === "string"
    && typeof receipt.issuedAt === "string"
    && typeof receipt.expiresAt === "string"
    && typeof receipt.nonce === "string"
    && Array.isArray(receipt.capabilities)
    && receipt.capabilities.every(capability => typeof capability === "string")
    && typeof receipt.signature === "string";
}

export function registerNodeReceiptRoutes(app: Express) {
  app.post("/v1/atmos/nodes/:nodeId/challenge", async (req, res) => {
    try {
      const nodeId = String(req.params.nodeId);
      const node = nodeRecord(nodeId);
      if (!node) return res.status(404).json({ error: "unknown_node", message: "The node is not in the declared ARCHANGEL registry." });
      const db = await getRequiredDb();
      const [integration] = await db.select().from(applicationIntegrations).where(and(eq(applicationIntegrations.nodeId, nodeId), eq(applicationIntegrations.status, "active"))).limit(1);
      if (!integration) return res.status(412).json({ error: "not_enrolled", message: "Register an active application endpoint and Ed25519 public key before requesting a node challenge." });
      const application = APPLICATION_ATLAS.find(item => item.id === integration.applicationId);
      if (!application) return res.status(412).json({ error: "unmapped_application", message: "The registered application is not in the declared application atlas." });
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
      const challengeId = `ch_${randomUUID()}`;
      const nonce = randomBytes(32).toString("base64url");
      await db.insert(atmosNodeReceiptChallenges).values({ challengeId, nodeId, nonce, issuedAt, expiresAt });
      const registeredPublicKeyFingerprint = createHash("sha256").update(createPublicKey(integration.publicKeyPem).export({ type: "spki", format: "der" })).digest("hex");
      return res.status(201).json({ schema: "NEXINUS_ATMOS_NODE_CHALLENGE/v1", challengeId, applicationId: application.id, nodeId, nonce, issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString(), requiredReceipt: "NEXINUS_ATMOS_SIGNED_HEALTH_RECEIPT/v1", canonicalization: "ARCHANGEL canonicalHealthReceipt v1", endpoint: integration.endpointUrl, registeredPublicKeyFingerprint });
    } catch (error) {
      console.error("ATMOS node challenge failed", error);
      return res.status(503).json({ error: "unavailable", message: "The node challenge service is unavailable." });
    }
  });

  app.post("/v1/atmos/nodes/:nodeId/receipts", async (req, res) => {
    try {
      const nodeId = String(req.params.nodeId);
      const node = nodeRecord(nodeId);
      if (!node) return res.status(404).json({ error: "unknown_node", message: "The node is not in the declared ARCHANGEL registry." });
      const body = req.body as { challengeId?: unknown; receipt?: unknown };
      if (typeof body.challengeId !== "string" || !isReceipt(body.receipt)) return res.status(400).json({ error: "invalid_request", message: "Expected { challengeId, receipt } with the canonical signed-health-receipt fields." });
      const receipt = body.receipt;
      if (receipt.nodeId !== nodeId) return res.status(400).json({ error: "identity_mismatch", message: "The receipt nodeId does not match the route node." });
      const db = await getRequiredDb();
      const [challenge] = await db.select().from(atmosNodeReceiptChallenges).where(and(eq(atmosNodeReceiptChallenges.challengeId, body.challengeId), eq(atmosNodeReceiptChallenges.nodeId, nodeId))).limit(1);
      if (!challenge) return res.status(404).json({ error: "challenge_not_found", message: "The challenge was not found for this node." });
      if (challenge.usedAt) return res.status(409).json({ error: "replay", message: "This node challenge has already been used." });
      if (new Date(challenge.expiresAt).getTime() <= Date.now()) return res.status(410).json({ error: "challenge_expired", message: "This node challenge has expired." });
      if (receipt.nonce !== challenge.nonce) return res.status(400).json({ error: "nonce_mismatch", message: "The receipt nonce does not match the issued challenge." });
      const [integration] = await db.select().from(applicationIntegrations).where(and(eq(applicationIntegrations.nodeId, nodeId), eq(applicationIntegrations.status, "active"))).limit(1);
      if (!integration || receipt.applicationId !== integration.applicationId) return res.status(412).json({ error: "not_enrolled", message: "The receipt identity is not bound to an active application integration." });
      const verification = verifySignedHealthReceipt(receipt, integration.publicKeyPem);
      if (!verification.valid) return res.status(400).json({ error: "receipt_invalid", message: verification.reason });
      const usedAt = new Date();
      await db.update(atmosNodeReceiptChallenges).set({ usedAt }).where(and(eq(atmosNodeReceiptChallenges.id, challenge.id), isNull(atmosNodeReceiptChallenges.usedAt)));
      const application = APPLICATION_ATLAS.find(item => item.id === integration.applicationId);
      const readiness = receipt.status === "ok" ? "ready" : receipt.status === "degraded" ? "degraded" : "not_ready";
      await db.insert(nodeStatusReports).values({ nodeId, observedAt: new Date(receipt.issuedAt), version: receipt.version, uptimeClass: "Challenge-bound signed application receipt", applicationReadiness: readiness, reachability: "reachable", verificationState: "verified", narrative: `${application?.name ?? node.name} presented a fresh challenge-bound Ed25519-signed health receipt.`, signedReceiptHash: verification.receiptHash });
      await db.insert(auditEvents).values({ publicId: `aud_${randomUUID().replaceAll("-", "").slice(0, 12)}`, nodeId, eventType: "receipt.recorded", outcome: "verified", actorPseudonym: "atmos-node-receipt", summary: `${application?.name ?? node.name} challenge-bound receipt accepted as ${verification.receiptHash}.`, occurredAt: usedAt });
      return res.status(201).json({ schema: "NEXINUS_ATMOS_RECEIPT_ACCEPTED/v1", accepted: true, nodeId, applicationId: integration.applicationId, receiptHash: verification.receiptHash, observedAt: new Date(receipt.issuedAt).toISOString(), verifiedAt: usedAt.toISOString(), freshnessThresholdSeconds: CHALLENGE_TTL_MS / 1000 });
    } catch (error) {
      console.error("ATMOS signed receipt ingestion failed", error);
      return res.status(503).json({ error: "unavailable", message: "The signed receipt service is unavailable." });
    }
  });
}
