import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { issueCapabilityEnvelope, verifyCapabilityEnvelope } from "./capabilityEnvelope";

const base = {
  envelopeId: "env_test_001",
  issuer: "operator:primary",
  subject: "atmos:archangel",
  operation: "SET_CONTROL_PLANE_MODE",
  scope: "control.mode",
  target: "ARCHANGEL",
  issuedAt: 1_000,
  expiresAt: 61_000,
  approvalRequired: true,
  approvalReference: "approval:test:001",
  rollbackOperation: "SET_CONTROL_PLANE_MODE",
  payload: { mode: "maintenance" },
};

function fixture() {
  const keys = generateKeyPairSync("ed25519");
  return { keys, envelope: issueCapabilityEnvelope(base, keys.privateKey) };
}

describe("ATMOS capability envelope", () => {
  it("accepts a signed, scoped, approved, unexpired envelope", () => {
    const { keys, envelope } = fixture();
    expect(verifyCapabilityEnvelope(envelope, keys.publicKey, 10_000, { scope: "control.mode", target: "ARCHANGEL", approvalPresent: true })).toEqual({ accepted: true, reason: "accepted" });
  });

  it("rejects signature tampering", () => {
    const { keys, envelope } = fixture();
    const tampered = { ...envelope, target: "ROOT-GATE" };
    expect(verifyCapabilityEnvelope(tampered, keys.publicKey, 10_000, { scope: "control.mode", target: "ARCHANGEL", approvalPresent: true }).reason).toBe("target_not_allowed");
    expect(verifyCapabilityEnvelope({ ...envelope, operation: "UNSAFE_SHELL" }, keys.publicKey, 10_000, { approvalPresent: true }).reason).toBe("signature_invalid");
  });

  it("rejects expiry, scope escalation, and missing approval", () => {
    const { keys, envelope } = fixture();
    expect(verifyCapabilityEnvelope(envelope, keys.publicKey, 61_000, { approvalPresent: true }).reason).toBe("expired_or_not_yet_valid");
    expect(verifyCapabilityEnvelope(envelope, keys.publicKey, 10_000, { scope: "mesh.activate", approvalPresent: true }).reason).toBe("scope_not_allowed");
    expect(verifyCapabilityEnvelope(envelope, keys.publicKey, 10_000, { scope: "control.mode", target: "ARCHANGEL", approvalPresent: false }).reason).toBe("approval_required");
  });

  it("rejects an untrusted signing key", () => {
    const { envelope } = fixture();
    const other = generateKeyPairSync("ed25519");
    expect(verifyCapabilityEnvelope(envelope, other.publicKey, 10_000, { approvalPresent: true }).reason).toBe("signature_invalid");
  });
});
