import { describe, expect, it } from "vitest";
import { AUDIT_EVENT_TYPES, FLEET_NODES, OPERATION_TYPES } from "../shared/archangel";
import { archangelRouter, evidenceRecordSchema, intentProposalSchema, intentReviewSchema } from "./archangel";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("ARCHANGEL fleet contract", () => {
  it("keeps the declared six-node inventory intact", () => {
    expect(FLEET_NODES.map(node => node.name)).toEqual([
      "Root-Gate",
      "Tesseract-Terminus",
      "XinUS-Clarity",
      "Kether-Gate",
      "Tesseract-A",
      "The_Portal",
    ]);
  });

  it("allows only the bounded operation vocabulary", () => {
    expect(OPERATION_TYPES).toEqual([
      "deploy",
      "restart",
      "configuration promote",
      "backup verify",
    ]);
    expect(() => intentProposalSchema.parse({
      nodeId: "root-gate",
      operationType: "shell exec",
      scope: "Attempt an unbounded shell operation",
      risk: "critical",
      expiresAt: new Date(Date.now() + 60_000),
      rollbackMethod: "No safe rollback is declared",
    })).toThrow();
  });

  it("reserves a structured audit vocabulary for every control-plane stage", () => {
    expect(AUDIT_EVENT_TYPES).toEqual([
      "intent.proposed",
      "intent.approved",
      "receipt.recorded",
      "verification.outcome",
    ]);
  });

  it("accepts only a separate review decision and bounded evidence events", () => {
    expect(intentReviewSchema.parse({ publicId: "int_a1b2c3d4e5f6", decision: "approved" })).toEqual({ publicId: "int_a1b2c3d4e5f6", decision: "approved" });
    expect(evidenceRecordSchema.parse({ nodeId: "root-gate", eventType: "verification.outcome", outcome: "verified", summary: "Signature, freshness, and canonical payload validation succeeded." }).eventType).toBe("verification.outcome");
    expect(() => evidenceRecordSchema.parse({ nodeId: "root-gate", eventType: "shell.executed", outcome: "verified", summary: "Unbounded command output" })).toThrow();
  });

  it("rejects unauthenticated fleet reads before accessing protected data", async () => {
    const caller = appRouter.createCaller({ user: null } as TrpcContext);
    await expect(caller.archangel.fleet()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not expose a mutation that edits or deletes audit records", () => {
    const procedures = Object.keys(archangelRouter._def.procedures);
    expect(procedures).not.toContain("deleteAudit");
    expect(procedures).not.toContain("editAudit");
  });
});
