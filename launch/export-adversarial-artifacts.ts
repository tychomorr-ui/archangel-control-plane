import { mkdir, writeFile } from "node:fs/promises";
import { generateKeyPairSync } from "node:crypto";
import { issueCapabilityEnvelope, verifyCapabilityEnvelope } from "../server/capabilityEnvelope";

const now = Date.now();
const keyPair = generateKeyPairSync("ed25519");
const base = {
  envelopeId: "ci-adversarial-001",
  issuer: "ci:fixture",
  subject: "atmos:test",
  operation: "SET_CONTROL_PLANE_MODE",
  scope: "control.mode",
  target: "ARCHANGEL",
  issuedAt: now,
  expiresAt: now + 60_000,
  approvalRequired: true,
  approvalReference: "ci:approval",
  rollbackOperation: "SET_CONTROL_PLANE_MODE",
  payload: { mode: "maintenance" },
};
const valid = issueCapabilityEnvelope(base, keyPair.privateKey);
const cases = [
  ["valid", verifyCapabilityEnvelope(valid, keyPair.publicKey, now + 1_000, { scope: "control.mode", target: "ARCHANGEL", approvalPresent: true })],
  ["scope-escalation", verifyCapabilityEnvelope(valid, keyPair.publicKey, now + 1_000, { scope: "mesh.activate", approvalPresent: true })],
  ["missing-approval", verifyCapabilityEnvelope(valid, keyPair.publicKey, now + 1_000, { scope: "control.mode", target: "ARCHANGEL", approvalPresent: false })],
  ["expiry", verifyCapabilityEnvelope(valid, keyPair.publicKey, now + 61_000, { approvalPresent: true })],
  ["tamper", verifyCapabilityEnvelope({ ...valid, operation: "UNSAFE_SHELL" }, keyPair.publicKey, now + 1_000, { approvalPresent: true })],
] as const;
const report = {
  schema: "ARCHANGEL_ADVERSARIAL_CI_ARTIFACT/v1",
  generatedAt: new Date().toISOString(),
  environment: "local-disposable-keys",
  productionChanges: false,
  networkAccess: "none",
  summary: { total: cases.length, accepted: cases.filter(([, result]) => result.accepted).length, rejected: cases.filter(([, result]) => !result.accepted).length },
  cases: cases.map(([name, result]) => ({ name, accepted: result.accepted, reason: result.reason })),
};
const output = process.env.ADVERSARIAL_ARTIFACT_OUT ?? "artifacts/adversarial/atmos-adversarial-report.json";
await mkdir(output.substring(0, output.lastIndexOf("/")), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ output, ...report.summary, productionChanges: report.productionChanges }, null, 2));
