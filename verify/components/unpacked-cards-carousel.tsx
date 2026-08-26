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
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import HoldHint from "@/components/hold-hint";

/**
 * Fixed seed, and it has to be fixed for two independent reasons.
 *
 * 1. HYDRATION. This is a client component, which Next still renders on the
 *    server first. `Date.now() % 100000` as the seed meant the server rolled
 *    one set of cards and the browser rolled a different set milliseconds
 *    later, so the markup React was asked to hydrate did not match the markup
 *    it had — a hydration mismatch on every single load, whose symptom is a
 *    silent client re-render of the whole subtree rather than an obvious error.
 *
 * 2. HONESTY. A seed that moves makes the row look like a live feed of what
 *    other people just opened. It is not: it is one deterministic roll, made
 *    here, from the same openCardPack() the real pack-open route runs. Pinning
 *    the seed makes it what it is — a fixed sample, showing the true drop
 *    distribution — and the heading now says so.
 */
const SAMPLE_SEED = 42_069;

function generateUnpackedRow(count: number): NftCard[] {
  const cards: NftCard[] = [];
  let packNum = 1;
  while (cards.length < count) {
    const result = openCardPack(SAMPLE_SEED, packNum++);
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
      {/* Was "RECENTLY UNPACKED", which claimed these were cards other players
          had just opened. Nobody opened them — the row is one deterministic
          roll of openCardPack(), generated in this component. The rarity mix is
          completely real (it is the production drop function, not a designer's
          mock-up), so the honest heading keeps the claim that is true and drops
          the one that is not. */}
      <HoldHint
        hint={{
          title: "Sample roll",
          kind: "sample",
          body: "Not a live feed of other players' packs. One fixed roll of openCardPack() from lib/gambit-game-math — the same weighted-rarity function the real pack-open route runs — so the rarity mix you see is the true drop distribution.",
        }}
      >
        <div
          tabIndex={0}
          style={{
            fontFamily: INSTRUMENT_FONT, fontSize: "8px", fontWeight: 800,
            letterSpacing: "2px", color: "#ffd700", padding: "0 4px 8px",
            display: "inline-block",
          }}
        >
          SAMPLE ROLL · REAL DROP ODDS
        </div>
      </HoldHint>

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
