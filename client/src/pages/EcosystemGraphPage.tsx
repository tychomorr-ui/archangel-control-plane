import { AetherAperture } from "@/components/AetherAperture";
import { trpc } from "@/lib/trpc";
import { CircleDashed, Network, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type Lens = "roles" | "evidence" | "placement";

const placement: Record<string, { x: number; y: number }> = {
  "root-gate": { x: 192, y: 390 },
  "tesseract-terminus": { x: 752, y: 390 },
  "xinus-clarity": { x: 470, y: 95 },
  "kether-gate": { x: 150, y: 188 },
  "tesseract-a": { x: 795, y: 188 },
  "keira": { x: 470, y: 500 },
  "project-reclaim": { x: 470, y: 610 },
  "iwa-sage": { x: 112, y: 548 },
  "resonate-earth": { x: 868, y: 548 },
  "exitus-lens": { x: 868, y: 92 },
  "valkyrie-adjudication-entity": { x: 112, y: 92 },
};

const lensCopy: Record<Lens, { title: string; detail: string; line: string }> = {
  roles: { title: "Role constellation", detail: "Logical relationships reveal trust boundaries and declared responsibilities, not geographic distance or live traffic.", line: "logical relationship" },
  evidence: { title: "Evidence field", detail: "Every node is awaiting a signed receipt. The graph shows no health path until a receipt is verified.", line: "proof path pending" },
  placement: { title: "Placement ledger", detail: "Current hosts are located by supplied region. Manus-hosted Valkyrie is shown as a logical application endpoint; Resonate Earth and Exitus Lens remain deliberately unplaced.", line: "physical inventory plus declared endpoints" },
};

export function EcosystemGraphPage() {
  const { data: fleet = [], isLoading, error, refetch } = trpc.archangel.fleet.useQuery(undefined, { refetchInterval: 15_000 });
  const [lens, setLens] = useState<Lens>("roles");
  const verified = useMemo(() => fleet.filter(node => node.status.verificationState === "verified").length, [fleet]);
  const pending = useMemo(() => fleet.filter(node => node.status.verificationState === "pending").length, [fleet]);
  const activeCopy = lensCopy[lens];
  const roleEdges = [
    ["xinus-clarity", "root-gate"], ["xinus-clarity", "tesseract-terminus"], ["root-gate", "tesseract-terminus"],
    ["kether-gate", "tesseract-a"], ["kether-gate", "keira"], ["tesseract-a", "keira"], ["project-reclaim", "keira"],
  ];

  if (error) return <section className="ion-surface rounded-2xl p-8"><p className="font-mono text-xs uppercase tracking-[.16em] text-rose-100">Protected graph unavailable</p><button onClick={() => refetch()} className="mt-4 truth-lens" data-active="true">Retry secure query</button></section>;
  return <>
    <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-cyan-200/60">Ecosystem graph · multi-dimensional truth</p><h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">The sovereign field.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Move through the ecosystem by declared role, evidence state, or physical placement. Each lens changes the explanation without altering the underlying record.</p></div><div className="signal-beacon"><span className="signal-beacon__dot" />{verified} verified · {pending} pending</div></header>
    <section className="ion-surface neural-grid overflow-hidden rounded-2xl"><div className="relative border-b border-white/[.07] px-5 py-4 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2">{(Object.keys(lensCopy) as Lens[]).map(item => <button type="button" key={item} className="truth-lens" data-active={lens === item} onClick={() => setLens(item)}>{item}</button>)}</div><div className="max-w-xl text-xs leading-5 text-slate-400"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-cyan-100">{activeCopy.title}</span><span className="mx-2 text-slate-600">/</span>{activeCopy.detail}</div></div></div>
      <div className="relative min-h-[710px] px-3 py-5 sm:px-7"><svg viewBox="0 0 1000 680" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-label={`${activeCopy.title} ecosystem graph`}><defs><linearGradient id="graph-cyan" x1="0" x2="1"><stop stopColor="#67e8f9" stopOpacity=".62"/><stop offset="1" stopColor="#c4b5fd" stopOpacity=".26"/></linearGradient></defs><circle cx="470" cy="338" r="280" fill="none" stroke="#67e8f9" strokeOpacity=".10" strokeDasharray="2 10"/>{lens === "roles" ? roleEdges.map(([from, to]) => { const a = placement[from]; const b = placement[to]; return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#graph-cyan)" strokeWidth="1.25" />; }) : null}{lens === "evidence" ? fleet.map(node => { const p = placement[node.id]; return <line key={node.id} x1="470" y1="338" x2={p.x} y2={p.y} stroke="#fbbf24" strokeOpacity=".22" strokeDasharray="3 6" />; }) : null}{fleet.map(node => { const p = placement[node.id]; const isUnplaced = node.declaredState !== "Declared running"; const fill = node.cluster === "Alpha" ? "#67e8f9" : node.cluster === "Beta" ? "#c4b5fd" : node.cluster === "Bridge" ? "#fde68a" : "#fbbf24"; return <g key={node.id}><circle cx={p.x} cy={p.y} r={isUnplaced ? 16 : 13} fill="#07111d" stroke={fill} strokeOpacity={isUnplaced ? ".42" : ".86"} strokeWidth="1.4" strokeDasharray={isUnplaced ? "3 3" : undefined}/><circle cx={p.x} cy={p.y} r="4.5" fill={fill} fillOpacity={isUnplaced ? ".26" : ".74"}/><text x={p.x} y={p.y + 30} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontFamily="DM Mono, monospace">{node.name}</text><text x={p.x} y={p.y + 45} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="DM Mono, monospace">{isUnplaced ? "UNPLACED" : node.cluster.toUpperCase()}</text></g>; })}<circle cx="470" cy="338" r="68" fill="#07131e" fillOpacity=".94" stroke="#67e8f9" strokeOpacity=".75" strokeWidth="1.7"/><circle cx="470" cy="338" r="40" fill="none" stroke="#a5f3fc" strokeOpacity=".32" strokeDasharray="3 4"/><path d="M454 338h32M470 322v32" stroke="#cffafe" strokeWidth="2"/></svg><div className="pointer-events-none absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2"><AetherAperture compact verified={verified} pending={pending}/></div><div className="absolute bottom-5 left-5 rounded-lg border border-white/[.08] bg-[#05070d]/85 px-3 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">{activeCopy.line} · all endpoints require explicit evidence</div></div></section>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{isLoading ? <div className="col-span-full rounded-2xl border border-white/[.08] p-8 text-center font-mono text-xs uppercase tracking-[.14em] text-slate-500">Reading protected graph inventory</div> : fleet.map(node => <Link key={node.id} href={`/nodes/${node.id}`} className="group rounded-xl border border-white/[.08] bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-cyan-300/[.045]"><div className="flex items-center justify-between gap-2"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-cyan-200/55">{node.declaredState === "Declared running" ? "Declared host" : "Unplaced application"}</p>{node.status.verificationState === "verified" ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-200"/> : <CircleDashed className="h-3.5 w-3.5 text-amber-100"/>}</div><p className="mt-2 font-display text-base text-white">{node.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{node.region}</p></Link>)}</section>
  </>;
}
