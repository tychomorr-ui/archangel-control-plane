import { describe, expect, it } from "vitest";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { authorizeNoop, canonicalize, gate4Status, issueChallenge, sha256, type Gate4Config, type Gate4Store, type ChallengeRecord, type MutationRecord } from "./atmosGate4";

function store(): Gate4Store {
  const challenges = new Map<string, ChallengeRecord>();
  const mutations = new Set<string>();
  return {
    createChallenge: async record => { challenges.set(record.challengeId, record); },
    getChallenge: async id => challenges.get(id) ?? null,
    consumeChallenge: async (id, now) => { const c = challenges.get(id); if (!c || c.usedAt) return false; c.usedAt = now; return true; },
    claimMutation: async (record: MutationRecord) => { if (mutations.has(record.mutationId)) return false; mutations.add(record.mutationId); return true; },
    audit: async () => undefined,
  };
}

function config() {
  const operator = generateKeyPairSync("ed25519");
  const control = generateKeyPairSync("ed25519");
  return {
    config: {
      operatorKeyReference: "operator:test",
      operatorPublicKeyPem: operator.publicKey.export({ type: "spki", format: "pem" }).toString(),
      controlPlanePrivateKeyPem: control.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    } satisfies Gate4Config,
    operatorPrivateKey: operator.privateKey,
  };
}

async function requestFor(challenge: ChallengeRecord, privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"], overrides: Record<string, unknown> = {}) {
  const base = {
    schema: "NEXINUS_ATMOS_MUTATION_REQUEST/v1",
    mutationId: randomUUID(),
    challengeId: challenge.challengeId,
    nonce: challenge.nonce,
    issuedAt: challenge.issuedAt,
    expiresAt: challenge.expiresAt,
    operation: "NOOP",
    targetNodeId: "ARCHANGEL",
    payload: { reason: "ATMOS_GATE4_VERIFICATION" },
    operatorKeyReference: "operator:test",
    ...overrides,
  } as Record<string, unknown>;
  base.payloadHash = sha256(base.payload);
  const unsigned = canonicalize(base);
  base.operatorSignature = sign(null, Buffer.from(unsigned), privateKey).toString("base64url");
  return base as never;
}

describe("ATMOS Gate 4", () => {
  it("accepts a valid signed NOOP and returns an independently verifiable receipt", async () => {
    const s = store(); const { config: c, operatorPrivateKey } = config(); const challenge = await issueChallenge(s, c); const request = await requestFor(challenge, operatorPrivateKey);
    const receipt = await authorizeNoop(s, c, request);
    expect(receipt.outcome).toBe("ACCEPTED_NOOP");
    expect(receipt.boundary).toBe("NOOP_ONLY_NO_ARBITRARY_MUTATION");
    expect(receipt.controlPlaneSignature).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("rejects invalid and missing operator signatures", async () => {
    const s = store(); const { config: c, operatorPrivateKey } = config(); const challenge = await issueChallenge(s, c); const request = await requestFor(challenge, operatorPrivateKey);
    await expect(authorizeNoop(s, c, { ...request, operatorSignature: "invalid" })).rejects.toMatchObject({ code: "unauthorized" });
    const second = await issueChallenge(s, c); const missing = await requestFor(second, operatorPrivateKey); delete missing.operatorSignature;
    await expect(authorizeNoop(s, c, missing)).rejects.toMatchObject({ code: "unauthorized" });
  });
  it("rejects unknown, expired, and replayed challenges and mutation IDs", async () => {
    const s = store(); const { config: c, operatorPrivateKey } = config(); const challenge = await issueChallenge(s, c); const request = await requestFor(challenge, operatorPrivateKey);
    await expect(authorizeNoop(s, c, { ...request, challengeId: randomUUID() })).rejects.toMatchObject({ code: "unauthorized" });
    const accepted = await authorizeNoop(s, c, request); expect(accepted.outcome).toBe("ACCEPTED_NOOP");
    await expect(authorizeNoop(s, c, request)).rejects.toMatchObject({ code: "unauthorized" });
    const other = await issueChallenge(s, c); const replayId = await requestFor(other, operatorPrivateKey); const duplicate = { ...replayId, mutationId: request.mutationId, challengeId: other.challengeId, nonce: other.nonce };
    duplicate.operatorSignature = sign(null, Buffer.from(canonicalize(Object.fromEntries(Object.entries(duplicate).filter(([key]) => key !== "operatorSignature")))), operatorPrivateKey).toString("base64url");
    await expect(authorizeNoop(s, c, duplicate)).rejects.toMatchObject({ code: "replay" });
  });
  it("rejects payload tampering and every operation other than NOOP", async () => {
    const s = store(); const { config: c, operatorPrivateKey } = config(); const challenge = await issueChallenge(s, c); const request = await requestFor(challenge, operatorPrivateKey);
    await expect(authorizeNoop(s, c, { ...request, payload: { reason: "tampered" } })).rejects.toMatchObject({ code: "bad_request" });
    const second = await issueChallenge(s, c); const forbidden = await requestFor(second, operatorPrivateKey, { operation: "RESTART" });
    await expect(authorizeNoop(s, c, forbidden)).rejects.toMatchObject({ code: "forbidden" });
  });
  it("fails closed when signing configuration is missing", async () => {
    expect(gate4Status({}, "unconfigured")).toMatchObject({ operatorVerification: "unconfigured", controlPlaneSigning: "unconfigured", externalMutation: "DISABLED" });
    await expect(issueChallenge(store(), { operatorKeyReference: "", operatorPublicKeyPem: "", controlPlanePrivateKeyPem: "" })).rejects.toMatchObject({ code: "misconfigured" });
  });
});
