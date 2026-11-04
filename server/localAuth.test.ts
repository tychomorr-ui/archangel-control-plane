import express from "express";
import http from "node:http";
import { describe, expect, it } from "vitest";
import { isLocalAuthConfigured, registerLocalAuthRoutes } from "./_core/localAuth";

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
      expect(await response.json()).toEqual({ enabled: true, username: "operator" });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
