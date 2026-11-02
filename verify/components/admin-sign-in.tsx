"use client";

import React, { useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

/** Admin sign-in. The server decides where `next` may lead (admin destinations only). */
export default function AdminSignIn({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, next }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { window.location.assign(data.next || "/admin"); return; }
      setError(data.error || "Sign-in failed.");
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  const field: React.CSSProperties = { width: "100%", background: INK.bgDeep, border: `1px solid ${INK.borderGold}`, borderRadius: 8, color: INK.white, padding: "11px 12px", fontSize: 15, marginTop: 6 };
  return (
    <main style={{ minHeight: "100vh", background: INK.bgDeep, display: "grid", placeItems: "center", padding: 16 }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, background: INK.bgPanel, border: `1px solid ${INK.borderGold}`, borderRadius: 14, padding: 24, fontFamily: INSTRUMENT_FONT }}>
        <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 900, color: INK.gold, textTransform: "uppercase" }}>MAD Gambit · Admin</div>
        <h1 style={{ color: INK.white, fontSize: 22, margin: "8px 0 18px" }}>Sign in</h1>
        <label style={{ color: INK.muted, fontSize: 12 }}>Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
        </label>
        <label style={{ color: INK.muted, fontSize: 12, display: "block", marginTop: 14 }}>Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={field} />
        </label>
        {error && <p role="alert" style={{ color: INK.pink, fontSize: 13, margin: "12px 0 0" }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ marginTop: 18, width: "100%", background: INK.gold, color: INK.bgDeep, border: 0, borderRadius: 8, padding: "12px 14px", fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", cursor: busy ? "wait" : "pointer", minHeight: 44 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p style={{ color: INK.muted, fontSize: 11, margin: "14px 0 0" }}>Authorised administrators only. Access is logged.</p>
      </form>
    </main>
  );
}
