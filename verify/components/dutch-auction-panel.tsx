"use client";

/**
 * MΛĐ Gambit — Dutch Auction Pack Panel
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt DutchAuctionPackPanel + GambitViewModel.
 * Live price timer: decrements by 5 every 5 seconds (floor at 10 $MADx).
 * Includes Founder&apos;s Golden Ticket claim flow (isGoldenTicketClaimed).
 * Pack cards: 7 named satirical NFTs from GambitViewModel.satiricalCardsPool.
 */

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";
import { Package, Star, Ticket, Clock, Zap } from "lucide-react";

const STARTING_PRICE = 100;
const PRICE_FLOOR = 10;
const DECREMENT = 5;
const INTERVAL_SECS = 5;

interface SatiricalCard {
  id: string; name: string; rarity: string; fact: string;
  power: number; color: string; emoji: string;
}

// From GambitViewModel.satiricalCardsPool (exact names, facts, power scores)
const CARD_POOL: SatiricalCard[] = [
  { id:"c1", name:"The Hallucinating LLM",    rarity:"Mythic",  fact:"Confidently outputs 2+2=5 with peer-reviewed mathematical proofs.", power:99, color:"#ffd700", emoji:"🤖" },
  { id:"c2", name:"The 3AM Liquidator",       rarity:"Exotic",  fact:"Nourished exclusively by margin-call tears and hot energy drinks.",  power:88, color:"#c084fc", emoji:"⚡" },
  { id:"c3", name:"Whampoa Twitter Hypebot", rarity:"Rare",    fact:"Fires 8,000 automated bullish remarks per minute about chaotic startups.", power:76, color:"#60a5fa", emoji:"📢" },
  { id:"c4", name:"Founder&apos;s Golden Ticket", rarity:"Genesis", fact:"Allows access to the vault. Backed by nothing but infinite optimism.", power:100, color:"#f472b6", emoji:"🎟️" },
  { id:"c5", name:"The Rogue Oracle Node",    rarity:"Mythic",  fact:"Pipes cultural chaos directly into predictive smart contracts.",     power:95, color:"#ffd700", emoji:"🔮" },
  { id:"c6", name:"Dutch Auction Sniper Bot", rarity:"Rare",    fact:"Patiently waits until price hits 10 $MADx to swipe packs instantly.", power:82, color:"#60a5fa", emoji:"🎯" },
  { id:"c7", name:"The Slideware Champion",   rarity:"Rare",    fact:"Guarantees 10x multiplier in pitch decks, 0.1x in production.",     power:68, color:"#938f99", emoji:"📊" },
];

const RARITY_COLORS: Record<string, string> = {
  Mythic:"#ff00f0", Genesis:"#ffd700", Exotic:"#c98aff", Rare:"#58a6ff", Common:"#94a3b8",
};

export default function DutchAuctionPanel() {
  const { madCredits, adjustCredits } = useGame();
  const [price, setPrice] = useState(STARTING_PRICE);
  const [countdown, setCountdown] = useState(INTERVAL_SECS);
  const [unlockedCards, setUnlockedCards] = useState<SatiricalCard[]>([]);
  const [goldenTicketClaimed, setGoldenTicketClaimed] = useState(false);
  const [lastPulled, setLastPulled] = useState<SatiricalCard | null>(null);
  const [flashCard, setFlashCard] = useState(false);

  // Live price decrement every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPrice((p) => Math.max(PRICE_FLOOR, p - DECREMENT));
          return INTERVAL_SECS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function buyPack() {
    if (madCredits < price) return;
    adjustCredits(-price);
    // draw a random card from pool (weighted toward non-Genesis)
    const pool = CARD_POOL.filter((c) => c.rarity !== "Genesis" || Math.random() < 0.05);
    const drawn = pool[Math.floor(Math.random() * pool.length)];
    setUnlockedCards((p) => [drawn, ...p]);
    setLastPulled(drawn);
    setFlashCard(true);
    setTimeout(() => setFlashCard(false), 900);
  }

  function claimGoldenTicket() {
    if (goldenTicketClaimed) return;
    setGoldenTicketClaimed(true);
    setUnlockedCards((p) => [CARD_POOL[3], ...p]);
  }

  const countdownPct = (countdown / INTERVAL_SECS) * 100;

  return (
    <div className="space-y-4">
      {/* GOLDEN TICKET */}
      <div className={`rounded-2xl border p-5 transition-all ${goldenTicketClaimed ? "border-emerald-500/40 bg-emerald-500/5" : "border-pink-500/40 bg-[#05070c]"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-pink-400" />
            <div>
              <p className="font-mono text-xs font-bold text-neutral-200">Founder&apos;s Golden Ticket</p>
              <p className="font-mono text-[9px] text-neutral-500">Genesis Core Vault Key</p>
            </div>
          </div>
          <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border font-bold ${goldenTicketClaimed ? "border-emerald-500/40 text-emerald-400" : "border-pink-500/40 text-pink-400"}`}>
            {goldenTicketClaimed ? "CLAIMED" : "AVAILABLE"}
          </span>
        </div>
        {goldenTicketClaimed ? (
          <div className="rounded-lg bg-[#010203] border border-neutral-900 p-3 font-mono text-[10px] text-emerald-400 space-y-0.5">
            <p>GENESIS TICKET METADATA</p>
            <p className="text-neutral-500">Serial: #0001 · Tier: Genesis · Network: EVM</p>
            <p className="text-neutral-500">Claimed: {new Date().toLocaleDateString()}</p>
            <p className="text-cyan-400">Status: VAULT ACCESS GRANTED ✓</p>
          </div>
        ) : (
          <button onClick={claimGoldenTicket}
            className="w-full rounded-xl py-2.5 font-mono text-xs uppercase tracking-widest font-bold bg-pink-500/10 border border-pink-500/40 text-pink-400 hover:bg-pink-500/20 transition-all flex items-center justify-center gap-2">
            <Star className="w-3.5 h-3.5" /> Claim Founder&apos;s Golden Ticket
          </button>
        )}
      </div>

      {/* DUTCH AUCTION BAY */}
      <div className="rounded-2xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-neutral-400">Dutch Auction Card Engine</h2>
            <p className="font-mono text-[9px] text-neutral-600">Price decays automatically — buy when price matches your risk index</p>
          </div>
        </div>

        {/* Pack + price */}
        <div className="rounded-xl border border-cyan-500/30 bg-[#030508] p-5 text-center mb-4 relative overflow-hidden">
          {flashCard && lastPulled && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#030508]/90 rounded-xl animate-pulse">
              <div className="text-center">
                <p className="text-4xl mb-1">{lastPulled.emoji}</p>
                <p className="font-mono text-xs font-black" style={{ color: RARITY_COLORS[lastPulled.rarity] || "#94a3b8" }}>{lastPulled.name}</p>
                <p className="font-mono text-[8px] text-neutral-500">{lastPulled.rarity}</p>
              </div>
            </div>
          )}
          <p className="text-4xl mb-2">📦</p>
          <p className="font-mono text-lg font-black text-neutral-200 mb-1">MΛĐ-HΛT PΛCK v3</p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="font-mono text-5xl font-black text-cyan-400" style={{ transition: "all 0.4s ease" }}>{price}</span>
            <span className="font-mono text-lg text-neutral-500">$MADx</span>
          </div>
          {/* countdown timer */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="w-3 h-3 text-neutral-500" />
            <div className="w-32 h-1 rounded-full bg-neutral-900 overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${countdownPct}%` }} />
            </div>
            <span className="font-mono text-[9px] text-neutral-500">-{DECREMENT} in {countdown}s</span>
          </div>
          <button
            onClick={buyPack}
            disabled={madCredits < price}
            className="w-full rounded-xl py-3 font-mono text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2"
            style={madCredits >= price ? { background: "#00f0ff18", border: "1px solid #00f0ff55", color: "#00f0ff" } : { background: "#11151c", border: "1px solid #1f2937", color: "#475569" }}>
            <Zap className="w-4 h-4" />
            {madCredits >= price ? "RIP PACK NOW" : `INSUFFICIENT $MADx (need ${price})`}
          </button>
          <p className="font-mono text-[9px] text-neutral-600 mt-2">Balance: {madCredits.toLocaleString()} $MADx</p>
        </div>

        {/* Unlocked cards */}
        {unlockedCards.length > 0 && (
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mb-2">
              Your Satirical Cards Playbook ({unlockedCards.length})
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {unlockedCards.map((c, i) => (
                <div key={`${c.id}-${i}`} className="flex items-center gap-3 rounded-lg border border-neutral-850 bg-[#030508] px-3 py-2">
                  <span className="text-xl shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] font-bold truncate" style={{ color: RARITY_COLORS[c.rarity] || "#94a3b8" }}>{c.name}</p>
                    <p className="font-mono text-[8px] text-neutral-600 truncate">{c.fact}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[8px] font-bold" style={{ color: RARITY_COLORS[c.rarity] }}>{c.rarity}</p>
                    <p className="font-mono text-[8px] text-neutral-600">{c.power} PWR</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
