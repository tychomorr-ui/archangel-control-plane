import { mkdir, writeFile } from "node:fs/promises";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
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
const outputDirectory = output.substring(0, output.lastIndexOf("/"));
const reportBytes = JSON.stringify(report, null, 2) + "\n";
const reportHash = `sha256:${createHash("sha256").update(reportBytes).digest("hex")}`;
const publicKeyDer = keyPair.publicKey.export({ format: "der", type: "spki" }).toString("base64");
const attestationBody = {
  schema: "ARCHANGEL_ADVERSARIAL_TEST_ATTESTATION/v1",
  artifact: "atmos-adversarial-report.json",
  artifactHash: reportHash,
  generatedAt: report.generatedAt,
  signer: "ci:ephemeral-disposable-key",
  publicKeyDerBase64: publicKeyDer,
  statement: "These results attest only to the disposable local CI fixture; they are not production authority or node health evidence.",
};
const attestationBytes = JSON.stringify(attestationBody, null, 2) + "\n";
const attestation = {
  ...attestationBody,
  signature: sign(null, Buffer.from(attestationBytes), keyPair.privateKey).toString("base64url"),
};
const buildCommit = process.env.GIT_COMMIT ?? (() => {
  try { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return "unknown"; }
})();
const manifest = {
  schema: "ARCHANGEL_ADVERSARIAL_EXPORT_MANIFEST/v1",
  generatedAt: report.generatedAt,
  build: {
    commit: buildCommit,
    project: "archangel-control-plane",
    artifactSchema: report.schema,
  },
  testEnvironment: {
    mode: "local-disposable-keys",
    networkAccess: "none",
    productionChanges: false,
    physicalLanTest: "not-executed-in-sandbox",
  },
  toolchain: {
    node: process.version,
    packageManager: process.env.npm_config_user_agent ?? "pnpm",
    runner: "tsx + Vitest",
    signatureAlgorithm: "Ed25519",
    hashAlgorithm: "SHA-256",
  },
  artifacts: {
    report: "atmos-adversarial-report.json",
    attestation: "atmos-adversarial-attestation.json",
    bundle: "atmos-adversarial-evidence-bundle.json",
    manifest: "atmos-adversarial-export-manifest.json",
  },
};
const attestationOutput = `${outputDirectory}/atmos-adversarial-attestation.json`;
const bundleOutput = `${outputDirectory}/atmos-adversarial-evidence-bundle.json`;
const manifestOutput = `${outputDirectory}/atmos-adversarial-export-manifest.json`;
await mkdir(outputDirectory, { recursive: true });
await writeFile(output, reportBytes, "utf8");
await writeFile(attestationOutput, JSON.stringify(attestation, null, 2) + "\n", "utf8");
await writeFile(manifestOutput, JSON.stringify(manifest, null, 2) + "\n", "utf8");
await writeFile(bundleOutput, JSON.stringify({ schema: "ARCHANGEL_ADVERSARIAL_EVIDENCE_BUNDLE/v1", report, attestation, manifest }, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ output, attestationOutput, manifestOutput, bundleOutput, reportHash, ...report.summary, productionChanges: report.productionChanges }, null, 2));
