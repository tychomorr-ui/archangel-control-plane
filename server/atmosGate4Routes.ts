import type { Express, Request, Response } from "express";
import { z } from "zod";
import { Gate4Error, authorizeNoop, gate4ConfigFromEnvironment, gate4Status, issueChallenge } from "./atmosGate4";
import { createDurableGate4Store } from "./atmosGate4Store";

const mutationRequestSchema = z.object({
  schema: z.literal("NEXINUS_ATMOS_MUTATION_REQUEST/v1"),
  mutationId: z.string().uuid(),
  challengeId: z.string().uuid(),
  nonce: z.string().min(16).max(256),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  operation: z.string().max(32),
  targetNodeId: z.string().max(64),
  payload: z.object({ reason: z.string().min(1).max(128) }).strict(),
  payloadHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  operatorKeyReference: z.string().min(1).max(128),
  operatorSignature: z.string().min(16).max(512),
}).strict();

function sendError(error: unknown, res: Response) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "bad_request", message: "Gate 4 request shape is invalid." });
  if (error instanceof Gate4Error) {
    const status = error.code === "unauthorized" ? 401 : error.code === "expired" ? 408 : error.code === "replay" ? 409 : error.code === "forbidden" ? 403 : error.code === "misconfigured" ? 503 : 400;
    return res.status(status).json({ error: error.code, message: error.message });
  }
  return res.status(503).json({ error: "unavailable", message: "Gate 4 durable authorization service is unavailable." });
}

export function registerAtmosGate4Routes(app: Express) {
  app.get("/authority/status", (_req, res) => {
    const config = gate4ConfigFromEnvironment();
    res.json(gate4Status(config, process.env.DATABASE_URL ? "durable" : "unconfigured"));
  });

  app.post("/authority/challenge", async (_req: Request, res: Response) => {
    try {
      if (Number(_req.headers["content-length"] ?? 0) > 16_384) return res.status(413).json({ error: "request_too_large" });
      const challenge = await issueChallenge(await createDurableGate4Store(), gate4ConfigFromEnvironment());
      const { usedAt: _usedAt, ...publicChallenge } = challenge;
      res.status(201).json(publicChallenge);
    } catch (error) {
      sendError(error, res);
    }
  });

  app.post("/mutate", async (req: Request, res: Response) => {
    try {
      if (Number(req.headers["content-length"] ?? 0) > 16_384) return res.status(413).json({ error: "request_too_large" });
      const request = mutationRequestSchema.parse(req.body);
      const receipt = await authorizeNoop(await createDurableGate4Store(), gate4ConfigFromEnvironment(), request);
      res.status(200).json(receipt);
    } catch (error) {
      sendError(error, res);
    }
  });
}
