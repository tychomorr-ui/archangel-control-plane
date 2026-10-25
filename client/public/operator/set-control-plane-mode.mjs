#!/usr/bin/env node
import { createHash, createPrivateKey, randomUUID, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const [baseUrlArg, mode, ...rest] = process.argv.slice(2);
const baseUrl = (baseUrlArg ?? "").replace(/\/$/, "");
const reasonIndex = rest.indexOf("--reason");
const reason = reasonIndex >= 0 ? rest[reasonIndex + 1] : `operator-request:${mode}`;
const keyFile = process.env.ATMOS_OPERATOR_PRIVATE_KEY_FILE ?? "./operator-private.pem";
const operatorKeyReference = process.env.ATMOS_OPERATOR_KEY_REFERENCE ?? "operator:primary";

if (!baseUrl || !["ready", "maintenance"].includes(mode) || !reason || reason.length > 128) {
  console.error("Usage: node set-control-plane-mode.mjs <https://host> <ready|maintenance> [--reason <text>]");
  process.exit(2);
}

const privateKey = createPrivateKey(readFileSync(keyFile));
const canonicalize = value => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
};
const hash = value => `sha256:${createHash("sha256").update(canonicalize(value)).digest("hex")}`;

async function json(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${path}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

const before = await json("/authority/state");
const challenge = await json("/authority/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const payload = { reason, mode };
const unsigned = {
  schema: "NEXINUS_ATMOS_MUTATION_REQUEST/v1",
  mutationId: randomUUID(),
  challengeId: challenge.challengeId,
  nonce: challenge.nonce,
  issuedAt: challenge.issuedAt,
  expiresAt: challenge.expiresAt,
  operation: "SET_CONTROL_PLANE_MODE",
  targetNodeId: "ARCHANGEL",
  payload,
  payloadHash: hash(payload),
  operatorKeyReference,
};
const operatorSignature = sign(null, Buffer.from(canonicalize(unsigned)), privateKey).toString("base64url");
const receipt = await json("/mutate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...unsigned, operatorSignature }) });
const after = await json("/authority/state");
console.log(JSON.stringify({ before, request: { ...unsigned, operatorSignature: "<redacted>" }, receipt, after }, null, 2));
