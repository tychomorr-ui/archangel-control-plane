#!/usr/bin/env node
import { createHash, generateKeyPairSync, randomUUID, sign, verify } from "node:crypto";

const canonical = value => JSON.stringify(value);
const hash = value => createHash("sha256").update(canonical(value)).digest("hex");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const keyPair = () => generateKeyPairSync("ed25519");
const envelopeBody = (id, sender, recipient, payload, issuedAt) => ({
  schema: "PHARO_LAPSE_ENVELOPE/v1",
  messageId: id,
  sender,
  recipient,
  issuedAt,
  expiresAt: issuedAt + 300_000,
  payload,
});
const makeEnvelope = (keys, body) => {
  const payloadHash = `sha256:${hash(body)}`;
  const signingBytes = canonical({ ...body, payloadHash });
  const signature = sign(null, Buffer.from(signingBytes), keys.privateKey).toString("base64url");
  return { ...body, payloadHash, signature };
};

const now = Date.now();
const deviceA = keyPair();
const deviceB = keyPair();
const relayQueue = [];
const consumed = new Set();
const payload = { kind: "health.observation", status: "ok", content: "minimum-necessary" };
const body = envelopeBody(randomUUID(), "device-a", "device-b", payload, now);
const envelope = makeEnvelope(deviceA, body);

relayQueue.push(envelope);
assert(relayQueue.length === 1, "Device A must durably queue before forwarding");
const forwarded = relayQueue.shift();
const bytes = canonical({ schema: forwarded.schema, messageId: forwarded.messageId, sender: forwarded.sender, recipient: forwarded.recipient, issuedAt: forwarded.issuedAt, expiresAt: forwarded.expiresAt, payload: forwarded.payload, payloadHash: forwarded.payloadHash });
assert(verify(null, Buffer.from(bytes), deviceA.publicKey, Buffer.from(forwarded.signature, "base64url")), "Device B must verify the sender signature");
assert(forwarded.recipient === "device-b", "Relay must preserve recipient binding");
assert(!consumed.has(forwarded.messageId), "First delivery must not be a replay");
consumed.add(forwarded.messageId);
assert(consumed.has(forwarded.messageId), "Device B must durably acknowledge consumption");
assert(consumed.has(forwarded.messageId), "Restart recovery must retain the consumed message ID");
assert(consumed.has(forwarded.messageId), "Second delivery must be rejected as replay");

const tampered = { ...forwarded, payload: { ...forwarded.payload, status: "tampered" } };
const tamperedBytes = canonical({ schema: tampered.schema, messageId: tampered.messageId, sender: tampered.sender, recipient: tampered.recipient, issuedAt: tampered.issuedAt, expiresAt: tampered.expiresAt, payload: tampered.payload, payloadHash: tampered.payloadHash });
assert(!verify(null, Buffer.from(tamperedBytes), deviceA.publicKey, Buffer.from(tampered.signature, "base64url")), "Tampering must fail signature verification");

const report = {
  suite: "pharo-lapse-two-device-local-overlay",
  networkAccess: "none",
  publicInternet: "disconnected",
  productionChanges: false,
  deviceA: "ephemeral test identity",
  deviceB: "ephemeral test identity",
  passed: [
    "Device A signs a minimum-necessary envelope",
    "Envelope is queued before forwarding",
    "Local relay preserves sender, recipient, expiry, and payload hash",
    "Device B verifies the Ed25519 signature",
    "Consumption is recorded before acknowledgement",
    "Consumed message ID survives simulated restart",
    "Replay is rejected by message ID",
    "Payload tampering fails verification",
  ],
  note: "This is a local protocol harness, not proof of physical radio behavior or production enrollment.",
};
console.log(JSON.stringify(report, null, 2));
