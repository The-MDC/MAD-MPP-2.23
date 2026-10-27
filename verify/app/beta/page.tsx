"use client";

/**
 * MAD Gambit — /beta : the private-beta gate.
 *
 * Every visitor without a pass lands here (proxy.ts redirects pages to it).
 * Top: request beta access (email → POST /api/v1/beta/signup → beta_signups).
 * Below: "~ Creator Sign-in ~" for people holding a guest pass
 * (POST /api/v1/beta/signin → signed HttpOnly cookie → back to where they were
 * headed, default /preview).
 */
import React, { useEffect, useState } from "react";
import MadGambitConcierge from "@/components/mad-gambit-concierge";

const GOLD = "#ffd700";
const ROSSA = "#f95639";
const MUTED = "#a99f8a";
const LINE = "rgba(255,215,0,.18)";

type Role = "trader" | "creator" | "collector";
const ROLES: { id: Role; label: string }[] = [
  { id: "trader", label: "Trader" },
  { id: "creator", label: "Creator" },
  { id: "collector", label: "Collector" },
];

const field: React.CSSProperties = {
  width: "100%", height: 48, borderRadius: 14, border: `1px solid ${LINE}`, background: "rgba(255,255,255,.04)",
  color: "#f6f1e3", padding: "0 16px", fontSize: 15, fontFamily: "inherit", outline: "none",
};

export default function BetaGate() {
  const [next, setNext] = useState("/preview");
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
  }, []);

  return (
    <main style={{ minHeight: "100dvh", background: "radial-gradient(120% 70% at 50% -10%, rgba(255,215,0,.16), transparent 60%), radial-gradient(90% 60% at 100% 100%, rgba(249,86,57,.18), transparent 60%), #080808", color: "#f6f1e3", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", padding: "28px 20px 40px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 22 }}>
        <header style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          {/* The official MAD Gambit neon lockup (public/brand/MAD_G_Official_Logo2, cropped). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mad-gambit-neon-logo.jpg" alt="MAD Gambit — Prediction · Conviction · Affliction. The Economic Engine of Entertainment Prediction Markets" width={420} height={235}
            style={{ width: "100%", height: "auto", borderRadius: 18, boxShadow: "0 18px 40px -18px rgba(0,0,0,.9), 0 0 0 1px rgba(255,215,0,.18)" }} />
          <span className="mg-chip" style={{ color: ROSSA, borderColor: "rgba(249,86,57,.45)", background: "rgba(249,86,57,.08)" }}>● Private beta · invite waves</span>
          <h1 style={{ margin: 0, lineHeight: 1 }}>
            <span className="mg-display" style={{ display: "block", fontSize: 46 }}>Predict the scandal.</span>
            <span className="mg-display" style={{ fontSize: 46 }}><span className="mg-punch mg-gold-text">Own</span> the culture.</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: MUTED, maxWidth: 360 }}>
            Prediction and conviction markets on culture, a satirical card game, and creators who earn 28.8% to 40% of the fee on every market they open.
          </p>
        </header>

        <SignupCard />

        <div style={{ display: "flex", gap: 8 }}>
          {[["1.88%", "flat fee"], ["28.8→40%", "creator share"], ["992", "card deck"]].map(([v, k]) => (
            <div key={k} className="mg-tile" style={{ flex: 1, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: 15, color: GOLD }}>{v}</div>
              <div style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: MUTED, marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>

        <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${LINE})` }} />
          <span className="mg-punch" style={{ fontSize: 22, color: GOLD, whiteSpace: "nowrap" }}>~ Creator Sign-in ~</span>
          <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${LINE}, transparent)` }} />
        </div>

        <SigninCard next={next} />

        {/* The MADHAT'r Concierge: answers questions about the beta for visitors who are not in yet. */}
        <MadGambitConcierge uid="beta" />

        <footer style={{ textAlign: "center", fontSize: 11, color: "#7d776b", lineHeight: 1.6 }}>
          Free-play $MADx on the beta floor · Play responsibly
          <br />MAD Gambit LLC · New Mexico
        </footer>
      </div>
    </main>
  );
}

function SignupCard() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("trader");
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("busy");
    try {
      const r = await fetch("/api/v1/beta/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role, handle }) });
      const d = (await r.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (r.ok && d.success) setState("done");
      else { setError(d.error ?? "Something went wrong — try again."); setState("idle"); }
    } catch {
      setError("Network hiccup — try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <section className="mg-tile" role="status" style={{ padding: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 6, borderColor: "rgba(124,255,199,.4)" }}>
        <div className="mg-display" style={{ fontSize: 28, color: "#7cffc7" }}>You&apos;re on the list.</div>
        <div style={{ fontSize: 13, color: MUTED }}>Invites go out in waves, by email{role === "creator" ? " — creators first" : ""}.</div>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="mg-tile" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }} aria-label="Request beta access">
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD }}>Request beta access</div>
      <input type="email" required autoComplete="email" placeholder="you@email.com" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
      <div role="radiogroup" aria-label="I'm here as a" style={{ display: "flex", gap: 6 }}>
        {ROLES.map((r) => {
          const on = r.id === role;
          return (
            <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRole(r.id)}
              style={{ flex: 1, minHeight: 40, borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 13, border: `1px solid ${on ? "transparent" : LINE}`, background: on ? "var(--mg-gold-fill, #ffd700)" : "transparent", color: on ? "#1a1205" : "#d7d2c4" }}>
              {r.label}
            </button>
          );
        })}
      </div>
      <input type="text" autoComplete="off" placeholder="@handle (optional)" aria-label="Social handle, optional" value={handle} onChange={(e) => setHandle(e.target.value)} style={field} />
      {error ? <div role="alert" style={{ fontSize: 12.5, color: "#ffb3a8" }}>{error}</div> : null}
      <button type="submit" className="mg-btn-gold" disabled={state === "busy"} style={{ width: "100%", minHeight: 50, fontSize: 15 }}>
        {state === "busy" ? "Joining…" : "Join the private beta"}
      </button>
    </form>
  );
}

function SigninCard({ next }: { next: string }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/v1/beta/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user, pass, next }) });
      const d = (await r.json().catch(() => ({}))) as { success?: boolean; error?: string; next?: string };
      if (r.ok && d.success) { window.location.href = d.next || "/preview"; return; }
      setError(r.status === 429 ? "Too many tries — wait a few minutes." : d.error ?? "Sign-in failed.");
    } catch {
      setError("Network hiccup — try again.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mg-tile" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }} aria-label="Creator sign-in">
      <input type="text" required autoComplete="username" placeholder="Username" aria-label="Username" value={user} onChange={(e) => setUser(e.target.value)} style={field} />
      <input type="password" required autoComplete="current-password" placeholder="Password" aria-label="Password" value={pass} onChange={(e) => setPass(e.target.value)} style={field} />
      {error ? <div role="alert" style={{ fontSize: 12.5, color: "#ffb3a8" }}>{error}</div> : null}
      <button type="submit" className="mg-btn-ghost" disabled={busy} style={{ width: "100%", minHeight: 48, fontSize: 14, borderColor: "rgba(255,215,0,.5)", color: GOLD }}>
        {busy ? "Checking…" : "Enter the floor ›"}
      </button>
    </form>
  );
}
