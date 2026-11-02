"use client";

/**
 * Beta page extras: redeem an invite code, enter the extended open beta (when it is open), the known-issues list, and
 * first-line support for anyone who cannot get in. Every form carries the signup shield (proof of work + honeypot).
 */
import React, { useEffect, useState } from "react";
import { HONEYPOT_STYLE, solveSignupChallenge } from "@/lib/signup-shield-client";
import { SupportPanel } from "@/components/concierge-support";

const GOLD = "#d69d41";
const MUTED = "#a39e92";
const field: React.CSSProperties = { minHeight: 44, borderRadius: 12, border: "1px solid rgba(214,157,65,.25)", background: "#0b0b0e", color: "#fff", padding: "0 12px", fontSize: 15, width: "100%" };

async function shieldedPost(url: string, body: object): Promise<{ ok: boolean; data: { success?: boolean; error?: string; next?: string } }> {
  const challenge = await solveSignupChallenge();
  if (!challenge) return { ok: false, data: { error: "Couldn't reach the server. Try again in a minute." } };
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, challenge }) });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function BetaExtras({ next }: { next: string }) {
  const [phase, setPhase] = useState<{ phase: string; phaseName: string; howToJoin: string; issues: { title: string; status: string }[] } | null>(null);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => { fetch("/api/v1/support/known-issues").then((r) => r.json()).then((d) => d?.success && setPhase(d)).catch(() => {}); }, []);

  async function redeem(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("Checking your code…");
    const r = await shieldedPost("/api/v1/beta/redeem", { code, website: trap });
    if (r.ok && r.data.success) { window.location.assign(next || r.data.next || "/"); return; }
    setMsg(r.data.error || "That didn't work."); setBusy(false);
  }
  async function join(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("Getting you in…");
    const r = await shieldedPost("/api/v1/beta/join", { email, website: trap });
    if (r.ok && r.data.success) { window.location.assign(next || "/"); return; }
    setMsg(r.data.error || "That didn't work."); setBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {phase && <div style={{ fontSize: 12, color: MUTED, textAlign: "center" }}><strong style={{ color: GOLD }}>{phase.phaseName}.</strong> {phase.howToJoin}</div>}

      {phase?.phase === "open" && (
        <form onSubmit={join} className="mg-tile" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }} aria-label="Enter the open beta">
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD }}>Enter the open beta</div>
          <input type="email" required autoComplete="email" aria-label="Email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
          <button type="submit" className="mg-btn-gold" disabled={busy} style={{ minHeight: 44 }}>{busy ? "One moment…" : "Let me in"}</button>
        </form>
      )}

      <form onSubmit={redeem} className="mg-tile" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }} aria-label="Redeem an invite code">
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD }}>Have an invite code?</div>
        <input required aria-label="Invite code" placeholder="MAD-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ ...field, fontFamily: "ui-monospace, monospace", letterSpacing: 1 }} />
        <div aria-hidden="true" style={HONEYPOT_STYLE}><label>Website<input tabIndex={-1} autoComplete="off" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} /></label></div>
        <button type="submit" className="mg-btn-ghost" disabled={busy} style={{ minHeight: 44 }}>{busy ? "Checking…" : "Redeem"}</button>
      </form>

      {msg && <p role="status" style={{ textAlign: "center", fontSize: 13, color: MUTED, margin: 0 }}>{msg}</p>}

      {phase && phase.issues.length > 0 && (
        <div className="mg-tile" style={{ padding: 14, fontSize: 12, color: MUTED }}>
          <div style={{ fontWeight: 900, color: GOLD, marginBottom: 6 }}>Known issues</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{phase.issues.map((i) => <li key={i.title}>{i.title} <em>({i.status})</em></li>)}</ul>
        </div>
      )}

      <button type="button" onClick={() => setHelp((h) => !h)} aria-expanded={help} className="mg-btn-ghost" style={{ minHeight: 40, fontSize: 12 }}>
        {help ? "Hide support" : "Having trouble getting in? Contact support"}
      </button>
      {help && <div className="mg-tile" style={{ overflow: "hidden" }}><SupportPanel /></div>}
    </div>
  );
}
