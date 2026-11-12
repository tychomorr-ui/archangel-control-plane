import { chmodSync, createPrivateKey, createPublicKey, existsSync, mkdtempSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { registerNodeReceiptRoutes } from "./nodeReceiptRoutes";
import { archangelRouter } from "./archangel";
import { getDb } from "./db";
import { applicationIntegrations, atmosNodeReceiptChallenges, auditEvents, nodeStatusReports } from "../drizzle/schema";
import { canonicalHealthReceipt } from "./conductor";

const TEST_NODE_ID = "tesseract-a";
const TEST_APPLICATION_ID = "tesseract-a";
const TEST_CHALLENGE_ID = "ch_test_tesseract_a_001";
const TEST_NONCE = "deterministic-tesseract-a-receipt-nonce";

function deterministicKeyPair() {
  const seed = Buffer.from("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", "hex");
  const pkcs8Prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = createPrivateKey({ key: Buffer.concat([pkcs8Prefix, seed]), format: "der", type: "pkcs8" });
  return { privateKey, publicKeyPem: createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString() };
}

function createDbDouble(publicKeyPem: string) {
  const now = new Date();
  const storedChallenges = [{ id: 1, challengeId: TEST_CHALLENGE_ID, nodeId: TEST_NODE_ID, nonce: TEST_NONCE, issuedAt: now, expiresAt: new Date(now.getTime() + 5 * 60_000), usedAt: null }];
  const storedIntegrations = [{ id: 1, applicationId: TEST_APPLICATION_ID, nodeId: TEST_NODE_ID, endpointUrl: "https://tesseract-a.manus.space", publicKeyPem, scopes: JSON.stringify(["read:health"]), status: "active" }];
  const storedReports: Record<string, unknown>[] = [];
  const storedAudit: Record<string, unknown>[] = [];

  const rowsFor = (table: unknown) => {
    if (table === atmosNodeReceiptChallenges) return storedChallenges;
    if (table === applicationIntegrations) return storedIntegrations;
    if (table === nodeStatusReports) return storedReports;
    if (table === auditEvents) return storedAudit;
    return [];
  };

  const queryFor = (rows: unknown[]) => {
    const query = Promise.resolve(rows) as Promise<unknown[]> & {
      where?: () => ReturnType<typeof queryFor>;
      orderBy?: () => ReturnType<typeof queryFor>;
      limit?: (count: number) => Promise<unknown[]>;
    };
    query.where = () => queryFor(rows);
    query.orderBy = () => queryFor(rows);
    query.limit = async (count: number) => rows.slice(0, count);
    return query;
  };

  const db = {
    select: () => ({
      from: (table: unknown) => queryFor(rowsFor(table)),
    }),
    insert: (table: unknown) => ({
      values: async (value: Record<string, unknown>) => {
        if (table === nodeStatusReports) storedReports.push({ ...value, id: storedReports.length + 1 });
        if (table === auditEvents) storedAudit.push(value);
      },
    }),
    update: (table: unknown) => ({
      set: (patch: Record<string, unknown>) => ({
        where: async () => {
          if (table === atmosNodeReceiptChallenges) Object.assign(storedChallenges[0], patch);
        },
      }),
    }),
  };

  return { db, storedReports, storedAudit };
}

describe("ARCHANGEL node receipt intake", () => {
  it("accepts one deterministic signed receipt and exposes one verified console result", async () => {
    const { privateKey, publicKeyPem } = deterministicKeyPair();
    const state = createDbDouble(publicKeyPem);
    vi.mocked(getDb).mockResolvedValue(state.db as never);

    const issuedAt = new Date();
    const unsignedReceipt = {
      applicationId: TEST_APPLICATION_ID,
      nodeId: TEST_NODE_ID,
      status: "ok" as const,
      version: "test-tesseract-a-1.0.0",
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + 60_000).toISOString(),
      nonce: TEST_NONCE,
      capabilities: ["health.check"],
    };
    const signature = sign(null, Buffer.from(canonicalHealthReceipt(unsignedReceipt)), privateKey).toString("base64url");
    const receipt = { ...unsignedReceipt, signature };

    const app = express();
    app.use(express.json());
    registerNodeReceiptRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listening = app.listen(0, () => resolve(listening));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address.");

    let response: Response;
    try {
      response = await fetch(`http://127.0.0.1:${address.port}/v1/atmos/nodes/${TEST_NODE_ID}/receipts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId: TEST_CHALLENGE_ID, receipt }),
      });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }

    const responseBody = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(201);
    expect(responseBody).toMatchObject({ accepted: true, nodeId: TEST_NODE_ID, applicationId: TEST_APPLICATION_ID });
    expect(state.storedReports).toHaveLength(1);
    expect(state.storedReports[0]).toMatchObject({ nodeId: TEST_NODE_ID, verificationState: "verified", signedReceiptHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) });

    const caller = archangelRouter.createCaller({ user: { id: 7, openId: "operator", role: "admin" } } as TrpcContext);
    const evidence = await caller.atmosEvidence();
    expect(evidence.summary.verifiedReceipts).toBe(1);
    expect(evidence.nodes.find(node => node.nodeId === TEST_NODE_ID.toUpperCase())).toMatchObject({ evidenceState: "verified", signedReceiptHash: state.storedReports[0]?.signedReceiptHash });

    console.log(JSON.stringify({
      intake: { httpStatus: response.status, response: responseBody },
      insertedRow: state.storedReports[0],
      consoleRead: { nodeId: TEST_NODE_ID.toUpperCase(), evidenceState: evidence.nodes.find(node => node.nodeId === TEST_NODE_ID.toUpperCase())?.evidenceState, verifiedReceipts: evidence.summary.verifiedReceipts },
    }, null, 2));
  });

  it("runs the submitter against the intake and exposes one verified console result", async () => {
    const { privateKey, publicKeyPem } = deterministicKeyPair();
    const state = createDbDouble(publicKeyPem);
    vi.mocked(getDb).mockResolvedValue(state.db as never);

    let generatedChallenge: Record<string, unknown> | undefined;
    const originalSelect = state.db.select;
    const originalInsert = state.db.insert;
    const queryRows = (rows: unknown[]) => {
      const query = Promise.resolve(rows) as Promise<unknown[]> & {
        where?: () => ReturnType<typeof queryRows>;
        limit?: (count: number) => Promise<unknown[]>;
      };
      query.where = () => queryRows(rows);
      query.limit = async (count: number) => rows.slice(0, count);
      return query;
    };
    (state.db as any).select = () => ({
      from: (table: unknown) => table === atmosNodeReceiptChallenges
        ? queryRows(generatedChallenge ? [generatedChallenge] : [])
        : originalSelect().from(table),
    });
    (state.db as any).insert = (table: unknown) => table === atmosNodeReceiptChallenges
      ? { values: async (value: Record<string, unknown>) => { generatedChallenge = { ...value, id: 1, usedAt: null }; } }
      : originalInsert(table);

    const tempDir = mkdtempSync(join(tmpdir(), "archangel-submit-test-"));
    chmodSync(tempDir, 0o700);
    const keyFile = join(tempDir, "node.pem");
    writeFileSync(keyFile, privateKey.export({ format: "pem", type: "pkcs8" }), { mode: 0o600 });
    chmodSync(keyFile, 0o600);

    const app = express();
    app.use(express.json());
    registerNodeReceiptRoutes(app);
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listening = app.listen(0, () => resolve(listening));
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address.");

    const submitterPath = join(process.cwd(), "launch", "submit-atmos-node-receipt.mjs");
    const submitterArgs = [
      submitterPath,
      `http://127.0.0.1:${address.port}`,
      TEST_NODE_ID,
      "test-submitter-1.0.0",
      "ok",
      "health.check",
    ];
    const childEnv = {
      PATH: process.env.PATH ?? "",
      ATMOS_NODE_PRIVATE_KEY_FILE: keyFile,
    };
    expect("DATABASE_URL" in childEnv).toBe(false);

    let stdout = "";
    let stderr = "";
    let exitCode: number | null = null;
    try {
      const child = spawn(process.execPath, submitterArgs, { cwd: process.cwd(), env: childEnv });
      child.stdout.on("data", chunk => { stdout += String(chunk); });
      child.stderr.on("data", chunk => { stderr += String(chunk); });
      exitCode = await new Promise<number | null>((resolve, reject) => {
        child.once("error", () => reject(new Error("submitter process failed to start")));
        child.once("close", code => resolve(code));
      });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      unlinkSync(keyFile);
      rmdirSync(tempDir);
    }

    expect(exitCode).toBe(0);
    expect(stdout).toContain('"accepted": true');
    expect(stderr).toBe("");
    expect(state.storedReports).toHaveLength(1);
    expect(state.storedReports[0]).toMatchObject({ nodeId: TEST_NODE_ID, verificationState: "verified", signedReceiptHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) });

    const caller = archangelRouter.createCaller({ user: { id: 7, openId: "operator", role: "admin" } } as TrpcContext);
    const evidence = await caller.atmosEvidence();
    expect(evidence.summary.verifiedReceipts).toBe(1);
    expect(evidence.nodes.find(node => node.nodeId === TEST_NODE_ID.toUpperCase())).toMatchObject({ evidenceState: "verified", signedReceiptHash: state.storedReports[0]?.signedReceiptHash });
    expect(existsSync(keyFile)).toBe(false);
  });
});
