"use client";

/**
 * The concierge's member tools: the threat colour, and the Support and Knowledge base panels that appear only once a
 * visitor has finished signing up (the endpoints behind them check the same thing).
 */
import React, { useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { HONEYPOT_STYLE, solveSignupChallenge } from "@/lib/signup-shield-client";

export type ThreatColour = "green" | "yellow" | "red";
export const THREAT_STYLE: Record<ThreatColour, { dot: string; glow: string; label: string }> = {
  green: { dot: "#00ff88", glow: "none", label: "LIVE" },
  yellow: { dot: "#ffcf40", glow: "drop-shadow(0 0 6px rgba(255,207,64,.9))", label: "WATCHING FOR BOTS" },
  red: { dot: "#f5242a", glow: "drop-shadow(0 0 8px rgba(245,36,42,.95))", label: "UNDER ATTACK · SHIELDS UP" },
};

/** Polls the public threat colour every 30 seconds (paused while the tab is hidden). */
export function useThreatColour(): ThreatColour {
  const [c, setC] = useState<ThreatColour>("green");
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      fetch("/api/v1/security/status", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive && (d?.colour === "green" || d?.colour === "yellow" || d?.colour === "red")) setC(d.colour); }).catch(() => {});
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return c;
}

/** True once the visitor has finished every signup step; re-checked whenever the panel opens. */
export function useSignupComplete(open: boolean): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/v1/support/eligibility", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setOk(d?.complete === true); }).catch(() => {});
    return () => { alive = false; };
  }, [open]);
  return ok;
}

const box: React.CSSProperties = { background: "#0a0705", padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 180, maxHeight: 300, overflowY: "auto" };
const field: React.CSSProperties = { background: "#0a0705", border: `1px solid ${INK.border}`, borderRadius: 8, padding: "8px 10px", fontFamily: INSTRUMENT_FONT, fontSize: 11, color: INK.white, width: "100%" };
const small: React.CSSProperties = { fontFamily: INSTRUMENT_FONT, fontSize: 9, color: "#8a8a95" };
const goldBtn: React.CSSProperties = { background: "rgba(214,157,65,0.15)", border: `1px solid ${INK.borderGold}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: INK.gold, fontFamily: INSTRUMENT_FONT, fontSize: 10, fontWeight: 800, minHeight: 36 };

const CATEGORIES: [string, string][] = [["access", "Can't get in"], ["wallet", "Wallet"], ["balance", "Balance or bet"], ["market", "Market dispute"], ["bug", "Something's broken"], ["abuse", "Report abuse"], ["security", "Security"], ["account", "Account or privacy"], ["feedback", "Feedback"]];

export function SupportPanel() {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "busy">("idle");
  const [out, setOut] = useState("");
  const [ref, setRef] = useState("");
  const [token, setToken] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy"); setOut("Checking you're human (a moment)…");
    const challenge = await solveSignupChallenge();
    if (!challenge) { setOut("Couldn't reach support. Try again in a minute."); setState("idle"); return; }
    try {
      const res = await fetch("/api/v1/support/tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, message, contact, website: trap, challenge }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ref) { setOut(d.reply); setRef(d.ref); setToken(d.token); setMessage(""); }
      else setOut(d.error || "Couldn't open a ticket. Try again.");
    } catch { setOut("Couldn't reach support. Try again in a minute."); }
    setState("idle");
  }
  async function check() {
    const d = await fetch(`/api/v1/support/tickets?ref=${encodeURIComponent(ref)}&token=${encodeURIComponent(token)}`).then((r) => r.json()).catch(() => ({}));
    setOut(d.ticket ? `${d.ticket.ref}: ${d.ticket.status}.${d.ticket.updates.length ? ` Latest: ${d.ticket.updates[d.ticket.updates.length - 1].text}` : ""}` : d.error || "No ticket found.");
  }

  return (
    <div style={box}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-label="Contact support">
        <select aria-label="What's it about" value={category} onChange={(e) => setCategory(e.target.value)} style={field}>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <textarea aria-label="What happened" required minLength={8} maxLength={2000} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What happened, and what did you expect? Never include passwords or seed phrases." style={field} />
        <input type="email" aria-label="Email for replies (optional)" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email for replies (optional)" style={field} />
        {/* honeypot: hidden from people and assistive tech; a bot that fills it gets a fake success */}
        <div aria-hidden="true" style={HONEYPOT_STYLE}><label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" /></label></div>
        <button type="submit" disabled={state === "busy"} style={goldBtn}>{state === "busy" ? "Sending…" : "Send to support"}</button>
      </form>
      {out && <p role="status" style={{ ...small, color: "#ffd98a", fontSize: 10, margin: 0 }}>{out}</p>}
      <div style={{ display: "flex", gap: 6 }}>
        <input aria-label="Ticket number" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="MG-XXXXXX" style={{ ...field, flex: 1 }} />
        <input aria-label="Ticket code" value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} placeholder="Code" style={{ ...field, flex: 1 }} />
        <button type="button" onClick={check} style={goldBtn}>Check</button>
      </div>
    </div>
  );
}

export function KnowledgePanel() {
  const [q, setQ] = useState("");
  const [topics, setTopics] = useState<{ title: string; answers: string[] }[]>([]);
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const id = setTimeout(() => {
      fetch(`/api/v1/support/kb${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`).then((r) => r.json())
        .then((d) => { if (d.success) { setTopics(d.topics); setErr(""); } else setErr(d.error || ""); }).catch(() => setErr("Couldn't load the knowledge base."));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);
  return (
    <div style={box}>
      <input aria-label="Search the knowledge base" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: fees, Shield, cards, invites…" style={field} />
      {err && <p style={{ ...small, margin: 0 }}>{err}</p>}
      {topics.map((t) => (
        <div key={t.title}>
          <button type="button" onClick={() => setOpenTitle(openTitle === t.title ? null : t.title)} aria-expanded={openTitle === t.title}
            style={{ all: "unset", cursor: "pointer", fontFamily: INSTRUMENT_FONT, fontSize: 10, fontWeight: 800, color: INK.gold }}>{t.title}</button>
          {openTitle === t.title && <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>{t.answers.map((a, i) => <li key={i} style={{ ...small, color: "#ffd98a", fontSize: 10, lineHeight: 1.5 }}>{a}</li>)}</ul>}
        </div>
      ))}
    </div>
  );
}

/* ── file attach (members with a profile at least 90% complete) ───────── */

export interface AttachedFile { id: string; name: string; notes: string[] }
interface UploadInfo { uploadAllowed: boolean; completion: number; missing: string[]; maxBytes: number; directMaxBytes: number; blob: boolean; prefix: string }

export function useUploadInfo(open: boolean): UploadInfo | null {
  const [info, setInfo] = useState<UploadInfo | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/v1/chat/files", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (alive && d?.success) setInfo(d); }).catch(() => {});
    return () => { alive = false; };
  }, [open]);
  return info;
}

const ACCEPT = ".md,.markdown,.txt,.pdf,text/markdown,text/plain,application/pdf";
const OK_EXT = /\.(md|markdown|txt|pdf)$/i;

/** Pick, pre-check, upload and scan one file. The server's two scanning layers decide; this only saves a wasted trip. */
export function AttachButton({ info, onAttached, onStatus }: { info: UploadInfo; onAttached: (f: AttachedFile) => void; onStatus: (s: string) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!OK_EXT.test(file.name)) { onStatus("Only Markdown, text and PDF files."); return; }
    if (file.size > info.maxBytes) { onStatus("That file is over 25 MB."); return; }
    if (file.size > info.directMaxBytes && !info.blob) { onStatus("Files over 4 MB need secure storage, which isn't switched on yet."); return; }
    setBusy(true); onStatus(`Scanning ${file.name}…`);
    try {
      let res: Response;
      if (file.size > info.directMaxBytes) {
        const { upload } = await import("@vercel/blob/client");
        const safe = file.name.replace(/[^\w.-]/g, "_").slice(-80);
        const blob = await upload(`${info.prefix}${safe}`, file, { access: "private", handleUploadUrl: "/api/v1/chat/files/upload-token", contentType: file.type || undefined });
        res = await fetch("/api/v1/chat/files", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ blobUrl: blob.url, pathname: blob.pathname, name: file.name, type: file.type }) });
      } else {
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/v1/chat/files", { method: "POST", body: form });
      }
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.file) {
        onAttached({ id: d.file.id, name: d.file.name, notes: d.file.notes ?? [] });
        onStatus(`Read "${d.file.name}" safely${d.file.notes?.length ? ` (${d.file.notes.slice(0, 2).join("; ")})` : ""}. Ask me about it.`);
      } else onStatus(d.error || "That file couldn't be read.");
    } catch { onStatus("The upload didn't go through. Try again."); }
    setBusy(false);
  };
  return (
    <label title="Attach a Markdown, text or PDF file (up to 25 MB)" aria-label="Attach a file" style={{ display: "flex", alignItems: "center", cursor: busy ? "wait" : "pointer", color: INK.gold, padding: "0 6px", border: `1px solid ${INK.borderGold}`, borderRadius: "8px", fontFamily: INSTRUMENT_FONT, fontSize: "12px" }}>
      {busy ? "…" : "📎"}
      <input type="file" accept={ACCEPT} onChange={pick} disabled={busy} style={{ display: "none" }} />
    </label>
  );
}
