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
import { Dices, Flame, type LucideIcon } from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { useAutoShowcase } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface DopCard {
  title: string;
  Icon?: LucideIcon;
  iconColor?: "accent" | "accent2";
  value?: string;
  gauge?: number; // 0..100 → renders the chaos gauge
  gainers?: [string, string][];
}

const CARDS: DopCard[] = [
  { title: "Active Bets", Icon: Dices, iconColor: "accent", value: "3 Live" },
  { title: "Degen Streak", Icon: Flame, iconColor: "accent2", value: "5 Day Streak!" },
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
  // The circled arrows are the platform's mark for a rail that showcases
  // itself, so this strip advances on its own — see components/carousel.tsx.
  const showcase = useAutoShowcase(ref, { gap: 11 });
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
        {...showcase}
        style={{ display: "flex", gap: 11, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}
      >
        {CARDS.map((c) => (
          <div
            key={c.title}
            style={{
              position: "relative",
              minWidth: 122,
              flex: "0 0 auto",
              background: skin.card,
              // Gold case, cyan legend — the card is brass with the readout lit
              // inside it, the same split the Seiko above it uses.
              border: `2px solid ${skin.gold}`,
              borderRadius: 14,
              padding: "13px 10px",
              textAlign: "center",
              boxShadow: `0 0 14px ${skin.gold}33, inset 0 0 18px ${skin.gold}0f`,
              fontFamily: INSTRUMENT_FONT,
            }}
          >
            {/* Grip — this carousel is user-reorderable, and the handle is what says so. */}
            <span
              aria-hidden="true"
              style={{ position: "absolute", top: 7, left: 8, fontSize: 9, fontWeight: 900, lineHeight: 1, color: `${skin.muted}cc`, letterSpacing: -1 }}
            >
              ≡
            </span>
            <div style={{ fontSize: 11, fontWeight: 900, color: skin.accent, letterSpacing: 0.6, textTransform: "uppercase", lineHeight: 1.15, minHeight: 26 }}>
              {c.title}
            </div>
            {c.Icon ? (
              <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }} aria-hidden="true">
                <c.Icon size={26} strokeWidth={1.75} style={{ color: c.iconColor === "accent2" ? skin.accent2 : skin.accent, filter: `drop-shadow(0 0 6px ${c.iconColor === "accent2" ? skin.accent2 : skin.accent}66)` }} />
              </div>
            ) : null}
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
            {c.value ? <div style={{ fontSize: 10.5, fontWeight: 900, color: skin.gold, textTransform: "uppercase", textShadow: `0 0 8px ${skin.gold}55` }}>{c.value}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
