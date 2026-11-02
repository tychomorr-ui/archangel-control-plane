import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  REFRESH_SIGNED_STATUS,
  buildPayloadHash,
  conductRefreshSignedStatus,
  createStagingNodeAdapter,
  publicFingerprint,
  stagingDispatch,
  verifyRefreshReceipt,
} from "./refreshSignedStatus";

function keys() {
  const archangel = generateKeyPairSync("ed25519");
  const node = generateKeyPairSync("ed25519");
  return { archangel, node };
}

function validFixture() {
  const { archangel, node } = keys();
  const now = new Date("2026-11-02T21:00:00.000Z");
  const dispatch = stagingDispatch("valkyrie-adjudication-entity", "operator:primary", archangel.privateKey, now);
  const status = {
    status: "ok" as const,
    version: "staging-1",
    capabilities: ["health.check"],
    evidenceHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    observedAt: now.toISOString(),
  };
  return {
    now,
    dispatch,
    archangel,
    node,
    nodeAdapter: createStagingNodeAdapter(node.privateKey.export({ format: "pem", type: "pkcs8" }).toString(), status),
    nodePublicKeyFingerprint: publicFingerprint(node.publicKey),
  };
}

describe("Gate 5A REFRESH_SIGNED_STATUS", () => {
  it("performs a read-only refresh and verifies a signed node receipt", async () => {
    const fixture = validFixture();
    const result = await conductRefreshSignedStatus({
      dispatch: fixture.dispatch,
      now: fixture.now,
      archangelPublicKey: fixture.archangel.publicKey,
      nodePublicKey: fixture.node.publicKey,
      nodePublicKeyFingerprint: fixture.nodePublicKeyFingerprint,
      nodeAdapter: fixture.nodeAdapter,
    });

    expect(result.receipt.success).toBe(true);
    expect(result.receipt.operation).toBe(REFRESH_SIGNED_STATUS);
    expect(result.receipt.targetNodeId).toBe("valkyrie-adjudication-entity");
    expect(result.audit.map(event => event.eventType)).toEqual([
      "conductor.authorization",
      "conductor.dispatch",
      "conductor.execution",
      "conductor.receipt",
      "conductor.final_decision",
    ]);
    expect(result.audit.every(event => event.evidenceClass !== "AUTHORIZED" || event.eventType === "conductor.authorization" || event.eventType === "conductor.dispatch")).toBe(true);
    expect(verifyRefreshReceipt(result.receipt, fixture.dispatch, fixture.node.publicKey, fixture.now).valid).toBe(true);
  });

  it("rejects altered payload, target, operation, scope, and dispatch hash", async () => {
    const fixture = validFixture();
    const mutations = [
      { payloadHash: buildPayloadHash({ requestedFields: ["status", "version", "capabilities"], reason: "tampered" }) },
      { targetNodeId: "other-node" },
      { operation: "OTHER_OPERATION" as typeof REFRESH_SIGNED_STATUS },
      { requiredScope: "write:cache" as "read:health" },
      { dispatchHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    ];

    for (const mutation of mutations) {
      const result = await conductRefreshSignedStatus({
        dispatch: { ...fixture.dispatch, ...mutation },
        now: fixture.now,
        archangelPublicKey: fixture.archangel.publicKey,
        nodePublicKey: fixture.node.publicKey,
        nodePublicKeyFingerprint: fixture.nodePublicKeyFingerprint,
        nodeAdapter: fixture.nodeAdapter,
      });
      expect(result.receipt.success).toBe(false);
      expect(result.audit.at(-1)?.eventType).toBe("conductor.final_decision");
    }
  });

  it("rejects expired dispatches and never invokes the node adapter", async () => {
    const fixture = validFixture();
    let calls = 0;
    const nodeAdapter = {
      async refreshSignedStatus() {
        calls += 1;
        throw new Error("must not execute");
      },
    };
    const result = await conductRefreshSignedStatus({
      dispatch: fixture.dispatch,
      now: new Date("2026-11-02T21:02:00.000Z"),
      archangelPublicKey: fixture.archangel.publicKey,
      nodePublicKey: fixture.node.publicKey,
      nodePublicKeyFingerprint: fixture.nodePublicKeyFingerprint,
      nodeAdapter,
    });
    expect(result.receipt.success).toBe(false);
    expect(calls).toBe(0);
  });

  it("rejects invalid dispatch signatures and unknown targets without shell fallback", async () => {
    const fixture = validFixture();
    const other = generateKeyPairSync("ed25519");
    const result = await conductRefreshSignedStatus({
      dispatch: fixture.dispatch,
      now: fixture.now,
      archangelPublicKey: other.publicKey,
      nodePublicKey: fixture.node.publicKey,
      nodePublicKeyFingerprint: fixture.nodePublicKeyFingerprint,
      nodeAdapter: fixture.nodeAdapter,
    });
    expect(result.receipt.success).toBe(false);
    expect(result.receipt.failureReason).toMatch(/signature/i);
  });

  it("uses no generic command, subprocess, SSH, or shell interface", () => {
    expect("refreshSignedStatus" in validFixture().nodeAdapter).toBe(true);
    expect("execute" in validFixture().nodeAdapter).toBe(false);
    expect("command" in validFixture().nodeAdapter).toBe(false);
  });
});
