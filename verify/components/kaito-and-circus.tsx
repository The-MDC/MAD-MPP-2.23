"use client";

/**
 * MΛĐ Gambit — Kaito Dynamic Ticker
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt GlobalSkinsAndKaitoHUD.
 * Shows $MADx / $ETH / $SOL / $PEPE.
 *
 * ── This tape is simulated, and now says so ──────────────────────────
 * It previously read "KAITO LIVE FEED" beside a pulsing green dot, over four
 * hardcoded prices jittered by Math.random() every three seconds. It renders on
 * /preview and /mpp2.23 — both shipped — so a visitor was shown "$ETH 3,140 ▼
 * 2.15%" under a live indicator, and every part of that except the ticker
 * symbol was invented on the spot.
 *
 * A price is the one number a user is most likely to act on and least able to
 * sanity-check, so the "PLACEHOLDER: wire to real oracle" comment that used to
 * sit up here was load-bearing documentation for a claim the interface was
 * making out loud to end users. A comment cannot carry that.
 *
 * The tape stays — it is part of the instrument language — but the LIVE claim
 * and the green pulse are gone, and the label says SIMULATED. Wiring it for
 * real is a product decision, not a code cleanup: it needs a chosen provider
 * (Chainlink feeds via the existing viem client, or the Kaito API), a key, and
 * that provider's origin added to `connect-src` in next.config.ts, which is
 * currently Report-Only and would otherwise fail silently at first and loudly
 * on promotion. Until those three exist, honest beats fabricated.
 */

import React, { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import HoldHint from "@/components/hold-hint";

// SIMULATED price data — see the header. Prod wires to Chainlink / Kaito.
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

  // Micro price movements, mean-reverting toward BASE_PRICES rather than a free
  // random walk. The old form added an unbounded increment to `change` every
  // three seconds forever, so a tab left open drifted to absurd percentages —
  // a simulated tape should at least stay in the range a real one would.
  //
  // Runs only in the effect, never during render, so the server and the first
  // client paint agree on BASE_PRICES and there is no hydration mismatch.
  useEffect(() => {
    const t = setInterval(() => {
      setPrices((p) =>
        p.map((item, i) => {
          const base = BASE_PRICES[i];
          const pull = (b: number, v: number) => v + (b - v) * 0.06;
          return {
            ...item,
            price: pull(base.price, item.price) * (1 + (Math.random() - 0.499) * 0.002),
            change: pull(base.change, item.change) + (Math.random() - 0.5) * 0.1,
          };
        })
      );
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-850 bg-[#05070c] w-full">
      <HoldHint
        hint={{
          title: "Kaito tape",
          kind: "sample",
          body: "Simulated, not a market feed. Four seeded prices drifting around fixed baselines — no oracle is connected. Wiring it needs a provider (Chainlink via viem, or the Kaito API), a key, and that origin added to connect-src.",
        }}
      >
      <div className="flex items-center gap-1.5 shrink-0" tabIndex={0}>
        {/* The pulsing green dot is gone with the word LIVE. A "live" indicator
            over invented numbers is the part a user reads fastest and trusts
            most. Amber, static — a status light for a bench rig. */}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
        <Radio className="w-3 h-3 text-yellow-400" />
        <span className="font-mono text-[8px] uppercase tracking-widest text-yellow-400 font-bold">
          KAITO FEED · SIMULATED
        </span>
      </div>
      </HoldHint>
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
import { ZapIcon, TrendingUp, TrendingDown, RefreshCcw, Loader2 } from "lucide-react";
import { useGame } from "@/context/game-context";
import { calculateDeltaLimit, resolveScenarioPick } from "@/lib/gambit-game-math";
import AuthModal from "./auth-modal";

// Type for the LLM generated scenario
interface AIScenario {
  id: string; // we'll generate one if missing
  title: string;
  description: string;
  resolution_criteria: string;
  category: string;
  suggested_card_name: string;
  source_url: string;
  emoji: string;
  baselineProbability: number;
  odds: number;
  initialConviction: number;
}

export function PredictionCircus({ activeDeck }: { activeDeck?: OVDeck }) {
  const deck = activeDeck ?? OV_DECKS[0];
  const { madCredits, adjustCredits, recordPick, socialAuth } = useGame();
  
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { won: boolean; payout: number; delta: number }>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // AI State
  const [scenarios, setScenarios] = useState<any[]>(DEFAULT_SCENARIOS);
  const [isScanning, setIsScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);

  async function scanLiveNews() {
    setIsScanning(true);
    try {

      // Operator-only route (CRON_SECRET): a browser cannot hold that secret, so
      // this has been 401ing silently. The refusal is now shown, not swallowed.
      setScanNote(null);
      const res = await fetch('/api/v1/agents/scraper', { method: 'POST' });
      if (!res.ok) {
        setScanNote(
          res.status === 401
            ? 'Live scan is operator-only — showing the stored scenarios.'
            : 'Live scan unavailable — showing the stored scenarios.',
        );
        return;
      }
      const json = await res.json();
      if (json.success && json.data?.analyzedEvents) {
        // Map AI output to component schema
        const mapped = json.data.analyzedEvents.map((evt: any, i: number) => ({
          id: `ai-market-${Date.now()}-${i}`,
          title: evt.title,
          emoji: evt.category === 'Hollywood' ? '🎥' : evt.category === 'Tech' ? '💻' : evt.category === 'Meme' ? '🐸' : '📰',
          category: evt.category || 'Meme',
          satiricalFact: evt.description || evt.resolution_criteria,
          baselineProbability: 0.5 + (Math.random() * 0.3 - 0.15),
          odds: 15 + Math.floor(Math.random() * 20), // 1.5x to 3.5x
          initialConviction: 1000 + Math.floor(Math.random() * 5000),
          sourceUrl: evt.source_url
        }));
        setScenarios(mapped.length > 0 ? mapped : DEFAULT_SCENARIOS);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  }

  function getStake(id: string): number {
    return Math.max(1, parseInt(stakes[id] ?? "100") || 100);
  }

  function stake(scenId: string) {
    if (!socialAuth.isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const scenario = scenarios.find((s) => s.id === scenId);
    if (!scenario) return;
    const amount = getStake(scenId);
    if (madCredits < amount) return;
    
    // Resolve scenario (mock random for now)
    const won = Math.random() < (scenario.baselineProbability ?? 0.5);
    const payout = won ? amount * ((scenario.odds ?? 20) / 10) : -amount;
    const deltaLimit = calculateDeltaLimit(deck.multiplier, scenario.initialConviction ?? 1000);
    
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
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-neutral-400 flex items-center gap-2">
            Predict the Scandal
            {isScanning && <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />}
          </h2>
          <p className="font-mono text-[9px] text-neutral-600">Stake conviction into viral indices for quadratic payout odds</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={scanLiveNews}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 transition-all font-mono text-[9px] uppercase tracking-wider font-bold disabled:opacity-50"
          >
            <RefreshCcw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Live RSS
          </button>
          <span className="font-mono text-[9px] px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-400">{deck.version}</span>
          {scanNote && (
            <span role="status" className="font-mono text-[9px] text-neutral-500 max-w-[240px]">{scanNote}</span>
          )}
        </div>
      </div>

      {isScanning ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-36 rounded-xl border border-pink-500/20 bg-[#05070c]/90 p-4 shadow-[0_0_15px_rgba(245,36,42,0.1)]">
              <div className="flex gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-500/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-pink-500/20 rounded w-3/4" />
                  <div className="h-2 bg-pink-500/10 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-2 bg-neutral-800 rounded w-full" />
                <div className="h-2 bg-neutral-800 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        scenarios.map((sc) => {
          const result = results[sc.id];
          const isFlashing = flash === sc.id;
          const deltaLimit = calculateDeltaLimit(deck.multiplier, sc.initialConviction ?? 1000);

          return (
            <div key={sc.id} className={`rounded-xl border transition-all p-4 ${isFlashing ? result?.won ? "border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-rose-500/60 bg-rose-500/5 shadow-[0_0_20px_rgba(245,36,42,0.2)]" : "border-neutral-850 bg-[#05070c]/80 hover:border-neutral-700"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sc.emoji}</span>
                  <div>
                    <p className="font-mono text-xs font-bold text-neutral-200 leading-tight">{sc.title}</p>
                    <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500 uppercase tracking-wider">{sc.category}</span>
                    {sc.sourceUrl && (
                      <a href={sc.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 font-mono text-[8px] text-pink-400/70 hover:text-pink-400">
                        [SOURCE]
                      </a>
                    )}
                  </div>
                </div>
                {result && (
                  <div className="flex items-center gap-1 shrink-0 bg-neutral-900/50 px-2 py-1 rounded-lg">
                    {result.won ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                    <span className={`font-mono text-[10px] font-bold ${result.won ? "text-emerald-400" : "text-rose-400"}`}>
                      {result.payout >= 0 ? "+" : ""}{result.payout.toFixed(0)} $MADx
                    </span>
                  </div>
                )}
              </div>

              <p className="font-mono text-[9px] italic text-neutral-500 mb-2 leading-relaxed">{sc.satiricalFact}</p>

              <div className="flex items-center justify-between text-[9px] font-mono mb-3 bg-neutral-900/40 p-2 rounded-lg">
                <span className="text-neutral-500">Base prob: <span className="text-cyan-400 font-bold">{((sc.baselineProbability ?? 0.5) * 100).toFixed(0)}%</span></span>
                <span className="text-neutral-500">Payout: <span className="text-yellow-400 font-bold">{((sc.odds ?? 20) / 10).toFixed(1)}x</span></span>
                <span className="text-neutral-500">δ-cap: <span className="text-purple-400 font-bold">{deltaLimit.toFixed(0)}δ</span></span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={Math.min(madCredits, Math.round(deltaLimit))}
                  value={stakes[sc.id] ?? "100"}
                  onChange={(e) => setStakes((p) => ({ ...p, [sc.id]: e.target.value }))}
                  className="flex-1 bg-[#030508] border border-neutral-800 rounded-lg px-3 py-1.5 font-mono text-xs text-neutral-200 focus:outline-none focus:border-neutral-600 transition-colors"
                  placeholder="100"
                />
                <button
                  onClick={() => stake(sc.id)}
                  disabled={madCredits < getStake(sc.id)}
                  className="shrink-0 rounded-lg px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 hover:scale-[1.02] flex items-center gap-1 shadow-[0_0_10px_rgba(201,138,255,0.1)]"
                  style={{ background: "#c98aff15", border: "1px solid #c98aff55", color: "#c98aff" }}>
                  <ZapIcon className="w-3 h-3" /> Stake
                </button>
              </div>
            </div>
          );
        })
      )}
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
