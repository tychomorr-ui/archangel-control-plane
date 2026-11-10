import { createHash, sign, verify, type KeyObject } from "node:crypto";

export type CapabilityEnvelope = {
  schema: "ATMOS_CAPABILITY_ENVELOPE/v1";
  envelopeId: string;
  issuer: string;
  subject: string;
  operation: string;
  scope: string;
  target: string;
  issuedAt: number;
  expiresAt: number;
  approvalRequired: boolean;
  approvalReference?: string;
  rollbackOperation: string;
  payloadHash: `sha256:${string}`;
  signature: string;
};

export type CapabilityInput = Omit<CapabilityEnvelope, "schema" | "payloadHash" | "signature"> & {
  payload: unknown;
};

const canonical = (value: unknown) => JSON.stringify(value);
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}` as const;

const unsigned = (envelope: CapabilityEnvelope) => {
  const { signature: _signature, ...body } = envelope;
  return body;
};

export function issueCapabilityEnvelope(input: CapabilityInput, privateKey: KeyObject): CapabilityEnvelope {
  const payloadHash = digest(input.payload);
  const envelope = {
    schema: "ATMOS_CAPABILITY_ENVELOPE/v1" as const,
    envelopeId: input.envelopeId,
    issuer: input.issuer,
    subject: input.subject,
    operation: input.operation,
    scope: input.scope,
    target: input.target,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    approvalRequired: input.approvalRequired,
    ...(input.approvalReference ? { approvalReference: input.approvalReference } : {}),
    rollbackOperation: input.rollbackOperation,
    payloadHash,
  };
  const signature = sign(null, Buffer.from(canonical(envelope)), privateKey).toString("base64url");
  return { ...envelope, signature };
}

export function verifyCapabilityEnvelope(
  envelope: CapabilityEnvelope,
  publicKey: KeyObject,
  now: number,
  expected?: { scope?: string; target?: string; approvalPresent?: boolean },
) {
  if (envelope.schema !== "ATMOS_CAPABILITY_ENVELOPE/v1") return { accepted: false, reason: "schema_invalid" as const };
  if (envelope.expiresAt <= envelope.issuedAt || now < envelope.issuedAt || now >= envelope.expiresAt) return { accepted: false, reason: "expired_or_not_yet_valid" as const };
  if (expected?.scope && expected.scope !== envelope.scope) return { accepted: false, reason: "scope_not_allowed" as const };
  if (expected?.target && expected.target !== envelope.target) return { accepted: false, reason: "target_not_allowed" as const };
  if (envelope.approvalRequired && expected?.approvalPresent !== true) return { accepted: false, reason: "approval_required" as const };
  const signatureValid = verify(null, Buffer.from(canonical(unsigned(envelope))), publicKey, Buffer.from(envelope.signature, "base64url"));
  return signatureValid ? { accepted: true as const, reason: "accepted" as const } : { accepted: false, reason: "signature_invalid" as const };
}
