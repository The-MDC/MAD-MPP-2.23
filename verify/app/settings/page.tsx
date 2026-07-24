"use client";

/**
 * MAD Gambit — /settings : theme + joy preferences, persisted locally.
 */
import React, { useEffect, useState } from "react";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

function Row({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  const { skin } = useSkin();
  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 14, padding: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1, color: skin.text, textTransform: "uppercase" }}>{title}</div>
        <div style={{ fontSize: 8, color: skin.muted, marginTop: 3, lineHeight: 1.5 }}>{blurb}</div>
      </div>
      {children}
    </div>
  );
}

function SettingsInner() {
  const { skin, name, setSkin } = useSkin();
  const [roast, setRoast] = useState(70);

  useEffect(() => {
    try {
      const r = Number(localStorage.getItem("mg_roast"));
      if (Number.isFinite(r) && r >= 0 && r <= 100) setRoast(r);
    } catch { /* ignore */ }
  }, []);

  const saveRoast = (v: number) => {
    setRoast(v);
    try { localStorage.setItem("mg_roast", String(v)); } catch { /* ignore */ }
  };

  return (
    <main style={{ minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT, padding: "18px 16px 60px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <a href="/MPP2.23" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.accent, textDecoration: "none" }}>
          <ArrowLeft size={12} /> Back to the Hub
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SettingsIcon size={22} style={{ color: skin.gold }} />
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.5, color: skin.gold, textTransform: "uppercase" }}>Settings</div>
        </div>

        <Row title="Theme" blurb="Gilded Pop-Baroque ⇄ Neon Noir Tabloid — persists in this browser.">
          {(["neonNoir", "gilded"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSkin(s)}
              style={{ padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontFamily: INSTRUMENT_FONT, color: name === s ? skin.bg : skin.text, background: name === s ? skin.gold : skin.card, border: `1px solid ${name === s ? skin.gold : skin.border}` }}>
              {s === "neonNoir" ? "◐ Neon Noir" : "◑ Gilded"}
            </button>
          ))}
        </Row>

        <Row title="Roast Severity" blurb={`Satire sharpness throttle for the news engine and MADHAT'r quips — currently ${roast}. Feeds the ?throttle= satire APIs.`}>
          <input type="range" min={0} max={100} value={roast} onChange={(e) => saveRoast(Number(e.target.value))} style={{ width: 180, accentColor: skin.accent2 }} aria-label="Roast severity" />
          <span style={{ fontSize: 12, fontWeight: 900, color: skin.accent2, minWidth: 30, textAlign: "right" }}>{roast}</span>
        </Row>

        <Row title="Motion" blurb="Every marquee, flip and parallax in the app already honors your OS-level Reduce Motion preference — flip it in your system settings and the hub calms down instantly.">
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.positive, border: `1px solid ${skin.positive}55`, padding: "5px 10px", borderRadius: 8 }}>prefers-reduced-motion: honored</span>
        </Row>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <SkinProvider>
      <SettingsInner />
    </SkinProvider>
  );
}
