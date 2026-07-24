"use client";

/**
 * MAD Gambit — Customizable Dopamine Carousel (mockup-faithful strip).
 * ────────────────────────────────────────────────────────────────
 * The exact four cards from the mockup — Active Bets (dice), Degen Streak (fire),
 * Chaos Meter (gauge), Top Gainers — as a horizontal, arrow-scrollable carousel
 * with cyan neon borders. Skin-aware. (The existing DopamineMetricsCarousel is the
 * data-wired analytics variant; this is the pixel-faithful landing strip.)
 */
import React, { useRef } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface DopCard {
  title: string;
  icon?: string;
  value?: string;
  gauge?: number; // 0..100 → renders the chaos gauge
  gainers?: [string, string][];
}

const CARDS: DopCard[] = [
  { title: "Active Bets", icon: "🎲", value: "3 Live" },
  { title: "Degen Streak", icon: "🔥", value: "5 Day Streak!" },
  { title: "Chaos Meter", gauge: 85, value: "85% Chaos" },
  { title: "Top Gainers", gainers: [["UserA", "+50%"], ["UserB", "+30%"], ["UserC", "+30%"]] },
];

function Gauge({ pct }: { pct: number }) {
  const { skin } = useSkin();
  const angle = -90 + (Math.min(100, Math.max(0, pct)) / 100) * 180; // -90..+90
  const color = pct > 66 ? skin.accent2 : pct > 33 ? skin.gold : skin.accent;
  return (
    <div style={{ width: 60, height: 34, margin: "8px auto 6px", position: "relative" }}>
      <svg width="60" height="34" viewBox="0 0 60 34" aria-hidden="true">
        <path d="M6 32 A24 24 0 0 1 54 32" fill="none" stroke={skin.card} strokeWidth="7" strokeLinecap="round" />
        <path d="M6 32 A24 24 0 0 1 54 32" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 75} 200`} />
        <line x1="30" y1="32" x2="30" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle} 30 32)`} />
        <circle cx="30" cy="32" r="2.5" fill="#fff" />
      </svg>
    </div>
  );
}

export default function DopamineCarouselStrip() {
  const { skin } = useSkin();
  const ref = useRef<HTMLDivElement>(null);
  const nudge = (dir: number) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 150, behavior: "smooth" });
  };

  const arrowStyle = (side: "l" | "r"): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 3,
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.7)",
      border: `1px solid ${skin.accent}`,
      color: skin.accent,
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 900,
      lineHeight: "26px",
      textAlign: "center",
      padding: 0,
      fontFamily: INSTRUMENT_FONT,
    };
    if (side === "l") base.left = -8;
    else base.right = -8;
    return base;
  };

  return (
    <div style={{ position: "relative" }}>
      <button type="button" aria-label="Scroll left" onClick={() => nudge(-1)} style={arrowStyle("l")}>‹</button>
      <button type="button" aria-label="Scroll right" onClick={() => nudge(1)} style={arrowStyle("r")}>›</button>
      <div
        ref={ref}
        style={{ display: "flex", gap: 11, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}
      >
        {CARDS.map((c) => (
          <div
            key={c.title}
            style={{
              minWidth: 122,
              flex: "0 0 auto",
              background: skin.card,
              border: `2px solid ${skin.accent}`,
              borderRadius: 14,
              padding: "13px 10px",
              textAlign: "center",
              boxShadow: `0 0 14px ${skin.accent}33`,
              fontFamily: INSTRUMENT_FONT,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: skin.accent, letterSpacing: 0.6, textTransform: "uppercase", lineHeight: 1.15, minHeight: 26 }}>
              {c.title}
            </div>
            {c.icon ? <div style={{ fontSize: 29, margin: "9px 0" }} aria-hidden="true">{c.icon}</div> : null}
            {typeof c.gauge === "number" ? <Gauge pct={c.gauge} /> : null}
            {c.gainers ? (
              <div style={{ fontSize: 10, fontWeight: 900, textAlign: "left", lineHeight: 1.6, color: skin.text, marginTop: 8 }}>
                {c.gainers.map(([u, g]) => (
                  <div key={u}>
                    {u} <span style={{ color: skin.positive }}>{g}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {c.value ? <div style={{ fontSize: 10.5, fontWeight: 900, color: skin.text, textTransform: "uppercase" }}>{c.value}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
