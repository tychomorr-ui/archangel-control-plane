import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { ACTION_SCOPES, actionPolicy, canonicalHealthReceipt, verifySignedHealthReceipt } from "./conductor";

describe("bounded ARCHANGEL conductor contract", () => {
  it("verifies a fresh Ed25519 health receipt and returns a stable digest", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const issuedAt = new Date("2026-09-27T14:30:00.000Z");
    const unsigned = {
      applicationId: "iwa-sage",
      nodeId: "iwa-sage",
      status: "ok" as const,
      version: "2026.09.27.1",
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + 60_000).toISOString(),
      nonce: "nonce-001",
      capabilities: ["health.check"],
    };
    const signature = sign(null, Buffer.from(canonicalHealthReceipt(unsigned)), privateKey).toString("base64url");
    const result = verifySignedHealthReceipt({ ...unsigned, signature }, publicKey.export({ type: "spki", format: "pem" }).toString(), new Date("2026-09-27T14:30:20.000Z"));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.receiptHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("rejects tampering and expired receipts", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const unsigned = {
      applicationId: "keira",
      nodeId: "keira",
      status: "ok" as const,
      version: "1.0.0",
      issuedAt: "2026-09-27T14:30:00.000Z",
      expiresAt: "2026-09-27T14:31:00.000Z",
      nonce: "nonce-002",
      capabilities: [],
    };
    const signature = sign(null, Buffer.from(canonicalHealthReceipt(unsigned)), privateKey).toString("base64url");
    const tampered = verifySignedHealthReceipt({ ...unsigned, status: "degraded", signature }, publicKey.export({ type: "spki", format: "pem" }).toString(), new Date("2026-09-27T14:30:20.000Z"));
    expect(tampered).toMatchObject({ valid: false });
    const expired = verifySignedHealthReceipt({ ...unsigned, signature }, publicKey.export({ type: "spki", format: "pem" }).toString(), new Date("2026-09-27T14:32:00.000Z"));
    expect(expired).toMatchObject({ valid: false, reason: "Receipt is expired." });
  });

  it("limits conductor actions to declared, non-infrastructure operations", () => {
    expect(Object.keys(ACTION_SCOPES)).toEqual(["health.check", "deployment.status", "cache.refresh"]);
    expect(actionPolicy("cache.refresh")).toMatchObject({ reversible: true, mutatesInfrastructure: false, allowsShell: false, requiresSignedReceipt: true, requiresIdempotencyKey: true, requiresAuditRecord: true });
  });
});
