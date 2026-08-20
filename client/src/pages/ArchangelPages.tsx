import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AetherAperture } from "@/components/AetherAperture";
import { OperationsField } from "@/components/OperationsField";
import { trpc } from "@/lib/trpc";
import { OPERATION_TYPES, TOPOLOGY_LAYOUT_CONTRACT, type NodeId, type OperationType } from "@shared/archangel";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  CopyCheck,
  FileLock2,
  Globe2,
  Hexagon,
  KeyRound,
  Network,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

type VerificationState = "verified" | "failed" | "pending";

const statusStyle: Record<VerificationState, string> = {
  verified: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100",
  failed: "border-rose-300/20 bg-rose-300/[0.08] text-rose-100",
  pending: "border-amber-300/20 bg-amber-300/[0.08] text-amber-100",
};

const formatState = (value: string) => value.replaceAll("_", " ");

function VerificationBadge({ state }: { state: VerificationState }) {
  const icon = state === "verified" ? <CheckCircle2 className="h-3.5 w-3.5" /> : state === "failed" ? <TriangleAlert className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${statusStyle[state]}`}>{icon}{state === "pending" ? "Verification pending" : formatState(state)}</span>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass-surface rounded-2xl ${className}`}>{children}</section>;
}

function SectionHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/60">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{detail}</p>
    </div>
    {action}
  </div>;
}

function PendingData({ label = "No signed events yet" }: { label?: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center">
    <CircleDashed className="h-6 w-6 text-cyan-200/60" />
    <p className="mt-3 text-sm font-medium text-slate-300">{label}</p>
    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">ARCHANGEL will show this surface once an authenticated node agent or protected operator workflow emits a signed, structured record.</p>
  </div>;
}

function QueryFailure({ title, retry }: { title: string; retry: () => void }) {
  return <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center"><ShieldAlert className="h-6 w-6 text-rose-200" /><p className="mt-3 text-sm font-medium text-slate-200">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Protected control-plane data could not be read. This is an observability failure, not an empty result.</p><Button onClick={retry} variant="outline" className="mt-4 border-rose-300/20 bg-rose-300/[0.06] text-rose-100 hover:bg-rose-300/[0.12] hover:text-white"><RefreshCcw className="mr-2 h-3.5 w-3.5" />Retry secure query</Button></div>;
}

function ConstellationSignal({ verified, pending }: { verified: number; pending: number }) {
  const points = [
    [16, 56, "Root-Gate"],
    [35, 24, "Tesseract-Terminus"],
    [34, 84, "XinUS-Clarity"],
    [83, 20, "Monarch-OS"],
    [78, 78, "Tesseract-A"],
    [98, 54, "KEIRA"],
    [56, 108, "Project Reclaim"],
  ];
  return (
    <Panel className="relative mb-6 overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_50%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_52%,rgba(139,92,246,0.13),transparent_32%)]" />
      <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_.72fr_1fr] lg:items-center lg:p-7">
        <div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.9)]" /><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">ARCHANGEL protocol · constellation 01</p></div>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-medium leading-tight text-white sm:text-3xl">One quiet interface for the whole mesh.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Two intersecting core triangles and one grounded bridge resolve into a single operator view. A node stays pending until ARCHANGEL can verify its identity, freshness, and signed receipt.</p>
          <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100">Identity before action</span><span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-100">Intent before execution</span></div>
        </div>
        <AetherAperture verified={verified} pending={pending} />
        <div className="relative min-h-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#060912]/55">
          <svg viewBox="0 0 112 124" className="h-full min-h-52 w-full" aria-label="Declared core-and-bridge mesh constellation">
            <defs><linearGradient id="arc-cyan" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".18"/><stop offset=".5" stopColor="#e0f2fe" stopOpacity=".7"/><stop offset="1" stopColor="#c4b5fd" stopOpacity=".2"/></linearGradient></defs>
            <circle cx="56" cy="54" r="32" fill="none" stroke="#67e8f9" strokeOpacity=".16" strokeDasharray="1.2 3"/><circle cx="56" cy="54" r="18" fill="none" stroke="#c4b5fd" strokeOpacity=".18"/><path d="M16 56 C34 24 50 30 83 20 M16 56 C35 82 56 76 78 78 M35 24 C58 43 73 39 98 54 M34 84 C55 69 76 70 98 54 M56 63 L56 105" fill="none" stroke="url(#arc-cyan)" strokeWidth=".65"/>
            <circle cx="56" cy="54" r="8" fill="#0d1e2d" stroke="#67e8f9" strokeOpacity=".6"/><path d="M52 54 h8 M56 50 v8" stroke="#a5f3fc" strokeWidth=".8"/>
            {points.map(([x, y, label], index) => <g key={label as string}><circle cx={x as number} cy={y as number} r="2.6" fill={index < 3 ? "#67e8f9" : index < 6 ? "#c4b5fd" : "#fde68a"} fillOpacity=".2" stroke={index < 3 ? "#a5f3fc" : index < 6 ? "#ddd6fe" : "#fef3c7"} strokeOpacity=".8"/><text x={x as number} y={(y as number) + 6} textAnchor="middle" fill="#94a3b8" fontSize="3.1" fontFamily="DM Mono, monospace">{label as string}</text></g>)}
          </svg>
          <div className="absolute bottom-3 left-3 rounded-md border border-white/[0.08] bg-[#05070d]/80 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-slate-500">Declared signal map · no health claim</div>
        </div>
      </div>
    </Panel>
  );
}

function AttentionHorizon({ verified, pending, proposed }: { verified: number; pending: number; proposed: number }) {
  const attention = [
    { label: "Signed proof coverage", value: `${verified} verified · ${pending} pending`, tone: verified > 0 ? "text-emerald-100 border-emerald-300/20 bg-emerald-300/[0.06]" : "text-amber-100 border-amber-300/20 bg-amber-300/[0.06]", detail: verified > 0 ? "Verify freshness before relying on each receipt." : "No signed node receipt has been accepted yet." },
    { label: "Human review queue", value: `${proposed} proposed`, tone: proposed > 0 ? "text-cyan-100 border-cyan-300/20 bg-cyan-300/[0.06]" : "text-slate-300 border-white/[0.08] bg-white/[0.025]", detail: proposed > 0 ? "Bounded intents await independent review." : "No intent is awaiting review." },
    { label: "Physical truth map", value: "9 declared hosts", tone: "text-violet-100 border-violet-300/20 bg-violet-300/[0.06]", detail: "Unplaced applications stay separate from host inventory." },
  ];
  return <section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 px-5 py-4 sm:px-6"><div className="relative flex flex-col justify-between gap-4 xl:flex-row xl:items-center"><div><div className="signal-beacon"><span className="signal-beacon__dot" />Attention horizon · evidence-first</div><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">The room is alive with what is known, what is waiting, and what must not be assumed. Each signal is traceable before it becomes actionable.</p></div><div className="grid gap-2 sm:grid-cols-3 xl:min-w-[660px]">{attention.map(signal => <div key={signal.label} className={`rounded-xl border px-3 py-3 ${signal.tone}`}><p className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-70">{signal.label}</p><p className="mt-1 font-display text-sm">{signal.value}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{signal.detail}</p></div>)}</div></div></section>;
}

function NodeCard({ node }: { node: any }) {
  return (
    <Link href={`/nodes/${node.id}`} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b101a]/75 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-[#0e1420] hover:shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.05] blur-2xl transition group-hover:bg-cyan-300/[0.1]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/55">{node.cluster === "Bridge" ? "Grounded bridge layer" : node.cluster === "Outer" ? "Outer-circle peer" : `Cluster ${node.cluster}`}</p>
          <h2 className="mt-2 font-display text-xl font-medium text-white">{node.name}</h2>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-200" />
      </div>
      <p className="relative mt-3 text-xs text-slate-400">{node.region}</p>
      <p className="relative mt-1.5 min-h-10 text-sm leading-5 text-slate-300">{node.role}</p>
      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <VerificationBadge state={node.status.verificationState} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{formatState(node.status.reachability)}</span>
      </div>
    </Link>
  );
}

function AlertFeed({ compact = false }: { compact?: boolean }) {
  const { data: alerts = [], isLoading, error, refetch } = trpc.archangel.alerts.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <Panel className={compact ? "" : "p-1"}><QueryFailure title="Alert feed unavailable" retry={() => refetch()} /></Panel>;
  return (
    <Panel className={compact ? "" : "p-1"}>
      {!compact ? <div className="flex items-center justify-between px-5 pb-3 pt-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Signal watch</p><h2 className="mt-1 font-display text-xl text-white">Notification feed</h2></div><BellRing className="h-5 w-5 text-cyan-200/70" /></div> : null}
      {isLoading ? <PendingData label="Reading protected alert feed" /> : alerts.length === 0 ? <PendingData label="No node alerts recorded" /> : (
        <div className="divide-y divide-white/[0.06]">
          {alerts.map(alert => <div key={alert.publicId} className="flex gap-3 px-5 py-4"><div className={`mt-0.5 rounded-lg p-2 ${alert.severity === "critical" ? "bg-rose-300/10 text-rose-200" : "bg-amber-300/10 text-amber-100"}`}><AlertTriangle className="h-4 w-4" /></div><div><p className="text-sm text-slate-200">{alert.message}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{alert.kind.replaceAll("_", " ")} · {new Date(alert.detectedAt).toLocaleString()}</p></div></div>)}
        </div>
      )}
    </Panel>
  );
}

export function FleetOverviewPage() {
  const { data: fleet = [], isLoading, error: fleetError, refetch } = trpc.archangel.fleet.useQuery(undefined, { refetchInterval: 15_000 });
  const { data: intents = [], error: intentsError, refetch: refetchIntents } = trpc.archangel.intents.useQuery(undefined, { refetchInterval: 15_000 });
  const counts = useMemo(() => ({ verified: fleet.filter(node => node.status.verificationState === "verified").length, pending: fleet.filter(node => node.status.verificationState === "pending").length, proposed: intents.filter(intent => intent.state === "proposed").length }), [fleet, intents]);
  const [activeLens, setActiveLens] = useState<"truth" | "roles" | "authority" | "placement">("truth");
  const lenses = {
    truth: { label: "Truth", detail: "Signed receipts, freshness, and unknown state remain separate operational facts." },
    roles: { label: "Roles", detail: "Every application and host has a declared purpose; no blanket ecosystem access is implied." },
    authority: { label: "Authority", detail: "ARCHANGEL drafts and audits bounded intents; no uncontrolled command path exists." },
    placement: { label: "Placement", detail: "Physical hosts are mapped only when their current region is known; unplaced applications remain off-map." },
  } as const;

  if (fleetError || intentsError) return <><SectionHeading eyebrow="Protected data unavailable" title="Fleet visibility interrupted." detail="ARCHANGEL could not read the fleet registry or the intent queue. No empty state is shown in place of a failed control-plane query." /><Panel><QueryFailure title="Fleet overview unavailable" retry={() => { refetch(); refetchIntents(); }} /></Panel></>;

  return (
    <>
      <SectionHeading eyebrow="Ten-node declared ecosystem" title="The ecosystem, made legible." detail="ARCHANGEL sits at the logical intersection of two core triangles and governs a bounded operational lifecycle: observe, draft, review, approve, execute through a future signed envelope, and verify. It treats every live claim as provisional until identity, freshness, and signed receipt verify." action={<Button variant="outline" onClick={() => refetch()} className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"><RefreshCcw className="mr-2 h-4 w-4" />Refresh view</Button>} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 md:grid-cols-[auto_1fr]"><div className="flex flex-wrap gap-2">{Object.entries(lenses).map(([key, lens]) => <button key={key} type="button" className="truth-lens" data-active={activeLens === key} onClick={() => setActiveLens(key as keyof typeof lenses)}>{lens.label}</button>)}</div><div className="flex items-center border-t border-white/[0.06] px-2 py-2 text-xs leading-5 text-slate-400 md:border-l md:border-t-0 md:pl-5"><span className="mr-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.8)]"/>{lenses[activeLens].detail}</div></div>
      <AttentionHorizon verified={counts.verified} pending={counts.pending} proposed={counts.proposed} />
      <ConstellationSignal verified={counts.verified} pending={counts.pending} />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Declared nodes</p><p className="mt-3 font-display text-4xl text-white">{String(fleet.length).padStart(2, "0")}</p><p className="mt-1 text-xs text-slate-500">Two core triangles · bridge · outer circle</p></Panel>
        <Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Signed verification</p><p className="mt-3 font-display text-4xl text-emerald-200">{String(counts.verified).padStart(2, "0")}</p><p className="mt-1 text-xs text-slate-500">Verified receipts, not reachability claims</p></Panel>
        <Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Review queue</p><p className="mt-3 font-display text-4xl text-amber-100">{String(counts.proposed).padStart(2, "0")}</p><p className="mt-1 text-xs text-slate-500">Proposals awaiting separate approval</p></Panel>
      </div>
      <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Fleet presence</p><h2 className="mt-1 font-display text-2xl text-white">Node constellation</h2></div><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{counts.pending} pending receipt</span></div>
          {isLoading ? <Panel><PendingData label="Opening protected fleet registry" /></Panel> : <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{fleet.map(node => <NodeCard key={node.id} node={node} />)}</div>}
        </section>
        <AlertFeed />
      </div>
    </>
  );
}

export function NodeDetailPage() {
  const [, params] = useRoute("/nodes/:nodeId");
  const [, setLocation] = useLocation();
  const nodeId = params?.nodeId ?? "root-gate";
  const { data: node, isLoading, error, refetch } = trpc.archangel.node.useQuery({ nodeId: nodeId as any }, { refetchInterval: 15_000 });

  if (error) return <><button onClick={() => setLocation("/")} className="mb-5 inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-200"><ArrowLeft className="h-3.5 w-3.5" />Return to fleet overview</button><Panel><QueryFailure title="Node status record unavailable" retry={() => refetch()} /></Panel></>;
  if (isLoading || !node) return <Panel><PendingData label="Opening signed node record" /></Panel>;
  const status = node.status;
  return (
    <>
      <button onClick={() => setLocation("/")} className="mb-5 inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-cyan-200"><ArrowLeft className="h-3.5 w-3.5" />Return to fleet overview</button>
      <SectionHeading eyebrow={`Cluster ${node.cluster} · ${node.region}`} title={node.name} detail={node.role} action={<VerificationBadge state={status.verificationState} />} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-white/[0.07] bg-gradient-to-r from-cyan-300/[0.07] via-transparent to-transparent px-6 py-5"><div className="flex items-center gap-3"><FileLock2 className="h-5 w-5 text-cyan-200" /><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Signed status display</p><h2 className="font-display text-xl text-white">Receipt-bound operational view</h2></div></div></div>
          <dl className="grid sm:grid-cols-2">
            {[ ["Timestamp", status.observedAt ? new Date(status.observedAt).toLocaleString() : "No signed timestamp reported"], ["Version", status.version], ["Uptime class", status.uptimeClass], ["Application readiness", formatState(status.applicationReadiness)], ["Reachability", formatState(status.reachability)], ["Verification result", formatState(status.verificationState)] ].map(([label, value]) => <div key={label as string} className="border-b border-r border-white/[0.06] p-5 last:border-b-0"><dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</dt><dd className="mt-2 text-sm text-slate-200">{value}</dd></div>)}
          </dl>
        </Panel>
        <Panel className="p-6"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-violet-200" /><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-violet-200/60">Plain-language health narrative</p><h2 className="font-display text-xl text-white">What this means</h2></div></div><p className="mt-5 text-sm leading-7 text-slate-300">{status.narrative}</p><div className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-4"><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-100"><ShieldAlert className="h-3.5 w-3.5" />Evidence boundary</p><p className="mt-2 text-xs leading-5 text-slate-400">A declared running state and a successful network response are not the same as verified application health. ARCHANGEL waits for a current signed receipt.</p></div></Panel>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Registry state</p><p className="mt-3 text-sm text-slate-200">{node.enrollmentStatus}</p></Panel><Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Public-key fingerprint</p><p className="mt-3 text-sm text-slate-200">{node.publicKeyFingerprint}</p></Panel><Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Receipt hash</p><p className="mt-3 break-all text-sm text-slate-200">{status.signedReceiptHash ?? "Not recorded"}</p></Panel></div>
    </>
  );
}

type TopologyPosition = (typeof TOPOLOGY_LAYOUT_CONTRACT.vertices)[number]["position"];

const topologyPositions: Record<TopologyPosition, React.CSSProperties> = {
  "alpha-apex": { left: "50%", top: "6%", transform: "translateX(-50%)" },
  "alpha-root": { left: "5%", top: "61%" },
  "alpha-terminus": { right: "5%", top: "61%" },
  "beta-kether": { left: "5%", top: "27%" },
  "beta-tesseract-a": { right: "5%", top: "27%" },
  "beta-keira": { left: "50%", top: `${TOPOLOGY_LAYOUT_CONTRACT.spacing.betaKeiraTopPercent}%`, transform: "translateX(-50%)" },
  "bridge-reclaim": { left: "50%", bottom: `${TOPOLOGY_LAYOUT_CONTRACT.spacing.bridgeBottomPercent}%`, transform: "translateX(-50%)" },
};

function TopologyNode({ name, region, role, tone, position, planned, state, selected, onSelect }: { name: string; region: string; role: string; tone: "alpha" | "beta" | "bridge"; position: TopologyPosition; planned?: boolean; state: "pending" | "verified" | "unplaced"; selected: boolean; onSelect: () => void }) {
  const colorClass = tone === "alpha" ? "border-cyan-300/30 bg-cyan-300/[0.09] shadow-[0_0_35px_rgba(34,211,238,0.08)]" : tone === "beta" ? "border-violet-300/30 bg-violet-300/[0.09] shadow-[0_0_35px_rgba(167,139,250,0.08)]" : "border-amber-300/30 bg-amber-300/[0.09] shadow-[0_0_35px_rgba(251,191,36,0.08)]";
  const labelClass = tone === "alpha" ? "text-cyan-100/70" : tone === "beta" ? "text-violet-100/70" : "text-amber-100/75";
  const stateClass = state === "verified" ? "ring-1 ring-emerald-300/50" : state === "pending" ? "ring-1 ring-amber-300/35" : "ring-1 ring-amber-300/20";
  return <button type="button" aria-pressed={selected} aria-label={`${name}: ${state === "pending" ? "awaiting signed evidence" : state === "verified" ? "verified" : "unplaced application"}`} onClick={onSelect} data-topology-vertex={position} style={topologyPositions[position]} className={`absolute z-10 w-[min(13rem,39vw)] rounded-xl border px-3 py-2.5 text-left backdrop-blur-sm transition hover:-translate-y-0.5 hover:brightness-125 sm:px-4 sm:py-3 ${colorClass} ${stateClass} ${planned ? "border-dashed opacity-80" : ""} ${selected ? "ring-2 ring-cyan-100/80" : ""}`}><span className="absolute right-2 top-2 flex h-2.5 w-2.5"><span className={`absolute inline-flex h-full w-full rounded-full ${state === "verified" ? "bg-emerald-300" : "bg-amber-300"} opacity-75 animate-ping motion-reduce:animate-none`}/><span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${state === "verified" ? "bg-emerald-200" : "bg-amber-200"}`}/></span><p className={`font-mono text-[8px] uppercase tracking-[0.13em] ${labelClass}`}>{planned ? `Unplaced · ${region}` : `${region} · ${state === "pending" ? "pending evidence" : state}`}</p><p className="mt-1 font-display text-sm leading-4 text-white sm:text-base">{name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:text-[11px]">{role}</p></button>;
}

function GeographicMeshMap({ fleet }: { fleet: any[] }) { return <OperationsField fleet={fleet} />; }

export function TopologyPage() {
  const { data: fleet = [], error, refetch } = trpc.archangel.fleet.useQuery(undefined, { refetchInterval: 15_000 });
  const [selectedTopologyId, setSelectedTopologyId] = useState<NodeId>("root-gate");
  const [topologyLens, setTopologyLens] = useState<"roles" | "evidence">("roles");
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Topology unavailable." detail="ARCHANGEL could not read the signed fleet registry, so it will not render a blank mesh in its place." /><Panel><QueryFailure title="Topology registry unavailable" retry={() => refetch()} /></Panel></>;
  const byId = new Map(fleet.map(node => [node.id, node]));
  const outer = fleet.filter(node => node.cluster === "Outer");
  const selectedTopologyNode = byId.get(selectedTopologyId);
  return <>
    <SectionHeading eyebrow="Declared inter-node relationship" title="Two triangles · one sovereign center" detail="Alpha and Beta are logical trust triangles over your actual regional nodes, not a distance-accurate geographic map. ARCHANGEL occupies their shared coordination center; Project Reclaim extends beneath it as the physical–digital bridge." />
    <Panel className="relative overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_36%),radial-gradient(circle_at_50%_78%,rgba(167,139,250,0.08),transparent_28%)]" />
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4"><div className="flex flex-wrap gap-x-5 gap-y-2"><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-100"><span className="h-2 w-2 rounded-full bg-cyan-200"/>Alpha · upright triangle</span><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-violet-100"><span className="h-2 w-2 rounded-full bg-violet-200"/>Beta · inverted triangle</span><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber-100"><span className="h-2 w-2 rounded-full bg-amber-100"/>Bridge layer</span></div><div className="flex items-center gap-2"><button type="button" className="ops-state-control" data-active={topologyLens === "roles"} onClick={() => setTopologyLens("roles")}>Role field</button><button type="button" className="ops-state-control" data-active={topologyLens === "evidence"} onClick={() => setTopologyLens("evidence")}>Evidence field</button><span className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-500">Logical geometry · not geographic</span></div></div>
      <div className="relative min-h-[900px] sm:min-h-[940px]" role="img" aria-label="Logical topology of Alpha upright triangle and Beta inverted triangle around ARCHANGEL">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"><defs><linearGradient id="alpha-triangle" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".48"/><stop offset="1" stopColor="#a5f3fc" stopOpacity=".2"/></linearGradient><linearGradient id="beta-triangle" x1="0" x2="1"><stop stopColor="#c4b5fd" stopOpacity=".22"/><stop offset="1" stopColor="#ddd6fe" stopOpacity=".5"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="none" stroke="#67e8f9" strokeOpacity=".13" strokeDasharray="1 2.5"/><polygon points="50,8 12,66 88,66" fill="rgba(34,211,238,0.025)" stroke="url(#alpha-triangle)" strokeWidth="0.28"/><polygon points="12,30 88,30 50,80" fill="rgba(167,139,250,0.025)" stroke="url(#beta-triangle)" strokeWidth="0.28"/><path d="M50 55 L50 97" fill="none" stroke="#fde68a" strokeOpacity=".5" strokeWidth="0.3" strokeDasharray="1.1 1.8"/><circle cx="50" cy="50" r="9" fill="#08131e" fillOpacity=".94" stroke="#67e8f9" strokeOpacity=".8" strokeWidth="0.38"/><circle cx="50" cy="50" r="4.7" fill="none" stroke="#a5f3fc" strokeOpacity=".35" strokeWidth="0.28"/><path d="M46.5 50h7M50 46.5v7" stroke="#cffafe" strokeOpacity=".9" strokeWidth="0.45"/></svg>
        {TOPOLOGY_LAYOUT_CONTRACT.vertices.map(vertex => { const node = byId.get(vertex.id); const state = node?.declaredState !== "Declared running" ? "unplaced" : node?.status.verificationState === "verified" ? "verified" : "pending"; return node ? <TopologyNode key={node.id} name={node.name} region={node.region} role={node.role} tone={vertex.tone} position={vertex.position} planned={node.declaredState === "Planned deployment"} state={state} selected={selectedTopologyId === node.id} onSelect={() => setSelectedTopologyId(node.id)} /> : null; })}
        <div className="absolute left-1/2 top-1/2 z-20 flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full border border-cyan-200/20 bg-[#08131e]/90 px-3 py-4 text-center shadow-[0_0_55px_rgba(34,211,238,0.16)]"><Network className="h-6 w-6 text-cyan-100"/><span className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-100">ARCHANGEL</span><span className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">Logical center · London</span></div>
        <p className="absolute left-1/2 top-[54.5%] z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">{topologyLens === "roles" ? "Shared coordination crosshair · role field" : "Shared coordination crosshair · evidence field"}</p>
      </div>
    </Panel>
    {selectedTopologyNode ? <section className="neural-grid mt-5 overflow-hidden rounded-2xl border border-cyan-300/10 p-5"><div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-100/70">Topology beacon inspector · {topologyLens} lens</p><div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="font-display text-xl text-white">{selectedTopologyNode.name}</h2><span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.11em] text-amber-100">{selectedTopologyNode.status.verificationState === "verified" ? "verified" : "pending evidence"}</span></div><p className="mt-2 text-sm leading-6 text-slate-300">{selectedTopologyNode.role}</p><p className="mt-2 text-xs leading-5 text-slate-500">{topologyLens === "roles" ? `Logical relationship geometry positions this role in Cluster ${selectedTopologyNode.cluster}; it is not a live network path or latency statement.` : selectedTopologyNode.status.narrative}</p></div><div className="rounded-xl border border-white/[.08] bg-black/20 p-4"><p className="font-mono text-[9px] uppercase tracking-[.13em] text-slate-500">Current field claim</p><p className="mt-2 max-w-xs text-xs leading-5 text-slate-300">{selectedTopologyNode.status.verificationState === "verified" ? "A signed receipt supports the state shown here; inspect freshness before relying on it." : "This beacon is visually active because the role is declared, but it is awaiting signed evidence. It is not an offline or health signal."}</p></div></div></section> : null}
    {outer.length > 0 ? <Panel className="mt-6 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-amber-100/70">Outer-circle expansion</p><h2 className="mt-1 font-display text-xl text-white">Role-specific active and future peers</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Outer-circle membership does not grant a node blanket application access. Each peer joins only through a named registry contract and a verified private receipt path.</p></div><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">Active and planned placements</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{outer.map(node => <div key={node.id} className={`rounded-xl border p-4 ${node.declaredState === "Declared running" ? "border-emerald-300/20 bg-emerald-300/[0.04]" : "border-amber-300/15 bg-amber-300/[0.04]"}`}><p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${node.declaredState === "Declared running" ? "text-emerald-100" : "text-amber-100/70"}`}>{node.declaredState === "Declared running" ? "Active · " : "Planned · "}{node.region}</p><p className="mt-2 font-display text-base text-white">{node.name}</p><p className="mt-1 text-xs leading-5 text-slate-400">{node.role}</p></div>)}</div></Panel> : null}
    <GeographicMeshMap fleet={fleet} />
    <div className="mt-6 grid gap-4 md:grid-cols-3"><Panel className="p-5"><Globe2 className="h-5 w-5 text-cyan-200"/><p className="mt-4 font-display text-lg text-white">Nine current hosts · real map</p><p className="mt-2 text-xs leading-5 text-slate-500">Current hosts span Oregon, N. Virginia, Montreal, Spain, Ireland, Frankfurt, São Paulo, Singapore, and London.</p></Panel><Panel className="p-5"><KeyRound className="h-5 w-5 text-violet-200"/><p className="mt-4 font-display text-lg text-white">ARCHANGEL at center</p><p className="mt-2 text-xs leading-5 text-slate-500">The crosshair remains logical. ARCHANGEL’s dedicated London host is separate from every core vertex and coordinates signed control traffic only.</p></Panel><Panel className="p-5"><ShieldCheck className="h-5 w-5 text-amber-100"/><p className="mt-4 font-display text-lg text-white">Project Reclaim · Oregon</p><p className="mt-2 text-xs leading-5 text-slate-500">The field node is the sole Oregon host for Lake and Mendocino County programs. It does not share Root-Gate authority or credentials.</p></Panel></div>
  </>;
}

export function CommandCenterPage() {
  const [command, setCommand] = useState('backup verify tesseract-a scope="Verify the current mirror backup evidence." risk=low rollback="No mutation is made during verification." ttl=30m');
  const { data: policy, error, refetch } = trpc.archangel.commandPolicy.useQuery();
  const { data: applications = [] } = trpc.archangel.applications.useQuery();
  const [applicationContextId, setApplicationContextId] = useState("sovereign-provenance-console");
  const applicationContext = applications.find(application => application.id === applicationContextId) ?? applications[0];
  const draft = trpc.archangel.draftPlainLanguageIntent.useMutation({
    onSuccess: result => toast.success(`Intent ${result.publicId} is ready for separate review. No node was contacted.`),
    onError: failure => toast.error(failure.message),
  });
  const examples = [
    'backup verify tesseract-a scope="Verify the current mirror backup evidence." risk=low rollback="No mutation is made during verification." ttl=30m',
    'restart keira scope="Restart the declared intelligence service after planned maintenance." risk=moderate rollback="Restore the prior validated service unit state." ttl=30m',
  ];
  const lifecycle = [
    ["01", "Observe", "Read signed status without making a health claim from a ping."],
    ["02", "Draft", "Normalize a named operation, node, scope, risk, rollback, and expiry."],
    ["03", "Review", "Inspect the exact digest and node-side handler before approval."],
    ["04", "Approve", "Record human confirmation for the unchanged operation."],
    ["05", "Execute", "Future signed envelope only; no generic shell command is ever sent."],
    ["06", "Verify", "Accept only a current signed outcome receipt from the target node."],
  ];
  if (error) return <><SectionHeading eyebrow="Protected policy unavailable" title="Command Center unavailable." detail="ARCHANGEL cannot safely draft an operational request while it cannot read its protected command policy." /><Panel><QueryFailure title="Command policy unavailable" retry={() => refetch()} /></Panel></>;
  return <>
    <SectionHeading eyebrow="Plain-language · bounded authority" title="Command Center" detail="Write a small, exact operational request. ARCHANGEL accepts only its named grammar, creates an immutable proposal, and does not contact a node from this screen." />
    <section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 px-5 py-4 sm:px-6"><div className="relative flex flex-col justify-between gap-4 xl:flex-row xl:items-center"><div><div className="signal-beacon"><span className="signal-beacon__dot"/>Command horizon · policy-gated</div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A request becomes a named intention, then a reviewable proof thread. The command field is deliberately not a terminal and cannot transmit arbitrary shell text.</p></div><div className="grid gap-2 sm:grid-cols-3 xl:min-w-[540px]"><div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-3"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-cyan-100/70">Grammar</p><p className="mt-1 font-display text-sm text-cyan-50">Named operations only</p></div><div className="rounded-xl border border-violet-300/20 bg-violet-300/[.06] px-3 py-3"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-violet-100/70">Authority</p><p className="mt-1 font-display text-sm text-violet-50">Review before approval</p></div><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] px-3 py-3"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-amber-100/70">Dispatch</p><p className="mt-1 font-display text-sm text-amber-50">Envelope design only</p></div></div></div></section>
    <section className="ion-surface mb-6 overflow-hidden rounded-2xl border border-violet-300/12 p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div className="min-w-0 flex-1"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-violet-100/70">Application planning context</p><h2 className="mt-1 font-display text-xl text-white">Plan with the ecosystem in view.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">This context adds declared role, dependency, and evidence posture to the operator’s reasoning. It does not convert an application into a reachable target.</p></div><label className="field-label min-w-[min(100%,320px)]">Declared application<select value={applicationContextId} onChange={event => setApplicationContextId(event.target.value)} className="console-field mt-2 h-10 w-full px-3 text-sm">{applications.map(application => <option key={application.id} value={application.id}>{application.name} · {application.lifecycle}</option>)}</select></label></div>{applicationContext ? <div className="mt-5 grid gap-3 border-t border-white/[.07] pt-4 md:grid-cols-4"><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-500">Role</p><p className="mt-1 text-xs leading-5 text-slate-300">{applicationContext.role}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-500">Host posture</p><p className="mt-1 text-xs leading-5 text-slate-300">{applicationContext.hostPosture}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-500">Evidence posture</p><p className="mt-1 text-xs leading-5 text-amber-100">{applicationContext.evidencePosture.replaceAll("-", " ")}</p></div><div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-500">Declared dependencies</p><p className="mt-1 text-xs leading-5 text-slate-300">{applicationContext.dependencies.length ? applicationContext.dependencies.map(dependency => dependency?.shortName).join(" · ") : "No declared dependency"}</p></div></div> : null}</section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="ion-surface overflow-hidden p-0"><div className="border-b border-cyan-300/10 bg-gradient-to-r from-cyan-300/[0.13] via-violet-300/[0.035] to-transparent px-6 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">ARCHANGEL/1 command grammar</p><h2 className="mt-1 font-display text-2xl text-white">Say what must happen. See exactly what will be reviewed.</h2><p className="mt-2 text-xs leading-5 text-slate-400">The chamber normalizes intent before it can enter an append-only review record.</p></div><form className="space-y-4 p-6" onSubmit={event => { event.preventDefault(); draft.mutate({ command }); }}><label className="field-label">Bounded command<Textarea value={command} onChange={event => setCommand(event.target.value)} className="console-field mt-2 min-h-36 font-mono text-xs leading-6" spellCheck={false} required /></label><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500">Required form</p><code className="mt-2 block break-words text-xs leading-6 text-cyan-100/80">operation node-id scope="…" risk=low|moderate|high|critical rollback="…" ttl=15|30|60|120|240m</code></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-slate-500">Creating this record is <span className="text-amber-100">not execution</span>. It will enter the existing protected review queue with a full audit record.</p><Button type="submit" disabled={draft.isPending} className="h-10 rounded-lg bg-cyan-200 px-5 text-slate-950 hover:bg-cyan-100">{draft.isPending ? "Normalizing request…" : "Create reviewable intent"}<ChevronRight className="ml-2 h-4 w-4" /></Button></div></form></Panel>
      <Panel className="neural-grid relative overflow-hidden p-6"><div className="relative"><div className="grid gap-4 sm:grid-cols-[1fr_150px] sm:items-center"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-violet-200/60">Authority boundary</p><h2 className="mt-1 font-display text-xl text-white">Control, without a hidden shell</h2><p className="mt-2 text-xs leading-5 text-slate-400">The review aperture only accepts bounded grammar. It cannot become a tunnel into an arbitrary terminal.</p></div><AetherAperture compact verified={0} pending={0} mode="review"/></div><div className="mt-5 space-y-3">{(policy?.prohibited ?? []).map(item => <div key={item} className="flex items-center gap-3 rounded-lg border border-rose-300/10 bg-rose-300/[0.04] px-3 py-2.5"><ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-200"/><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-rose-100">{item}</span></div>)}</div><div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-100">Current execution state</p><p className="mt-2 text-sm text-slate-200">{policy?.executionMode === "envelope-design-only" ? "Signed envelope design only" : "Policy unavailable"}</p><p className="mt-2 text-xs leading-5 text-slate-400">Node command agents and signed envelopes must be installed and separately validated before any approved operation can leave ARCHANGEL.</p></div></div></Panel>
    </div>
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"><Panel className="ion-surface p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Starting examples</p><h2 className="mt-1 font-display text-xl text-white">Known-safe request shapes</h2></div><CopyCheck className="h-5 w-5 text-cyan-200/70"/></div><div className="mt-4 space-y-3">{examples.map(example => <button key={example} type="button" onClick={() => setCommand(example)} className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left font-mono text-[11px] leading-5 text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] hover:text-cyan-50">{example}</button>)}</div></Panel><Panel className="neural-grid overflow-hidden p-5"><div className="relative"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-violet-200/60">Lifecycle</p><ol className="mt-4 space-y-3">{lifecycle.map(([number, title, detail]) => <li key={number} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-300/20 font-mono text-[9px] text-violet-100">{number}</span><div><p className="text-sm text-slate-200">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</p></div></li>)}</ol></div></Panel></div>
  </>;
}

export function IntentWorkflowPage() {
  const { data: fleet = [], error: fleetError, refetch: refetchFleet } = trpc.archangel.fleet.useQuery();
  const { data: intents = [], error: intentsError, refetch: refetchIntents } = trpc.archangel.intents.useQuery();
  const [nodeId, setNodeId] = useState("root-gate");
  const [operationType, setOperationType] = useState<OperationType>("deploy");
  const [scope, setScope] = useState("");
  const [risk, setRisk] = useState<"low" | "moderate" | "high" | "critical">("moderate");
  const [rollbackMethod, setRollbackMethod] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const propose = trpc.archangel.proposeIntent.useMutation({ onSuccess: result => { toast.success(`Proposal ${result.publicId} recorded for review.`); setScope(""); setRollbackMethod(""); refetchIntents(); }, onError: error => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); propose.mutate({ nodeId: nodeId as any, operationType, scope, risk, rollbackMethod, expiresAt: new Date(expiresAt) }); };
  if (fleetError || intentsError) return <><SectionHeading eyebrow="Protected data unavailable" title="Intent workspace unavailable." detail="ARCHANGEL cannot safely create or review a proposal while it cannot read the fleet registry or review queue." /><Panel><QueryFailure title="Intent workflow unavailable" retry={() => { refetchFleet(); refetchIntents(); }} /></Panel></>;
  return <>
    <SectionHeading eyebrow="Proposal is not execution" title="Intent workflow" detail="Construct a bounded operational proposal. Submitting records a proposed intent and a redacted audit event; it does not contact a node, run a command, or grant approval." />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="p-6"><form onSubmit={submit} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><label className="field-label">Target node<select value={nodeId} onChange={event => setNodeId(event.target.value)} className="console-field">{fleet.map(node => <option key={node.id} value={node.id}>{node.name} · {node.region}</option>)}</select></label><label className="field-label">Operation type<select value={operationType} onChange={event => setOperationType(event.target.value as OperationType)} className="console-field">{OPERATION_TYPES.map(operation => <option key={operation} value={operation}>{operation}</option>)}</select></label></div><label className="field-label">Bounded scope<Textarea value={scope} onChange={event => setScope(event.target.value)} placeholder="Describe exactly what should change and which declared component is in scope." className="console-field min-h-28 resize-y" required minLength={8} /></label><div className="grid gap-5 sm:grid-cols-2"><label className="field-label">Risk class<select value={risk} onChange={event => setRisk(event.target.value as typeof risk)} className="console-field"><option value="low">low</option><option value="moderate">moderate</option><option value="high">high</option><option value="critical">critical</option></select></label><label className="field-label">Proposal expiry<Input value={expiresAt} onChange={event => setExpiresAt(event.target.value)} className="console-field" type="datetime-local" required /></label></div><label className="field-label">Rollback method<Textarea value={rollbackMethod} onChange={event => setRollbackMethod(event.target.value)} placeholder="State the known-safe recovery or reversal procedure." className="console-field min-h-24 resize-y" required minLength={8} /></label><div className="flex flex-col gap-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-slate-400"><span className="font-medium text-cyan-100">Review boundary:</span> a proposal remains separate from approval and execution. No direct-action control exists in this console.</p><Button type="submit" disabled={propose.isPending} className="h-10 rounded-lg bg-cyan-200 px-5 text-slate-950 hover:bg-cyan-100">{propose.isPending ? "Recording proposal…" : "Submit for review"}<ChevronRight className="ml-2 h-4 w-4" /></Button></div></form></Panel>
      <Panel className="p-6"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-violet-200/60">Four-stage control boundary</p><ol className="mt-5 space-y-4">{[["01", "Propose", "A bounded intent is structured with scope, risk, expiry, and rollback."],["02", "Review", "An authorized operator examines the exact target and recovery path."],["03", "Approve", "A separate policy and approval gate must succeed before any agent could receive work."],["04", "Verify", "A signed receipt and expected postcondition would be required to record success."]].map(([number, title, detail], index) => <li key={number} className="flex gap-4"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${index === 0 ? "bg-cyan-200 text-slate-950" : "border border-white/10 text-slate-500"}`}>{number}</span><div><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></li>)}</ol></Panel>
    </div>
    <div className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Protected review queue</p><h2 className="mt-1 font-display text-2xl text-white">Recorded proposals</h2></div><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Immutable event trail</span></div><Panel>{intents.length === 0 ? <PendingData label="No operational proposals recorded" /> : <div className="divide-y divide-white/[0.06]">{intents.map(intent => <div key={intent.publicId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-200">{intent.operationType} · {intent.nodeId}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{intent.publicId} · expires {new Date(intent.expiresAt).toLocaleString()}</p></div><span className="rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-100">{intent.state}</span></div>)}</div>}</Panel></div>
  </>;
}

function LegacyAuditPage() {
  const { data: events = [], isLoading, error, refetch } = trpc.archangel.audit.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Audit ledger unavailable." detail="ARCHANGEL will never substitute an empty ledger for a failed audit query." /><Panel><QueryFailure title="Audit ledger unavailable" retry={() => refetch()} /></Panel></>;
  const verified = events.filter(event => event.outcome === "verified").length;
  const pending = events.filter(event => event.outcome === "pending").length;
  return <><SectionHeading eyebrow="Redacted · append-only · evidence-first" title="Evidence Observatory" detail="Every intent, approval, receipt, and verification outcome becomes a structured proof thread. This surface never permits editing or deletion." /><section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 px-5 py-2"><div className="relative grid items-center gap-4 md:grid-cols-[1fr_210px]"><div><div className="signal-beacon"><span className="signal-beacon__dot"/>Chronological proof field</div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Trace every claim backward to its actor, target, time, event type, and recorded outcome. Missing evidence remains visible as a missing state.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-emerald-100">{verified} verified outcomes</span><span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-amber-100">{pending} pending events</span><span className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-300">{events.length} total threads</span></div></div><AetherAperture compact verified={verified} pending={pending}/></div></section><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected evidence thread" /> : events.length === 0 ? <PendingData label="No audit events recorded" /> : <div className="divide-y divide-white/[0.06]">{events.map(event => <div key={event.publicId} className="relative grid gap-3 px-5 py-4 transition hover:bg-cyan-300/[.025] md:grid-cols-[150px_1fr_auto]"><div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{new Date(event.occurredAt).toLocaleString()}</div><div><p className="text-sm text-slate-200">{event.summary}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.publicId} · {event.actorPseudonym} · redacted summary</p></div><span className={`h-fit rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${event.outcome === "verified" ? statusStyle.verified : event.outcome === "failed" ? statusStyle.failed : statusStyle.pending}`}>{event.outcome}</span></div>)}</div>}</Panel></>;
}

export function AuditPage() {
  const [, setLocation] = useLocation();
  const { data: events = [], isLoading, error, refetch } = trpc.archangel.audit.useQuery(undefined, { refetchInterval: 15_000 });
  const scenarioFilter = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("scenario");
  const visibleEvents = scenarioFilter ? events.filter(event => event.summary.includes(scenarioFilter)) : events;
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Audit ledger unavailable." detail="ARCHANGEL will never substitute an empty ledger for a failed audit query."/><Panel><QueryFailure title="Audit ledger unavailable" retry={() => refetch()}/></Panel></>;
  const verified = visibleEvents.filter(event => event.outcome === "verified").length;
  const pending = visibleEvents.filter(event => event.outcome === "pending").length;
  return <><SectionHeading eyebrow="Redacted · append-only · evidence-first" title="Evidence Observatory" detail="Every intent, approval, receipt, and verification outcome becomes a structured proof thread. This surface never permits editing or deletion."/>{scenarioFilter ? <section className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-violet-300/15 bg-violet-300/[.04] p-4 sm:flex-row sm:items-center"><p className="text-sm text-slate-300">Audit context for application-only scenario <span className="font-mono text-violet-100">{scenarioFilter}</span>.</p><Button variant="outline" onClick={() => setLocation("/audit")}>Clear audit context</Button></section> : null}<section className="neural-grid mb-6 overflow-hidden rounded-2xl border border-cyan-300/10 px-5 py-2"><div className="relative grid items-center gap-4 md:grid-cols-[1fr_210px]"><div><div className="signal-beacon"><span className="signal-beacon__dot"/>Chronological proof field</div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Trace every claim backward to its actor, target, time, event type, and recorded outcome. Missing evidence remains visible as a missing state.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-emerald-100">{verified} verified outcomes</span><span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-amber-100">{pending} pending events</span><span className="rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-300">{visibleEvents.length} matching threads</span></div></div><AetherAperture compact verified={verified} pending={pending}/></div></section><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected evidence thread"/> : visibleEvents.length === 0 ? <PendingData label={scenarioFilter ? "No audit record has been recorded for this scenario yet" : "No audit events recorded"}/> : <div className="divide-y divide-white/[0.06]">{visibleEvents.map(event => <div key={event.publicId} className="relative grid gap-3 px-5 py-4 transition hover:bg-cyan-300/[.025] md:grid-cols-[150px_1fr_auto]"><div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{new Date(event.occurredAt).toLocaleString()}</div><div><p className="text-sm text-slate-200">{event.summary}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.publicId} · {event.actorPseudonym} · redacted summary</p></div><span className={`h-fit rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${event.outcome === "verified" ? statusStyle.verified : event.outcome === "failed" ? statusStyle.failed : statusStyle.pending}`}>{event.outcome}</span></div>)}</div>}</Panel></>;
}

export function AlertsPage() { return <><SectionHeading eyebrow="Refreshes while open" title="Alerts & health beats" detail="Events appear here when the protected control-plane pipeline records a node-unreachable condition, failed verification, expired intent, or missed health beat." /><AlertFeed compact={false} /></>;
}

export function RegistryPage() {
  const { data: registry = [], isLoading, error, refetch } = trpc.archangel.registry.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Node registry unavailable." detail="ARCHANGEL cannot show an empty registry when the protected node-identity query has failed." /><Panel><QueryFailure title="Node registry unavailable" retry={() => refetch()} /></Panel></>;
  return <><SectionHeading eyebrow="Declared identity records" title="Node registry" detail="Registry records identify the declared node role, topology layer, enrollment posture, and public-key fingerprint. Private key material is never shown or stored here." /><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected node registry" /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/[0.07] bg-white/[0.025]"><tr>{["Node", "Layer", "Declared role", "Fingerprint", "Enrollment"].map(label => <th key={label} className="px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{registry.map(node => <tr key={node.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 text-xs text-slate-500">{node.region}</p></td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${node.cluster === "Alpha" ? "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100" : node.cluster === "Beta" ? "border-violet-300/20 bg-violet-300/[0.07] text-violet-100" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100"}`}>{node.cluster}</span></td><td className="px-5 py-4 text-sm text-slate-300">{node.role}</td><td className="px-5 py-4 font-mono text-xs text-slate-400">{node.publicKeyFingerprint}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm text-amber-100"><Clock3 className="h-3.5 w-3.5" />{node.enrollmentStatus}</span></td></tr>)}</tbody></table></div>}</Panel></>;
}
