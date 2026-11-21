import { createHash } from "node:crypto";

export const QUANTUS_WITNESS_RECEIPT_SCHEMA = "QUANTUS_SIGNED_WITNESS_RECEIPT/v1" as const;
export const QUANTUS_WITNESS_STATUS_SCHEMA = "QUANTUS_WITNESS_STATUS/v1" as const;
export const QUANTUS_WITNESS_SCOPE = "witness:health" as const;
export const QUANTUS_WITNESS_NODE_ID = "quantus" as const;
export const QUANTUS_WITNESS_APPLICATION_ID = "quantus" as const;
export const QUANTUS_WITNESS_BOUNDARY = "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY" as const;

export type QuantusWitnessStatus = "READY" | "DEGRADED";

export type QuantusSignedWitnessReceipt = {
  schema: typeof QUANTUS_WITNESS_RECEIPT_SCHEMA;
  witnessNodeId: typeof QUANTUS_WITNESS_NODE_ID;
  applicationId: typeof QUANTUS_WITNESS_APPLICATION_ID;
  challengeId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  status: QuantusWitnessStatus;
  statusSchema: typeof QUANTUS_WITNESS_STATUS_SCHEMA;
  statusPayloadHash: `sha256:${string}`;
  manifestPayloadSha256: `sha256:${string}`;
  artifactSha256: `sha256:${string}`;
  publicKeyFingerprintSha256: string;
  boundary: typeof QUANTUS_WITNESS_BOUNDARY;
  signature: string;
};

export type UnsignedQuantusWitnessReceipt = Omit<QuantusSignedWitnessReceipt, "signature">;

export function canonicalQuantusWitnessJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalQuantusWitnessJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${canonicalQuantusWitnessJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export function unsignedQuantusWitnessReceipt(receipt: QuantusSignedWitnessReceipt): UnsignedQuantusWitnessReceipt {
  const { signature: _signature, ...unsigned } = receipt;
  return unsigned;
}

export function hashQuantusWitnessReceipt(receipt: UnsignedQuantusWitnessReceipt): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalQuantusWitnessJson(receipt)).digest("hex")}`;
}

export function hashQuantusStatusPayload(rawResponseText: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(rawResponseText, "utf8").digest("hex")}`;
}
