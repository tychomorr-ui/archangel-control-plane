import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

export const BOUNDED_APPLICATION_ACTIONS = [
  "health.check",
  "deployment.status",
  "cache.refresh",
] as const;

export type BoundedApplicationAction = (typeof BOUNDED_APPLICATION_ACTIONS)[number];

export const ACTION_SCOPES: Record<BoundedApplicationAction, string> = {
  "health.check": "read:health",
  "deployment.status": "read:deployment",
  "cache.refresh": "write:cache",
};

export type SignedHealthReceipt = {
  applicationId: string;
  nodeId: string;
  status: "ok" | "degraded" | "not_ready";
  version: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  capabilities: string[];
  signature: string;
};

type UnsignedHealthReceipt = Omit<SignedHealthReceipt, "signature">;

/**
 * Canonical receipt bytes. The exact field order and JSON encoding are part of
 * the protocol; callers must never sign a pretty-printed or browser-mutated
 * representation of this object.
 */
export function canonicalHealthReceipt(receipt: UnsignedHealthReceipt): string {
  return JSON.stringify({
    applicationId: receipt.applicationId,
    nodeId: receipt.nodeId,
    status: receipt.status,
    version: receipt.version,
    issuedAt: receipt.issuedAt,
    expiresAt: receipt.expiresAt,
    nonce: receipt.nonce,
    capabilities: [...receipt.capabilities].sort(),
  });
}

export function healthReceiptHash(receipt: UnsignedHealthReceipt): string {
  return createHash("sha256").update(canonicalHealthReceipt(receipt)).digest("hex");
}

export function verifySignedHealthReceipt(
  receipt: SignedHealthReceipt,
  publicKeyPem: string,
  now = new Date(),
): { valid: true; receiptHash: string } | { valid: false; reason: string } {
  const issuedAt = Date.parse(receipt.issuedAt);
  const expiresAt = Date.parse(receipt.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return { valid: false, reason: "Receipt timestamps are invalid." };
  if (issuedAt > now.getTime() + 30_000) return { valid: false, reason: "Receipt is issued in the future." };
  if (expiresAt <= now.getTime()) return { valid: false, reason: "Receipt is expired." };
  if (expiresAt - issuedAt > 5 * 60_000) return { valid: false, reason: "Receipt validity window exceeds five minutes." };
  if (!receipt.applicationId || !receipt.nodeId || !receipt.nonce) return { valid: false, reason: "Receipt identity or nonce is missing." };
  if (!/^sha256:[a-f0-9]{64}$/.test(`sha256:${healthReceiptHash(receipt)}`)) return { valid: false, reason: "Receipt digest could not be computed." };

  try {
    const key = createPublicKey(publicKeyPem);
    const signature = Buffer.from(receipt.signature, "base64url");
    const valid = verifySignature(null, Buffer.from(canonicalHealthReceipt(receipt)), key, signature);
    return valid
      ? { valid: true, receiptHash: `sha256:${healthReceiptHash(receipt)}` }
      : { valid: false, reason: "Ed25519 signature verification failed." };
  } catch {
    return { valid: false, reason: "The supplied public key or signature is invalid." };
  }
}

export function isBoundedApplicationAction(value: string): value is BoundedApplicationAction {
  return (BOUNDED_APPLICATION_ACTIONS as readonly string[]).includes(value);
}

export function actionPolicy(action: BoundedApplicationAction) {
  return {
    action,
    requiredScope: ACTION_SCOPES[action],
    reversible: action === "cache.refresh",
    mutatesInfrastructure: false,
    allowsShell: false,
    requiresSignedReceipt: true,
    requiresIdempotencyKey: true,
    requiresAuditRecord: true,
  } as const;
}
