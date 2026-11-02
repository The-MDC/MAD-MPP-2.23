"use client";

/**
 * The profile's personal agent. Runs only on MAD Gambit's onboard agents; trading tiers are shown as coming soon until
 * agentic trading is switched on (lib/agentic).
 */
import React, { useEffect, useState } from "react";
import { SectionTitle, GOLD, MUTED, LINE } from "@/components/om-ui";

interface Info { signedIn: boolean; tier: string; tradingEnabled: boolean; agent: { name: string }; ladder: { id: string; name: string; pitch: string; available: boolean }[] }

export default function PersonalAssistantCard() {
  const [info, setInfo] = useState<Info | null>(null);
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/v1/agent/assistant").then((r) => r.json()).then((d) => d?.success && setInfo(d)).catch(() => {}); }, []);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    setBusy(true); setReply("");
    try {
      const res = await fetch("/api/v1/agent/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: msg }) });
      const d = await res.json().catch(() => ({}));
      setReply(res.status === 401 ? "Sign in with your wallet to talk to your agent." : d.reply || d.error || "No answer.");
    } catch { setReply("Your agent could not be reached."); }
    setBusy(false);
  }

  return (
    <section className="mg-tile" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }} aria-label="Your MAD agent">
      <SectionTitle>{info?.agent.name ?? "Your MAD agent"}</SectionTitle>
      <div style={{ fontSize: 12, color: MUTED }}>
        Plan: <strong style={{ color: GOLD }}>{info ? info.ladder.find((t) => t.id === info.tier)?.name ?? "Free" : "Free"}</strong> · runs only on MAD Gambit&apos;s onboard agents
      </div>
      <form onSubmit={ask} style={{ display: "flex", gap: 8 }}>
        <input aria-label="Ask your agent" value={msg} maxLength={800} onChange={(e) => setMsg(e.target.value)} placeholder="Ask your agent about a market…"
          style={{ flex: 1, minWidth: 0, background: "#0b0b0e", border: `1px solid ${LINE}`, borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: 15 }} />
        <button type="submit" className="mg-btn-gold" disabled={busy} style={{ minHeight: 44, padding: "0 14px", fontSize: 12 }}>{busy ? "…" : "Ask"}</button>
      </form>
      {reply && <p style={{ margin: 0, fontSize: 14 }}>{reply}</p>}
      <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
        {(info?.ladder ?? []).map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, borderTop: `1px solid ${LINE}`, paddingTop: 6 }}>
            <span><strong>{t.name}</strong> <span style={{ color: MUTED }}>{t.pitch}</span></span>
            <span style={{ color: t.available ? GOLD : MUTED, whiteSpace: "nowrap" }}>{t.available ? (t.id === info?.tier ? "current" : "available") : "coming soon"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
