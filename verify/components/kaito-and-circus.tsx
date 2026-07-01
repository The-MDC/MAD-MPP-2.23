"use client";

/**
 * MΛĐ Gambit — Kaito Dynamic Ticker
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt GlobalSkinsAndKaitoHUD.
 * Shows $MADx / $ETH / $SOL / $PEPE with pulsing live indicator.
 * PLACEHOLDER: wire to real price oracle in prod
 * (see docs/BACKEND_PLACEHOLDERS.md → ORACLE).
 */

import React, { useState, useEffect } from "react";
import { Radio } from "lucide-react";

// PLACEHOLDER price data — prod wires to Chainlink price feeds / Kaito API
const BASE_PRICES: { symbol: string; price: number; change: number }[] = [
  { symbol: "$MADx", price: 2.48,    change: 18.42 },
  { symbol: "$ETH",  price: 3140,    change: -2.15 },
  { symbol: "$SOL",  price: 164.50,  change: 12.18 },
  { symbol: "$PEPE", price: 0.00015, change: 42.50 },
];

function fmtPrice(p: number): string {
  if (p < 0.001) return p.toFixed(5);
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(2);
  return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function KaitoPriceTicker() {
  const [prices, setPrices] = useState(BASE_PRICES);

  // Simulate micro price movements (PLACEHOLDER — replace with real feed)
  useEffect(() => {
    const t = setInterval(() => {
      setPrices((p) =>
        p.map((item) => ({
          ...item,
          price: item.price * (1 + (Math.random() - 0.499) * 0.002),
          change: item.change + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-850 bg-[#05070c] w-full">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <Radio className="w-3 h-3 text-yellow-400" />
        <span className="font-mono text-[8px] uppercase tracking-widest text-yellow-400 font-bold">
          KAITO LIVE FEED
        </span>
      </div>
      <div className="flex items-center gap-4 overflow-x-auto flex-1 scrollbar-none">
        {prices.map(({ symbol, price, change }) => {
          const up = change >= 0;
          return (
            <div key={symbol} className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[9px] text-neutral-500 font-bold">{symbol}</span>
              <span className="font-mono text-[10px] font-black text-neutral-200">{fmtPrice(price)}</span>
              <span className={`font-mono text-[8px] font-bold ${up ? "text-emerald-400" : "text-rose-400"}`}>
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/**
 * MΛĐ Gambit — Prediction Circus (upgraded)
 * ------------------------------------------------------------------
 * Replaces coin-flip simulation with the 5 real named scenarios from
 * MainActivity.kt GambitViewModel.defaultScenarios.
 * Each card shows satiricalFact, baselineProbability, δ-limit, and odds.
 * Outcome resolves via resolveScenarioPick() using scene probability.
 */

import { DEFAULT_SCENARIOS, OV_DECKS, OVDeck } from "@/lib/gambit-game-math";
import { ZapIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useGame } from "@/context/game-context";
import { calculateDeltaLimit, resolveScenarioPick } from "@/lib/gambit-game-math";
import AuthModal from "./auth-modal";

export function PredictionCircus({ activeDeck }: { activeDeck?: OVDeck }) {
  const deck = activeDeck ?? OV_DECKS[0];
  const { madCredits, adjustCredits, recordPick, socialAuth } = useGame();
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { won: boolean; payout: number; delta: number }>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  function getStake(id: string): number {
    return Math.max(1, parseInt(stakes[id] ?? "100") || 100);
  }

  function stake(scenId: string) {
    if (!socialAuth.isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const scenario = DEFAULT_SCENARIOS.find((s) => s.id === scenId);
    if (!scenario) return;
    const amount = getStake(scenId);
    if (madCredits < amount) return;
    const { won, payout, deltaLimit } = resolveScenarioPick(scenario, deck, amount);
    adjustCredits(payout);
    recordPick(won);
    setResults((p) => ({ ...p, [scenId]: { won, payout, delta: deltaLimit } }));
    setFlash(scenId);
    setTimeout(() => setFlash(null), 1200);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-neutral-400">Predict the Scandal</h2>
          <p className="font-mono text-[9px] text-neutral-600">Stake conviction into viral indices for quadratic payout odds</p>
        </div>
        <span className="font-mono text-[9px] px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-400">{deck.version}</span>
      </div>

      {DEFAULT_SCENARIOS.map((sc) => {
        const result = results[sc.id];
        const isFlashing = flash === sc.id;
        const deltaLimit = calculateDeltaLimit(deck.multiplier, sc.initialConviction);

        return (
          <div key={sc.id} className={`rounded-xl border transition-all p-4 ${isFlashing ? result?.won ? "border-emerald-500/60 bg-emerald-500/5" : "border-rose-500/60 bg-rose-500/5" : "border-neutral-850 bg-[#05070c]/80"}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{sc.emoji}</span>
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-200">{sc.title}</p>
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500 uppercase tracking-wider">{sc.category}</span>
                </div>
              </div>
              {result && (
                <div className="flex items-center gap-1 shrink-0">
                  {result.won ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                  <span className={`font-mono text-[10px] font-bold ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                    {result.payout >= 0 ? "+" : ""}{result.payout.toFixed(0)} $MADx
                  </span>
                </div>
              )}
            </div>

            <p className="font-mono text-[9px] italic text-neutral-500 mb-2 leading-relaxed">{sc.satiricalFact}</p>

            <div className="flex items-center justify-between text-[9px] font-mono mb-3">
              <span className="text-neutral-600">Base prob: <span className="text-cyan-400">{(sc.baselineProbability * 100).toFixed(0)}%</span></span>
              <span className="text-neutral-600">Payout: <span className="text-yellow-400">{(sc.odds / 10).toFixed(1)}x</span></span>
              <span className="text-neutral-600">δ-cap: <span className="text-purple-400">{deltaLimit.toFixed(0)}δ</span></span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={Math.min(madCredits, Math.round(deltaLimit))}
                value={stakes[sc.id] ?? "100"}
                onChange={(e) => setStakes((p) => ({ ...p, [sc.id]: e.target.value }))}
                className="flex-1 bg-[#030508] border border-neutral-800 rounded-lg px-3 py-1.5 font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-600"
                placeholder="100"
              />
              <button
                onClick={() => stake(sc.id)}
                disabled={madCredits < getStake(sc.id)}
                className="shrink-0 rounded-lg px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 hover:scale-[1.02] flex items-center gap-1"
                style={{ background: "#c98aff15", border: "1px solid #c98aff55", color: "#c98aff" }}>
                <ZapIcon className="w-3 h-3" /> [MOCK] Stake
              </button>
            </div>
          </div>
        );
      })}
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
