"use client";

/**
 * MAD Gambit — left category rail (mockup's left sidebar).
 * ────────────────────────────────────────────────────────────────
 * The news-category nav from the mockup (Home · Trending · … · About Us) with the
 * brand mark on top. Every item is a real clickable button that jumps to the live
 * News Flow section. Skin-aware; desktop chrome (the shell hides it on mobile).
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

const CATS: [string, string][] = [
  ["🏠", "Home"], ["🔥", "Trending"], ["📍", "Local"], ["🌐", "International"], ["🏈", "Sports"],
  ["💻", "Tech"], ["🔬", "Science"], ["🩺", "Health"], ["📈", "Business"], ["🎬", "Entertainment"],
  ["🎭", "Culture"], ["🌱", "Environment"], ["💬", "Opinion"], ["⛅", "Weather"], ["ℹ️", "About Us"],
];

function jumpToNews() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("mg-news");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CategoryRail() {
  const { skin } = useSkin();
  return (
    <aside style={{ width: 176, flex: "none", alignSelf: "flex-start", position: "sticky", top: 12, background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 12, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 10px", borderBottom: `1px solid ${skin.border}`, marginBottom: 8 }}>
        <span style={{ width: 24, height: 24, flex: "none", borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${skin.gold}, ${skin.accent2})`, boxShadow: `0 0 8px ${skin.gold}66` }} aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.5, color: skin.gold, textTransform: "uppercase", lineHeight: 1 }}>MADHAT&rsquo;s</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {CATS.map(([icon, label], i) => (
          <button
            key={label}
            type="button"
            onClick={jumpToNews}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: i === 0 ? `${skin.accent}18` : "transparent", border: `1px solid ${i === 0 ? `${skin.accent}55` : "transparent"}`, color: i === 0 ? skin.text : skin.muted, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, fontFamily: INSTRUMENT_FONT }}
          >
            <span style={{ fontSize: 12 }} aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
