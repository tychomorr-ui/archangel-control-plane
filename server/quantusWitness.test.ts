import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  QUANTUS_WITNESS_BOUNDARY,
  QUANTUS_WITNESS_NODE_ID,
  QUANTUS_WITNESS_RECEIPT_SCHEMA,
  QUANTUS_WITNESS_STATUS_SCHEMA,
  canonicalQuantusWitnessJson,
  hashQuantusStatusPayload,
  hashQuantusWitnessReceipt,
  unsignedQuantusWitnessReceipt,
} from "../shared/quantusWitness";

function deterministicKeyPair() {
  const seed = Buffer.from("8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677", "hex");
  const pkcs8Prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = createPrivateKey({ key: Buffer.concat([pkcs8Prefix, seed]), format: "der", type: "pkcs8" });
  const publicKey = createPublicKey(privateKey);
  return {
    privateKey,
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
    fingerprint: `sha256:${createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex")}`,
  };
}

describe("ARCHANGEL Quantus witness contract", () => {
  it("canonicalizes and verifies a deterministic manifest-bound receipt", () => {
    const { privateKey, fingerprint } = deterministicKeyPair();
    const rawStatus = JSON.stringify({ schema: "QUANTUS_WITNESS_STATUS/v1", service: "QUANTUS_WITNESS", nodeId: "QUANTUS", status: "READY", reviewBoundary: "READ_ONLY_WITNESS_NO_AUTHORITY", issuedAt: "2026-11-21T00:00:00.000Z", expiresAt: "2026-11-21T00:05:00.000Z", payload: { ready: true, version: "quantus-test-1" } });
    const unsigned = {
      schema: QUANTUS_WITNESS_RECEIPT_SCHEMA,
      witnessNodeId: QUANTUS_WITNESS_NODE_ID,
      applicationId: "quantus",
      challengeId: "wch_quantus_deterministic",
      nonce: "quantus_nonce_deterministic",
      issuedAt: "2026-11-21T00:00:00.000Z",
      expiresAt: "2026-11-21T00:05:00.000Z",
      status: "READY" as const,
      statusSchema: QUANTUS_WITNESS_STATUS_SCHEMA,
      statusPayloadHash: hashQuantusStatusPayload(rawStatus),
      manifestPayloadSha256: "sha256:1111111111111111111111111111111111111111111111111111111111111111" as const,
      artifactSha256: "sha256:2222222222222222222222222222222222222222222222222222222222222222" as const,
      publicKeyFingerprintSha256: fingerprint,
      boundary: QUANTUS_WITNESS_BOUNDARY,
    };
    const signature = sign(null, Buffer.from(canonicalQuantusWitnessJson(unsigned)), privateKey).toString("base64url");
    const receipt = { ...unsigned, signature };
    expect(hashQuantusWitnessReceipt(unsigned)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(verify(null, Buffer.from(canonicalQuantusWitnessJson(unsigned)), createPublicKey(privateKey), Buffer.from(signature, "base64url"))).toBe(true);
    expect(unsignedQuantusWitnessReceipt(receipt)).toEqual(unsigned);
    expect(receipt.manifestPayloadSha256).not.toBe(receipt.artifactSha256);
  });

  it("does not allow a receipt without both manifest and artifact bindings", () => {
    const required = ["manifestPayloadSha256", "artifactSha256", "statusPayloadHash", "publicKeyFingerprintSha256"];
    expect(required.every(field => field in {
      manifestPayloadSha256: "sha256:manifest",
      artifactSha256: "sha256:artifact",
      statusPayloadHash: "sha256:status",
      publicKeyFingerprintSha256: "sha256:key",
    })).toBe(true);
  });
});
