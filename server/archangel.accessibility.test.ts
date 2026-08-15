import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const clientDirectory = join(serverDirectory, "..", "client", "src");
const layoutSource = readFileSync(join(clientDirectory, "components", "ArchangelLayout.tsx"), "utf8");
const pageSource = readFileSync(join(clientDirectory, "pages", "ArchangelPages.tsx"), "utf8");
const graphSource = readFileSync(join(clientDirectory, "pages", "EcosystemGraphPage.tsx"), "utf8");
const operationsFieldSource = readFileSync(join(clientDirectory, "components", "OperationsField.tsx"), "utf8");
const applicationPagesSource = readFileSync(join(clientDirectory, "pages", "ApplicationControlPages.tsx"), "utf8");
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

  it("renders a named upright Alpha triangle and inverted Beta triangle around ARCHANGEL", () => {
    expect(pageSource).toContain("Alpha · upright triangle");
    expect(pageSource).toContain("Beta · inverted triangle");
    expect(pageSource).toContain('data-topology-vertex={position}');
    expect(pageSource).toContain('"alpha-apex"');
    expect(pageSource).toContain('"alpha-root"');
    expect(pageSource).toContain('"alpha-terminus"');
    expect(pageSource).toContain('"beta-kether"');
    expect(pageSource).toContain('"beta-tesseract-a"');
    expect(pageSource).toContain('"beta-keira"');
    expect(pageSource).toContain('"bridge-reclaim"');
    expect(pageSource).toContain('points="50,8 12,66 88,66"');
    expect(pageSource).toContain('points="12,30 88,30 50,80"');
    expect(pageSource).toContain("Shared coordination crosshair");
  });

  it("keeps living control-room lenses and graph perspectives as named native buttons", () => {
    expect(pageSource).toContain('className="truth-lens"');
    expect(pageSource).toContain('type="button"');
    expect(pageSource).toContain('data-active={activeLens === key}');
    expect(graphSource).toContain('type="button"');
    expect(graphSource).toContain('data-active={lens === item}');
    expect(graphSource).toContain('aria-label={`${activeCopy.title} ecosystem graph`}');
  });

  it("gives the living aperture a readable named state and honors reduced-motion styling", () => {
    const apertureSource = readFileSync(join(clientDirectory, "components", "AetherAperture.tsx"), "utf8");
    expect(apertureSource).toContain("ARCHANGEL aperture:");
    expect(apertureSource).toContain("Observe-only field");
    expect(styles).toContain("prefers-reduced-motion: no-preference");
    expect(styles).toContain(".aether-aperture__orbit--one");
  });

  it("keeps the operations field and topology beacons keyboard-operable and truthful", () => {
    expect(operationsFieldSource).toContain('aria-label="Operations-field state filter"');
    expect(operationsFieldSource).toContain('type="button"');
    expect(operationsFieldSource).toContain('role="button"');
    expect(operationsFieldSource).toContain("tabIndex={0}");
    expect(operationsFieldSource).toContain('event.key === "Enter" || event.key === " "');
    expect(operationsFieldSource).toContain("never inferred from a missing receipt");
    expect(pageSource).toContain('aria-pressed={selected}');
    expect(pageSource).toContain('type="button"');
    expect(pageSource).toContain("Evidence field");
  });

  it("keeps application-only planning surfaces in semantic native controls with explicit paused authority", () => {
    expect(applicationPagesSource).toContain('aria-label="Application Atlas filter"');
    expect(applicationPagesSource).toContain('type="checkbox"');
    expect(applicationPagesSource).toContain('type="submit"');
    expect(applicationPagesSource).toContain("Enrollment and execution paused");
    expect(applicationPagesSource).toContain("cannot reserve infrastructure, connect a node, or alter the fleet");
  });
});
