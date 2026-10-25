import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign as signEd25519,
  verify as verifyEd25519,
} from "node:crypto";
import { randomUUID } from "node:crypto";

export const GATE4 = {
  challengeSchema: "NEXINUS_ATMOS_AUTHORITY_CHALLENGE/v1",
  mutationSchema: "NEXINUS_ATMOS_MUTATION_REQUEST/v1",
  receiptSchema: "NEXINUS_ATMOS_MUTATION_RECEIPT/v1",
  nodeId: "ARCHANGEL",
  mutationPolicy: "NOOP_OR_CONTROL_PLANE_STATE_V1",
  boundary: "NOOP_ONLY_NO_ARBITRARY_MUTATION",
} as const;

export type Gate4ErrorCode = "unauthorized" | "expired" | "replay" | "bad_request" | "forbidden" | "misconfigured";
export class Gate4Error extends Error {
  constructor(public readonly code: Gate4ErrorCode, message: string) { super(message); }
}

export type Gate4Config = {
  operatorKeyReference: string;
  operatorPublicKeyPem: string;
  controlPlanePrivateKeyPem: string;
};

export function gate4ConfigFromEnvironment(env: NodeJS.ProcessEnv = process.env): Gate4Config {
  return {
    operatorKeyReference: env.ATMOS_OPERATOR_KEY_REFERENCE ?? "",
    operatorPublicKeyPem: env.ATMOS_OPERATOR_PUBLIC_KEY ?? "",
    controlPlanePrivateKeyPem: env.ATMOS_CONTROL_PLANE_PRIVATE_KEY ?? "",
  };
}

export type ChallengeRecord = {
  challengeId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
};

export type MutationRecord = { mutationId: string; challengeId: string; createdAt: string };

export type ControlPlaneMode = "ready" | "maintenance";

export type Gate4Store = {
  createChallenge(record: ChallengeRecord): Promise<void>;
  getChallenge(challengeId: string): Promise<ChallengeRecord | null>;
  consumeChallenge(challengeId: string, now: string): Promise<boolean>;
  claimMutation(record: MutationRecord): Promise<boolean>;
  getControlPlaneMode(): Promise<ControlPlaneMode>;
  setControlPlaneMode(mode: ControlPlaneMode, now: string): Promise<ControlPlaneMode>;
  audit(event: { outcome: "accepted" | "rejected"; mutationId?: string; challengeId?: string; code: string; occurredAt: string; payloadHash?: string; receiptHash?: string }): Promise<void>;
};

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
}

export function sha256(value: unknown): string { return `sha256:${createHash("sha256").update(canonicalize(value)).digest("hex")}`; }

function decodePublicKeyMaterial(value: string): string | { key: Buffer; format: "der"; type: "spki" } {
  if (value.includes("BEGIN")) return value;
  return { key: Buffer.from(value, "base64"), format: "der", type: "spki" };
}

function operatorPublicKey(config: Gate4Config) {
  const material = decodePublicKeyMaterial(config.operatorPublicKeyPem);
  return typeof material === "string" ? createPublicKey(material) : createPublicKey(material);
}

function controlPlanePrivateKey(config: Gate4Config) {
  if (config.controlPlanePrivateKeyPem.includes("BEGIN")) return createPrivateKey(config.controlPlanePrivateKeyPem);
  return createPrivateKey({ key: Buffer.from(config.controlPlanePrivateKeyPem, "base64"), format: "der", type: "pkcs8" });
}

export function gate4KeyFingerprint(config: Gate4Config): { operator: string; controlPlane: string } {
  return {
    operator: createHash("sha256").update(operatorPublicKey(config).export({ type: "spki", format: "der" })).digest("hex"),
    controlPlane: createHash("sha256").update(createPublicKey(controlPlanePrivateKey(config)).export({ type: "spki", format: "der" })).digest("hex"),
  };
}

function assertConfigured(config: Gate4Config): void {
  if (!config.operatorKeyReference || !config.operatorPublicKeyPem || !config.controlPlanePrivateKeyPem) {
    throw new Gate4Error("misconfigured", "Gate 4 signing configuration is incomplete; authorization is fail-closed.");
  }
  try { operatorPublicKey(config); controlPlanePrivateKey(config); } catch {
    throw new Gate4Error("misconfigured", "Gate 4 signing keys are invalid; authorization is fail-closed.");
  }
}

function parseTime(value: string): number {
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Gate4Error("bad_request", "Timestamp is invalid.");
  return result;
}

export async function issueChallenge(store: Gate4Store, config: Gate4Config, now = new Date()): Promise<ChallengeRecord & { schema: string; nodeId: string; operatorKeyReference: string; signatureAlgorithm: string }> {
  assertConfigured(config);
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 60_000).toISOString();
  const record: ChallengeRecord = { challengeId: randomUUID(), nonce: randomBytes(32).toString("base64url"), issuedAt, expiresAt, usedAt: null };
  await store.createChallenge(record);
  return { schema: GATE4.challengeSchema, nodeId: GATE4.nodeId, ...record, operatorKeyReference: config.operatorKeyReference, signatureAlgorithm: "Ed25519" };
}

export type MutationRequest = {
  schema: string; mutationId: string; challengeId: string; nonce: string; issuedAt: string; expiresAt: string;
  operation: string; targetNodeId: string; payload: { reason: string; mode?: ControlPlaneMode }; payloadHash: string;
  operatorKeyReference: string; operatorSignature: string;
};

function verifyOperatorSignature(request: MutationRequest, config: Gate4Config): boolean {
  const { operatorSignature: _signature, ...unsigned } = request;
  return verifyEd25519(null, Buffer.from(canonicalize(unsigned)), operatorPublicKey(config), Buffer.from(request.operatorSignature, "base64url"));
}

export async function authorizeNoop(store: Gate4Store, config: Gate4Config, request: MutationRequest, now = new Date()) {
  assertConfigured(config);
  const current = now.getTime();
  if (request.schema !== GATE4.mutationSchema || request.targetNodeId !== GATE4.nodeId || request.operation !== "NOOP") throw new Gate4Error("forbidden", "Only the exact ARCHANGEL NOOP mutation contract is permitted.");
  if (request.operatorKeyReference !== config.operatorKeyReference || !request.operatorSignature) throw new Gate4Error("unauthorized", "Operator authentication failed.");
  const issued = parseTime(request.issuedAt); const expires = parseTime(request.expiresAt);
  if (issued > current + 30_000 || expires <= current || expires - issued > 60_000) throw new Gate4Error("expired", "Mutation request is expired or outside the allowed time window.");
  if (request.payloadHash !== sha256(request.payload)) throw new Gate4Error("bad_request", "Payload hash mismatch.");
  if (!verifyOperatorSignature(request, config)) throw new Gate4Error("unauthorized", "Operator signature verification failed.");
  const challenge = await store.getChallenge(request.challengeId);
  if (!challenge || challenge.usedAt || challenge.nonce !== request.nonce) throw new Gate4Error("unauthorized", "Challenge is unknown, expired, consumed, or does not match.");
  if (Date.parse(challenge.expiresAt) <= current) throw new Gate4Error("expired", "Challenge is expired.");
  if (!(await store.claimMutation({ mutationId: request.mutationId, challengeId: request.challengeId, createdAt: new Date(current).toISOString() }))) throw new Gate4Error("replay", "Mutation ID has already been used.");
  if (!(await store.consumeChallenge(request.challengeId, new Date(current).toISOString()))) throw new Gate4Error("replay", "Challenge has already been used.");
  const verifiedAt = new Date(current).toISOString();
  const unsignedReceipt = { schema: GATE4.receiptSchema, mutationId: request.mutationId, challengeId: request.challengeId, operation: "NOOP", targetNodeId: GATE4.nodeId, outcome: "ACCEPTED_NOOP", payloadHash: request.payloadHash, operatorKeyReference: config.operatorKeyReference, verifiedAt, replay: "fresh", boundary: GATE4.boundary } as const;
  const receiptHash = sha256(unsignedReceipt);
  const controlPlaneSignature = signEd25519(null, Buffer.from(canonicalize({ ...unsignedReceipt, receiptHash })), controlPlanePrivateKey(config)).toString("base64url");
  const receipt = { ...unsignedReceipt, receiptHash, controlPlaneSignature };
  await store.audit({ outcome: "accepted", mutationId: request.mutationId, challengeId: request.challengeId, code: "ACCEPTED_NOOP", occurredAt: verifiedAt, payloadHash: request.payloadHash, receiptHash });
  return receipt;
}

export async function authorizeControlPlaneMode(store: Gate4Store, config: Gate4Config, request: MutationRequest, now = new Date()) {
  assertConfigured(config);
  const current = now.getTime();
  if (request.schema !== GATE4.mutationSchema || request.targetNodeId !== GATE4.nodeId || request.operation !== "SET_CONTROL_PLANE_MODE") throw new Gate4Error("forbidden", "Only the allowlisted control-plane mode operation is permitted.");
  if (request.operatorKeyReference !== config.operatorKeyReference || !request.operatorSignature) throw new Gate4Error("unauthorized", "Operator authentication failed.");
  if (request.payload.mode !== "ready" && request.payload.mode !== "maintenance") throw new Gate4Error("bad_request", "Control-plane mode must be ready or maintenance.");
  const issued = parseTime(request.issuedAt); const expires = parseTime(request.expiresAt);
  if (issued > current + 30_000 || expires <= current || expires - issued > 60_000) throw new Gate4Error("expired", "Mutation request is expired or outside the allowed time window.");
  if (request.payloadHash !== sha256(request.payload)) throw new Gate4Error("bad_request", "Payload hash mismatch.");
  if (!verifyOperatorSignature(request, config)) throw new Gate4Error("unauthorized", "Operator signature verification failed.");
  const challenge = await store.getChallenge(request.challengeId);
  if (!challenge || challenge.usedAt || challenge.nonce !== request.nonce) throw new Gate4Error("unauthorized", "Challenge is unknown, expired, consumed, or does not match.");
  if (Date.parse(challenge.expiresAt) <= current) throw new Gate4Error("expired", "Challenge is expired.");
  if (!(await store.claimMutation({ mutationId: request.mutationId, challengeId: request.challengeId, createdAt: new Date(current).toISOString() }))) throw new Gate4Error("replay", "Mutation ID has already been used.");
  if (!(await store.consumeChallenge(request.challengeId, new Date(current).toISOString()))) throw new Gate4Error("replay", "Challenge has already been used.");
  const previousMode = await store.getControlPlaneMode();
  const newMode = await store.setControlPlaneMode(request.payload.mode, new Date(current).toISOString());
  const verifiedAt = new Date(current).toISOString();
  const unsignedReceipt = { schema: GATE4.receiptSchema, mutationId: request.mutationId, challengeId: request.challengeId, operation: request.operation, targetNodeId: GATE4.nodeId, outcome: "APPLIED", payloadHash: request.payloadHash, operatorKeyReference: config.operatorKeyReference, verifiedAt, replay: "fresh", boundary: "CONTROL_PLANE_STATE_ONLY", previousMode, newMode, rollbackOperation: "SET_CONTROL_PLANE_MODE" } as const;
  const receiptHash = sha256(unsignedReceipt);
  const controlPlaneSignature = signEd25519(null, Buffer.from(canonicalize({ ...unsignedReceipt, receiptHash })), controlPlanePrivateKey(config)).toString("base64url");
  const receipt = { ...unsignedReceipt, receiptHash, controlPlaneSignature };
  await store.audit({ outcome: "accepted", mutationId: request.mutationId, challengeId: request.challengeId, code: "APPLIED_CONTROL_PLANE_MODE", occurredAt: verifiedAt, payloadHash: request.payloadHash, receiptHash });
  return receipt;
}

export function gate4Status(config: Partial<Gate4Config>, replayProtection: "durable" | "unconfigured") {
  let configured = false;
  try { assertConfigured(config as Gate4Config); configured = true; } catch { configured = false; }
  return { schema: "NEXINUS_ATMOS_AUTHORITY_STATUS/v1", nodeId: GATE4.nodeId, challengeEndpoint: configured ? "configured" : "unconfigured", operatorVerification: configured ? "configured" : "unconfigured", controlPlaneSigning: configured ? "configured" : "unconfigured", mutationPolicy: "NOOP_OR_CONTROL_PLANE_STATE_V1", replayProtection, externalMutation: "DISABLED" } as const;
}
