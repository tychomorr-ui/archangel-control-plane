#!/usr/bin/env node
import { createHash, createPrivateKey, createPublicKey, randomUUID, sign, verify } from "node:crypto";

const baseUrl = (process.argv[2] ?? "").replace(/\/$/, "");
if (!baseUrl) throw new Error("Usage: verify-atmos-gate4-live.mjs https://host.example");

const operatorKey = process.env.ATMOS_OPERATOR_KEY_REFERENCE;
const operatorPrivateMaterial = process.env.ATMOS_OPERATOR_PRIVATE_KEY;
const controlPlanePrivateMaterial = process.env.ATMOS_CONTROL_PLANE_PRIVATE_KEY;
if (!operatorKey || !operatorPrivateMaterial || !controlPlanePrivateMaterial) throw new Error("ATMOS_OPERATOR_KEY_REFERENCE, ATMOS_OPERATOR_PRIVATE_KEY, and ATMOS_CONTROL_PLANE_PRIVATE_KEY are required; the operator private key must never be replaced by the receipt-signing key.");

const decodePrivate = value => value.includes("BEGIN") ? createPrivateKey(value) : createPrivateKey({ key: Buffer.from(value, "base64"), format: "der", type: "pkcs8" });
const canonicalize = value => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
};
const hash = value => `sha256:${createHash("sha256").update(canonicalize(value)).digest("hex")}`;
const privateKey = decodePrivate(operatorPrivateMaterial);
const controlPlanePublicKey = createPublicKey(decodePrivate(controlPlanePrivateMaterial));
const json = async (url, options) => {
  const response = await fetch(url, options);
  const body = await response.text();
  let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; }
  if (!response.ok) throw new Error(`${response.status} ${url}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
  return parsed;
};

const status = await json(`${baseUrl}/authority/status`);
const challenge = await json(`${baseUrl}/authority/challenge`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const unsigned = {
  schema: "NEXINUS_ATMOS_MUTATION_REQUEST/v1",
  mutationId: randomUUID(),
  challengeId: challenge.challengeId,
  nonce: challenge.nonce,
  issuedAt: challenge.issuedAt,
  expiresAt: challenge.expiresAt,
  operation: "NOOP",
  targetNodeId: "ARCHANGEL",
  payload: { reason: "ATMOS_GATE4_VERIFICATION" },
  payloadHash: hash({ reason: "ATMOS_GATE4_VERIFICATION" }),
  operatorKeyReference: operatorKey,
};
const request = { ...unsigned, operatorSignature: sign(null, Buffer.from(canonicalize(unsigned)), privateKey).toString("base64url") };
const receipt = await json(`${baseUrl}/mutate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
const { controlPlaneSignature, ...signedReceipt } = receipt;
const receiptSignatureValid = verify(null, Buffer.from(canonicalize(signedReceipt)), controlPlanePublicKey, Buffer.from(controlPlaneSignature, "base64url"));
if (!receiptSignatureValid) throw new Error("Receipt signature did not verify independently.");
console.log(JSON.stringify({ status, challenge: { challengeId: challenge.challengeId, expiresAt: challenge.expiresAt }, request: { mutationId: request.mutationId, payloadHash: request.payloadHash, operation: request.operation, targetNodeId: request.targetNodeId }, receipt: { ...receipt, controlPlaneSignature: "<redacted-from-summary>" }, receiptSignatureValid }, null, 2));
