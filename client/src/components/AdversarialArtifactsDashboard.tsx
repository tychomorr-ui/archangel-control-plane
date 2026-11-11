import { useEffect, useMemo, useState } from "react";
import { verifyAdversarialAttestation, type Attestation, type AttestationVerification } from "@/lib/verifyAdversarialAttestation";

const artifacts = [
  ["scope_escalation", "Scope escalation", "rejected", "capability boundary", "tamper-safe"],
  ["replay", "Replay attempt", "rejected", "replay protection", "fresh fixture"],
  ["unknown_destination", "Unknown destination", "quarantined", "destination policy", "signature valid · authority denied"],
  ["expiry", "Expired envelope", "rejected", "freshness window", "clock bounded"],
  ["tamper", "Payload tampering", "rejected", "signature verification", "hash mismatch"],
] as const;

type ExportManifest = {
  build: { commit: string; project: string; artifactSchema: string };
  testEnvironment: { mode: string; networkAccess: string; productionChanges: boolean; physicalLanTest: string };
  toolchain: { node: string; packageManager: string; runner: string; signatureAlgorithm: string; hashAlgorithm: string };
};

type VerificationInput = { attestation: Attestation; report: string };

function failureExplanation(verification: AttestationVerification) {
  if (verification.failureStage === "artifact-hash-binding") return { title: "Report payload binding compromised", body: "The downloaded report bytes no longer produce the attestation's signed artifactHash. The payload changed after signing; the Ed25519 key was not reached because the report-to-attestation binding failed first." };
  if (verification.failureStage === "ed25519-signature") return { title: "Attestation signature compromised", body: "The signed attestation fields or signature bytes do not verify against the embedded Ed25519 public key. Treat the attestation as unauthenticated." };
  return { title: "Verification runtime unavailable", body: "The browser could not complete the cryptographic check. No authenticity conclusion was made." };
}

export function AdversarialArtifactsDashboard() {
  const [filter, setFilter] = useState("all");
  const [manifest, setManifest] = useState<ExportManifest | null>(null);
  const [verificationInput, setVerificationInput] = useState<VerificationInput | null>(null);
  const [attestationVerification, setAttestationVerification] = useState<AttestationVerification>({ status: "unavailable", detail: "Verifying attestation…" });
  const [tamperingSimulated, setTamperingSimulated] = useState(false);
  const [failureTooltipOpen, setFailureTooltipOpen] = useState(false);
  const visible = useMemo(() => artifacts.filter(item => filter === "all" || item[2] === filter), [filter]);

  useEffect(() => {
    fetch("/artifacts/adversarial/atmos-adversarial-export-manifest.json").then(response => response.ok ? response.json() : null).then(setManifest).catch(() => setManifest(null));
  }, []);

  useEffect(() => {
    Promise.all([fetch("/artifacts/adversarial/atmos-adversarial-attestation.json"), fetch("/artifacts/adversarial/atmos-adversarial-report.json")]).then(async ([attestationResponse, reportResponse]) => {
      if (!attestationResponse.ok || !reportResponse.ok) throw new Error("artifact unavailable");
      const input = { attestation: await attestationResponse.json() as Attestation, report: await reportResponse.text() };
      setVerificationInput(input);
      return verifyAdversarialAttestation(input.attestation, input.report);
    }).then(setAttestationVerification).catch(() => setAttestationVerification({ status: "unavailable", detail: "Attestation artifacts could not be loaded.", failureStage: "verification-runtime" }));
  }, []);

  const simulateTampering = async () => {
    if (!verificationInput) return;
    const tamperedReport = verificationInput.report.replace('"accepted": true', '"accepted": false');
    setTamperingSimulated(true);
    setFailureTooltipOpen(false);
    setAttestationVerification(await verifyAdversarialAttestation(verificationInput.attestation, tamperedReport === verificationInput.report ? `${verificationInput.report}\nTAMPERED` : tamperedReport));
  };

  const restoreAuthenticPayload = async () => {
    if (!verificationInput) return;
    setTamperingSimulated(false);
    setFailureTooltipOpen(false);
    setAttestationVerification(await verifyAdversarialAttestation(verificationInput.attestation, verificationInput.report));
  };

  const failure = attestationVerification.status === "failed" ? failureExplanation(attestationVerification) : null;

  return <section className="adversarial-dashboard" aria-labelledby="adversarial-dashboard-title">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-amber-100/70">CI evidence export</p><h2 id="adversarial-dashboard-title" className="mt-1 font-display text-xl text-white">Adversarial test artifacts</h2><p className="mt-2 text-xs leading-5 text-slate-400">Visualizes the exported local contract report. Values are fixture outcomes, not live production incidents.</p></div><span className="rogue-posture-badge">artifact · read-only</span></div>
    <div className="attestation-verification" data-status={attestationVerification.status} aria-live="polite"><span className="attestation-verification__dot" /><div><strong>Client-side attestation: {attestationVerification.status}</strong><small>{attestationVerification.detail}</small></div>{failure && <div className="attestation-failure-tooltip-wrap"><button type="button" className="attestation-failure-help" aria-expanded={failureTooltipOpen} aria-controls="attestation-failure-tooltip" onClick={() => setFailureTooltipOpen(open => !open)}>Why did verification fail?</button>{failureTooltipOpen && <div id="attestation-failure-tooltip" className="attestation-failure-tooltip" role="tooltip"><strong>{failure.title}</strong><p>{failure.body}</p></div>}</div>}</div>
    <div className="attestation-tamper-controls" aria-label="Attestation tamper simulation"><div><strong>Verification demonstration</strong><small>Changes stay in memory and never modify the downloaded or server-side artifacts.</small></div>{tamperingSimulated ? <button type="button" className="flow-mode-toggle" onClick={restoreAuthenticPayload}>Restore authentic payload</button> : <button type="button" className="flow-mode-toggle" onClick={simulateTampering} disabled={!verificationInput}>Simulate Tampering</button>}</div>
    <div className="export-manifest-preview" aria-live="polite"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Export manifest preview</p><p className="mt-1 text-xs text-slate-400">Review provenance before any download starts.</p></div>{manifest ? <div className="export-manifest-preview__grid"><span>commit<strong>{manifest.build.commit.slice(0, 12)}</strong></span><span>environment<strong>{manifest.testEnvironment.mode}</strong></span><span>network<strong>{manifest.testEnvironment.networkAccess}</strong></span><span>toolchain<strong>{manifest.toolchain.runner} · {manifest.toolchain.node}</strong></span><span>signing<strong>{manifest.toolchain.signatureAlgorithm}</strong></span><span>physical LAN<strong>{manifest.testEnvironment.physicalLanTest}</strong></span></div> : <p className="mt-3 text-xs text-amber-100">Manifest preview unavailable; verify the artifact path before downloading.</p>}<a className="adversarial-manifest-link" href="/artifacts/adversarial/atmos-adversarial-export-manifest.json" download="atmos-adversarial-export-manifest.json">Download export manifest</a></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2" role="group" aria-label="Filter CI artifact outcomes">{["all", "rejected", "quarantined"].map(value => <button type="button" key={value} className="flow-mode-toggle" data-active={filter === value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">{visible.length} artifacts shown · export status: local</span></div>
    <div className="adversarial-downloads" aria-label="Download CI evidence"><a className="adversarial-downloads__link" href="/artifacts/adversarial/atmos-adversarial-report.json" download="atmos-adversarial-report.json">Download report <small>JSON results</small></a><a className="adversarial-downloads__link" href="/artifacts/adversarial/atmos-adversarial-attestation.json" download="atmos-adversarial-attestation.json">Download attestation <small>ephemeral CI signature</small></a><a className="adversarial-downloads__link" href="/artifacts/adversarial/atmos-adversarial-evidence-bundle.json" download="atmos-adversarial-evidence-bundle.json">Download bundle <small>report + attestation + manifest</small></a></div>
    <div className="mt-3 grid gap-2">{visible.map(([id, label, outcome, basis, detail]) => <div className="adversarial-dashboard__row" key={id}><span className="adversarial-dashboard__status" data-outcome={outcome}>{outcome}</span><div><strong>{label}</strong><small>{basis} · {detail}</small></div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">{id}</span></div>)}</div>
  </section>;
}
