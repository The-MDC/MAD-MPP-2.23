"use client";

/**
 * MAD Gambit — Unpacked Cards Carousel
 * ══════════════════════════════════════════════════════════════════
 * Continuously scrolling row of cards pulled from packs — reuses the
 * existing NftCardView (gold-chisel logo, dual neon frame, holographic
 * foil on Legendary+) so cards render at the SAME fidelity here as
 * everywhere else in the app. No simplified/flattened preview version.
 *
 * Cards are generated via the real openCardPack() engine (same
 * deterministic weighted-rarity logic used at actual pack-opening
 * time), then mapped into the NftCard shape exactly as
 * pack-opening.tsx already does — one source of truth for that
 * mapping, not a second ad-hoc version.
 * ══════════════════════════════════════════════════════════════════ */

import React, { useMemo } from "react";
import { NftCardView } from "@/components/nft-card";
import type { NftCard } from "@/context/game-context";
import { openCardPack } from "@/lib/gambit-game-math";
import { INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";

function generateUnpackedRow(count: number): NftCard[] {
  const cards: NftCard[] = [];
  let packNum = 1;
  while (cards.length < count) {
    const result = openCardPack(Date.now() % 100000, packNum++);
    result.cards.forEach((c, idx) => {
      cards.push({
        id: `unpacked_${packNum}_${idx}`,
        name: c.name,
        faction: c.faction as any,
        rarity: c.rarity,
        serial: c.serial,
        caption: c.caption,
        volatility: c.volatility,
        cloutPct: c.cloutPct,
        odds: c.odds,
        xp: 0,
        durability: 1.0,
        stage: 1,
        apyBoost: c.apyBoost,
        edgeMultiplier: c.edgeMultiplier,
        earnsCount: 0,
        canonicalFactionId: c.canonicalFactionId,
      });
    });
  }
  return cards.slice(0, count);
}

export default function UnpackedCardsCarousel({ count = 8 }: { count?: number }) {
  const cards = useMemo(() => generateUnpackedRow(count), [count]);
  const loop = [...cards, ...cards];

  return (
    <div>
      <div style={{
        fontFamily: INSTRUMENT_FONT, fontSize: "8px", fontWeight: 800,
        letterSpacing: "2px", color: "#ffd700", padding: "0 4px 8px",
      }}>
        RECENTLY UNPACKED
      </div>

      <div className="unpacked-scroll-track" style={{ overflow: "hidden" }}>
        <div
          className="unpacked-scroll-inner"
          style={{
            display: "flex",
            gap: "10px",
            width: "max-content",
            animation: "gambitCardScroll 34s linear infinite",
          }}
        >
          {loop.map((c, i) => (
            <div key={`${c.id}-${i}`} style={{ flex: "0 0 auto", width: "110px" }}>
              <NftCardView card={c} compact />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gambitCardScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .unpacked-scroll-track:hover .unpacked-scroll-inner {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
