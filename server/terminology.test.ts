import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("protected terminology guard", () => {
  it("passes the current repository", () => {
    expect(() => execFileSync("node", ["launch/check-terminology.mjs"], { encoding: "utf8" })).not.toThrow();
  });

  it("detects the retired hallucinated transport name", () => {
    const fixture = mkdtempSync(join(tmpdir(), "archangel-terminology-"));
    writeFileSync(join(fixture, "fixture.md"), `Fera${"labs"} must never enter the architecture.\n`);
    expect(() => execFileSync("node", ["launch/check-terminology.mjs", fixture], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })).toThrow();
  });
});
