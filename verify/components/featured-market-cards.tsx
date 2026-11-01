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
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${neon}99`,
              borderRadius: 16,
              padding: 16,
              boxShadow: `0 0 18px ${neon}33, inset 0 0 24px ${neon}11`,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontFamily: INSTRUMENT_FONT,
            }}
          >
            {/* Graphic first: the prediction symbol glows behind the question. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/sym-prediction.png" alt="" loading="lazy" style={{ position: "absolute", top: 10, right: 10, width: 52, height: 52, objectFit: "contain", filter: `drop-shadow(0 0 10px ${neon}aa)`, pointerEvents: "none" }} />
            {/* Caps are a display choice, applied here — the data stays sentence case. */}
            <div style={{ fontSize: 15, fontWeight: 900, color: skin.gold, lineHeight: 1.25, letterSpacing: 0.4, textTransform: "uppercase", paddingRight: 58 }}>
              {m.question}
            </div>
            {/* The odds as a picture: implied share from the two multipliers, YES left, NO right. */}
            {(() => {
              const py = 1 / m.yes, pn = 1 / m.no, yesShare = Math.round((py / (py + pn)) * 100);
              return (
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: skin.positive }}>{odds(m.yes)} <span style={{ fontSize: 9, letterSpacing: 1 }}>YES</span></span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: skin.accent2 }}><span style={{ fontSize: 9, letterSpacing: 1 }}>NO</span> {odds(m.no)}</span>
                  </div>
                  <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.08)" }} role="img" aria-label={`Implied ${yesShare} percent yes, ${100 - yesShare} percent no`}>
                    <span style={{ width: `${yesShare}%`, background: skin.positive, boxShadow: `0 0 9px ${skin.positive}88` }} />
                    <span style={{ width: `${100 - yesShare}%`, background: skin.accent2 }} />
                  </div>
                </div>
              );
            })()}
            <a
              href="/open-markets?tab=prediction"
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
