#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createPrivateKey, sign } from "node:crypto";

const [baseUrl, nodeId, version, status = "ok", capabilitiesCsv = ""] = process.argv.slice(2);
const keyFile = process.env.ATMOS_NODE_PRIVATE_KEY_FILE;
if (!baseUrl || !nodeId || !version || !keyFile) {
  console.error("Usage: ATMOS_NODE_PRIVATE_KEY_FILE=/secure/node.pem node submit-atmos-node-receipt.mjs <archangel-base-url> <node-id> <version> [ok|degraded|not_ready] [capability,capability]");
  process.exit(2);
}
if (!["ok", "degraded", "not_ready"].includes(status)) throw new Error("status must be ok, degraded, or not_ready");

const challengeResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/atmos/nodes/${encodeURIComponent(nodeId)}/challenge`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const challenge = await challengeResponse.json();
if (!challengeResponse.ok) throw new Error(`Challenge failed (${challengeResponse.status}): ${JSON.stringify(challenge)}`);

const issuedAt = new Date().toISOString();
const expiresAt = challenge.expiresAt;
const receipt = {
  applicationId: challenge.applicationId,
  nodeId,
  status,
  version,
  issuedAt,
  expiresAt,
  nonce: challenge.nonce,
  capabilities: capabilitiesCsv ? capabilitiesCsv.split(",").map(value => value.trim()).filter(Boolean).sort() : [],
};
const canonical = JSON.stringify({ ...receipt, capabilities: [...receipt.capabilities].sort() });
const privateKey = createPrivateKey(readFileSync(keyFile));
const signature = sign(null, Buffer.from(canonical), privateKey).toString("base64url");
const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/atmos/nodes/${encodeURIComponent(nodeId)}/receipts`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: challenge.challengeId, receipt: { ...receipt, signature } }) });
const body = await response.json();
console.log(JSON.stringify({ httpStatus: response.status, challengeId: challenge.challengeId, receipt: { ...receipt, signature: "<redacted>" }, response: body }, null, 2));
if (!response.ok) process.exit(1);
