import { createHash } from "node:crypto";
import express from "express";
import http from "node:http";
import { describe, expect, it } from "vitest";
import { generatePasswordHash, isLocalAuthConfigured, registerLocalAuthRoutes, verifyOperatorPassword, verifyPasswordHash } from "./_core/localAuth";

describe("ARCHANGEL first-party operator auth", () => {
  it("exposes an enabled local-auth configuration when the project secret is present", async () => {
    expect(isLocalAuthConfigured()).toBe(true);
    const app = express();
    app.use(express.json());
    registerLocalAuthRoutes(app);
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/local/config`);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ enabled: true, username: "Tyler-Morris", passkeyEnabled: true });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("uses a salted scrypt hash and rejects the wrong passphrase", () => {
    const hash = generatePasswordHash("a deliberately long operator passphrase");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verifyPasswordHash("a deliberately long operator passphrase", hash)).toBe(true);
    expect(verifyPasswordHash("wrong passphrase", hash)).toBe(false);
  });

  it("accepts the prior bare SHA-256 bootstrap digest for one-time migration", () => {
    const legacyPassword = "legacy bootstrap passphrase";
    const legacyDigest = createHash("sha256").update(legacyPassword, "utf8").digest("hex");
    expect(verifyPasswordHash(legacyPassword, legacyDigest)).toBe(true);
    expect(verifyPasswordHash("not the legacy passphrase", legacyDigest)).toBe(false);
  });

  it("supports a raw bootstrap passphrase during a deliberate credential reset", () => {
    const previous = process.env.ARCHANGEL_OPERATOR_PASSWORD;
    process.env.ARCHANGEL_OPERATOR_PASSWORD = "test-only reset passphrase";
    try {
      expect(verifyOperatorPassword("test-only reset passphrase")).toBe(true);
      expect(verifyOperatorPassword("wrong reset passphrase")).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.ARCHANGEL_OPERATOR_PASSWORD;
      else process.env.ARCHANGEL_OPERATOR_PASSWORD = previous;
    }
  });

  it("returns a useful error for a failed login without disclosing credential details", async () => {
    const app = express();
    app.use(express.json());
    registerLocalAuthRoutes(app);
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/local/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "Tyler-Morris", password: "not-the-passphrase" }),
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "authentication_failed", message: "Authentication failed. Check your operator ID and passphrase." });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
