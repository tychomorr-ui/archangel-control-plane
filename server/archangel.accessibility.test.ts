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
const atmosSource = readFileSync(join(clientDirectory, "pages", "AtmosPage.tsx"), "utf8");
const capabilityViewerSource = readFileSync(join(clientDirectory, "components", "CapabilityEnvelopeViewer.tsx"), "utf8");
const lanGuideSource = readFileSync(join(clientDirectory, "components", "PharoLapseLanTestGuide.tsx"), "utf8");
const adversarialDashboardSource = readFileSync(join(clientDirectory, "components", "AdversarialArtifactsDashboard.tsx"), "utf8");
const attestationVerifierSource = readFileSync(join(clientDirectory, "lib", "verifyAdversarialAttestation.ts"), "utf8");
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
    expect(applicationPagesSource).toContain('aria-expanded={selectedId === application.id}');
    expect(applicationPagesSource).toContain('type="checkbox"');
    expect(applicationPagesSource).toContain('type="submit"');
    expect(applicationPagesSource).toContain("Preview policy");
    expect(applicationPagesSource).toContain("Mark review-ready");
    expect(applicationPagesSource).toContain("View audit record");
    expect(applicationPagesSource).toContain("Sovereign API");
    expect(applicationPagesSource).toContain("No applications connected");
    expect(applicationPagesSource).toContain("No direct control channel exists");
    expect(applicationPagesSource).toContain("Enrollment and execution paused");
    expect(applicationPagesSource).toContain("cannot reserve infrastructure, connect a node, or alter the fleet");
  });

  it("keeps the Pharo-Lapse comparison interactive, keyboard-readable, and reduced-motion aware", () => {
    expect(atmosSource).toContain('data-flow-mode={flowMode}');
    expect(atmosSource).toContain('aria-pressed={flowMode === "standard"}');
    expect(atmosSource).toContain('aria-pressed={flowMode === "pharo"}');
    expect(atmosSource).toContain('role="tooltip"');
    expect(atmosSource).toContain("queue-flow-node__tooltip");
    expect(atmosSource).toContain("flow-speed-toggle");
    expect(atmosSource).toContain("Package state legend");
    expect(atmosSource).toContain("Node detail · simulated");
    expect(atmosSource).toContain("aria-pressed={selectedFlowNode === id}");
    expect(atmosSource).toContain("animated packets represent envelope movement");
    expect(styles).toContain("@keyframes queue-packet");
    expect(styles).toContain("queue-flow-lower-grid");
    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain("prefers-reduced-motion: no-preference");
  });

  it("exposes the visual fail-closed kill-switch simulation without implying hardware control", () => {
    expect(atmosSource).toContain("kill-switch-demo");
    expect(atmosSource).toContain('aria-pressed={killSwitchEngaged}');
    expect(atmosSource).toContain("Engage simulated physical kill switch");
    expect(atmosSource).toContain("Visual demonstration only");
    expect(atmosSource).toContain("does not control GPIO, telemetry, or production hardware");
    expect(atmosSource).toContain("AI compute rail");
    expect(atmosSource).toContain("radio power rail");
    expect(styles).toContain(".kill-switch-toggle");
    expect(styles).toContain(".kill-switch-rail[data-powered=\"false\"]");
  });

  it("exposes the anti-rogue posture as bounded, auditable, and visual-only", () => {
    expect(atmosSource).toContain("anti-rogue posture");
    expect(atmosSource).toContain("Bounded authority, not blind trust.");
    expect(atmosSource).toContain("Capability bounded");
    expect(atmosSource).toContain("Human approval");
    expect(atmosSource).toContain("Rollback declared");
    expect(atmosSource).toContain("Adversarial simulator · visual only");
    expect(atmosSource).toContain('aria-label="Choose adversarial simulation"');
    expect(atmosSource).toContain("No request is sent and no node is changed.");
    expect(atmosSource).toContain("Provenance chain · contract view");
    expect(atmosSource).toContain("Model proposal");
    expect(atmosSource).toContain("ATMOS decision");
    expect(atmosSource).toContain("Evidence outcome");
    expect(styles).toContain(".rogue-posture-card");
    expect(styles).toContain(".rogue-provenance__step");
  });

  it("exposes capability envelopes and quarantine reasons without creating requests", () => {
    expect(atmosSource).toContain("Capability envelope inspector");
    expect(atmosSource).toContain("Authority is explicit, narrow, and expiring.");
    expect(atmosSource).toContain("sample contract · no request generated");
    expect(atmosSource).toContain("Quarantine evidence timeline");
    expect(atmosSource).toContain("Containment preserves the reason.");
    expect(atmosSource).toContain("simulation ledger · not a production audit record");
    expect(styles).toContain(".capability-field");
    expect(styles).toContain(".quarantine-event");
  });

  it("filters the real stored evidence log by disposition", () => {
    expect(atmosSource).toContain("Quarantine views use stored outcomes only.");
    expect(atmosSource).toContain('value={evidenceDisposition}');
    expect(atmosSource).toContain('<option value="quarantined">Quarantined</option>');
    expect(atmosSource).toContain("No stored evidence matches this disposition.");
  });

  it("keeps the physical guide and evidence dashboards explicit and keyboard-addressable", () => {
    expect(lanGuideSource).toContain('role="listbox"');
    expect(lanGuideSource).toContain("does not execute device commands");
    expect(lanGuideSource).toContain("physical validation pending");
    expect(capabilityViewerSource).toContain('role="listbox"');
    expect(capabilityViewerSource).toContain("cannot issue authority");
    expect(adversarialDashboardSource).toContain('role="group"');
    expect(adversarialDashboardSource).toContain("not live production incidents");
    expect(adversarialDashboardSource).toContain('download="atmos-adversarial-report.json"');
    expect(adversarialDashboardSource).toContain('download="atmos-adversarial-attestation.json"');
    expect(adversarialDashboardSource).toContain('download="atmos-adversarial-evidence-bundle.json"');
    expect(adversarialDashboardSource).toContain("Export manifest preview");
    expect(adversarialDashboardSource).toContain('download="atmos-adversarial-export-manifest.json"');
    expect(adversarialDashboardSource).toContain("Review provenance before any download starts.");
    expect(adversarialDashboardSource).toContain("Client-side attestation:");
    expect(adversarialDashboardSource).toContain("verifyAdversarialAttestation");
    expect(adversarialDashboardSource).toContain('aria-live="polite"');
    expect(attestationVerifierSource).toContain('subtle.importKey("spki"');
    expect(attestationVerifierSource).toContain('subtle.verify({ name: "Ed25519" }');
    expect(attestationVerifierSource).toContain("report hash does not match");
    expect(adversarialDashboardSource).toContain("Simulate Tampering");
    expect(adversarialDashboardSource).toContain("Restore authentic payload");
    expect(adversarialDashboardSource).toContain("Changes stay in memory");
    expect(adversarialDashboardSource).toContain("tamperingSimulated");
    expect(adversarialDashboardSource).toContain("Why did verification fail?");
    expect(adversarialDashboardSource).toContain('role="tooltip"');
    expect(adversarialDashboardSource).toContain('aria-expanded={failureTooltipOpen}');
    expect(adversarialDashboardSource).toContain("Report payload binding compromised");
    expect(adversarialDashboardSource).toContain("Copy diagnostic report");
    expect(adversarialDashboardSource).toContain("expectedArtifactHash");
    expect(adversarialDashboardSource).toContain("actualReportHash");
    expect(adversarialDashboardSource).toContain("publicKeyFingerprint");
    expect(adversarialDashboardSource).toContain("navigator.clipboard.writeText");
    expect(adversarialDashboardSource).toContain("Copied!");
    expect(adversarialDashboardSource).toContain("Report diff · in memory");
    expect(adversarialDashboardSource).toContain("Exact fields changed by the simulation");
    expect(adversarialDashboardSource).toContain("attestation-report-diff__before");
    expect(adversarialDashboardSource).toContain("attestation-report-diff__after");
    expect(adversarialDashboardSource).toContain("formatDiffValue");
    expect(attestationVerifierSource).toContain('failureStage: "artifact-hash-binding"');
    expect(attestationVerifierSource).toContain('failureStage: "ed25519-signature"');
  });
});
