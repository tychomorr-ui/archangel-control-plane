import { useMemo, useState } from "react";

const artifacts = [
  ["scope_escalation", "Scope escalation", "rejected", "capability boundary", "tamper-safe"],
  ["replay", "Replay attempt", "rejected", "replay protection", "fresh fixture"],
  ["unknown_destination", "Unknown destination", "quarantined", "destination policy", "signature valid · authority denied"],
  ["expiry", "Expired envelope", "rejected", "freshness window", "clock bounded"],
  ["tamper", "Payload tampering", "rejected", "signature verification", "hash mismatch"],
] as const;

export function AdversarialArtifactsDashboard() {
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => artifacts.filter(item => filter === "all" || item[2] === filter), [filter]);
  return <section className="adversarial-dashboard" aria-labelledby="adversarial-dashboard-title"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-amber-100/70">CI evidence export</p><h2 id="adversarial-dashboard-title" className="mt-1 font-display text-xl text-white">Adversarial test artifacts</h2><p className="mt-2 text-xs leading-5 text-slate-400">Visualizes the exported local contract report. Values are fixture outcomes, not live production incidents.</p></div><span className="rogue-posture-badge">artifact · read-only</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2" role="group" aria-label="Filter CI artifact outcomes">{["all", "rejected", "quarantined"].map(value => <button type="button" key={value} className="flow-mode-toggle" data-active={filter === value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">{visible.length} artifacts shown · export status: local</span></div><div className="mt-3 grid gap-2">{visible.map(([id, label, outcome, basis, detail]) => <div className="adversarial-dashboard__row" key={id}><span className="adversarial-dashboard__status" data-outcome={outcome}>{outcome}</span><div><strong>{label}</strong><small>{basis} · {detail}</small></div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-500">{id}</span></div>)}</div></section>;
}
