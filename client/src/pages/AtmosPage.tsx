import { Activity, Cloud, Layers3, RefreshCcw, ShieldCheck, Sprout, Waypoints } from "lucide-react";
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
    <section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 p-5"><div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] p-3 text-cyan-100"><Layers3 className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Atmospheric control model</p><h2 className="mt-1 font-display text-xl text-white">One field, six observable layers.</h2><p className="mt-2 text-xs leading-5 text-slate-400">Canonical verification is a vertical stack, not a single green light. Current mode: <span className={state?.mode === "maintenance" ? "text-amber-100" : "text-emerald-100"}>{state?.mode ?? "checking"}</span> · external mutation: <span className="text-rose-100">{gate4?.externalMutation ?? "checking"}</span></p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{atmosphereLayers.map(([layer, domain, detail], index) => <div key={layer} className="relative overflow-hidden rounded-xl border border-white/[.08] bg-black/15 p-4"><span className="absolute right-3 top-3 font-mono text-[9px] text-cyan-200/40">0{index + 1}</span><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">{layer}</p><h3 className="mt-2 font-display text-lg text-white">{domain}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p><p className="mt-4 border-t border-white/[.07] pt-3 font-mono text-[10px] uppercase tracking-[.1em] text-cyan-100/70"><span className="font-display text-lg text-white">{layerMetrics[index].value}</span> {layerMetrics[index].label}</p></div>)}</div></section>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(stat => { const Icon = stat.icon; return <div key={stat.label} className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><Icon className={`h-4 w-4 ${stat.color}`} /><p className="mt-3 font-mono text-[9px] uppercase tracking-[.13em] text-slate-500">{stat.label}</p><p className={`mt-1 font-display text-2xl ${stat.color}`}>{stat.value}</p></div>; })}</section>
    {freshnessCounts.stale > 0 || freshnessCounts.missing > 0 ? <section className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4"><div className="flex items-start gap-3"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-amber-100" /><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-amber-100">Receipt expiration watch</p><p className="mt-1 text-sm text-amber-50">{freshnessCounts.stale} receipt{freshnessCounts.stale === 1 ? "" : "s"} exceed the 15-minute freshness threshold and {freshnessCounts.missing} declared node{freshnessCounts.missing === 1 ? " has" : "s have"} no stored receipt. This is an evidence alert, not an inferred outage.</p></div></div></section> : <section className="mb-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.05] p-4 text-sm text-emerald-50">All stored receipts are inside the 15-minute freshness threshold. Declared nodes without receipts remain separately visible as pending.</section>}
    {error ? <section className="rounded-2xl border border-rose-300/20 bg-rose-300/[.05] p-5 text-sm text-rose-100">Atmos directory unavailable. No claims are inferred from the failure.</section> : isLoading ? <section className="rounded-2xl border border-white/[.08] p-8 text-center text-sm text-slate-400">Reading protected atmosphere directory…</section> : <>
      <section className="mb-6 rounded-2xl border border-white/[.08] bg-white/[.02] p-4"><div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Evidence weather map</p><p className="mt-1 text-xs text-slate-500">Filter stored receipts by node, freshness, or verification outcome. Missing is a valid result.</p></div><div className="grid gap-2 sm:grid-cols-3"><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Node<select value={nodeFilter} onChange={event => setNodeFilter(event.target.value)} className="console-field mt-1 h-9 min-w-44 px-2 text-xs"><option value="all">All nodes</option>{data?.nodes.map(node => <option key={node.nodeId} value={node.nodeId}>{node.name}</option>)}</select></label><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Freshness<select value={freshnessFilter} onChange={event => setFreshnessFilter(event.target.value)} className="console-field mt-1 h-9 min-w-36 px-2 text-xs"><option value="all">All freshness</option><option value="fresh">Fresh · 15m</option><option value="stale">Stale · &gt;15m</option><option value="missing">No receipt</option></select></label><label className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">Outcome<select value={verificationFilter} onChange={event => setVerificationFilter(event.target.value)} className="console-field mt-1 h-9 min-w-36 px-2 text-xs"><option value="all">All outcomes</option><option value="verified">Verified</option><option value="failed">Failed</option><option value="pending">Pending</option></select></label></div></div></section>
      <section className="mb-6 overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.02]"><div className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4"><Waypoints className="h-4 w-4 text-cyan-200" /><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Node receipt matrix · {filteredNodes.length} shown</p><p className="mt-1 text-xs text-slate-500">{data?.schema} · {data?.truthBoundary}</p></div></div><div className="divide-y divide-white/[.06]">{filteredNodes.map(node => <div key={node.nodeId} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center"><div><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">{node.nodeId} · {node.applicationId ?? "no application binding"}</p></div><div><p className="text-xs text-slate-300">{node.narrative}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{node.signedReceiptHash ? `receipt ${node.signedReceiptHash}` : "no signed receipt stored"} · {freshness(node.observedAt)}</p></div><span className={`inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] ${tone(node.evidenceState)}`}>{node.evidenceState}</span></div>)}</div></section>
      <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.02]"><div className="border-b border-white/[.07] px-5 py-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-violet-100/70">Verification log · substrate</p><p className="mt-1 text-xs text-slate-500">Append-only application and node evidence events currently stored by ARCHANGEL.</p></div>{data?.audit.length ? <div className="divide-y divide-white/[.06]">{data.audit.slice(0, 40).map(event => <div key={event.publicId} className="grid gap-2 px-5 py-3 md:grid-cols-[180px_130px_1fr_auto] md:items-center"><span className="font-mono text-[10px] uppercase tracking-[.1em] text-slate-500">{event.eventType}</span><span className="font-mono text-[10px] text-slate-500">{event.nodeId ?? "control-plane"}</span><span className="text-xs text-slate-300">{event.summary}</span><span className={`rounded-full border px-2 py-1 text-center font-mono text-[9px] uppercase ${tone(event.outcome)}`}>{event.outcome}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">No verification audit records are stored yet.</div>}</section>
    </>}
  </>;
}
