import { createHash, createPublicKey, randomBytes, randomUUID, verify } from "node:crypto";
import type { Express } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { applicationIntegrations, auditEvents, tesseractAWitnessChallenges, tesseractAWitnessReceipts } from "../drizzle/schema";
import { canonicalWitnessJson, hashWitnessObservations, type SignedWitnessReceipt, TESSERACT_A_WITNESS_RECEIPT_SCHEMA, TESSERACT_A_WITNESS_SCOPE } from "../shared/witness";

const CHALLENGE_TTL_MS = 5 * 60_000;
const MAX_CLOCK_SKEW_MS = 30_000;

async function requiredDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured.");
  return db;
}

function isWitnessReceipt(value: unknown): value is SignedWitnessReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Record<string, unknown>;
  if (receipt.schema !== TESSERACT_A_WITNESS_RECEIPT_SCHEMA || receipt.witnessNodeId !== "tesseract-a" || receipt.applicationId !== "tesseract-a") return false;
  if (typeof receipt.challengeId !== "string" || typeof receipt.nonce !== "string" || typeof receipt.issuedAt !== "string" || typeof receipt.expiresAt !== "string") return false;
  if (!Array.isArray(receipt.observations) || typeof receipt.observationSetHash !== "string" || typeof receipt.witnessKeyReference !== "string" || typeof receipt.signature !== "string") return false;
  if (receipt.boundary !== "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY") return false;
  return receipt.observations.every(item => {
    if (!item || typeof item !== "object") return false;
    const observation = item as Record<string, unknown>;
    return typeof observation.nodeId === "string"
      && typeof observation.targetUrl === "string"
      && typeof observation.responseHash === "string"
      && typeof observation.manifestCid === "string"
      && typeof observation.codeHash === "string"
      && typeof observation.serviceKeyReference === "string"
      && observation.serviceSignatureVerified === true
      && typeof observation.expectedManifestMatched === "boolean"
      && typeof observation.expectedArtifactMatched === "boolean";
  });
}

function unsignedReceipt(receipt: SignedWitnessReceipt) {
  const { signature: _signature, ...unsigned } = receipt;
  return unsigned;
}

function receiptHash(receipt: SignedWitnessReceipt) {
  return `sha256:${createHash("sha256").update(canonicalWitnessJson(unsignedReceipt(receipt))).digest("hex")}`;
}

function integrationHasScope(scopes: string, requiredScope: string) {
  try {
    return (JSON.parse(scopes) as unknown[]).includes(requiredScope);
  } catch {
    return false;
  }
}

export function registerWitnessReceiptRoutes(app: Express) {
  app.post("/v1/atmos/witnesses/tesseract-a/challenge", async (_req, res) => {
    try {
      const db = await requiredDb();
      const [integration] = await db.select().from(applicationIntegrations).where(and(eq(applicationIntegrations.applicationId, "tesseract-a"), eq(applicationIntegrations.nodeId, "tesseract-a"), eq(applicationIntegrations.status, "active"))).limit(1);
      if (!integration || !integrationHasScope(integration.scopes, TESSERACT_A_WITNESS_SCOPE)) {
        return res.status(412).json({ error: "not_enrolled", message: "Register an active Tesseract-A integration with the witness:health scope before requesting a witness challenge." });
      }
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
      const challengeId = `wch_${randomUUID()}`;
      const nonce = randomBytes(32).toString("base64url");
      await db.insert(tesseractAWitnessChallenges).values({ challengeId, nonce, issuedAt, expiresAt });
      const fingerprint = createHash("sha256").update(createPublicKey(integration.publicKeyPem).export({ type: "spki", format: "der" })).digest("hex");
      return res.status(201).json({ schema: "TESSERACT_A_WITNESS_CHALLENGE/v1", challengeId, witnessNodeId: "tesseract-a", applicationId: "tesseract-a", nonce, issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString(), requiredReceipt: TESSERACT_A_WITNESS_RECEIPT_SCHEMA, requiredScope: TESSERACT_A_WITNESS_SCOPE, registeredPublicKeyFingerprint: fingerprint });
    } catch (error) {
      console.error("Tesseract-A witness challenge failed", error);
      return res.status(503).json({ error: "unavailable", message: "The witness challenge service is unavailable." });
    }
  });

  app.post("/v1/atmos/witnesses/tesseract-a/receipts", async (req, res) => {
    try {
      const body = req.body as { receipt?: unknown };
      if (!isWitnessReceipt(body.receipt)) return res.status(400).json({ error: "invalid_request", message: `Expected a ${TESSERACT_A_WITNESS_RECEIPT_SCHEMA} receipt.` });
      const receipt = body.receipt;
      const db = await requiredDb();
      const [challenge] = await db.select().from(tesseractAWitnessChallenges).where(eq(tesseractAWitnessChallenges.challengeId, receipt.challengeId)).limit(1);
      if (!challenge) return res.status(404).json({ error: "challenge_not_found", message: "The Tesseract-A witness challenge was not found." });
      if (challenge.usedAt) return res.status(409).json({ error: "replay", message: "The Tesseract-A witness challenge has already been used." });
      if (new Date(challenge.expiresAt).getTime() <= Date.now()) return res.status(410).json({ error: "challenge_expired", message: "The Tesseract-A witness challenge has expired." });
      if (receipt.nonce !== challenge.nonce) return res.status(400).json({ error: "nonce_mismatch", message: "The witness receipt nonce does not match the issued challenge." });
      const issuedAt = Date.parse(receipt.issuedAt);
      const expiresAt = Date.parse(receipt.expiresAt);
      if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > Date.now() + MAX_CLOCK_SKEW_MS || expiresAt <= Date.now() || expiresAt <= issuedAt || expiresAt - issuedAt > CHALLENGE_TTL_MS) {
        return res.status(400).json({ error: "receipt_invalid", message: "The witness receipt validity window is invalid." });
      }
      if (receipt.observationSetHash !== hashWitnessObservations(receipt.observations)) return res.status(400).json({ error: "receipt_invalid", message: "The witness observation-set hash does not match the observations." });
      const [integration] = await db.select().from(applicationIntegrations).where(and(eq(applicationIntegrations.applicationId, "tesseract-a"), eq(applicationIntegrations.nodeId, "tesseract-a"), eq(applicationIntegrations.status, "active"))).limit(1);
      if (!integration || !integrationHasScope(integration.scopes, TESSERACT_A_WITNESS_SCOPE) || receipt.witnessKeyReference.length === 0) return res.status(412).json({ error: "not_enrolled", message: "The Tesseract-A witness is not actively enrolled with the required scope." });
      let signatureValid = false;
      try {
        signatureValid = verify(null, Buffer.from(canonicalWitnessJson(unsignedReceipt(receipt))), createPublicKey(integration.publicKeyPem), Buffer.from(receipt.signature, "base64url"));
      } catch {
        signatureValid = false;
      }
      if (!signatureValid) return res.status(400).json({ error: "receipt_invalid", message: "Tesseract-A witness signature verification failed." });
      const verifiedAt = new Date();
      const hash = receiptHash(receipt);
      await db.update(tesseractAWitnessChallenges).set({ usedAt: verifiedAt }).where(and(eq(tesseractAWitnessChallenges.id, challenge.id), isNull(tesseractAWitnessChallenges.usedAt)));
      await db.insert(tesseractAWitnessReceipts).values({ receiptHash: hash, challengeId: receipt.challengeId, witnessNodeId: receipt.witnessNodeId, observationSetHash: receipt.observationSetHash, observationCount: receipt.observations.length, receiptJson: JSON.stringify(receipt), verifiedAt });
      await db.insert(auditEvents).values({ publicId: `aud_${randomUUID().replaceAll("-", "").slice(0, 12)}`, nodeId: "tesseract-a", eventType: "witness.receipt.recorded", outcome: "verified", actorPseudonym: "tesseract-a-witness", summary: `Tesseract-A witness receipt accepted as ${hash} for ${receipt.observations.length} observed node(s).`, occurredAt: verifiedAt });
      return res.status(201).json({ schema: "TESSERACT_A_WITNESS_RECEIPT_ACCEPTED/v1", accepted: true, witnessNodeId: "tesseract-a", receiptHash: hash, observationSetHash: receipt.observationSetHash, observationCount: receipt.observations.length, verifiedAt: verifiedAt.toISOString(), freshnessThresholdSeconds: CHALLENGE_TTL_MS / 1000 });
    } catch (error) {
      console.error("Tesseract-A witness receipt ingestion failed", error);
      return res.status(503).json({ error: "unavailable", message: "The witness receipt service is unavailable." });
    }
  });
}
