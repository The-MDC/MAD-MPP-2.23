"use client";

/**
 * MAD Gambit — left category rail (mockup's left sidebar).
 * ────────────────────────────────────────────────────────────────
 * The 10 satirical news categories (worksheet item D) with the brand mark on
 * top. Lucide line icons (the platform's icon language — no emoji). Each item
 * is a real clickable button that filters the hub News Flow to that category
 * (via the `mg:category` window event) and scrolls to it — the cards are the
 * SAME hub cards, just filtered. "All" (the brand row) clears the filter.
 * Skin-aware; desktop chrome (the shell hides it on mobile).
 */
import React from "react";
import {
  Star, Clapperboard, Megaphone, Landmark, Trophy, Newspaper, Tv, Flame, Coins, Laugh,
  type LucideIcon,
} from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import type { NewsCategory } from "@/lib/satire-headline";

// [Icon, display label, satire category key]. Order mirrors the API's CATEGORIES.
const CATS: [LucideIcon, string, NewsCategory][] = [
  [Star, "Celebrity News", "celebrity"],
  [Clapperboard, "Entertainment News", "entertainment"],
  [Megaphone, "Influencers & KOLs", "influencer"],
  [Landmark, "Politics & Commentary", "political"],
  [Trophy, "Sports & Athletes", "sports"],
  [Newspaper, "Tabloid Gossip", "tabloid"],
  [Tv, "Television", "television"],
  [Flame, "Viral Socials", "viral"],
  [Coins, "Crypto & Trading", "crypto"],
  [Laugh, "Funnies & Gaffes", "funnies"],
];

function selectCategory(cat: NewsCategory | null) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mg:category", { detail: cat }));
  }
  if (typeof document === "undefined") return;
  const el = document.getElementById("mg-news");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CategoryRail() {
  const { skin } = useSkin();
  const [active, setActive] = React.useState<NewsCategory | null>(null);

  return (
    <aside style={{ width: 176, flex: "none", alignSelf: "flex-start", position: "sticky", top: 12, background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 12, fontFamily: INSTRUMENT_FONT }}>
      <button
        type="button"
        onClick={() => { setActive(null); selectCategory(null); }}
        title="Show all categories"
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "2px 4px 10px", borderBottom: `1px solid ${skin.border}`, marginBottom: 8, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ width: 22, height: 22, flex: "none", borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${skin.gold}, ${skin.accent2})`, boxShadow: `0 0 8px ${skin.gold}66` }} aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.5, color: skin.gold, textTransform: "uppercase", lineHeight: 1 }}>MADHAT&rsquo;s</span>
      </button>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {CATS.map(([Icon, label, key]) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setActive(key); selectCategory(key); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: on ? `${skin.accent}18` : "transparent", border: `1px solid ${on ? `${skin.accent}55` : "transparent"}`, color: on ? skin.text : skin.muted, fontSize: 10, fontWeight: on ? 900 : 700, letterSpacing: 0.3, fontFamily: INSTRUMENT_FONT }}
            >
              <Icon size={12} strokeWidth={2.25} style={{ color: on ? skin.accent : skin.muted, flex: "none" }} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
