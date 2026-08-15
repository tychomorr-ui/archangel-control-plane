import { CircleDashed, LockKeyhole, MapPin, Radar, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

type FieldState = "declared" | "pending" | "verified" | "stale" | "offline" | "policy-blocked" | "unplaced";
type FleetNode = { id: string; name: string; region: string; role: string; declaredState: string; cluster: string; status: { verificationState: string; observedAt: Date | null; narrative: string } };

const stateMeta: Record<FieldState, { label: string; color: string; description: string }> = {
  declared: { label: "Declared", color: "#e2e8f0", description: "Owner-supplied inventory records a host; no runtime conclusion follows." },
  pending: { label: "Pending evidence", color: "#fbbf24", description: "A declared host awaits a current signed status receipt." },
  verified: { label: "Verified", color: "#6ee7b7", description: "A future current signed receipt, identity, and freshness gate have accepted this state." },
  stale: { label: "Evidence stale", color: "#fbbf24", description: "A future previously accepted receipt has exceeded its freshness window." },
  offline: { label: "Offline evidence", color: "#fb7185", description: "Available only after a future signed, policy-defined offline signal; never inferred from a missing receipt." },
  "policy-blocked": { label: "Policy blocked", color: "#c4b5fd", description: "A future policy evaluation contained this planned state; it is not a host failure." },
  unplaced: { label: "Unplaced", color: "#fde68a", description: "An application role is declared without a physical host and region." },
};

const cityProxy = [
  { nodeId: "project-reclaim", x: 79, y: 103, labelDx: 14, labelDy: 31 },
  { nodeId: "root-gate", x: 260, y: 129, labelDx: 0, labelDy: 44 },
  { nodeId: "iwa-sage", x: 276, y: 103, labelDx: 20, labelDy: -17 },
  { nodeId: "xinus-clarity", x: 545, y: 72, labelDx: -23, labelDy: -18 },
  { nodeId: "tesseract-terminus", x: 555, y: 123, labelDx: 18, labelDy: 39 },
  { nodeId: "tesseract-a", x: 605, y: 85, labelDx: 23, labelDy: 21 },
  { nodeId: "keira", x: 383, y: 379, labelDx: 0, labelDy: 29 },
  { nodeId: "kether-gate", x: 985, y: 280, labelDx: 0, labelDy: 28 },
] as const;

const london = { nodeId: "archangel-london", name: "ARCHANGEL host", region: "London · eu-west-2", role: "Dedicated control-plane host · observe-only baseline", x: 569, y: 79 };

function truthState(node: FleetNode | undefined): FieldState {
  if (!node) return "declared";
  if (node.declaredState !== "Declared running") return "unplaced";
  if (node.status.verificationState === "verified") return "verified";
  return "pending";
}

export function OperationsField({ fleet }: { fleet: FleetNode[] }) {
  const [filter, setFilter] = useState<FieldState | "all">("all");
  const [selectedId, setSelectedId] = useState("archangel-london");
  const fieldNodes = useMemo(() => cityProxy.map(proxy => {
    const node = fleet.find(item => item.id === proxy.nodeId);
    return node ? { ...proxy, node, state: truthState(node) } : null;
  }).filter(Boolean) as Array<(typeof cityProxy)[number] & { node: FleetNode; state: FieldState }>, [fleet]);
  const selected = selectedId === "archangel-london" ? { ...london, state: "pending" as FieldState, status: { narrative: "London hosts the observe-only ARCHANGEL baseline. No signed receipt channel is active." } } : fieldNodes.find(item => item.node.id === selectedId);
  const unplaced = fleet.filter(node => node.declaredState !== "Declared running");
  const stateCounts = Object.fromEntries((["declared", "pending", "verified", "stale", "offline", "policy-blocked"] as FieldState[]).map(state => [state, fieldNodes.filter(item => item.state === state).length]));
  const filtered = fieldNodes.filter(item => filter === "all" || item.state === filter);
  const selectNode = (nodeId: string) => setSelectedId(nodeId);
  const onBeaconKey = (event: React.KeyboardEvent<SVGGElement>, nodeId: string) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(nodeId); } };

  return <section className="mt-8">
    <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-cyan-200/60">Operations field · regional-city proxy projection</p><h2 className="mt-1 font-display text-2xl text-white">The world, as evidence allows it.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Select a beacon to inspect its role and evidence state. Beacons represent supplied regional inventory only; they do not draw traffic, latency, health, or an offline conclusion without the required proof.</p></div><div className="flex flex-wrap gap-2" aria-label="Operations-field state filter">{(["all", "pending", "verified", "stale", "offline", "policy-blocked"] as const).map(state => <button key={state} type="button" className="ops-state-control" data-active={filter === state} onClick={() => setFilter(state)}>{state === "all" ? "All declared" : `${stateMeta[state].label} ${stateCounts[state] ?? ""}`}</button>)}</div></div>
    <div className="operations-field rounded-2xl border border-cyan-300/15"><div className="relative border-b border-white/[.07] px-5 py-4"><div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="signal-beacon"><span className="signal-beacon__dot"/><Radar className="h-3.5 w-3.5"/>Visual state follows evidence</div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">regional proxy · not AWS facility coordinates</p></div></div>
      <div className="relative p-3 sm:p-5"><p className="mb-2 font-mono text-[8px] uppercase tracking-[.13em] text-slate-500 sm:hidden">Swipe field horizontally to inspect regional beacons</p><div className="overflow-x-auto pb-2"><svg viewBox="0 0 1100 450" className="h-auto min-w-[760px] w-full sm:min-w-0" role="img" aria-label="Interactive regional operations field showing declared hosts and evidence states"><defs><pattern id="ops-latlon" width="55" height="45" patternUnits="userSpaceOnUse"><path d="M55 0H0V45" fill="none" stroke="#67e8f9" strokeOpacity=".07" strokeWidth=".7"/></pattern><radialGradient id="ops-glow"><stop stopColor="#67e8f9" stopOpacity=".24"/><stop offset="1" stopColor="#67e8f9" stopOpacity="0"/></radialGradient></defs><rect width="1100" height="450" rx="18" fill="url(#ops-latlon)"/><path d="M18 105c72-48 156-64 241-35 50 16 76 39 116 44 42 5 74-11 106-26 52-25 121-27 178-4 49 20 96 34 143 18 44-15 85-8 121 21 53 42 104 65 159 62M53 338c59-31 126-34 188-9 43 17 77 46 124 53 72 12 126-10 188-24 68-15 130-5 183 26" fill="none" stroke="#a5f3fc" strokeOpacity=".09" strokeWidth="1.3"/><path d="M505 55c34 10 62 24 78 49M544 127c-7 31 2 60 22 79M372 310c36 21 70 28 104 20" fill="none" stroke="#c4b5fd" strokeOpacity=".12" strokeWidth="1" strokeDasharray="4 8"/>
        <g className="ops-beacon" data-state="pending" data-muted={filter !== "all" && filter !== "pending"} role="button" tabIndex={0} aria-label="ARCHANGEL London host: pending evidence" onClick={() => selectNode("archangel-london")} onKeyDown={event => onBeaconKey(event, "archangel-london")}><circle className="ops-beacon__pulse" cx={london.x} cy={london.y} r="12"/><circle className="ops-beacon__ring" cx={london.x} cy={london.y} r="13" fill="#06111b"/><circle className="ops-beacon__core" cx={london.x} cy={london.y} r="5" fill="#fbbf24"/><path d={`M${london.x - 3} ${london.y}h6M${london.x} ${london.y - 3}v6`} stroke="#fff7ed" strokeWidth="1"/></g>
        {fieldNodes.map(item => <g key={item.node.id} className="ops-beacon" data-state={item.state} data-muted={filter !== "all" && filter !== item.state} role="button" tabIndex={0} aria-label={`${item.node.name}: ${stateMeta[item.state].label}`} onClick={() => selectNode(item.node.id)} onKeyDown={event => onBeaconKey(event, item.node.id)}><circle className="ops-beacon__pulse" cx={item.x} cy={item.y} r="10" stroke={stateMeta[item.state].color}/><circle className="ops-beacon__ring" cx={item.x} cy={item.y} r="9" fill="#06111b"/><circle className="ops-beacon__core" cx={item.x} cy={item.y} r="3.8" fill={stateMeta[item.state].color}/><text x={item.x + item.labelDx} y={item.y + item.labelDy} textAnchor={item.node.id === "xinus-clarity" ? "end" : item.node.id === "kether-gate" ? "end" : "start"} fill="#e2e8f0" fontSize="10" fontFamily="DM Mono, monospace">{item.node.name}</text><text x={item.x + item.labelDx} y={item.y + item.labelDy + 13} textAnchor={item.node.id === "xinus-clarity" ? "end" : item.node.id === "kether-gate" ? "end" : "start"} fill={stateMeta[item.state].color} fillOpacity=".76" fontSize="8" fontFamily="DM Mono, monospace" letterSpacing=".8">{stateMeta[item.state].label.toUpperCase()}</text></g>)}<text x="24" y="432" fill="#64748b" fontSize="9" fontFamily="DM Mono, monospace" letterSpacing="1">NO LINK, TRAFFIC, LATENCY, OR HEALTH CLAIM IS DRAWN WITHOUT EVIDENCE</text></svg></div></div>
      <div className="relative grid gap-4 border-t border-white/[.07] px-5 py-5 lg:grid-cols-[1fr_360px]"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-cyan-100/70">Selected field record</p>{selected ? <><div className="mt-2 flex flex-wrap items-center gap-2"><p className="font-display text-xl text-white">{("node" in selected ? selected.node.name : selected.name)}</p><span className="rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.11em]" style={{ borderColor: `${stateMeta[selected.state].color}55`, color: stateMeta[selected.state].color }}>{stateMeta[selected.state].label}</span></div><p className="mt-1 text-xs text-slate-400">{("node" in selected ? selected.node.region : selected.region)} · {("node" in selected ? selected.node.role : selected.role)}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{("node" in selected ? selected.node.status.narrative : selected.status.narrative)}</p></> : <p className="mt-2 text-sm text-slate-400">Choose a declared beacon to inspect its evidence boundary.</p>}</div><div className="ops-field-tooltip rounded-xl p-4"><p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.13em] text-amber-100"><TriangleAlert className="h-3.5 w-3.5"/>Truth safeguard</p><p className="mt-2 text-xs leading-5 text-slate-400">A missing receipt remains <span className="text-amber-100">pending evidence</span>. The field reserves red “offline” beacons for a future signed offline rule; it will not manufacture an outage from absence.</p></div></div></div>
    {unplaced.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-4"><p className="font-mono text-[9px] uppercase tracking-[.13em] text-amber-100">Unplaced application ledger</p><p className="mt-2 text-xs leading-5 text-slate-400">These roles have no declared physical coordinates and are intentionally excluded from the world field.</p></div>{unplaced.map(node => <div key={node.id} className="rounded-xl border border-dashed border-amber-300/20 bg-amber-300/[.025] p-4"><p className="font-display text-base text-white">{node.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{node.role}</p></div>)}</div> : null}
  </section>;
}
