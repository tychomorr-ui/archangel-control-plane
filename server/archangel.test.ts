import { describe, expect, it } from "vitest";
import { AUDIT_EVENT_TYPES, FLEET_NODES, OPERATION_TYPES, TOPOLOGY_LAYOUT_CONTRACT } from "../shared/archangel";
import { archangelRouter, evidenceRecordSchema, intentProposalSchema, intentReviewSchema, parsePlainLanguageCommand } from "./archangel";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("ARCHANGEL fleet contract", () => {
  it("keeps the declared core, bridge, and outer-circle topology intact", () => {
    expect(FLEET_NODES.map(node => node.name)).toEqual([
      "Root-Gate",
      "Tesseract-Terminus",
      "XinUS-Clarity",
      "Monarch-OS",
      "Tesseract-A",
      "KEIRA",
      "Project Reclaim",
      "IWA Sage",
      "Resonate Earth",
      "Exitus Lens",
    ]);
    expect(FLEET_NODES.find(node => node.id === "project-reclaim")).toMatchObject({
      cluster: "Bridge",
      declaredState: "Declared running",
      region: "Oregon · us-west-2 · Lake & Mendocino field node",
    });
    expect(FLEET_NODES.find(node => node.id === "root-gate")).toMatchObject({
      region: "N. Virginia · us-east-1 · ROOT_SOVEREIGN-IDENTITY",
      declaredState: "Declared running",
    });
    expect(FLEET_NODES.find(node => node.id === "iwa-sage")).toMatchObject({ declaredState: "Declared running" });
    expect(FLEET_NODES.filter(node => node.cluster === "Outer").map(node => node.id)).toEqual(["iwa-sage", "resonate-earth", "exitus-lens"]);
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

  it("normalizes only the approved plain-language control grammar and rejects shell-shaped input", () => {
    expect(parsePlainLanguageCommand('backup verify tesseract-a scope="Verify the current mirror backup evidence." risk=low rollback="No mutation is made during verification." ttl=30m')).toMatchObject({
      nodeId: "tesseract-a",
      operationType: "backup verify",
      risk: "low",
    });
    expect(parsePlainLanguageCommand('restart monarch-os scope="Restart the declared operating-system service after maintenance." risk=moderate rollback="Restore the prior validated service unit state." ttl=30m')).toMatchObject({
      nodeId: "kether-gate",
      operationType: "restart",
    });
    expect(parsePlainLanguageCommand('restart monarch-os scope="Restart service; rm -rf /" risk=high rollback="Restore the previous unit state." ttl=30m')).toBeNull();
    expect(parsePlainLanguageCommand('shell exec root-gate scope="Run whatever is supplied." risk=critical rollback="No rollback." ttl=30m')).toBeNull();
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
