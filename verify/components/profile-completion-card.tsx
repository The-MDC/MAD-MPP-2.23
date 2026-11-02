"use client";

/**
 * Profile completion: display name, avatar, bio and a VERIFIED email. Reaching 90% unlocks file upload in the
 * concierge. Email must be a personal mailbox or a real mail-receiving domain, proven with a six-digit code.
 */
import React, { useCallback, useEffect, useState } from "react";
import { SectionTitle, GOLD, MUTED, LINE } from "@/components/om-ui";

interface P { signedIn: boolean; profile: { displayName: string | null; avatar: string | null; bio: string | null; email: string | null; emailVerified: boolean }; completion: number; missing: string[]; uploadAllowed: boolean; uploadThreshold: number; avatars: string[] }

const field: React.CSSProperties = { width: "100%", minHeight: 42, background: "#0b0b0e", border: `1px solid ${LINE}`, borderRadius: 10, color: "#fff", padding: "0 12px", fontSize: 15 };

export default function ProfileCompletionCard() {
  const [p, setP] = useState<P | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    fetch("/api/v1/profile", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (!d?.success) return;
      setP(d); setName(d.profile.displayName ?? ""); setBio(d.profile.bio ?? "");
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(body: object, ok: string) {
    const r = await fetch("/api/v1/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? ok : d.error || "Couldn't save."); if (r.ok) load();
  }
  async function sendCode() {
    const r = await fetch("/api/v1/profile/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setSent(true); setMsg("Code sent. Check your inbox."); } else setMsg(d.error || "Couldn't send the code.");
  }
  async function verify() {
    const r = await fetch("/api/v1/profile/email/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { setSent(false); setCode(""); setMsg("Email verified."); load(); } else setMsg(d.error || "That didn't work.");
  }

  if (!p) return null;
  if (!p.signedIn) return null;
  return (
    <section className="mg-tile" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }} aria-label="Complete your profile">
      <SectionTitle>Your profile · {p.completion}%</SectionTitle>
      <div role="progressbar" aria-valuenow={p.completion} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, borderRadius: 3, background: LINE }}>
        <div style={{ width: `${p.completion}%`, height: "100%", borderRadius: 3, background: p.completion >= p.uploadThreshold ? "#7cffc7" : GOLD }} />
      </div>
      <div style={{ fontSize: 12, color: MUTED }}>
        {p.uploadAllowed ? "File upload in the concierge is unlocked." : `Reach ${p.uploadThreshold}% to unlock file upload in the concierge.`}{p.missing.length ? ` Still missing: ${p.missing.join(", ")}.` : ""}
      </div>

      <label style={{ fontSize: 12, color: MUTED }}>Display name
        <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => name && name !== p.profile.displayName && save({ displayName: name }, "Name saved.")} style={field} />
      </label>
      <div style={{ fontSize: 12, color: MUTED }}>Avatar</div>
      <div style={{ display: "flex", gap: 8 }}>
        {p.avatars.map((a) => (
          <button key={a} type="button" onClick={() => save({ avatar: a }, "Avatar saved.")} aria-pressed={p.profile.avatar?.includes(a) ?? false}
            style={{ border: `2px solid ${p.profile.avatar?.includes(a) ? GOLD : LINE}`, borderRadius: 12, padding: 2, background: "transparent", cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a === "madhatr" ? "/brand/madhatr-bust.png" : "/brand/madhatr-logo.png"} alt={a} width={44} height={44} style={{ borderRadius: 10, objectFit: "cover" }} />
          </button>
        ))}
      </div>
      <label style={{ fontSize: 12, color: MUTED }}>Short bio
        <textarea value={bio} maxLength={280} rows={2} onChange={(e) => setBio(e.target.value)} onBlur={() => bio !== (p.profile.bio ?? "") && save({ bio }, "Bio saved.")} style={{ ...field, padding: 10 }} />
      </label>

      <div style={{ fontSize: 12, color: MUTED }}>
        Email {p.profile.emailVerified ? <strong style={{ color: "#7cffc7" }}>verified: {p.profile.email}</strong> : "(a personal address or one at a real company domain)"}
      </div>
      {!p.profile.emailVerified && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="email" autoComplete="email" aria-label="Email" placeholder="you@gmail.com or you@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...field, flex: "1 1 220px" }} />
          <button type="button" className="mg-btn-ghost" onClick={sendCode} style={{ minHeight: 42 }}>Send code</button>
          {sent && (<>
            <input inputMode="numeric" aria-label="Six-digit code" placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={{ ...field, flex: "0 1 120px" }} />
            <button type="button" className="mg-btn-gold" onClick={verify} style={{ minHeight: 42 }}>Verify</button>
          </>)}
        </div>
      )}
      {msg && <p role="status" style={{ margin: 0, fontSize: 12, color: MUTED }}>{msg}</p>}
    </section>
  );
}
