import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { OPERATION_TYPES, TOPOLOGY_LAYOUT_CONTRACT, type OperationType } from "@shared/archangel";
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

function ConstellationSignal() {
  const points = [
    [16, 56, "Root-Gate"],
    [35, 24, "Tesseract-Terminus"],
    [34, 84, "XinUS-Clarity"],
    [83, 20, "Kether-Gate"],
    [78, 78, "Tesseract-A"],
    [98, 54, "KEIRA"],
    [56, 108, "Project Reclaim"],
  ];
  return (
    <Panel className="relative mb-6 overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_50%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_52%,rgba(139,92,246,0.13),transparent_32%)]" />
      <div className="relative grid gap-6 p-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:p-7">
        <div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.9)]" /><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">ARCHANGEL protocol · constellation 01</p></div>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-medium leading-tight text-white sm:text-3xl">One quiet interface for the whole mesh.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Two intersecting core triangles and one grounded bridge resolve into a single operator view. A node stays pending until ARCHANGEL can verify its identity, freshness, and signed receipt.</p>
          <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100">Identity before action</span><span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-100">Intent before execution</span></div>
        </div>
        <div className="relative min-h-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#060912]/55">
          <svg viewBox="0 0 112 124" className="h-full min-h-52 w-full" aria-label="Declared seven-node mesh constellation">
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

function NodeCard({ node }: { node: any }) {
  return (
    <Link href={`/nodes/${node.id}`} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b101a]/75 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-[#0e1420] hover:shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.05] blur-2xl transition group-hover:bg-cyan-300/[0.1]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/55">{node.cluster === "Bridge" ? "Grounded bridge layer" : `Cluster ${node.cluster}`}</p>
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

  if (fleetError || intentsError) return <><SectionHeading eyebrow="Protected data unavailable" title="Fleet visibility interrupted." detail="ARCHANGEL could not read the fleet registry or the intent queue. No empty state is shown in place of a failed control-plane query." /><Panel><QueryFailure title="Fleet overview unavailable" retry={() => { refetch(); refetchIntents(); }} /></Panel></>;

  return (
    <>
      <SectionHeading eyebrow="Seven-node declared ecosystem" title="The ecosystem, made legible." detail="ARCHANGEL sits at the logical intersection of two core triangles. It treats every live claim as provisional until node identity, freshness, and signed receipt verify." action={<Button variant="outline" onClick={() => refetch()} className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"><RefreshCcw className="mr-2 h-4 w-4" />Refresh view</Button>} />
      <ConstellationSignal />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Declared nodes</p><p className="mt-3 font-display text-4xl text-white">{String(fleet.length).padStart(2, "0")}</p><p className="mt-1 text-xs text-slate-500">Two core triangles · one bridge</p></Panel>
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

function TopologyNode({ name, region, role, tone, position }: { name: string; region: string; role: string; tone: "alpha" | "beta" | "bridge"; position: TopologyPosition }) {
  const colorClass = tone === "alpha" ? "border-cyan-300/30 bg-cyan-300/[0.09] shadow-[0_0_35px_rgba(34,211,238,0.08)]" : tone === "beta" ? "border-violet-300/30 bg-violet-300/[0.09] shadow-[0_0_35px_rgba(167,139,250,0.08)]" : "border-amber-300/30 bg-amber-300/[0.09] shadow-[0_0_35px_rgba(251,191,36,0.08)]";
  const labelClass = tone === "alpha" ? "text-cyan-100/70" : tone === "beta" ? "text-violet-100/70" : "text-amber-100/75";
  return <div data-topology-vertex={position} style={topologyPositions[position]} className={`absolute z-10 w-[min(13rem,39vw)] rounded-xl border px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3 ${colorClass}`}><p className={`font-mono text-[8px] uppercase tracking-[0.13em] ${labelClass}`}>{region}</p><p className="mt-1 font-display text-sm leading-4 text-white sm:text-base">{name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400 sm:text-[11px]">{role}</p></div>;
}

function GeographicMeshMap() {
  const regions = [
    { x: 85, y: 116, region: "Oregon · us-west-2", label: "Root-Gate + Project Reclaim", tone: "#a5f3fc", anchor: "start" },
    { x: 456, y: 70, region: "Ireland · eu-west-1", label: "XinUS-Clarity", tone: "#a5f3fc", anchor: "start" },
    { x: 438, y: 165, region: "Spain · eu-south-2", label: "Tesseract-Terminus", tone: "#a5f3fc", anchor: "middle" },
    { x: 528, y: 98, region: "Frankfurt · eu-central-1", label: "Tesseract-A", tone: "#ddd6fe", anchor: "start" },
    { x: 282, y: 352, region: "São Paulo · sa-east-1", label: "KEIRA", tone: "#ddd6fe", anchor: "middle" },
    { x: 855, y: 290, region: "Singapore · ap-southeast-1", label: "Kether-Gate", tone: "#ddd6fe", anchor: "end" },
  ] as const;
  const crosshair = { x: 432, y: 56 };
  return <section className="mt-8">
    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-emerald-200/60">Six unique regions · geographic placement</p><h2 className="mt-1 font-display text-2xl text-white">The actual regional crosshair</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">This view plots the six core regional locations. Root-Gate and Project Reclaim share Oregon as separate hosts; Tesseract-Terminus is now the Spain-based Sovereign Provenance Console.</p></div><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">Approximate geographic projection</span></div>
    <Panel className="relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_16%,rgba(52,211,153,0.10),transparent_24%),linear-gradient(115deg,rgba(34,211,238,0.04),transparent_42%)]" />
      <div className="relative p-4 sm:p-6">
        <svg viewBox="0 0 940 410" className="h-auto w-full" role="img" aria-label="Approximate geographic map of the five deployed regions and the calculated North Atlantic ARCHANGEL crosshair">
          <defs><pattern id="geo-grid" width="94" height="41" patternUnits="userSpaceOnUse"><path d="M 94 0 L 0 0 0 41" fill="none" stroke="#94a3b8" strokeOpacity=".08" strokeWidth="1" /></pattern><linearGradient id="geo-flow" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".2"/><stop offset=".5" stopColor="#f8fafc" stopOpacity=".55"/><stop offset="1" stopColor="#c4b5fd" stopOpacity=".2"/></linearGradient></defs>
          <rect width="940" height="410" rx="18" fill="url(#geo-grid)" />
          {regions.map(point => <path key={point.label} d={`M${crosshair.x} ${crosshair.y} L${point.x} ${point.y}`} stroke="url(#geo-flow)" strokeWidth="1.25" strokeDasharray="4 7" opacity=".8" />)}
          <circle cx={crosshair.x} cy={crosshair.y} r="30" fill="#04121c" stroke="#67e8f9" strokeOpacity=".72" strokeWidth="1.4" />
          <circle cx={crosshair.x} cy={crosshair.y} r="18" fill="none" stroke="#67e8f9" strokeOpacity=".35" strokeDasharray="3 4" />
          <path d={`M${crosshair.x - 10} ${crosshair.y}h20 M${crosshair.x} ${crosshair.y - 10}v20`} stroke="#a5f3fc" strokeWidth="1.6" />
          <text x={crosshair.x} y={crosshair.y - 39} textAnchor="middle" fill="#a5f3fc" fontSize="10" fontFamily="DM Mono, monospace" letterSpacing="1.5">CENTROID · 51.64°N, 8.61°W</text>
          {regions.map(point => <g key={point.region}><circle cx={point.x} cy={point.y} r={point.label.includes("+") ? 10 : 7} fill="#07111d" stroke={point.tone} strokeWidth="1.6" /><circle cx={point.x} cy={point.y} r={point.label.includes("+") ? 5 : 3.5} fill={point.tone} fillOpacity=".55" /><text x={point.x} y={point.y - 17} textAnchor={point.anchor} fill={point.tone} fillOpacity=".78" fontSize="9" fontFamily="DM Mono, monospace" letterSpacing="1">{point.region.toUpperCase()}</text><text x={point.x} y={point.y + 25} textAnchor={point.anchor} fill="#e2e8f0" fontSize="11" fontFamily="DM Mono, monospace">{point.label}</text></g>)}
          <text x="24" y="384" fill="#64748b" fontSize="10" fontFamily="DM Mono, monospace">OREGON HOSTS ARE SEPARATE · CONTROL LINES ARE NOT PUBLIC-TRAFFIC ROUTES</text>
        </svg>
      </div>
      <div className="grid border-t border-white/[0.07] bg-white/[0.02] md:grid-cols-3"><div className="px-5 py-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200/65">Oregon hosts</p><p className="mt-1 text-xs leading-5 text-slate-400">Root-Gate and Project Reclaim are separate Oregon hosts with distinct identities and duties.</p></div><div className="border-t border-white/[0.07] px-5 py-4 md:border-l md:border-t-0"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-200/65">ARCHANGEL host</p><p className="mt-1 text-xs leading-5 text-slate-400">London is the dedicated host for the logical center and its signed control traffic.</p></div><div className="border-t border-white/[0.07] px-5 py-4 md:border-l md:border-t-0"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-100/70">Sovereign provenance</p><p className="mt-1 text-xs leading-5 text-slate-400">Tesseract-Terminus now occupies Spain as the separate provenance and attestation vertex.</p></div></div>
    </Panel>
  </section>;
}

export function TopologyPage() {
  const { data: fleet = [], error, refetch } = trpc.archangel.fleet.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Topology unavailable." detail="ARCHANGEL could not read the signed fleet registry, so it will not render a blank mesh in its place." /><Panel><QueryFailure title="Topology registry unavailable" retry={() => refetch()} /></Panel></>;
  const byId = new Map(fleet.map(node => [node.id, node]));
  return <>
    <SectionHeading eyebrow="Declared inter-node relationship" title="Two triangles · one sovereign center" detail="Alpha and Beta are logical trust triangles over your actual regional nodes, not a distance-accurate geographic map. ARCHANGEL occupies their shared coordination center; Project Reclaim extends beneath it as the physical–digital bridge." />
    <Panel className="relative overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_36%),radial-gradient(circle_at_50%_78%,rgba(167,139,250,0.08),transparent_28%)]" />
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4"><div className="flex flex-wrap gap-x-5 gap-y-2"><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-100"><span className="h-2 w-2 rounded-full bg-cyan-200"/>Alpha · upright triangle</span><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-violet-100"><span className="h-2 w-2 rounded-full bg-violet-200"/>Beta · inverted triangle</span><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber-100"><span className="h-2 w-2 rounded-full bg-amber-100"/>Bridge layer</span></div><span className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-500">Logical geometry · not a geographic projection</span></div>
      <div className="relative min-h-[900px] sm:min-h-[940px]" role="img" aria-label="Logical topology of Alpha upright triangle and Beta inverted triangle around ARCHANGEL">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"><defs><linearGradient id="alpha-triangle" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".48"/><stop offset="1" stopColor="#a5f3fc" stopOpacity=".2"/></linearGradient><linearGradient id="beta-triangle" x1="0" x2="1"><stop stopColor="#c4b5fd" stopOpacity=".22"/><stop offset="1" stopColor="#ddd6fe" stopOpacity=".5"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="none" stroke="#67e8f9" strokeOpacity=".13" strokeDasharray="1 2.5"/><polygon points="50,8 12,66 88,66" fill="rgba(34,211,238,0.025)" stroke="url(#alpha-triangle)" strokeWidth="0.28"/><polygon points="12,30 88,30 50,80" fill="rgba(167,139,250,0.025)" stroke="url(#beta-triangle)" strokeWidth="0.28"/><path d="M50 55 L50 97" fill="none" stroke="#fde68a" strokeOpacity=".5" strokeWidth="0.3" strokeDasharray="1.1 1.8"/><circle cx="50" cy="50" r="9" fill="#08131e" fillOpacity=".94" stroke="#67e8f9" strokeOpacity=".8" strokeWidth="0.38"/><circle cx="50" cy="50" r="4.7" fill="none" stroke="#a5f3fc" strokeOpacity=".35" strokeWidth="0.28"/><path d="M46.5 50h7M50 46.5v7" stroke="#cffafe" strokeOpacity=".9" strokeWidth="0.45"/></svg>
        {TOPOLOGY_LAYOUT_CONTRACT.vertices.map(vertex => { const node = byId.get(vertex.id); return node ? <TopologyNode key={node.id} name={node.name} region={node.region} role={node.role} tone={vertex.tone} position={vertex.position} /> : null; })}
        <div className="absolute left-1/2 top-1/2 z-20 flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full border border-cyan-200/20 bg-[#08131e]/90 px-3 py-4 text-center shadow-[0_0_55px_rgba(34,211,238,0.16)]"><Network className="h-6 w-6 text-cyan-100"/><span className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-100">ARCHANGEL</span><span className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">Logical center · London</span></div>
        <p className="absolute left-1/2 top-[54.5%] z-10 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">Shared coordination crosshair</p>
      </div>
    </Panel>
    <GeographicMeshMap />
    <div className="mt-6 grid gap-4 md:grid-cols-3"><Panel className="p-5"><Globe2 className="h-5 w-5 text-cyan-200"/><p className="mt-4 font-display text-lg text-white">Six regions · real map</p><p className="mt-2 text-xs leading-5 text-slate-500">The core vertices are Oregon, Spain, Ireland, Frankfurt, Singapore, and São Paulo. Project Reclaim is a separate Oregon field host.</p></Panel><Panel className="p-5"><KeyRound className="h-5 w-5 text-violet-200"/><p className="mt-4 font-display text-lg text-white">ARCHANGEL at center</p><p className="mt-2 text-xs leading-5 text-slate-500">The crosshair remains logical. ARCHANGEL’s dedicated London host is separate from every core vertex and coordinates signed control traffic only.</p></Panel><Panel className="p-5"><ShieldCheck className="h-5 w-5 text-amber-100"/><p className="mt-4 font-display text-lg text-white">Project Reclaim · Oregon</p><p className="mt-2 text-xs leading-5 text-slate-500">The field node is a separate Oregon host for Lake and Mendocino County programs. It shares a Region with Root-Gate but never its authority or credentials.</p></Panel></div>
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

export function AuditPage() {
  const { data: events = [], isLoading, error, refetch } = trpc.archangel.audit.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Audit ledger unavailable." detail="ARCHANGEL will never substitute an empty ledger for a failed audit query." /><Panel><QueryFailure title="Audit ledger unavailable" retry={() => refetch()} /></Panel></>;
  return <><SectionHeading eyebrow="Redacted and append-only" title="Audit ledger" detail="ARCHANGEL writes intent, approval, receipt, and verification outcomes as structured event records. This view does not permit editing or deletion." /><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected audit ledger" /> : events.length === 0 ? <PendingData label="No audit events recorded" /> : <div className="divide-y divide-white/[0.06]">{events.map(event => <div key={event.publicId} className="grid gap-3 px-5 py-4 md:grid-cols-[150px_1fr_auto]"><div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{new Date(event.occurredAt).toLocaleString()}</div><div><p className="text-sm text-slate-200">{event.summary}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.publicId} · {event.actorPseudonym} · redacted summary</p></div><span className={`h-fit rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${event.outcome === "verified" ? statusStyle.verified : event.outcome === "failed" ? statusStyle.failed : statusStyle.pending}`}>{event.outcome}</span></div>)}</div>}</Panel></>;
}

export function AlertsPage() { return <><SectionHeading eyebrow="Refreshes while open" title="Alerts & health beats" detail="Events appear here when the protected control-plane pipeline records a node-unreachable condition, failed verification, expired intent, or missed health beat." /><AlertFeed compact={false} /></>;
}

export function RegistryPage() {
  const { data: registry = [], isLoading, error, refetch } = trpc.archangel.registry.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Node registry unavailable." detail="ARCHANGEL cannot show an empty registry when the protected node-identity query has failed." /><Panel><QueryFailure title="Node registry unavailable" retry={() => refetch()} /></Panel></>;
  return <><SectionHeading eyebrow="Declared identity records" title="Node registry" detail="Registry records identify the declared node role, topology layer, enrollment posture, and public-key fingerprint. Private key material is never shown or stored here." /><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected node registry" /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/[0.07] bg-white/[0.025]"><tr>{["Node", "Layer", "Declared role", "Fingerprint", "Enrollment"].map(label => <th key={label} className="px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{registry.map(node => <tr key={node.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 text-xs text-slate-500">{node.region}</p></td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${node.cluster === "Alpha" ? "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100" : node.cluster === "Beta" ? "border-violet-300/20 bg-violet-300/[0.07] text-violet-100" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100"}`}>{node.cluster}</span></td><td className="px-5 py-4 text-sm text-slate-300">{node.role}</td><td className="px-5 py-4 font-mono text-xs text-slate-400">{node.publicKeyFingerprint}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm text-amber-100"><Clock3 className="h-3.5 w-3.5" />{node.enrollmentStatus}</span></td></tr>)}</tbody></table></div>}</Panel></>;
}
