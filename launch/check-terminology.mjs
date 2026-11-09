#!/usr/bin/env node
/**
 * ARCHANGEL protected-terminology guard.
 *
 * This is a lexical integrity check, not a claim that naming alone provides
 * cryptographic security. It prevents known hallucinated or deprecated names
 * from entering source, documentation, manifests, and public UI assets.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());
const forbidden = [
  { name: ["Fera", "labs"].join(""), pattern: new RegExp(["Fera", "labs"].join(""), "gi"), reason: "Use Pharo-Lapse for the offline transport/queue protocol." },
];
const protectedTerms = [
  { term: "Hardware Kill Switch", file: "docs/SOVEREIGN_RESONATOR_RADIO_KILL_SWITCH_HAL.md" },
  { term: "Regulatory Alignment", file: "docs/SOVEREIGN_RESONATOR_RADIO_KILL_SWITCH_HAL.md" },
  { term: "Fail-Closed", file: "docs/SOVEREIGN_RESONATOR_RADIO_KILL_SWITCH_HAL.md" },
];
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage", ".manus-logs"]);
const ignoredFiles = new Set(["pnpm-lock.yaml"]);
const extensions = new Set([".ts", ".tsx", ".mjs", ".js", ".md", ".json", ".css", ".html", ".yml", ".yaml"]);
const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (!ignoredFiles.has(entry.name) && extensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(fullPath, "utf8");
      for (const rule of forbidden) {
        const lines = text.split(/\r?\n/);
        lines.forEach((line, index) => {
          if (rule.pattern.test(line)) findings.push(`${path.relative(root, fullPath)}:${index + 1}: ${rule.name} — ${rule.reason}`);
          rule.pattern.lastIndex = 0;
        });
      }
    }
  }
}

walk(root);
for (const rule of protectedTerms) {
  const target = path.join(root, rule.file);
  if (!fs.existsSync(target) || !fs.readFileSync(target, "utf8").includes(rule.term)) {
    findings.push(`${rule.file}: required protected term missing: ${rule.term}`);
  }
}
if (findings.length) {
  console.error("Protected terminology check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log("Protected terminology check passed: Pharo-Lapse / ATMOS / ARCHANGEL naming guard is clean.");
