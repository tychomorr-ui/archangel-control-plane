import { describe, expect, it } from "vitest";
import { AUDIT_EVENT_TYPES, FLEET_NODES, OPERATION_TYPES, TOPOLOGY_LAYOUT_CONTRACT } from "../shared/archangel";
import { archangelRouter, evidenceRecordSchema, intentProposalSchema, intentReviewSchema } from "./archangel";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("ARCHANGEL fleet contract", () => {
  it("keeps the declared seven-node topology and its bridge layer intact", () => {
    expect(FLEET_NODES.map(node => node.name)).toEqual([
      "Root-Gate",
      "Tesseract-Terminus",
      "XinUS-Clarity",
      "Kether-Gate",
      "Tesseract-A",
      "KEIRA",
      "Project Reclaim",
      "IWA Sage",
      "Resonate Earth",
    ]);
    expect(FLEET_NODES.find(node => node.id === "project-reclaim")).toMatchObject({
      cluster: "Bridge",
      declaredState: "Declared running",
      region: "Oregon · us-west-2 · Lake & Mendocino field node",
    });
    expect(FLEET_NODES.find(node => node.id === "root-gate")).toMatchObject({
      region: "N. Virginia · us-east-1 · planned rebuild",
      declaredState: "Planned deployment",
    });
    expect(FLEET_NODES.filter(node => node.cluster === "Outer").map(node => node.id)).toEqual(["iwa-sage", "resonate-earth"]);
  });

  it("preserves the explicit two-triangle vertex order and bridge clearance contract", () => {
    expect(TOPOLOGY_LAYOUT_CONTRACT.vertices).toEqual([
      { id: "xinus-clarity", tone: "alpha", position: "alpha-apex" },
      { id: "root-gate", tone: "alpha", position: "alpha-root" },
      { id: "tesseract-terminus", tone: "alpha", position: "alpha-terminus" },
      { id: "kether-gate", tone: "beta", position: "beta-kether" },
      { id: "tesseract-a", tone: "beta", position: "beta-tesseract-a" },
      { id: "keira", tone: "beta", position: "beta-keira" },
      { id: "project-reclaim", tone: "bridge", position: "bridge-reclaim" },
    ]);
    expect(TOPOLOGY_LAYOUT_CONTRACT.spacing).toMatchObject({
      mobileMinCanvasHeightPx: 900,
      desktopMinCanvasHeightPx: 940,
      betaKeiraTopPercent: 76,
      bridgeBottomPercent: 1,
    });
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
