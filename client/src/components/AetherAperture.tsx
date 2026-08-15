import { Activity, ShieldCheck, Sparkles } from "lucide-react";

type AetherApertureProps = {
  verified: number;
  pending: number;
  mode?: "observe" | "review" | "verify";
  compact?: boolean;
};

export function AetherAperture({ verified, pending, mode = "observe", compact = false }: AetherApertureProps) {
  const stateLabel = mode === "review" ? "Intent review field" : mode === "verify" ? "Verification field" : "Observe-only field";
  return (
    <div className={`aether-aperture ${compact ? "aether-aperture--compact" : ""}`} aria-label={`ARCHANGEL aperture: ${stateLabel}; ${verified} verified receipts and ${pending} pending receipts.`}>
      <div className="aether-aperture__halo aether-aperture__halo--outer" aria-hidden="true" />
      <div className="aether-aperture__halo aether-aperture__halo--inner" aria-hidden="true" />
      <div className="aether-aperture__orbit aether-aperture__orbit--one" aria-hidden="true" />
      <div className="aether-aperture__orbit aether-aperture__orbit--two" aria-hidden="true" />
      <div className="aether-aperture__core">
        <ShieldCheck className="h-6 w-6 text-cyan-100" aria-hidden="true" />
        <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-100">ARCHANGEL</span>
        <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">{stateLabel}</span>
      </div>
      {!compact ? <div className="aether-aperture__readout"><div><Activity className="h-3.5 w-3.5 text-emerald-200"/><span><strong>{String(verified).padStart(2, "0")}</strong> verified</span></div><div><Sparkles className="h-3.5 w-3.5 text-amber-100"/><span><strong>{String(pending).padStart(2, "0")}</strong> pending</span></div></div> : null}
    </div>
  );
}
