import { Activity, Cloud, Layers3, RefreshCcw, ShieldCheck, Sprout, Waypoints, Wifi, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const atmosphereLayers = [
  ["Exosphere", "identity envelope", "Key references, provenance, and the outer trust boundary."],
  ["Thermosphere", "signal field", "Signed receipts, challenge freshness, and cryptographic posture."],
  ["Mesosphere", "mesh integrity", "Enrollment bindings, endpoint declarations, and revocation state."],
  ["Stratosphere", "policy climate", "Scopes, allowlists, operator approvals, and bounded mutation policy."],
  ["Troposphere", "application weather", "Runtime readiness, reachability, incidents, and node evidence."],
  ["Substrate", "ground truth", "Physical hosts, declared roles, audit history, and human review."],
] as const;

const queueStages = [
  ["created", "Local record", "A field device creates a minimum-necessary record while remaining offline."],
  ["signed", "Identity bound", "The device binds the envelope to its key reference and payload hash."],
  ["queued", "Durable queue", "The message is fsync-backed and waits for an approved carrier."],
  ["offered", "Relay offer", "A local relay or scheduled sync window offers delivery without rewriting the sender."],
  ["received", "Envelope received", "The recipient accepts bytes for verification, not yet application content."],
  ["verified", "Signature verified", "Identity, freshness, hash, and replay state pass the receiver contract."],
  ["acknowledged", "Receipt committed", "The receiver records consumption before acknowledging delivery."],
] as const;

const flowModes = {
  standard: {
    label: "Standard network",
    detail: "A connected device sends directly through a network gateway to the receiving service.",
    nodes: [
      ["resonator", "Sovereign resonator", "Creates a signed observation locally, then hands it to the connected interface.", "queue 0 · 12 ms local · radio ready"],
      ["gateway", "Network gateway", "Carries the packet immediately when the network path is available.", "queue 0 · 38 ms transit · connected"],
      ["service", "ARCHANGEL / app", "Receives the payload and applies its own verification and policy boundary.", "queue 1 · 64 ms end-to-end · verifying"],
    ],
  },
  pharo: {
    label: "Offline Pharo-Lapse",
    detail: "The device signs and durably queues an envelope, then forwards it only when an approved carrier appears.",
    nodes: [
      ["resonator", "Sovereign resonator", "Creates the minimum-necessary record and signs the envelope without requiring a network.", "queue 1 · 12 ms local · radio quiet"],
      ["queue", "Pharo-Lapse queue", "Persists the signed envelope locally, preserving order, expiry, and replay state.", "queue 3 · 0 ms transit · durable"],
      ["relay", "Approved relay", "Offers store-and-forward delivery without rewriting the sender or payload hash.", "queue 2 · 240 ms offer · carrier available"],
      ["service", "ARCHANGEL / app", "Verifies identity, freshness, hash, and replay state before acknowledging receipt.", "queue 1 · 310 ms end-to-end · receipt ready"],
    ],
  },
} as const;

const rogueScenarios = [
  ["scope-escalation", "Scope escalation", "AI proposal requests a capability outside its signed envelope.", "hold · capability boundary rejects expansion"],
  ["replay", "Replay attempt", "An old Pharo-Lapse envelope is submitted a second time.", "reject · consumed message ID is already recorded"],
  ["unknown-destination", "Unknown destination", "A validly signed envelope targets an unallowlisted endpoint.", "quarantine · signature is not permission"],
  ["kill-switch", "Physical stop", "The operator engages the independent hardware interlock.", "power absent · AI and radio rails are severed"],
] as const;

const provenanceStages = [
  ["01", "Model proposal", "A bounded proposal is produced under a named policy version."],
  ["02", "Capability envelope", "Scope, target, expiry, approval, and rollback are attached."],
  ["03", "Pharo-Lapse envelope", "The message is signed, queued, and preserved without granting authority."],
  ["04", "ATMOS decision", "Identity, policy, destination, freshness, and replay state are evaluated."],
  ["05", "Evidence outcome", "Accepted, held, rejected, quarantined, or revoked is recorded."],
] as const;

const capabilityProfiles = [
  ["read-receipt", "Read signed receipt", "evidence.read", "registered-node/*", "expires in 5m", "not required", "none · read-only"],
  ["queue-envelope", "Queue Pharo-Lapse envelope", "transport.queue", "local-device/*", "expires in 15m", "operator when external", "discard or retry"],
  ["set-mode", "Request control-plane mode", "control.mode", "ARCHANGEL", "expires in 60s", "required", "inverse mode receipt"],
] as const;
const quarantineEvents = [
  ["scope-escalation", "Held", "Capability envelope did not cover the requested operation.", "capability boundary"],
  ["replay", "Rejected", "Message ID was already consumed; payload was not re-applied.", "replay protection"],
  ["unknown-destination", "Quarantined", "Signature was valid but the destination was not allowlisted.", "policy destination"],
  ["physical-stop", "Stopped", "Independent interlock state requires power to remain absent.", "hardware boundary"],
] as const;
const flowLegend = [
  ["Created", "A minimum-necessary local record exists."],
  ["Signed", "The device binds identity and payload hash."],
  ["Queued", "The envelope is durable and awaiting a carrier."],
  ["Offered", "A permitted relay offers store-and-forward delivery."],
  ["Verified", "Freshness, signature, hash, and replay checks pass."],
  ["Receipt", "Consumption is committed before acknowledgement."],
] as const;

function tone(state: string) {
  if (state === "verified" || state === "active") return "text-emerald-100 border-emerald-300/20 bg-emerald-300/[.06]";
  if (state === "failed" || state === "revoked") return "text-rose-100 border-rose-300/20 bg-rose-300/[.06]";
  return "text-amber-100 border-amber-300/20 bg-amber-300/[.06]";
}

function freshness(observedAt: Date | string | null) {
  if (!observedAt) return "missing";
  return Date.now() - new Date(observedAt).getTime() <= 15 * 60_000 ? "fresh" : "stale";
}

export function AtmosPage() {
  const { data, isLoading, error, refetch } = trpc.archangel.atmosEvidence.useQuery(undefined, { refetchInterval: 15_000 });
  const { data: gate4 } = trpc.archangel.gate4Status.useQuery(undefined, { refetchInterval: 15_000 });
  const { data: state } = trpc.archangel.gate4State.useQuery(undefined, { refetchInterval: 15_000 });
  const [nodeFilter, setNodeFilter] = useState("all");
  const [freshnessFilter, setFreshnessFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [queueStage, setQueueStage] = useState(0);
  const [flowMode, setFlowMode] = useState<keyof typeof flowModes>("pharo");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedFlowNode, setSelectedFlowNode] = useState("resonator");
  const [killSwitchEngaged, setKillSwitchEngaged] = useState(false);
  const [rogueScenario, setRogueScenario] = useState<(typeof rogueScenarios)[number][0]>("scope-escalation");
  const [capabilityProfile, setCapabilityProfile] = useState<(typeof capabilityProfiles)[number][0]>("read-receipt");
  const activeFlow = flowModes[flowMode];
  const selectedNode = activeFlow.nodes.find(([id]) => id === selectedFlowNode) ?? activeFlow.nodes[0];
  const selectedRogueScenario = rogueScenarios.find(([id]) => id === rogueScenario) ?? rogueScenarios[0];
  const selectedCapability = capabilityProfiles.find(([id]) => id === capabilityProfile) ?? capabilityProfiles[0];
  const filteredNodes = useMemo(() => (data?.nodes ?? []).filter(node => (nodeFilter === "all" || node.nodeId === nodeFilter) && (freshnessFilter === "all" || freshness(node.observedAt) === freshnessFilter) && (verificationFilter === "all" || node.evidenceState === verificationFilter)), [data?.nodes, nodeFilter, freshnessFilter, verificationFilter]);
  const freshnessCounts = useMemo(() => {
    const counts = { fresh: 0, stale: 0, missing: 0 };
    for (const node of data?.nodes ?? []) counts[freshness(node.observedAt)] += 1;
    return counts;
  }, [data?.nodes]);
  const stats = [
    { label: "Verified receipts", value: data?.summary.verifiedReceipts ?? 0, color: "text-emerald-100", icon: ShieldCheck },
    { label: "Failed receipts", value: data?.summary.failedReceipts ?? 0, color: "text-rose-100", icon: Activity },
    { label: "Pending evidence", value: data?.summary.pendingReceipts ?? 0, color: "text-amber-100", icon: Cloud },
    { label: "Audit records", value: data?.summary.auditRecords ?? 0, color: "text-cyan-100", icon: Sprout },
  ];
  const layerMetrics = [
    { value: data?.summary.declaredNodes ?? 0, label: "declared nodes" },
    { value: data?.summary.verifiedReceipts ?? 0, label: "verified signals" },
    { value: data?.nodes.filter(node => node.enrollmentStatus === "active").length ?? 0, label: "active bindings" },
    { value: gate4?.mutationPolicy ?? "checking", label: "policy state" },
    { value: data?.nodes.filter(node => node.applicationReadiness === "ready").length ?? 0, label: "ready applications" },
    { value: data?.summary.auditRecords ?? 0, label: "audit events" },
  ];

  return <>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-cyan-200/60">ATMOS · total operating atmosphere</p><h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">From exosphere to substrate.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">ATMOS is the whole field: identity above, policy through the mesh, application weather in the middle, and physical/audit substrate below. Layer descriptions are the control model; live claims appear only when supported by stored evidence.</p></div><Button variant="outline" onClick={() => refetch()} className="border-white/10 bg-white/[.03] text-slate-300 hover:bg-white/[.07] hover:text-white"><RefreshCcw className="mr-2 h-4 w-4" />Refresh atmosphere</Button></div>
    <section className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.05] p-4"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-emerald-100/80">Canonical ATMOS cutover · {data?.atmosProtocol ?? "ATMOS-1.1.1"}</p><p className="mt-1 text-sm text-emerald-50">{data?.summary.canonicalVerifiedNodes ?? 0} of {data?.summary.declaredNodes ?? 0} canonical identity edges are recorded as verified against the public fingerprint, signed manifest payload, and signed health artifact hash.</p></div><span className="rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-emerald-100">{data?.verificationBoundary ?? "fingerprint + manifest + health artifact"}</span></div></section>
    <section className="mb-6 rounded-2xl border border-rose-300/15 bg-rose-300/[.035] p-5" aria-labelledby="rogue-resistance-title">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-rose-100/70">ATMOS · anti-rogue posture</p><h2 id="rogue-resistance-title" className="mt-1 font-display text-xl text-white">Bounded authority, not blind trust.</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">ATMOS does not declare an AI “safe.” It shows which controls are present, which require evidence, and how an out-of-policy proposal is held, rejected, quarantined, or physically stopped.</p></div><span className="rogue-posture-badge">posture · evidence-led</span></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{[
        ["Identity bound", data?.summary.canonicalVerifiedNodes ? `${data.summary.canonicalVerifiedNodes} verified edges` : "evidence required", data?.summary.canonicalVerifiedNodes ? "evidence" : "pending"],
        ["Capability bounded", "scoped + expiring", "policy"],
        ["Transport constrained", "Pharo-Lapse queue", "policy"],
        ["Human approval", "required for high risk", "required"],
        ["Rollback declared", "operation-specific", "declared"],
        ["Physical stop", killSwitchEngaged ? "simulation engaged" : "simulation only", killSwitchEngaged ? "engaged" : "simulated"],
      ].map(([label, value, status]) => <div key={label} className="rogue-posture-card" data-state={status}><span className="rogue-posture-card__dot" /><div><p>{label}</p><strong>{value}</strong></div><span className="rogue-posture-card__state">{status}</span></div>)}</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[.9fr_1.1fr]"><div className="rogue-simulator" aria-labelledby="rogue-simulator-title"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-violet-100/70">Adversarial simulator · visual only</p><h3 id="rogue-simulator-title" className="mt-1 font-display text-lg text-white">Show the boundary under pressure.</h3><p className="mt-1 text-xs leading-5 text-slate-400">Select a failure mode to preview the expected fail-closed disposition. No request is sent and no node is changed.</p></div><div className="mt-3 grid gap-2" role="group" aria-label="Choose adversarial simulation"><select className="console-field h-10 text-xs" value={rogueScenario} onChange={event => setRogueScenario(event.target.value as (typeof rogueScenarios)[number][0])}>{rogueScenarios.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><div className="rounded-xl border border-violet-300/20 bg-violet-300/[.06] p-3"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-violet-100/70">Selected test · {selectedRogueScenario[1]}</p><p className="mt-2 text-xs text-slate-300">{selectedRogueScenario[2]}</p><p className="mt-3 font-mono text-[10px] uppercase tracking-[.1em] text-emerald-100">expected: {selectedRogueScenario[3]}</p></div></div></div><div className="rogue-provenance" aria-label="AI proposal provenance timeline"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Provenance chain · contract view</p><p className="mt-1 text-xs text-slate-400">Every meaningful proposal should be traceable from model output to final evidence outcome.</p></div><div className="mt-3 grid gap-2">{provenanceStages.map(([step, label, detail]) => <div key={step} className="rogue-provenance__step"><span className="rogue-provenance__step-number">{step}</span><div><strong>{label}</strong><small>{detail}</small></div></div>)}</div></div></div>
    </section>
    <section className="mb-6 grid gap-3 lg:grid-cols-[1.05fr_.95fr]" aria-label="ATMOS capability and quarantine evidence">
      <div className="capability-inspector rounded-2xl border border-cyan-300/15 bg-cyan-300/[.035] p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Capability envelope inspector</p><h2 className="mt-1 font-display text-xl text-white">Authority is explicit, narrow, and expiring.</h2><p className="mt-2 text-xs leading-5 text-slate-400">Contract view only. A signature authenticates an envelope; ATMOS still evaluates scope, target, expiry, approval, and rollback before any future handler could act.</p><label className="mt-4 block font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">Example operation<select className="console-field mt-1 h-10 w-full text-xs" value={capabilityProfile} onChange={event => setCapabilityProfile(event.target.value as (typeof capabilityProfiles)[number][0])}>{capabilityProfiles.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{[["scope", selectedCapability[2]], ["target", selectedCapability[3]], ["expiry", selectedCapability[4]], ["human gate", selectedCapability[5]], ["rollback", selectedCapability[6]], ["authority", "not implied"]].map(([label, value]) => <div key={label} className="capability-field"><span>{label}</span><strong>{value}</strong></div>)}</div><p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-amber-100/80">sample contract · no request generated</p></div>
      <div className="quarantine-timeline rounded-2xl border border-amber-300/15 bg-amber-300/[.035] p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-amber-100/70">Quarantine evidence timeline</p><h2 className="mt-1 font-display text-xl text-white">Containment preserves the reason.</h2><p className="mt-2 text-xs leading-5 text-slate-400">Illustrative dispositions from the adversarial contract. Live records appear below only when stored by ARCHANGEL.</p><div className="mt-4 grid gap-2">{quarantineEvents.map(([id, outcome, detail, basis]) => <div key={id} className="quarantine-event"><span className="quarantine-event__marker" data-outcome={outcome.toLowerCase()} /><div><div className="flex flex-wrap items-center gap-2"><strong>{outcome}</strong><span>{basis}</span></div><p>{detail}</p></div></div>)}</div><p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-amber-100/80">simulation ledger · not a production audit record</p></div>
    </section>
    <section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 p-5"><div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] p-3 text-cyan-100"><Layers3 className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Atmospheric control model</p><h2 className="mt-1 font-display text-xl text-white">One field, six observable layers.</h2><p className="mt-2 text-xs leading-5 text-slate-400">Canonical verification is a vertical stack, not a single green light. Current mode: <span className={state?.mode === "maintenance" ? "text-amber-100" : "text-emerald-100"}>{state?.mode ?? "checking"}</span> · external mutation: <span className="text-rose-100">{gate4?.externalMutation ?? "checking"}</span></p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{atmosphereLayers.map(([layer, domain, detail], index) => <div key={layer} className="relative overflow-hidden rounded-xl border border-white/[.08] bg-black/15 p-4"><span className="absolute right-3 top-3 font-mono text-[9px] text-cyan-200/40">0{index + 1}</span><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">{layer}</p><h3 className="mt-2 font-display text-lg text-white">{domain}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p><p className="mt-4 border-t border-white/[.07] pt-3 font-mono text-[10px] uppercase tracking-[.1em] text-cyan-100/70"><span className="font-display text-lg text-white">{layerMetrics[index].value}</span> {layerMetrics[index].label}</p></div>)}</div></section>
    <section className="mb-6 rounded-2xl border border-violet-300/15 bg-violet-300/[.035] p-5" aria-labelledby="queue-flow-title"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-violet-100/70">Pharo-Lapse queue logic</p><h2 id="queue-flow-title" className="mt-1 font-display text-xl text-white">Trace one envelope through the field.</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">Compare routing models, inspect simulated node metrics, and follow package states through a local-first handoff. This diagram is explanatory and does not imply a live connection.</p></div><span className="signal-beacon"><span className="signal-beacon__dot" />offline-first · no dispatch</span></div><div className="mt-5 rounded-xl border border-white/[.08] bg-black/20 p-4" aria-label="Network flow comparison"><div className="flex flex-col gap-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Routing comparison</p><p className="mt-1 text-xs text-slate-400">{activeFlow.detail}</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="Choose routing visualization"><button type="button" onClick={() => { setFlowMode("standard"); setSelectedFlowNode("resonator"); }} aria-pressed={flowMode === "standard"} className="flow-mode-toggle" data-active={flowMode === "standard"}><Wifi className="mr-2 h-3.5 w-3.5" />Standard network</button><button type="button" onClick={() => { setFlowMode("pharo"); setSelectedFlowNode("resonator"); }} aria-pressed={flowMode === "pharo"} className="flow-mode-toggle" data-active={flowMode === "pharo"}><WifiOff className="mr-2 h-3.5 w-3.5" />Offline Pharo-Lapse</button></div></div><div className="flex flex-col gap-2 border-t border-white/[.07] pt-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">Packet playback</span>{([0.5, 1, 2] as const).map(speed => <button key={speed} type="button" onClick={() => setPlaybackSpeed(speed)} aria-pressed={playbackSpeed === speed} className="flow-speed-toggle" data-active={playbackSpeed === speed}>{speed}×</button>)}</div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">visual simulation · {playbackSpeed}× speed</span></div></div><section className="kill-switch-demo" aria-labelledby="kill-switch-demo-title" data-kill-switch={killSwitchEngaged ? "engaged" : "released"}>
  <div>
    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-rose-100/80">Hardware oversight simulation</p>
    <h3 id="kill-switch-demo-title" className="mt-1 font-display text-lg text-white">Fail-closed physical kill switch</h3>
    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Visual demonstration only. Engaging the simulated interlock removes the illustrated AI and radio power paths; it does not control GPIO, telemetry, or production hardware.</p>
  </div>
  <div className="kill-switch-demo__control">
    <span className={killSwitchEngaged ? "kill-switch-demo__status kill-switch-demo__status--engaged" : "kill-switch-demo__status"}>{killSwitchEngaged ? "engaged · power absent" : "released · power available"}</span>
    <button type="button" className="kill-switch-toggle" data-active={killSwitchEngaged} aria-pressed={killSwitchEngaged} aria-label={killSwitchEngaged ? "Release simulated physical kill switch" : "Engage simulated physical kill switch"} onClick={() => setKillSwitchEngaged(value => !value)}><span className="kill-switch-toggle__track"><span className="kill-switch-toggle__thumb" /></span><span>{killSwitchEngaged ? "Release interlock" : "Engage interlock"}</span></button>
  </div>
  <div className="kill-switch-demo__rails" aria-live="polite">
    <span className="kill-switch-rail" data-powered={!killSwitchEngaged}><span className="kill-switch-rail__dot" />AI compute rail · {killSwitchEngaged ? "severed" : "available"}</span>
    <span className="kill-switch-rail" data-powered={!killSwitchEngaged}><span className="kill-switch-rail__dot" />radio power rail · {killSwitchEngaged ? "severed" : "available"}</span>
    <span className="kill-switch-demo__boundary">boundary: {killSwitchEngaged ? "fail-closed" : "operator-visible"} · no dispatch</span>
  </div>
</section>
<div className="queue-flow-diagram mt-5" data-flow-mode={flowMode} data-flow-speed={playbackSpeed} aria-live="polite"><div className="queue-flow-diagram__track">{activeFlow.nodes.map(([id, label, detail, metrics], index) => <div key={`${flowMode}-${id}`} className="queue-flow-node"><button type="button" onClick={() => setSelectedFlowNode(id)} className="queue-flow-node__button" aria-label={`${label}: ${detail}`} aria-describedby={`queue-flow-tip-${flowMode}-${id}`} aria-pressed={selectedFlowNode === id} data-selected={selectedFlowNode === id}><span className="queue-flow-node__glyph">{index + 1}</span><span className="queue-flow-node__label">{label}</span><span className="queue-flow-node__hint">Click for metrics</span></button><span id={`queue-flow-tip-${flowMode}-${id}`} role="tooltip" className="queue-flow-node__tooltip">{detail}</span>{index < activeFlow.nodes.length - 1 ? <span className="queue-flow-connector" aria-hidden="true"><span className={`queue-flow-packet queue-flow-packet-${index}`} /></span> : null}</div>)}</div></div><div className="queue-flow-lower-grid"><div className="queue-flow-legend" aria-label="Pharo-Lapse package state legend"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Package state legend</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{flowLegend.map(([label, detail]) => <div key={label} className="queue-flow-legend__item"><span className="queue-flow-legend__dot" /> <span><strong>{label}</strong><small>{detail}</small></span></div>)}</div></div><aside className="queue-flow-details" aria-live="polite"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-violet-100/70">Node detail · simulated</p><h3 className="mt-2 font-display text-lg text-white">{selectedNode[1]}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{selectedNode[2]}</p><div className="mt-4 grid gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-slate-500"><span className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2">metrics<br /><strong className="text-cyan-100">{selectedNode[3]}</strong></span><span className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2">authority<br /><strong className="text-amber-100">visual only · no dispatch</strong></span></div></aside></div><p className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">Demonstration only · animated packets represent envelope movement, not live telemetry or dispatch.</p></div><div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]"><div className="relative overflow-x-auto rounded-xl border border-white/[.08] bg-black/20 p-4"><div className="flex min-w-[760px] items-center gap-2">{queueStages.map(([id, label], index) => <div key={id} className="flex min-w-[94px] items-center gap-2"><button type="button" onClick={() => setQueueStage(index)} aria-label={`Inspect queue stage ${label}`} aria-pressed={queueStage === index} className="queue-stage" data-active={queueStage === index}><span className="font-mono text-[9px] text-cyan-200/60">0{index + 1}</span><span className="mt-1 block text-[11px] text-white">{label}</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[.1em] text-slate-500">{id}</span></button>{index < queueStages.length - 1 ? <span aria-hidden="true" className="font-mono text-sm text-violet-200/50">→</span> : null}</div>)}</div></div><div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.035] p-4"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Selected stage · {queueStages[queueStage][0]}</p><h3 className="mt-2 font-display text-lg text-white">{queueStages[queueStage][1]}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{queueStages[queueStage][2]}</p><div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-slate-500"><span className="rounded-lg border border-white/[.08] bg-black/20 px-2 py-2">payload hash<br /><strong className="text-emerald-100">bound</strong></span><span className="rounded-lg border border-white/[.08] bg-black/20 px-2 py-2">replay state<br /><strong className="text-amber-100">guarded</strong></span></div></div></div></section>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(stat => { const Icon = stat.icon; return <div key={stat.label} className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><Icon className={`h-4 w-4 ${stat.color}`} /><p className="mt-3 font-mono text-[9px] uppercase tracking-[.13em] text-slate-500">{stat.label}</p><p className={`mt-1 font-display text-2xl ${stat.color}`}>{stat.value}</p></div>; })}</section>
    {freshnessCounts.stale > 0 || freshnessCounts.missing > 0 ? <section className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4"><div className="flex items-start gap-3"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-amber-100" /><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-amber-100">Receipt expiration watch</p><p className="mt-1 text-sm text-amber-50">{freshnessCounts.stale} receipt{freshnessCounts.stale === 1 ? "" : "s"} exceed the 15-minute freshness threshold and {freshnessCounts.missing} declared node{freshnessCounts.missing === 1 ? " has" : "s have"} no stored receipt. This is an evidence alert, not an inferred outage.</p></div></div></section> : <section className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.05] p-4 text-sm text-emerald-50">All stored receipts are inside the 15-minute freshness threshold. Declared nodes without receipts remain separately visible as pending.</section>}
    {error ? <section className="rounded-2xl border border-rose-300/20 bg-rose-300/[.05] p-5 text-sm text-rose-100">Atmos directory unavailable. No claims are inferred from the failure.</section> : isLoading ? <section className="rounded-2xl border border-white/[.08] p-8 text-center text-sm text-slate-400">Reading protected atmosphere directory…</section> : <>
      <section className="mb-6 rounded-2xl border border-white/[.08] bg-white/[.02] p-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Evidence weather map</p><p className="mt-1 text-xs text-slate-500">Filter stored receipts by node, freshness, or verification outcome. Missing is a valid result.</p></div><div className="grid gap-2 sm:grid-cols-3"><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Node<select value={nodeFilter} onChange={event => setNodeFilter(event.target.value)} className="console-field mt-1 h-9 min-w-44 px-2 text-xs"><option value="all">All nodes</option>{data?.nodes.map(node => <option key={node.nodeId} value={node.nodeId}>{node.name}</option>)}</select></label><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Freshness<select value={freshnessFilter} onChange={event => setFreshnessFilter(event.target.value)} className="console-field mt-1 h-9 min-w-36 px-2 text-xs"><option value="all">All freshness</option><option value="fresh">Fresh · 15m</option><option value="stale">Stale · &gt;15m</option><option value="missing">No receipt</option></select></label><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Outcome<select value={verificationFilter} onChange={event => setVerificationFilter(event.target.value)} className="console-field mt-1 h-9 min-w-36 px-2 text-xs"><option value="all">All outcomes</option><option value="verified">Verified</option><option value="failed">Failed</option><option value="pending">Pending</option></select></label></div></div></section>
      <section className="mb-6 overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.02]"><div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4"><Waypoints className="h-4 w-4 text-cyan-200" /><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Node receipt matrix · {filteredNodes.length} shown</p><p className="mt-1 text-xs text-slate-500">{data?.schema} · {data?.truthBoundary}</p></div></div><div className="divide-y divide-white/[.06]">{filteredNodes.map(node => <div key={node.nodeId} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center"><div><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">{node.nodeId} · {node.applicationId ?? "no application binding"}</p></div><div><p className="text-xs text-slate-300">{node.narrative}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{node.signedReceiptHash ? `receipt ${node.signedReceiptHash}` : "no signed receipt stored"} · {freshness(node.observedAt)}</p></div><span className={`inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] ${tone(node.evidenceState)}`}>{node.evidenceState}</span></div>)}</div></section>
      <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.02]"><div className="border-b border-white/[.07] px-5 py-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-violet-100/70">Verification log · substrate</p><p className="mt-1 text-xs text-slate-500">Append-only application and node evidence events currently stored by ARCHANGEL.</p></div>{data?.audit.length ? <div className="divide-y divide-white/[.06]">{data.audit.slice(0, 40).map(event => <div key={event.publicId} className="grid gap-2 px-5 py-3 md:grid-cols-[180px_130px_1fr_auto] md:items-center"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-slate-500">{event.eventType}</span><span className="font-mono text-[10px] text-slate-500">{event.nodeId ?? "control-plane"}</span><span className="text-xs text-slate-300">{event.summary}</span><span className={`rounded-full border px-2 py-1 text-center font-mono text-[9px] uppercase ${tone(event.outcome)}`}>{event.outcome}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">No verification audit records are stored yet.</div>}</section>
    </>}
  </>;
}
