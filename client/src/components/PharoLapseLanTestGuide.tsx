import { useState } from "react";

const steps = [
  ["01", "Prepare the boundary", "Use two disposable devices and disconnect the WAN at the router or physical uplink. Do not use production keys or participant data.", "WAN isolated · witness required"],
  ["02", "Create disposable identities", "Generate one ephemeral Ed25519 identity on each device and record public fingerprints only.", "private keys remain local"],
  ["03", "Sign and queue on Device A", "Create a minimum-necessary test envelope, bind sender, recipient, expiry, payload hash, and signature, then persist it before relay.", "queue record exists"],
  ["04", "Forward over the LAN", "Use only the allowlisted local carrier. Confirm sender, recipient, expiry, and payload hash are unchanged.", "bytes preserved"],
  ["05", "Verify on Device B", "Verify signature, recipient, freshness, and payload hash, then commit consumption before acknowledgement.", "receipt committed"],
  ["06", "Run rejection cases", "Replay the message ID and tamper with payload or recipient. Both must fail closed.", "replay/tamper rejected"],
  ["07", "Restart and close", "Restart Device B, verify consumed state remains, confirm WAN is still disconnected, and sign the local evidence summary.", "physical test witnessed"],
] as const;

export function PharoLapseLanTestGuide() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  return <section className="lan-test-guide" aria-labelledby="lan-test-guide-title"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-violet-100/70">Operator procedure · physical proof gate</p><h2 id="lan-test-guide-title" className="mt-1 font-display text-xl text-white">Two-device Pharo-Lapse LAN test</h2><p className="mt-2 text-xs leading-5 text-slate-400">Interactive checklist for an isolated local network. This guide does not execute device commands or mark a physical test complete.</p></div><span className="rogue-posture-badge">physical validation pending</span></div><div className="mt-4 grid gap-3 lg:grid-cols-[.8fr_1.2fr]"><div className="grid gap-2" role="listbox" aria-label="LAN test steps">{steps.map(([id, title], index) => <button type="button" role="option" aria-selected={step === index} key={id} className="lan-test-guide__step" data-selected={step === index} onClick={() => setStep(index)}><span>{id}</span><strong>{title}</strong></button>)}</div><div className="lan-test-guide__detail" aria-live="polite"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-cyan-100/70">Step {current[0]} · {current[1]}</p><p className="mt-3 text-sm leading-6 text-slate-300">{current[2]}</p><p className="mt-4 font-mono text-[10px] uppercase tracking-[.1em] text-emerald-100">exit evidence: {current[3]}</p><div className="mt-5 flex justify-between gap-2"><button type="button" className="flow-mode-toggle" disabled={step === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>Previous</button><button type="button" className="flow-mode-toggle" disabled={step === steps.length - 1} onClick={() => setStep(value => Math.min(steps.length - 1, value + 1))}>Next step</button></div></div></div></section>;
}
