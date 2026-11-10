import { useState } from "react";

const envelopes = [
  { id: "env-read-receipt", operation: "Read signed receipt", scope: "evidence.read", target: "registered-node/*", expiry: "5 minutes", approval: "not required · read-only", rollback: "none · read-only", disposition: "accepted", hash: "sha256:sample-contract-read" },
  { id: "env-queue-envelope", operation: "Queue Pharo-Lapse envelope", scope: "transport.queue", target: "local-device/*", expiry: "15 minutes", approval: "operator when external", rollback: "discard or retry", disposition: "held", hash: "sha256:sample-contract-queue" },
  { id: "env-set-mode", operation: "Request control-plane mode", scope: "control.mode", target: "ARCHANGEL", expiry: "60 seconds", approval: "required", rollback: "inverse mode receipt", disposition: "review", hash: "sha256:sample-contract-mode" },
] as const;
type EnvelopeId = (typeof envelopes)[number]["id"];

export function CapabilityEnvelopeViewer() {
  const [selected, setSelected] = useState<EnvelopeId>(envelopes[0].id);
  const envelope = envelopes.find(item => item.id === selected) ?? envelopes[0];
  return <section className="capability-viewer" aria-labelledby="capability-viewer-title">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/70">Dedicated evidence viewer</p><h2 id="capability-viewer-title" className="mt-1 font-display text-xl text-white">Signed capability envelopes</h2><p className="mt-2 text-xs leading-5 text-slate-400">Inspect the signed contract fields without exposing private keys. This viewer displays contract fixtures and stored evidence only; it cannot issue authority.</p></div><span className="rogue-posture-badge">read-only · no signing</span></div>
    <div className="mt-4 grid gap-3 lg:grid-cols-[.72fr_1.28fr]"><div className="grid gap-2" role="listbox" aria-label="Capability envelope fixtures">{envelopes.map(item => <button key={item.id} type="button" role="option" aria-selected={selected === item.id} className="capability-viewer__item" data-selected={selected === item.id} onClick={() => setSelected(item.id)}><span>{item.operation}</span><small>{item.scope} · {item.disposition}</small></button>)}</div><div className="capability-viewer__detail" aria-live="polite"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[["envelope", envelope.id], ["operation", envelope.operation], ["scope", envelope.scope], ["target", envelope.target], ["expiry", envelope.expiry], ["approval", envelope.approval], ["rollback", envelope.rollback], ["payload hash", envelope.hash], ["signature", "present · redacted"]].map(([label, value]) => <div key={label} className="capability-field"><span>{label}</span><strong>{value}</strong></div>)}</div><p className="mt-3 font-mono text-[9px] uppercase tracking-[.1em] text-amber-100/80">Boundary: valid signature proves integrity, not permission.</p></div></div>
  </section>;
}
