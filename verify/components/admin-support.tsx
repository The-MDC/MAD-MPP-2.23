"use client";

/**
 * Staff side of support and the beta programme. What each person sees follows their role:
 *   support staff → the user lane; developers → the dev and internal staff lanes; admins → both, plus beta controls.
 */
import React, { useCallback, useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Ticket { id: number; ref: string; lane: string; channel: string; category: string; severity: string; status: string; summary: string; excerpt: string | null; contact: string | null; assignee: string | null; created_at: string }
interface Beta { phase: string; phaseName: string; capacity: number; invitesDisabled: boolean; counts: { waitlist: number; invited: number; admitted: number; creators_waiting: number } | null; cohorts: { cohort: string; codes: number; uses_left: number }[]; issues: { id: number; title: string; status: string; note: string | null }[] }

const card: React.CSSProperties = { background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 12, padding: 16 };
const label: React.CSSProperties = { fontFamily: INSTRUMENT_FONT, fontSize: 11, letterSpacing: 2, fontWeight: 900, color: INK.gold, textTransform: "uppercase" };
const btn = (on = false): React.CSSProperties => ({ background: on ? INK.gold : INK.bgCard, color: on ? INK.bgDeep : INK.white, border: `1px solid ${on ? INK.gold : INK.borderGold}`, borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36, textDecoration: "none", display: "inline-flex", alignItems: "center" });
const input: React.CSSProperties = { background: INK.bgDeep, border: `1px solid ${INK.borderGold}`, borderRadius: 8, color: INK.white, padding: "8px 10px", fontSize: 14 };
const SEV: Record<string, string> = { P1: INK.pink, P2: INK.goldLcd, P3: INK.cyan, P4: INK.muted };
const STATUSES = ["new", "triaged", "in-progress", "waiting-user", "resolved", "closed"];

export default function AdminSupport({ email, canUserLane, canDevLane, canBeta }: { email: string; canUserLane: boolean; canDevLane: boolean; canBeta: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lane, setLane] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [events, setEvents] = useState<{ actor: string; kind: string; body: string; at: string }[]>([]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [beta, setBeta] = useState<Beta | null>(null);
  const [codes, setCodes] = useState<string>("");
  const [internal, setInternal] = useState("");

  const load = useCallback(() => {
    if (canUserLane || canDevLane) fetch("/api/admin/support").then((r) => r.json()).then((d) => setTickets(d.tickets ?? [])).catch(() => {});
    if (canBeta) fetch("/api/admin/beta").then((r) => r.json()).then((d) => d?.success && setBeta(d)).catch(() => {});
  }, [canUserLane, canDevLane, canBeta]);
  useEffect(() => { load(); }, [load]);

  async function show(id: number) {
    setOpen(open === id ? null : id); setEvents([]); setNote("");
    const d = await fetch(`/api/admin/support?id=${id}`).then((r) => r.json()).catch(() => ({}));
    setEvents(d.events ?? []);
  }
  async function patch(id: number, body: object, ok: string) {
    const res = await fetch("/api/admin/support", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    setMsg(res.ok ? ok : "Could not update."); load(); if (open === id) show(id);
  }
  async function betaAction(body: object) {
    const res = await fetch("/api/admin/beta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not complete that."); return; }
    if (d.codes) setCodes(`Cohort ${d.cohort}, expires in ${d.expiresInDays} days (shown once):\n${d.codes.join("\n")}`);
    if (d.invited) setCodes(`Wave ${d.cohort}: send each person their code (shown once):\n${d.invited.map((x: { email: string; code: string }) => `${x.email},${x.code}`).join("\n")}`);
    setMsg("Done."); load();
  }
  async function fileInternal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ summary: internal, severity: "P3" }) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Internal ticket ${d.ref} filed.` : d.error || "Could not file."); if (res.ok) { setInternal(""); load(); }
  }

  const shown = tickets.filter((t) => lane === "all" || t.lane === lane);
  return (
    <main style={{ minHeight: "100vh", background: INK.bgDeep, color: INK.white, padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div><div style={label}>MAD Gambit · Support and beta</div><div style={{ color: INK.muted, fontSize: 12, marginTop: 4 }}>{email}</div></div>
          <a href="/admin" style={btn()}>Console</a>
        </header>
        {msg && <p role="status" style={{ margin: 0, color: INK.muted, fontSize: 13 }}>{msg}</p>}

        {(canUserLane || canDevLane) && (
          <section style={card} aria-label="Support queue">
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <div style={label}>Queue · {shown.length} open</div>
              <div role="tablist" style={{ display: "flex", gap: 6 }}>
                {["all", ...(canUserLane ? ["user"] : []), ...(canDevLane ? ["dev", "staff"] : [])].map((l) => <button key={l} role="tab" aria-selected={lane === l} onClick={() => setLane(l)} style={btn(lane === l)}>{l === "user" ? "Users" : l === "dev" ? "Dev" : l === "staff" ? "Internal" : "All"}</button>)}
              </div>
            </div>
            {shown.length === 0 ? <p style={{ color: INK.muted, fontSize: 13 }}>Nothing open. Enjoy it while it lasts.</p> : (
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "grid", gap: 8 }}>
                {shown.map((t) => (
                  <li key={t.id} style={{ background: INK.bgCard, borderRadius: 10, padding: 10, borderLeft: `3px solid ${SEV[t.severity] ?? INK.muted}` }}>
                    <button onClick={() => show(t.id)} style={{ all: "unset", cursor: "pointer", display: "flex", gap: 10, flexWrap: "wrap", width: "100%" }} aria-expanded={open === t.id}>
                      <strong style={{ color: SEV[t.severity] }}>{t.severity}</strong><span>{t.ref}</span><span style={{ color: INK.muted }}>{t.lane} · {t.category} · {t.status}{t.assignee ? ` · ${t.assignee}` : ""}</span>
                      <span style={{ flex: "1 1 100%", fontSize: 13 }}>{t.summary}</span>
                    </button>
                    {open === t.id && (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {t.excerpt && <p style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap", color: INK.white }}>{t.excerpt}</p>}
                        <div style={{ color: INK.muted, fontSize: 12 }}>Via {t.channel} · {new Date(t.created_at).toLocaleString()}{t.contact ? ` · reply to ${t.contact}` : " · no contact given"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {STATUSES.map((s) => <button key={s} style={btn(t.status === s)} onClick={() => patch(t.id, { status: s }, `Marked ${s}.`)}>{s}</button>)}
                          <button style={btn()} onClick={() => patch(t.id, { assignee: email }, "Assigned to you.")}>Take it</button>
                        </div>
                        <textarea aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...input, width: "100%" }} placeholder="Internal note, or a public update the user will see" />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={btn()} onClick={() => { patch(t.id, { note }, "Note added."); setNote(""); }} disabled={!note}>Internal note</button>
                          <button style={btn(true)} onClick={() => { patch(t.id, { publicNote: note }, "Update sent to the user's ticket."); setNote(""); }} disabled={!note}>Public update</button>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12, color: INK.muted, display: "grid", gap: 2 }}>
                          {events.map((e, i) => <li key={i}>{new Date(e.at).toLocaleString()} · {e.actor} · {e.kind}: {e.body}</li>)}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canDevLane && (
              <form onSubmit={fileInternal} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <input aria-label="Internal issue" value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="File an internal platform or ops issue" style={{ ...input, flex: "1 1 260px" }} />
                <button type="submit" style={btn()}>File internal</button>
              </form>
            )}
          </section>
        )}

        {canBeta && beta && (
          <section style={card} aria-label="Beta programme">
            <div style={label}>Beta programme · {beta.phaseName}</div>
            <p style={{ color: INK.muted, fontSize: 12, margin: "6px 0 10px" }}>
              Phase is set by the BETA_PHASE environment variable (closed, open, ga); capacity by BETA_CAPACITY ({beta.capacity}).{beta.invitesDisabled ? " Invite passes are currently disabled." : ""}
            </p>
            {beta.counts && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
                {Object.entries({ Waitlist: beta.counts.waitlist, Invited: beta.counts.invited, Admitted: beta.counts.admitted, "Creators waiting": beta.counts.creators_waiting }).map(([k, v]) => (
                  <div key={k} style={{ background: INK.bgCard, borderRadius: 8, padding: "8px 10px" }}><div style={{ color: INK.muted, fontSize: 11 }}>{k}</div><div style={{ fontSize: 20, fontWeight: 800, color: INK.goldLcd }}>{v}</div></div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <button style={btn(true)} onClick={() => betaAction({ action: "wave", count: 25, cohort: `wave-${new Date().toISOString().slice(0, 10)}` })}>Invite next 25 (creators first)</button>
              <button style={btn()} onClick={() => betaAction({ action: "invites", count: 10, cohort: "manual", uses: 1 })}>10 single-use codes</button>
              <button style={btn()} onClick={() => betaAction({ action: "invites", count: 1, cohort: "partner", uses: 50 })}>1 partner code (50 uses)</button>
            </div>
            {codes && <textarea readOnly aria-label="Codes" value={codes} rows={8} style={{ ...input, width: "100%", marginTop: 10, fontFamily: "ui-monospace, monospace" }} />}
            <div style={{ ...label, marginTop: 16 }}>Known issues (public)</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0", display: "grid", gap: 6 }}>
              {beta.issues.map((i) => (
                <li key={i.id} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 13 }}>
                  <strong>{i.title}</strong><span style={{ color: INK.muted }}>{i.status}</span>
                  {["identified", "fixing", "fixed"].map((s) => <button key={s} style={btn(i.status === s)} onClick={() => betaAction({ action: "issue-update", id: i.id, status: s })}>{s}</button>)}
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget.elements.namedItem("title") as HTMLInputElement; if (f.value) { betaAction({ action: "issue", title: f.value }); f.value = ""; } }} style={{ display: "flex", gap: 8 }}>
              <input name="title" aria-label="Known issue title" placeholder="Add a known issue users will see" style={{ ...input, flex: 1 }} />
              <button type="submit" style={btn()}>Add</button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
