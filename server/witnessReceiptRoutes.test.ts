import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import { applicationIntegrations, auditEvents, tesseractAWitnessChallenges, tesseractAWitnessReceipts } from "../drizzle/schema";
import { canonicalWitnessJson, hashWitnessObservations } from "../shared/witness";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { getDb } from "./db";
import { registerWitnessReceiptRoutes } from "./witnessReceiptRoutes";

function deterministicKeyPair() {
  const seed = Buffer.from("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", "hex");
  const pkcs8Prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = createPrivateKey({ key: Buffer.concat([pkcs8Prefix, seed]), format: "der", type: "pkcs8" });
  return { privateKey, publicKeyPem: createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString() };
}

describe("ARCHANGEL Tesseract-A witness intake", () => {
  it("issues a challenge and accepts one signed observation-set receipt", async () => {
    const { privateKey, publicKeyPem } = deterministicKeyPair();
    const now = new Date();
    const challenges: Record<string, unknown>[] = [];
    const receipts: Record<string, unknown>[] = [];
    const audits: Record<string, unknown>[] = [];
    const integration = { id: 1, applicationId: "tesseract-a", nodeId: "tesseract-a", endpointUrl: "https://tesseract.nexinus.net", publicKeyPem, scopes: JSON.stringify(["witness:health"]), status: "active" };
    const db = {
      select: () => ({
        from: (table: unknown) => {
          const rows = table === applicationIntegrations ? [integration] : table === tesseractAWitnessChallenges ? challenges : [];
          const query = Promise.resolve(rows) as Promise<unknown[]> & { where?: () => typeof query; limit?: (count: number) => Promise<unknown[]> };
          query.where = () => query;
          query.limit = async (count: number) => rows.slice(0, count);
          return query;
        },
      }),
      insert: (table: unknown) => ({ values: async (value: Record<string, unknown>) => {
        if (table === tesseractAWitnessChallenges) challenges.push({ ...value, id: challenges.length + 1, usedAt: null });
        if (table === tesseractAWitnessReceipts) receipts.push({ ...value, id: receipts.length + 1 });
        if (table === auditEvents) audits.push(value);
      } }),
      update: (table: unknown) => ({ set: (patch: Record<string, unknown>) => ({ where: async () => { if (table === tesseractAWitnessChallenges) Object.assign(challenges[0], patch); } }) }),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);

    const app = express();
    app.use(express.json());
    registerWitnessReceiptRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listening = app.listen(0, () => resolve(listening));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address.");

    try {
      const challengeResponse = await fetch(`http://127.0.0.1:${address.port}/v1/atmos/witnesses/tesseract-a/challenge`, { method: "POST" });
      const challenge = await challengeResponse.json() as { challengeId: string; nonce: string; expiresAt: string };
      expect(challengeResponse.status).toBe(201);
      const observation = {
        nodeId: "valkyrie-adjudication-entity",
        targetUrl: "https://valkyrie.nexinus.net/health",
        responseHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        manifestCid: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        codeHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        serviceKeyReference: "valkyrie:service",
        serviceSignatureVerified: true,
        expectedManifestMatched: true,
        expectedArtifactMatched: true,
      } as const;
      const unsigned = {
        schema: "TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1",
        witnessNodeId: "tesseract-a",
        applicationId: "tesseract-a",
        challengeId: challenge.challengeId,
        nonce: challenge.nonce,
        issuedAt: new Date().toISOString(),
        expiresAt: challenge.expiresAt,
        observations: [observation],
        observationSetHash: hashWitnessObservations([observation]),
        witnessKeyReference: "tesseract-a:test-vector",
        boundary: "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY",
      } as const;
      const receipt = { ...unsigned, signature: sign(null, Buffer.from(canonicalWitnessJson(unsigned)), privateKey).toString("base64url") };
      const receiptResponse = await fetch(`http://127.0.0.1:${address.port}/v1/atmos/witnesses/tesseract-a/receipts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ receipt }) });
      const responseBody = await receiptResponse.json() as Record<string, unknown>;
      expect(receiptResponse.status).toBe(201);
      expect(responseBody).toMatchObject({ accepted: true, witnessNodeId: "tesseract-a", observationCount: 1 });
      expect(receipts).toHaveLength(1);
      expect(audits).toHaveLength(1);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
