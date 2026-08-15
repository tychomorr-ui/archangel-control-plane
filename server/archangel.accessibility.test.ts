import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const clientDirectory = join(serverDirectory, "..", "client", "src");
const layoutSource = readFileSync(join(clientDirectory, "components", "ArchangelLayout.tsx"), "utf8");
const pageSource = readFileSync(join(clientDirectory, "pages", "ArchangelPages.tsx"), "utf8");
const styles = readFileSync(join(clientDirectory, "index.css"), "utf8");

describe("ARCHANGEL keyboard controls", () => {
  it("applies a visible focus treatment for keyboard navigation", () => {
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("outline: 2px solid rgba(103,232,249,0.95)");
  });

  it("uses semantic buttons for custom navigation and operator actions", () => {
    expect(layoutSource).toContain('aria-label="Toggle navigation"');
    expect(layoutSource).toContain('aria-label="Mobile control-plane navigation"');
    expect(layoutSource).toContain("<button");
    expect(pageSource).toContain("Refresh view");
    expect(pageSource).toContain("Retry secure query");
    expect(pageSource).toContain("Submit for review");
  });

  it("keeps custom controls in the native Tab and Shift+Tab sequence", () => {
    expect(layoutSource).toContain('const navigation = [');
    expect((layoutSource.match(/<button/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(layoutSource).not.toContain("tabIndex={-1}");
    expect(pageSource).not.toContain("tabIndex={-1}");
    expect(pageSource).toContain("type=\"submit\"");
  });
});
