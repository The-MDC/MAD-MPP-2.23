"use client";

import React, { useCallback, useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Rec { text: string; priority: number; rule: string }
interface SkillRow { id: string; kind: "watch" | "gap"; title: string; status: "proposed" | "active" | "retired"; evidence: string; proficiency: string }

const card: React.CSSProperties = { background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 12, padding: 16 };
const label: React.CSSProperties = { fontFamily: INSTRUMENT_FONT, fontSize: 11, letterSpacing: 2, fontWeight: 900, color: INK.gold, textTransform: "uppercase" };
const small: React.CSSProperties = { background: INK.bgCard, color: INK.white, border: `1px solid ${INK.borderGold}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36 };

/** Self-learning panel: ranked recommendations (mark them useful or dismiss to teach it) and the skill ledger. */
export default function AdminInsights({ canTeach }: { canTeach: boolean }) {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [days, setDays] = useState(0);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/insights").then((r) => r.json()).then((d) => { setRecs(d.recommendations ?? []); setSkills(d.skills ?? []); setDays(d.daysOfHistory ?? 0); }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: object, ok: string) {
    setNote("");
    const res = await fetch("/api/admin/insights", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setNote(res.ok ? ok : d.error || "Could not save.");
    if (res.ok) load();
  }

  return (
    <section style={card} aria-label="Self-learning insights">
      <div style={label}>Self-learning · recommendations and skills</div>
      <p style={{ color: INK.muted, fontSize: 12, margin: "6px 0 10px" }}>
        Learned from {days} day{days === 1 ? "" : "s"} of history{days < 7 ? " (anomaly detection starts at 7)" : ""}. A weekly report goes to the owner by email each Monday.
      </p>
      {recs.length === 0 ? <p style={{ color: INK.muted, fontSize: 13 }}>Nothing to recommend yet.</p> : (
        <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
          {recs.map((r, i) => (
            <li key={i} style={{ fontSize: 14 }}>
              {r.text} <span style={{ color: INK.muted, fontSize: 11 }}>(priority {r.priority})</span>
              {canTeach && (
                <span style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}>
                  <button style={small} onClick={() => post({ action: "feedback", rule: r.rule, verdict: "useful" }, "Noted: more like this.")}>Useful</button>
                  <button style={small} onClick={() => post({ action: "feedback", rule: r.rule, verdict: "dismiss" }, "Noted: less like this.")}>Dismiss</button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      <div style={{ ...label, marginTop: 18 }}>Skills acquired</div>
      {skills.length === 0 ? <p style={{ color: INK.muted, fontSize: 13 }}>None yet. Watchers are acquired once an event type shows a week of steady volume.</p> : (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 8 }}>
          {skills.map((s) => (
            <li key={s.id} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", fontSize: 13, borderBottom: `1px solid ${INK.border}`, paddingBottom: 8 }}>
              <strong>{s.title}</strong>
              <span style={{ color: s.status === "active" ? INK.green : s.status === "proposed" ? INK.gold : INK.muted }}>{s.status}</span>
              <span style={{ color: INK.muted }}>{s.proficiency} · {s.evidence}</span>
              {canTeach && s.status === "proposed" && <button style={small} onClick={() => post({ action: "skill", id: s.id, decision: "approve" }, "Skill approved.")}>Approve</button>}
              {canTeach && s.status !== "retired" && <button style={small} onClick={() => post({ action: "skill", id: s.id, decision: "retire" }, "Skill retired.")}>Retire</button>}
            </li>
          ))}
        </ul>
      )}
      {note && <p role="status" style={{ color: INK.muted, fontSize: 12, margin: "10px 0 0" }}>{note}</p>}
    </section>
  );
}
