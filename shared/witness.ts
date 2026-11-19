import { createHash } from "node:crypto";

export const TESSERACT_A_WITNESS_RECEIPT_SCHEMA = "TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1" as const;
export const TESSERACT_A_WITNESS_SCOPE = "witness:health" as const;

export type WitnessObservation = {
  nodeId: string;
  targetUrl: string;
  responseHash: `sha256:${string}`;
  manifestCid: `sha256:${string}`;
  codeHash: `sha256:${string}`;
  serviceKeyReference: string;
  serviceSignatureVerified: true;
  expectedManifestMatched: boolean;
  expectedArtifactMatched: boolean;
};

export type SignedWitnessReceipt = {
  schema: typeof TESSERACT_A_WITNESS_RECEIPT_SCHEMA;
  witnessNodeId: "tesseract-a";
  applicationId: "tesseract-a";
  challengeId: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  observations: WitnessObservation[];
  observationSetHash: `sha256:${string}`;
  witnessKeyReference: string;
  boundary: "SIGNED_WITNESS_OBSERVATION_NOT_SERVICE_AUTHORITY";
  signature: string;
};

type UnsignedWitnessReceipt = Omit<SignedWitnessReceipt, "signature">;

export function canonicalWitnessJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalWitnessJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map(key => `${JSON.stringify(key)}:${canonicalWitnessJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export function canonicalUnsignedWitnessReceipt(receipt: UnsignedWitnessReceipt): string {
  return canonicalWitnessJson(receipt);
}

export function hashWitnessObservations(observations: WitnessObservation[]): `sha256:${string}` {
  const ordered = [...observations].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  return `sha256:${createHash("sha256").update(canonicalWitnessJson(ordered)).digest("hex")}`;
}

export function hashUnsignedWitnessReceipt(receipt: UnsignedWitnessReceipt): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalUnsignedWitnessReceipt(receipt)).digest("hex")}`;
}
