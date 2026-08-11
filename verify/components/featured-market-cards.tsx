"use client";

/**
 * MAD Gambit — Featured Market Cards (mockup bottom section).
 * ────────────────────────────────────────────────────────────────
 * The neon-bordered YES/NO odds cards with a BET NOW call-to-action, exactly as
 * the mockup. Skin-aware (neon-pink glow in Neon Noir, gilded edge in Gilded),
 * responsive grid, keyboard-focusable actions. Odds are beta placeholders.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { FEATURED_DEMO_MARKETS, odds } from "@/lib/demo-markets";

// Copy comes from lib/demo-markets — this surface used to carry its own
// third copy of the same three questions, and it was the one still dated 2024.
const MARKETS = FEATURED_DEMO_MARKETS;

export default function FeaturedMarketCards() {
  const { skin } = useSkin();
  const neon = skin.accent2; // hot-pink / velvet edge

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 2,
          color: skin.text,
          textTransform: "uppercase",
          margin: "0 0 12px 2px",
          fontFamily: INSTRUMENT_FONT,
        }}
      >
        Featured Market Cards
        <AutoShowcaseBadge />
      </div>
      <Carousel auto gap={14} ariaLabel="Featured market cards">
        {MARKETS.map((m) => (
          <div
            key={m.id}
            style={{
              width: 260,
              maxWidth: "100%",
              height: "100%",
              background: skin.card,
              border: `2px solid ${neon}`,
              borderRadius: 16,
              padding: 18,
              boxShadow: `0 0 18px ${neon}44, inset 0 0 24px ${neon}11`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontFamily: INSTRUMENT_FONT,
            }}
          >
            {/* Caps are a display choice, applied here — the data stays sentence case. */}
            <div style={{ fontSize: 15, fontWeight: 900, color: skin.gold, lineHeight: 1.25, letterSpacing: 0.4, textTransform: "uppercase" }}>
              {m.question}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: skin.positive, letterSpacing: 1 }}>YES</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: skin.text }}>{odds(m.yes)}</div>
              </div>
              <div style={{ width: 1, height: 34, background: `${skin.text}22` }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: skin.accent2, letterSpacing: 1 }}>NO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: skin.text }}>{odds(m.no)}</div>
              </div>
            </div>
            <a
              href="/gambit"
              style={{
                display: "block",
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "none",
                background: skin.accent,
                color: skin.bg,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: INSTRUMENT_FONT,
                boxShadow: `0 0 14px ${skin.accent}66`,
              }}
            >
              Bet Now
            </a>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
