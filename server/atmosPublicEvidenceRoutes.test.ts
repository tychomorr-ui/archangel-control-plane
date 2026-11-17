import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { registerAtmosPublicEvidenceRoutes } from "./atmosPublicEvidenceRoutes";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

async function startTestServer() {
  const app = express();
  registerAtmosPublicEvidenceRoutes(app);
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not bind to a TCP port");
  return `http://127.0.0.1:${address.port}`;
}

describe("public ATMOS evidence routes", () => {
  it("serves the signed identity document as JSON", async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/.well-known/atmos-identity.json`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.schema).toBe("NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v1");
    expect(body.nodeId).toBe("ARCHANGEL");
    expect(body.signature).toBeTruthy();
  });

  it("serves governance evidence as JSON", async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/governance`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.schema).toBe("NEXINUS_ATMOS_GOVERNANCE/v1");
    expect(body.policy).toBe("PUBLIC_NOOP_ADMIT_AND_BIND");
    expect(body.boundary).toContain("Neither publishes DNS nor marks a node VERIFIED");
  });

  it("refuses an unsigned health claim for a changed running artifact", async () => {
    const baseUrl = await startTestServer();
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.nodeId).toBe("ARCHANGEL");
    expect(body.status).toBe("down");
    expect(body.boundary).toBe("NO_UNSIGNED_HEALTH_CLAIM");
  });
});
