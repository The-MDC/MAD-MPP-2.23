"use client";

/**
 * MAD Gambit — Dashboard shell (Part Y). Provides the SkinProvider, a themed
 * background, and a hamburger menu holding the Neon Noir ↔ Gilded theme switch.
 * Additive: default (Neon Noir) equals the current INK look, so no regression.
 */
import React, { useState } from "react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

function ShellChrome({ children }: { children: React.ReactNode }) {
  const { skin, name, toggle } = useSkin();
  const [open, setOpen] = useState(false);

  return (
    <main style={{ minHeight: "100vh", background: skin.bg, padding: "var(--mg-pad-page-y) var(--mg-pad-page-x)", transition: "background .4s ease" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto var(--mg-gap-section)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: INSTRUMENT_FONT, fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          MAD Gambit · Dashboard
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Open menu"
            aria-expanded={open}
            style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 8, color: skin.text, fontSize: 16, lineHeight: 1, padding: "6px 11px", cursor: "pointer" }}
          >
            ☰
          </button>
          {open && (
            <div role="menu" style={{ position: "absolute", right: 0, top: "118%", background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 10, padding: 10, minWidth: 190, zIndex: 30, fontFamily: INSTRUMENT_FONT }}>
              <div style={{ fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Theme · SKIN_TOKENS</div>
              <button
                onClick={toggle}
                role="menuitem"
                style={{ width: "100%", textAlign: "left", background: skin.card, border: `1px solid ${skin.accent}`, color: skin.text, borderRadius: 8, padding: "8px 10px", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
              >
                {name === "neonNoir" ? "◐ Neon Noir → Gilded" : "◑ Gilded → Neon Noir"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Auto-fit panel grid: lateral seam between columns, section seam
          between rows — the global container contract (see tokens.css). */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          columnGap: "var(--mg-gap-lateral)",
          rowGap: "var(--mg-gap-section)",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          alignItems: "start",
        }}
      >
        {children}
      </div>
    </main>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SkinProvider>
      <ShellChrome>{children}</ShellChrome>
    </SkinProvider>
  );
}
