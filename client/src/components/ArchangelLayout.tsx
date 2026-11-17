import { useAuth } from "@/_core/hooks/useAuth";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BellRing,
  Cable,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Command,
  DatabaseZap,
  KeyRound,
  Orbit,
  LogOut,
  MapPinned,
  Radar,
  ScanLine,
  Settings2,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const navigation = [
  { label: "Fleet overview", path: "/", icon: Orbit },
  { label: "Mesh topology", path: "/topology", icon: Cable },
  { label: "Ecosystem graph", path: "/ecosystem", icon: Orbit },
  { label: "Application Atlas", path: "/atlas", icon: MapPinned },
  { label: "Policy Constellation", path: "/policy", icon: ShieldCheck },
  { label: "Scenario Studio", path: "/scenarios", icon: Waypoints },
  { label: "Control Briefing", path: "/briefing", icon: Radar },
  { label: "Sovereign API", path: "/sovereign-api", icon: KeyRound },
  { label: "ATMOS Evidence", path: "/atmos", icon: DatabaseZap },
  { label: "Command Center", path: "/command-center", icon: Command },
  { label: "Intent workflow", path: "/intents", icon: ClipboardList },
  { label: "Evidence Observatory", path: "/audit", icon: ScanLine },
  { label: "Alerts", path: "/alerts", icon: BellRing },
  { label: "Node registry", path: "/registry", icon: Settings2 },
];

function SignInGate() {
  const [username, setUsername] = useState("operator");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/local/config", { credentials: "include" })
      .then(response => response.json())
      .then(config => {
        if (typeof config.username === "string") setUsername(config.username);
        setPasskeyAvailable(Boolean(config.passkeyEnabled && config.passkeyCount > 0));
      })
      .catch(() => setError("The operator authentication service is unavailable. Refresh and try again."))
      .finally(() => setConfigLoading(false));
  }, []);

  const readError = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      return typeof body.message === "string" ? body.message : fallback;
    } catch { return fallback; }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const response = await fetch("/api/auth/local/login", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ username, password }) });
      if (!response.ok) throw new Error(await readError(response, "Operator credentials were rejected."));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operator sign-in failed.");
    } finally { setSubmitting(false); }
  };

  const signInWithPasskey = async () => {
    setPasskeyBusy(true); setError(null);
    try {
      const optionsResponse = await fetch("/api/auth/local/login/passkey/options", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username }), credentials: "include" });
      if (!optionsResponse.ok) throw new Error(await readError(optionsResponse, "No passkey is available for this operator."));
      const options = await optionsResponse.json();
      const assertion = await startAuthentication({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/local/login/passkey/verify", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ username, challenge: options.challenge, response: assertion }) });
      if (!verifyResponse.ok) throw new Error(await readError(verifyResponse, "The passkey could not verify this operator."));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in was cancelled or failed.");
    } finally { setPasskeyBusy(false); }
  };
  return (
    <div className="auth-gate min-h-screen px-6 py-10 text-slate-100">
      <div className="absolute inset-0 star-field opacity-70" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="glass-surface w-full overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.18)]">
                <Orbit className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-200/70">NEXINUS RI Systems</p>
                <h1 className="font-display text-xl font-semibold tracking-[0.14em] text-white">ARCHANGEL</h1>
              </div>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-300" aria-label="Protected access" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/60">Protected operator console</p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-white sm:text-5xl">Enter the control plane.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Fleet state, signed receipts, protected command drafts, registry detail, and audit records are visible only to authenticated operators.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-3">
            <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Operator ID</span><input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-200/50" /></label>
            <label className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Passphrase</span><input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-200/50" /></label>
            {error ? <p role="alert" className="text-sm text-rose-200">{error}</p> : null}
            <Button type="submit" disabled={submitting || passkeyBusy || configLoading} className="h-12 w-full rounded-xl bg-cyan-200 font-display tracking-[0.1em] text-slate-950 hover:bg-cyan-100">{submitting ? <><span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />Verifying operator</> : "Enter ARCHANGEL"}<ChevronRight className="ml-2 h-4 w-4" /></Button>
          </form>
          {passkeyAvailable ? <>
            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-600"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
            <Button type="button" onClick={signInWithPasskey} disabled={submitting || passkeyBusy} variant="outline" className="h-11 w-full rounded-xl border-cyan-200/20 bg-transparent text-cyan-100 hover:bg-cyan-200/10">{passkeyBusy ? <><span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-100" />Waiting for passkey</> : "Use passkey"}</Button>
          </> : null}
          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">First-party operator authentication · local session and WebAuthn ready</p>
        </section>
      </div>
    </div>
  );
}

function SecurityPanel({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readError = async (response: Response, fallback: string) => {
    try { const body = await response.json(); return typeof body.message === "string" ? body.message : fallback; } catch { return fallback; }
  };

  const rotatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    if (newPassword !== confirmPassword) { setError("The new passphrases do not match."); setBusy(false); return; }
    try {
      const response = await fetch("/api/auth/local/rotate-password", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword, newPassword }) });
      if (!response.ok) throw new Error(await readError(response, "Passphrase rotation failed."));
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage("Passphrase updated. Other active operator sessions were invalidated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Passphrase rotation failed."); }
    finally { setBusy(false); }
  };

  const registerPasskey = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const optionsResponse = await fetch("/api/auth/local/passkey/register/options", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword }) });
      if (!optionsResponse.ok) throw new Error(await readError(optionsResponse, "Re-enter your current passphrase to register a passkey."));
      const options = await optionsResponse.json();
      const attestation = await startRegistration({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/local/passkey/register/verify", { method: "POST", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify({ challenge: options.challenge, response: attestation }) });
      if (!verifyResponse.ok) throw new Error(await readError(verifyResponse, "Passkey registration was not accepted."));
      setMessage("Passkey registered. You can use it on this device at the next sign-in."); setCurrentPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Passkey registration was cancelled or failed."); }
    finally { setBusy(false); }
  };

  return <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.04] p-4">
    <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-200/70">Operator security</p><p className="mt-1 text-xs text-slate-300">Rotate credentials or bind this device.</p></div><button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-200">Close</button></div>
    <form onSubmit={rotatePassword} className="mt-4 space-y-2">
      <input value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Current passphrase" className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none focus:border-cyan-200/50" />
      <input value={newPassword} onChange={event => setNewPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="New passphrase · 14+ characters" className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none focus:border-cyan-200/50" />
      <input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" placeholder="Confirm new passphrase" className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none focus:border-cyan-200/50" />
      <Button type="submit" disabled={busy} size="sm" className="w-full bg-cyan-200 text-slate-950 hover:bg-cyan-100">{busy ? "Updating security" : "Rotate passphrase"}</Button>
    </form>
    <Button type="button" onClick={registerPasskey} disabled={busy || !currentPassword} variant="outline" size="sm" className="mt-2 w-full border-cyan-200/20 bg-transparent text-cyan-100 hover:bg-cyan-200/10">Register this device passkey</Button>
    {message ? <p role="status" className="mt-3 text-xs leading-5 text-emerald-200">{message}</p> : null}
    {error ? <p role="alert" className="mt-3 text-xs leading-5 text-rose-200">{error}</p> : null}
  </div>;
}

export default function ArchangelLayout({ children }: { children: ReactNode }) {
  const { loading, user, logout } = useAuth();
  const evidence = trpc.archangel.atmosEvidence.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 15_000 });
  const [location, setLocation] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const receiptChip = evidence.isLoading ? "—" : evidence.error ? "evidence unavailable" : evidence.data ? `${evidence.data.summary.verifiedReceipts}/${evidence.data.summary.declaredNodes} verified` : "—";

  if (loading) {
    return (
      <div className="auth-gate flex min-h-screen items-center justify-center text-cyan-100">
        <div className="flex flex-col items-center gap-4">
          <Orbit className="h-8 w-8 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-[0.24em]">Verifying operator session</span>
        </div>
      </div>
    );
  }

  if (!user) return <SignInGate />;

  const active = navigation.find(item => item.path === location) ?? navigation[0];
  const goTo = (path: string) => {
    setLocation(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      <div className="fixed inset-0 star-field pointer-events-none" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-[294px] shrink-0 flex-col border-r border-white/[0.07] bg-[#070a11]/85 px-4 py-5 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3 px-3 pb-8 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.14)]">
              <Orbit className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-cyan-200/55">NEXINUS RI Systems</p>
              <h1 className="font-display text-lg font-semibold tracking-[0.16em] text-white">ARCHANGEL</h1>
            </div>
          </div>
          <div className="mb-4 border-y border-white/[0.06] px-3 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Network posture</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-300"><span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]" /> Awaiting signed receipts</div>
          </div>
          <nav className="space-y-1" aria-label="Control-plane navigation">
            {navigation.map(item => {
              const isActive = item.path === location;
              const Icon = item.icon;
              return (
                <button key={item.path} onClick={() => goTo(item.path)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${isActive ? "bg-cyan-300/[0.12] text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.12)]" : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-200"}`}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-cyan-200" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]" /> : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-400/15 text-violet-200"><CircleUserRound className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{user.name || "Authenticated operator"}</p>
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">ARCHANGEL local auth verified</p>
              </div>
            </div>
            <button onClick={() => setSecurityOpen(value => !value)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/15 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/[0.06]">
              <KeyRound className="h-3.5 w-3.5" /> {securityOpen ? "Hide security" : "Manage security"}
            </button>
            <button onClick={logout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-slate-400 transition hover:border-rose-300/25 hover:bg-rose-300/[0.06] hover:text-rose-200">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
            {securityOpen ? <SecurityPanel onClose={() => setSecurityOpen(false)} /> : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#080b12]/80 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button onClick={() => setMobileNavOpen(value => !value)} className="rounded-lg border border-white/[0.1] p-2 text-slate-300 lg:hidden" aria-label="Toggle navigation"><DatabaseZap className="h-4 w-4" /></button>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-200/55">Authenticated mesh console</p>
                  <h2 className="truncate font-display text-lg font-medium text-white">{active.label}</h2>
                </div>
              </div>
              <div className="hidden items-center gap-4 sm:flex">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">UTC synchronized interface</span>
                <span className="flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-100"><Activity className="h-3.5 w-3.5" /> {receiptChip}</span>
              </div>
            </div>
            {mobileNavOpen ? (
              <nav className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4 lg:hidden" aria-label="Mobile control-plane navigation">
                {navigation.map(item => <button key={item.path} onClick={() => goTo(item.path)} className={`rounded-xl border px-3 py-2 text-left text-xs ${item.path === location ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/[0.07] bg-white/[0.025] text-slate-400"}`}>{item.label}</button>)}
              </nav>
            ) : null}
          </header>
          <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
