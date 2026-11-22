import express from "express";
import { describe, expect, it } from "vitest";
import { registerPamEvidenceRoutes } from "./pamEvidenceRoutes";

async function withServer(app: express.Express, run: (baseUrl: string) => Promise<void>) {
  const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

const request = {
  schema: "NEXINUS_PAM_EVIDENCE_REQUEST/v1",
  requestId: "pam_test_keira_001",
  target: "keira",
  operation: "version",
  requestedAt: "2026-11-22T22:00:00.000Z",
  purpose: "display the remote version only",
} as const;

describe("PAM read-only evidence contract", () => {
  it("fetches only an allowlisted KEIRA read and declares no authority", async () => {
    const app = express();
    app.use(express.json());
    registerPamEvidenceRoutes(app, {
      isAllowedCaller: () => true,
      fetchEvidence: async (target, received) => ({ target, requestId: received.requestId, version: "keira-test-1" }),
    });

    await withServer(app, async baseUrl => {
      const response = await fetch(`${baseUrl}/v1/pam/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await response.json() as Record<string, unknown>;
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        schema: "NEXINUS_PAM_EVIDENCE_RESPONSE/v1",
        requestId: request.requestId,
        target: "keira",
        operation: "version",
        state: "FETCHED",
        authority: "none",
        mutatesRemoteState: false,
        evidence: { target: "keira", version: "keira-test-1" },
      });
    });
  });

  it("returns UNKNOWN for a caller that is not explicitly allowlisted", async () => {
    const app = express();
    app.use(express.json());
    registerPamEvidenceRoutes(app, {
      isAllowedCaller: () => false,
      fetchEvidence: async () => { throw new Error("must not be called"); },
    });

    await withServer(app, async baseUrl => {
      const response = await fetch(`${baseUrl}/v1/pam/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...request, requestId: "pam_test_valkyrie_001", target: "valkyrie", operation: "evidence" }),
      });
      const body = await response.json() as Record<string, unknown>;
      expect(response.status).toBe(403);
      expect(body).toMatchObject({ state: "UNKNOWN", target: "valkyrie", reason: "caller_not_allowlisted", authority: "none", mutatesRemoteState: false });
    });
  });

  it("rejects an unsupported target or extra command fields", async () => {
    const app = express();
    app.use(express.json());
    registerPamEvidenceRoutes(app, { isAllowedCaller: () => true });

    await withServer(app, async baseUrl => {
      const response = await fetch(`${baseUrl}/v1/pam/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...request, target: "root-gate", command: "restart" }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: "invalid_request" });
    });
  });
});
