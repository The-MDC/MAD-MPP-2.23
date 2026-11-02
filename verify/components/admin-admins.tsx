"use client";

import React, { useCallback, useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface AdminRow { id: number; email: string; role: "admin" | "support" | "dev" | "viewer"; disabled: boolean; createdBy: string; createdAt: string; lastSignIn: string | null }
interface AuditRow { id: number; actor: string; action: string; detail: string | null; createdAt: string }

const card: React.CSSProperties = { background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 12, padding: 16 };
const label: React.CSSProperties = { fontFamily: INSTRUMENT_FONT, fontSize: 11, letterSpacing: 2, fontWeight: 900, color: INK.gold, textTransform: "uppercase" };
const btn = (active = false): React.CSSProperties => ({ background: active ? INK.gold : INK.bgCard, color: active ? INK.bgDeep : INK.white, border: `1px solid ${active ? INK.gold : INK.borderGold}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 40, textDecoration: "none", display: "inline-flex", alignItems: "center" });
const input: React.CSSProperties = { background: INK.bgDeep, border: `1px solid ${INK.borderGold}`, borderRadius: 8, color: INK.white, padding: "10px 12px", fontSize: 15 };

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRow["role"]>("viewer");
  const [msg, setMsg] = useState("");
  const [secret, setSecret] = useState<{ who: string; password: string } | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/admin/admins").then((r) => r.json()).then((d) => setAdmins(d?.admins ?? [])).catch(() => {});
    fetch("/api/admin/audit").then((r) => r.json()).then((d) => setAudit(d?.entries ?? [])).catch(() => {});
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setSecret(null);
    const res = await fetch("/api/admin/admins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not create the admin."); return; }
    setSecret({ who: d.admin.email, password: d.password });
    setEmail("");
    refresh();
  }

  async function act(id: number, action: "disable" | "enable" | "reset", who: string) {
    setMsg(""); setSecret(null);
    const res = await fetch("/api/admin/admins", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(d.error || "Could not update."); return; }
    if (d.password) setSecret({ who, password: d.password });
    refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: INK.bgDeep, color: INK.white, padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={label}>MAD Gambit · Admins</div>
          <a href="/admin" style={btn()}>Back to console</a>
        </header>

        <section style={card}>
          <div style={label}>Add an admin</div>
          <p style={{ color: INK.muted, fontSize: 12, margin: "6px 0 10px" }}>Admin: reports, exports, the assistant, support and the beta. Support: the user support queue. Developer: bugs, security and internal tickets. Viewer: read-only reports. A password is generated and shown once.</p>
          <form onSubmit={create} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="email" required aria-label="Email" placeholder="name@madgambit.fun" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, flex: "1 1 240px" }} />
            <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminRow["role"])} style={input}>
              <option value="viewer">Viewer</option><option value="support">Support</option><option value="dev">Developer</option><option value="admin">Admin</option>
            </select>
            <button type="submit" style={btn(true)}>Create</button>
          </form>
          {msg && <p role="alert" style={{ color: INK.pink, fontSize: 13, margin: "10px 0 0" }}>{msg}</p>}
          {secret && (
            <div role="status" style={{ marginTop: 12, background: INK.bgCard, border: `1px solid ${INK.borderGold}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: INK.muted }}>One-time password for {secret.who}. Copy it now; it is not stored and cannot be shown again.</div>
              <code style={{ display: "block", marginTop: 6, fontSize: 18, color: INK.goldLcd, userSelect: "all", wordBreak: "break-all" }}>{secret.password}</code>
            </div>
          )}
        </section>

        <section style={card}>
          <div style={label}>Admins</div>
          {admins.length === 0 ? <p style={{ color: INK.muted, fontSize: 13 }}>No subordinate admins yet.</p> : (
            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                <thead><tr>{["Email", "Role", "Status", "Last sign-in", ""].map((c) => <th key={c} scope="col" style={{ textAlign: "left", color: INK.muted, padding: "6px 10px", borderBottom: `1px solid ${INK.borderGold}` }}>{c}</th>)}</tr></thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td style={{ padding: "6px 10px" }}>{a.email}</td>
                      <td style={{ padding: "6px 10px" }}>{a.role}</td>
                      <td style={{ padding: "6px 10px", color: a.disabled ? INK.pink : INK.green }}>{a.disabled ? "disabled" : "active"}</td>
                      <td style={{ padding: "6px 10px", color: INK.muted }}>{a.lastSignIn ? new Date(a.lastSignIn).toLocaleString() : "never"}</td>
                      <td style={{ padding: "6px 10px", display: "flex", gap: 6 }}>
                        <button style={btn()} onClick={() => act(a.id, a.disabled ? "enable" : "disable", a.email)}>{a.disabled ? "Enable" : "Disable"}</button>
                        <button style={btn()} onClick={() => act(a.id, "reset", a.email)}>Reset password</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={card}>
          <div style={label}>Audit log</div>
          {audit.length === 0 ? <p style={{ color: INK.muted, fontSize: 13 }}>Nothing recorded yet.</p> : (
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 4, fontSize: 12 }}>
              {audit.map((r) => (
                <li key={r.id} style={{ display: "flex", gap: 10, flexWrap: "wrap", borderBottom: `1px solid ${INK.border}`, paddingBottom: 4 }}>
                  <span style={{ color: INK.muted }}>{new Date(r.createdAt).toLocaleString()}</span>
                  <span>{r.actor}</span><strong>{r.action}</strong><span style={{ color: INK.muted }}>{r.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
