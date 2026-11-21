#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const REGISTRY_PATH = join(ROOT, "manifests/node-identity-registry.json");
const PROTOCOL = "ATMOS-1.1.1";
const MANIFEST_KIND = "NEXINUS_ATMOS_SIGNED_NODE_MANIFEST/v1";
const HEALTH_KIND = "NEXINUS_ATMOS_SIGNED_HEALTH/v1";
const WITNESS_KIND = "TESSERACT_A_SIGNED_WITNESS_RECEIPT/v1";
const FORBIDDEN = [new RegExp(["fera", "labs"].join(""), "i")];
const PROTECTED = [/ARCHANGEL/, /ATMOS/, /Pharo-Lapse/];

function usage(message) {
  if (message) console.error(`ERROR: ${message}`);
  console.error("Usage: archangel-align-node.mjs --node-id ID --repo PATH [--private-key PATH] [--public-key PATH] [--endpoint URL] [--probe-endpoint] [--verifier] [--allow-planned] [--json]");
  process.exit(2);
}
function args() {
  const out = { json: false, verifier: false, probeEndpoint: false, allowPlanned: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") out.json = true;
    else if (arg === "--verifier") out.verifier = true;
    else if (arg === "--probe-endpoint") out.probeEndpoint = true;
    else if (arg === "--allow-planned") out.allowPlanned = true;
    else if (["--node-id", "--repo", "--private-key", "--public-key", "--endpoint"].includes(arg)) {
      const value = argv[++i];
      if (!value) usage(`${arg} requires a value`);
      out[arg.slice(2).replaceAll("-", "_")] = value;
    } else usage(`unknown argument: ${arg}`);
  }
  if (!out.node_id || !out.repo) usage("--node-id and --repo are required");
  return out;
}
function result(name, ok, detail) { return { name, ok, detail }; }
function walkText(root, maxFiles = 250) {
  const files = [];
  const skip = new Set([".git", "node_modules", "dist", "build", ".next", ".manus-logs"]);
  function visit(dir) {
    if (files.length >= maxFiles) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (files.length >= maxFiles || skip.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name !== "archangel-align-node.mjs" && /\.(mjs|cjs|js|ts|tsx|json|md|yml|yaml|toml|sh|py|env\.example)$/i.test(entry.name)) {
        try { files.push({ path, text: readFileSync(path, "utf8") }); } catch {}
      }
    }
  }
  visit(root);
  return files;
}
function fingerprint(keyPath) {
  const der = execFileSync("openssl", ["pkey", "-in", keyPath, "-pubout", "-outform", "DER"], { stdio: ["ignore", "pipe", "pipe"] });
  return createHash("sha256").update(der).digest("hex");
}
function loadCanonical(nodeId) {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  const target = registry.nodes.find((node) => node.nodeId.toLowerCase() === nodeId.toLowerCase());
  if (target) return { type: "canonical", ...target };
  const planned = nodeId.toLowerCase() === "quantus" || nodeId.toLowerCase() === "quantus-witness";
  return planned ? { type: "planned", nodeId, application: "Quantus", status: "PLANNED_NOT_CANONICAL" } : null;
}
async function probe(endpoint) {
  const checks = [];
  for (const path of ["/.well-known/atmos-identity.json", "/health"]) {
    try {
      const response = await fetch(new URL(path, endpoint), { redirect: "error", signal: AbortSignal.timeout(5000) });
      const body = await response.text();
      checks.push({ path, status: response.status, contentType: response.headers.get("content-type"), json: (() => { try { return JSON.parse(body); } catch { return false; } })() });
    } catch (error) { checks.push({ path, error: error instanceof Error ? error.message : String(error) }); }
  }
  return checks;
}

const options = args();
const checks = [];
const canonical = loadCanonical(options.node_id);
const planned = canonical?.type === "planned";
if (!canonical) checks.push(result("identity", false, { nodeId: options.node_id, reason: "not present in ARCHANGEL registry" }));
else if (canonical.type === "planned") checks.push(result("identity", options.allowPlanned, { status: canonical.status, reason: "Quantus requires a reviewed canonical registry entry before enrollment" }));
else checks.push(result("identity", true, { nodeId: canonical.nodeId, application: canonical.application, endpoint: canonical.canonicalLocus }));

const files = walkText(options.repo);
const corpus = files.map(({ text }) => text).join("\n");
checks.push(result("repository", existsSync(options.repo) && statSync(options.repo).isDirectory(), { path: options.repo, readableTextFiles: files.length }));
checks.push(result("protocol", corpus.includes(PROTOCOL) && corpus.includes(MANIFEST_KIND) && corpus.includes(HEALTH_KIND), { protocol: PROTOCOL, manifestKind: MANIFEST_KIND, healthKind: HEALTH_KIND }));
const forbiddenHits = files.flatMap(({ path, text }) => FORBIDDEN.filter((pattern) => pattern.test(text)).map((pattern) => ({ file: relative(options.repo, path), term: pattern.source })));
checks.push(result("terminology", forbiddenHits.length === 0 && PROTECTED.every((pattern) => pattern.test(corpus)), { forbiddenHits, required: PROTECTED.map((pattern) => pattern.source) }));

if (options.private_key || options.public_key) {
  const keyPath = options.private_key || options.public_key;
  let derived;
  try { derived = fingerprint(keyPath); } catch (error) { derived = null; checks.push(result("keyBinding", false, { path: keyPath, error: error instanceof Error ? error.message : String(error) })); }
  if (derived) {
    const expected = canonical?.publicKeyFingerprintSha256;
    checks.push(result("keyBinding", canonical?.type === "canonical" && derived === expected, { fingerprintSha256: derived, expectedFingerprintSha256: expected ?? null, privateMaterialPrinted: false }));
  }
} else checks.push(result("keyBinding", planned ? options.allowPlanned : false, { reason: planned ? "planned target has no registered key by design" : "no local public/private key supplied; custody remains on the node" }));

if (options.verifier) {
  const packagePath = join(options.repo, "package.json");
  let pkg = null;
  try { pkg = JSON.parse(readFileSync(packagePath, "utf8")); } catch {}
  const scripts = pkg?.scripts ?? {};
  const verifierOk = corpus.includes(WITNESS_KIND) && corpus.includes("TESSERACT_A_WITNESS_PRIVATE_KEY_FILE") && ["check", "test", "validate:startup"].every((name) => typeof scripts[name] === "string");
  checks.push(result("verifier", verifierOk, { witnessContract: WITNESS_KIND, requiredKeyEnv: "TESSERACT_A_WITNESS_PRIVATE_KEY_FILE", requiredScripts: ["check", "test", "validate:startup"] }));
}

if (options.probeEndpoint || options.endpoint) {
  const endpoint = options.endpoint || canonical?.canonicalLocus;
  const endpointChecks = endpoint ? await probe(endpoint) : [{ error: "no canonical endpoint available" }];
  checks.push(result("endpoint", endpointChecks.every((item) => item.status >= 200 && item.status < 300 && item.json), { endpoint, checks: endpointChecks }));
}

const failed = checks.some((check) => !check.ok);
const overall = planned && options.allowPlanned && !failed ? "PLANNED_NOT_CANONICAL" : failed ? "FAILED" : "ALIGNED";
const report = { schema: "ARCHANGEL_ALIGNMENT_REPORT/v1", observedAt: new Date().toISOString(), nodeId: options.node_id, overall, checks };
if (options.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`node=${options.node_id}`);
  console.log(`overall=${overall}`);
  for (const check of checks) console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${JSON.stringify(check.detail)}`);
}
process.exit(overall === "FAILED" ? 1 : 0);
