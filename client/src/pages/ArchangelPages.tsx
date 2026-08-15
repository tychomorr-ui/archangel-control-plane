import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { OPERATION_TYPES, type OperationType } from "@shared/archangel";
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
    [98, 54, "The_Portal"],
  ];
  return (
    <Panel className="relative mb-6 overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_50%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_80%_52%,rgba(139,92,246,0.13),transparent_32%)]" />
      <div className="relative grid gap-6 p-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:p-7">
        <div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.9)]" /><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">ARCHANGEL protocol · constellation 01</p></div>
          <h2 className="mt-3 max-w-xl font-display text-2xl font-medium leading-tight text-white sm:text-3xl">One quiet interface for the whole mesh.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Six declared Lightsail nodes resolve into one operator view. A node stays pending until ARCHANGEL can verify its identity, freshness, and signed receipt.</p>
          <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100">Identity before action</span><span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-100">Intent before execution</span></div>
        </div>
        <div className="relative min-h-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#060912]/55">
          <svg viewBox="0 0 112 108" className="h-full min-h-48 w-full" aria-label="Declared six-node mesh constellation">
            <defs><linearGradient id="arc-cyan" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".18"/><stop offset=".5" stopColor="#e0f2fe" stopOpacity=".7"/><stop offset="1" stopColor="#c4b5fd" stopOpacity=".2"/></linearGradient></defs>
            <circle cx="56" cy="54" r="32" fill="none" stroke="#67e8f9" strokeOpacity=".16" strokeDasharray="1.2 3"/><circle cx="56" cy="54" r="18" fill="none" stroke="#c4b5fd" strokeOpacity=".18"/><path d="M16 56 C34 24 50 30 83 20 M16 56 C35 82 56 76 78 78 M35 24 C58 43 73 39 98 54 M34 84 C55 69 76 70 98 54" fill="none" stroke="url(#arc-cyan)" strokeWidth=".65"/>
            <circle cx="56" cy="54" r="8" fill="#0d1e2d" stroke="#67e8f9" strokeOpacity=".6"/><path d="M52 54 h8 M56 50 v8" stroke="#a5f3fc" strokeWidth=".8"/>
            {points.map(([x, y, label], index) => <g key={label as string}><circle cx={x as number} cy={y as number} r="2.6" fill={index < 3 ? "#67e8f9" : "#c4b5fd"} fillOpacity=".2" stroke={index < 3 ? "#a5f3fc" : "#ddd6fe"} strokeOpacity=".8"/><text x={x as number} y={(y as number) + 6} textAnchor="middle" fill="#94a3b8" fontSize="3.1" fontFamily="DM Mono, monospace">{label as string}</text></g>)}
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
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/55">Cluster {node.cluster}</p>
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
      <SectionHeading eyebrow="Six-node declared fleet" title="The ecosystem, made legible." detail="ARCHANGEL treats every live claim as provisional until its node identity, freshness, and signed receipt verify. The current view is protected and refreshes while open." action={<Button variant="outline" onClick={() => refetch()} className="border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"><RefreshCcw className="mr-2 h-4 w-4" />Refresh view</Button>} />
      <ConstellationSignal />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-5"><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Declared nodes</p><p className="mt-3 font-display text-4xl text-white">06</p><p className="mt-1 text-xs text-slate-500">Two clusters · five regions</p></Panel>
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

function TopologyNode({ name, region, role, tone }: { name: string; region: string; role: string; tone: "alpha" | "beta" }) {
  return <div className={`relative z-10 rounded-xl border px-4 py-3 ${tone === "alpha" ? "border-cyan-300/25 bg-cyan-300/[0.08]" : "border-violet-300/25 bg-violet-300/[0.08]"}`}><p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${tone === "alpha" ? "text-cyan-200/65" : "text-violet-200/65"}`}>{region}</p><p className="mt-1 font-display text-base text-white">{name}</p><p className="mt-1 text-[11px] text-slate-400">{role}</p></div>;
}

export function TopologyPage() {
  const { data: fleet = [], error, refetch } = trpc.archangel.fleet.useQuery(undefined, { refetchInterval: 15_000 });
  if (error) return <><SectionHeading eyebrow="Protected data unavailable" title="Topology unavailable." detail="ARCHANGEL could not read the signed fleet registry, so it will not render a blank mesh in its place." /><Panel><QueryFailure title="Topology registry unavailable" retry={() => refetch()} /></Panel></>;
  const alpha = fleet.filter(node => node.cluster === "Alpha");
  const beta = fleet.filter(node => node.cluster === "Beta");
  return <>
    <SectionHeading eyebrow="Declared inter-node relationship" title="Global mesh topology" detail="Alpha joins the Oregon pair with Ireland. Beta joins Singapore, Frankfurt, and São Paulo. Lines represent the intended signed-status verification flow, not a claim that a private network path is currently active." />
    <Panel className="relative min-h-[560px] overflow-hidden p-5 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.09),transparent_43%)]" />
      <svg viewBox="0 0 1000 560" className="pointer-events-none absolute inset-0 h-full w-full opacity-75" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mesh" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".14"/><stop offset=".5" stopColor="#f8fafc" stopOpacity=".48"/><stop offset="1" stopColor="#c4b5fd" stopOpacity=".16"/></linearGradient></defs><path d="M180 150 C370 110 510 160 830 150 M180 280 C400 330 590 230 830 280 M180 410 C350 375 590 430 830 410" fill="none" stroke="url(#mesh)" strokeWidth="1.5" strokeDasharray="5 8"/><circle cx="500" cy="280" r="72" fill="none" stroke="#67e8f9" strokeOpacity=".22"/><circle cx="500" cy="280" r="38" fill="#67e8f9" fillOpacity=".08"/></svg>
      <div className="relative grid min-h-[490px] gap-8 lg:grid-cols-[1fr_120px_1fr] lg:items-center">
        <div><div className="mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-200"/><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100">Cluster Alpha</span></div><div className="space-y-4">{alpha.map(node => <TopologyNode key={node.id} name={node.name} region={node.region} role={node.role} tone="alpha" />)}</div></div>
        <div className="flex flex-col items-center justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.14] bg-[#0b101a]/90 text-cyan-100 shadow-[0_0_55px_rgba(34,211,238,0.15)]"><Network className="h-8 w-8" /></div><span className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">Signed flow</span></div>
        <div><div className="mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-200"/><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-100">Cluster Beta</span></div><div className="space-y-4">{beta.map(node => <TopologyNode key={node.id} name={node.name} region={node.region} role={node.role} tone="beta" />)}</div></div>
      </div>
    </Panel>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><Panel className="p-5"><Globe2 className="h-5 w-5 text-cyan-200"/><p className="mt-4 font-display text-lg text-white">Five regions</p><p className="mt-2 text-xs leading-5 text-slate-500">The declared fleet spans Oregon, Ireland, Singapore, Frankfurt, and São Paulo.</p></Panel><Panel className="p-5"><KeyRound className="h-5 w-5 text-violet-200"/><p className="mt-4 font-display text-lg text-white">Identity first</p><p className="mt-2 text-xs leading-5 text-slate-500">A line becomes trustworthy only when node identity and the current signed receipt validate.</p></Panel><Panel className="p-5"><ShieldCheck className="h-5 w-5 text-emerald-200"/><p className="mt-4 font-display text-lg text-white">No implied authority</p><p className="mt-2 text-xs leading-5 text-slate-500">Topology describes a relationship. It does not authorize traffic, shell access, or node mutation.</p></Panel></div>
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
  return <><SectionHeading eyebrow="Declared identity records" title="Node registry" detail="Registry records identify the declared node role, cluster, enrollment posture, and public-key fingerprint. Private key material is never shown or stored here." /><Panel className="overflow-hidden">{isLoading ? <PendingData label="Opening protected node registry" /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="border-b border-white/[0.07] bg-white/[0.025]"><tr>{["Node", "Cluster", "Declared role", "Fingerprint", "Enrollment"].map(label => <th key={label} className="px-5 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{registry.map(node => <tr key={node.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 text-xs text-slate-500">{node.region}</p></td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${node.cluster === "Alpha" ? "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100" : "border-violet-300/20 bg-violet-300/[0.07] text-violet-100"}`}>{node.cluster}</span></td><td className="px-5 py-4 text-sm text-slate-300">{node.role}</td><td className="px-5 py-4 font-mono text-xs text-slate-400">{node.publicKeyFingerprint}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm text-amber-100"><Clock3 className="h-3.5 w-3.5" />{node.enrollmentStatus}</span></td></tr>)}</tbody></table></div>}</Panel></>;
}
