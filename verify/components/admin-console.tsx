"use client";

import React, { useCallback, useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useTickerFeed } from "@/lib/use-ticker-feed";
import type { Report } from "@/lib/report-render";
import AdminInsights from "@/components/admin-insights";

interface Item { id: string; title: string; blurb: string }
type Role = "master" | "admin" | "support" | "dev" | "viewer";

const card: React.CSSProperties = { background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 12, padding: 16 };
const label: React.CSSProperties = { fontFamily: INSTRUMENT_FONT, fontSize: 11, letterSpacing: 2, fontWeight: 900, color: INK.gold, textTransform: "uppercase" };
const btn = (active = false): React.CSSProperties => ({
  background: active ? INK.gold : INK.bgCard, color: active ? INK.bgDeep : INK.white, border: `1px solid ${active ? INK.gold : INK.borderGold}`,
  borderRadius: 8, padding: "9px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40, textDecoration: "none", display: "inline-flex", alignItems: "center",
});

export default function AdminConsole({ email, role }: { email: string; role: Role }) {
  const feed = useTickerFeed();
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState<string>("platform-usage");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const canExport = role === "master" || role === "admin";
  const canAssist = role === "master" || role === "admin";

  useEffect(() => { fetch("/api/admin/reports").then((r) => r.json()).then((d) => d?.reports && setItems(d.reports)).catch(() => {}); }, []);

  const load = useCallback((id: string) => {
    setLoading(true);
    fetch(`/api/admin/reports/${id}`).then((r) => r.json()).then((d) => setReport(d?.report ?? null)).catch(() => setReport(null)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(current); }, [current, load]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const res = await fetch("/api/admin/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      const d = await res.json();
      setAnswer(d.reply || d.error || "No answer.");
    } catch { setAnswer("Could not reach the assistant."); }
    setAsking(false);
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.assign("/admin/sign-in");
  }

  const dl = (format: string, text: string) => canExport && (
    <a key={format} href={`/api/admin/reports/${current}?format=${format}`} download style={btn()}>{text}</a>
  );

  return (
    <main style={{ minHeight: "100vh", background: INK.bgDeep, color: INK.white, padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={label}>MAD Gambit · Admin</div>
            <div style={{ color: INK.muted, fontSize: 13, marginTop: 4 }}>{email} · {role}</div>
          </div>
          <nav aria-label="Admin" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="/dashboard" style={btn()}>Dashboard</a>
            <a href="/workbench" style={btn()}>Workbench</a>
            {role !== "viewer" && <a href="/admin/support" style={btn()}>Support and beta</a>}
            {role === "master" && <a href="/admin/admins" style={btn()}>Admins</a>}
            <button onClick={signOut} style={btn()}>Sign out</button>
          </nav>
        </header>

        <section style={card} aria-label="Live ticker poll">
          <div style={label}>Live poll · once a minute</div>
          {feed ? (
            <>
              <p style={{ margin: "10px 0 6px", fontSize: 15 }}>{feed.caption}</p>
              <p style={{ margin: 0, color: INK.muted, fontSize: 12 }}>
                {feed.captionBy === "moe" ? "Written by the MoE" : "Rule-based caption (MoE off or slow)"} · {new Date(feed.at).toLocaleTimeString()} · source {feed.source}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginTop: 12 }}>
                {([["Heat", feed.analytics.heat], ["Events 24h", feed.analytics.events24h], ["Wallets 24h", feed.analytics.wallets24h], ["Open bets", feed.analytics.openBets], ["Perps open", feed.perps.open]] as [string, number][]).map(([k, v]) => (
                  <div key={k} style={{ background: INK.bgCard, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ color: INK.muted, fontSize: 11 }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: INK.goldLcd }}>{v}</div>
                  </div>
                ))}
              </div>
              {feed.markets.length > 0 && (
                <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 6 }}>
                  {feed.markets.slice(0, 8).map((m) => (
                    <li key={m.kind + m.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, borderBottom: `1px solid ${INK.border}`, paddingBottom: 6 }}>
                      <span>{m.title}</span>
                      <span style={{ color: INK.muted, whiteSpace: "nowrap" }}>{m.kind === "perp" ? "perp" : `YES ${m.yesPct}%`} · {Math.round(m.volume)} $MADx</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : <p style={{ color: INK.muted }}>Loading the first poll…</p>}
        </section>

        <section style={card} aria-label="Reports">
          <div style={label}>Reports</div>
          <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
            {items.map((i) => <button key={i.id} role="tab" aria-selected={current === i.id} onClick={() => setCurrent(i.id)} style={btn(current === i.id)}>{i.title}</button>)}
          </div>
          {canExport ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <span style={{ color: INK.muted, fontSize: 12 }}>Export</span>
              {dl("md", "Markdown")}{dl("txt", "Text")}{dl("pdf", "PDF")}
            </div>
          ) : <p style={{ color: INK.muted, fontSize: 12 }}>Your role is read-only; exports are off.</p>}
          {loading && <p style={{ color: INK.muted }}>Building…</p>}
          {!loading && report && (
            <div style={{ display: "grid", gap: 18 }}>
              <p style={{ margin: 0, color: INK.muted, fontSize: 12 }}>Generated {report.generatedAt} · source {report.source}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
                {report.summary.map(([k, v]) => (
                  <div key={k} style={{ background: INK.bgCard, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ color: INK.muted, fontSize: 11 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{v}</div>
                  </div>
                ))}
              </div>
              {report.tables.map((t, ti) => (
                <div key={t.title}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 15 }}>{t.title}</h2>
                    {canExport && t.rows.length > 0 && <a href={`/api/admin/reports/${current}?format=csv&table=${ti}`} download style={{ ...btn(), minHeight: 32, padding: "5px 10px", fontSize: 12 }}>CSV</a>}
                  </div>
                  {t.rows.length === 0 ? <p style={{ color: INK.muted, fontSize: 13, margin: 0 }}>No rows.</p> : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                        <thead><tr>{t.columns.map((c) => <th key={c} scope="col" style={{ textAlign: "left", color: INK.muted, fontWeight: 600, padding: "6px 10px", borderBottom: `1px solid ${INK.borderGold}`, whiteSpace: "nowrap" }}>{c}</th>)}</tr></thead>
                        <tbody>{t.rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: "6px 10px", borderBottom: `1px solid ${INK.border}` }}>{c ?? ""}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {report.notes.map((n) => <p key={n} style={{ margin: 0, color: INK.muted, fontSize: 12 }}>{n}</p>)}
            </div>
          )}
        </section>

        <AdminInsights canTeach={canExport} />

        {canAssist && (
          <section style={card} aria-label="Assistant">
            <div style={label}>Ask the MoE</div>
            <p style={{ color: INK.muted, fontSize: 12, margin: "6px 0 10px" }}>It reads aggregate summaries only: no wallets, emails or individual records.</p>
            <form onSubmit={ask} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input aria-label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} placeholder="Which markets are heating up?" style={{ flex: "1 1 240px", background: INK.bgDeep, border: `1px solid ${INK.borderGold}`, borderRadius: 8, color: INK.white, padding: "10px 12px", fontSize: 15 }} />
              <button type="submit" disabled={asking} style={btn(true)}>{asking ? "Thinking…" : "Ask"}</button>
            </form>
            {answer && <p style={{ margin: "12px 0 0", fontSize: 15, whiteSpace: "pre-wrap" }}>{answer}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
