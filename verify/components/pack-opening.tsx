"use client";

/**
 * AGENT-GAMMA Stage 5 — Pack Opening Component
 * Implements the Affliction Step 1: "Rip Scandal Pack" — anticipation + surprise.
 * Source: MADHATs Gambit Card Game Master Bible §7-Step Conviction Loop.
 * Pack economics: 4.88 MADx / 5 cards / slot 0 guaranteed Uncommon+.
 */

import React, { useState, useCallback } from "react";
import { useGame } from "@/context/game-context";
import {
  openCardPack, PLATFORM, RARITY_TABLE, type Rarity,
} from "@/lib/gambit-game-math";
import { NftCardView } from "@/components/nft-card";
import { Gift, Sparkles, Lock, ChevronRight } from "lucide-react";

type RevealedCard = ReturnType<typeof openCardPack>["cards"][number];

const RARITY_ANIMATION: Record<Rarity, string> = {
  Common:         "animate-resolve-win",
  Uncommon:       "animate-resolve-win",
  Rare:           "animate-vrs-burst",
  Epic:           "animate-vrs-burst",
  Legendary:      "animate-gold-jackpot",
  "Golden Hand":  "animate-gold-jackpot",
  Mythic:         "animate-gold-jackpot",
};

export default function PackOpening() {
  const { madCredits, adjustCredits, cards, setCards } = useGame();
  const [phase, setPhase] = useState<"idle" | "opening" | "revealed">("idle");
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1); // which slot is flipping
  const [packCount, setPackCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canAfford = madCredits >= PLATFORM.CARD_PACK_COST;

  const handleOpenPack = useCallback(async () => {
    if (!canAfford) return;
    setError(null);
    setPhase("opening");
    setRevealIndex(-1);
    setRevealedCards([]);
    adjustCredits(-PLATFORM.CARD_PACK_COST);

    // Generate pack client-side (same logic as /api/v1/cards/open-pack)
    const result = openCardPack(Math.floor(Date.now() / 1000), packCount + 1);
    setPackCount(p => p + 1);
    setRevealedCards(result.cards);

    // Sequential reveal with rarity-appropriate delay
    for (let i = 0; i < result.cards.length; i++) {
      await new Promise(res => setTimeout(res, i === 0 ? 400 : 600));
      setRevealIndex(i);
    }

    // After all revealed, mark complete
    await new Promise(res => setTimeout(res, 800));
    setPhase("revealed");

    // Add to collection
    const mapped = result.cards.map((c, idx) => ({
      id: `pack_${packCount}_${idx}_${Date.now()}`,
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
    }));
    setCards((prev: any[]) => [...prev, ...mapped]);
  }, [canAfford, adjustCredits, packCount, setCards]);

  return (
    <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md overflow-hidden p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="inline-flex font-mono text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-md">
            SCANDAL PACK
          </span>
          <p className="font-mono text-[8px] text-neutral-600 mt-1">
            {PLATFORM.CARD_PACK_SIZE} cards · {PLATFORM.CARD_PACK_COST} MADx · Slot 0 guaranteed Uncommon+
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600">Balance</p>
          <p className={`font-mono text-sm font-black ${canAfford ? "text-neutral-200" : "text-rose-400"}`}>
            {madCredits.toLocaleString()} $MADx
          </p>
        </div>
      </div>

      {/* CTA */}
      {phase === "idle" && (
        <button
          onClick={handleOpenPack}
          disabled={!canAfford}
          className={`w-full rounded-xl py-3 font-mono text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 ${
            canAfford
              ? "bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 hover:border-purple-400/60 animate-conviction"
              : "bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed"
          }`}
        >
          {canAfford ? (
            <><Gift className="w-3.5 h-3.5" /> Rip Pack · {PLATFORM.CARD_PACK_COST} MADx</>
          ) : (
            <><Lock className="w-3.5 h-3.5" /> Insufficient Balance</>
          )}
        </button>
      )}

      {/* Opening animation + card reveal grid */}
      {(phase === "opening" || phase === "revealed") && (
        <div className="space-y-3">
          {/* Slot 0 guarantee label */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-[8px] text-yellow-400">✦ SLOT 0 GUARANTEED UNCOMMON+</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: PLATFORM.CARD_PACK_SIZE }).map((_, slot) => {
              const card = revealedCards[slot];
              const revealed = slot <= revealIndex;
              const tier = card ? RARITY_TABLE[card.rarity] : null;
              const anim = card ? RARITY_ANIMATION[card.rarity] : "";

              return (
                <div
                  key={slot}
                  className={`aspect-[3/4] rounded-xl overflow-hidden relative transition-all duration-500 ${
                    revealed ? anim : "bg-neutral-900/80 border border-neutral-800"
                  } ${slot === 0 && !revealed ? "border border-yellow-500/30" : ""}`}
                >
                  {!revealed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {slot === 0 ? (
                        <Sparkles className="w-4 h-4 text-yellow-500/50" />
                      ) : (
                        <Gift className="w-4 h-4 text-neutral-700" />
                      )}
                    </div>
                  )}
                  {revealed && card && (
                    <div className={`absolute inset-0 ${slot === revealIndex && phase === "opening" ? "animate-card-flip" : ""}`}>
                      <NftCardView card={card as any} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Post-reveal actions */}
          {phase === "revealed" && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleOpenPack}
                disabled={!canAfford}
                className={`flex-1 rounded-xl py-2 font-mono text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all ${
                  canAfford
                    ? "bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed"
                }`}
              >
                <ChevronRight className="w-3 h-3" />
                {canAfford ? "Open Another" : "Insufficient Balance"}
              </button>
              <button
                onClick={() => setPhase("idle")}
                className="rounded-xl py-2 px-3 font-mono text-[10px] uppercase tracking-widest font-bold bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 font-mono text-[10px] text-rose-400">{error}</p>
      )}
    </div>
  );
}
