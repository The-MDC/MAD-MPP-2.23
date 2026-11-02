"use client";

/**
 * MΛĐ Gambit — Kaito Feed
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt GlobalSkinsAndKaitoHUD, and no longer a price tape.
 *
 * ── From a simulated tape to a stats feed ────────────────────────────
 * This strip used to read "KAITO FEED · SIMULATED" over four invented prices
 * ($MADx, $ETH, $SOL, $PEPE) drifting around fixed baselines — no oracle was
 * ever connected. The label was honest by then, but a price is the number a
 * user is likeliest to act on and least able to sanity-check, so the tape is
 * gone rather than merely labelled. No crypto ticker of any kind remains here;
 * the page's dual ticker above carries the market wire.
 *
 * In its place one cell flips, bottom-up, every 3.5 seconds through:
 *   · the active O-V deck's multiplier, minimum threshold, shield APY, δ-limit
 *     and shield reserve pool (these used to sit under the deck selector), then
 *   · the platform's mood and counters — crowd mood, chaos meter, open markets,
 *     pending wagers, your streak, your open bets, deck size, fee.
 * The counters that need the database appear only when it answered; nothing is
 * shown as a zero it does not know.
 */

import React, { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import HoldHint from "@/components/hold-hint";
import usePlatformMetrics, { isLiveMetrics } from "@/hooks/use-platform-metrics";

/** How long each stat holds before the next flips up. */
const FLIP_MS = 3500;

interface FeedStat {
  label: string;
  value: string;
  /** Tailwind-free colour so it works on every skin. */
  color: string;
}

function crowdMood(chaos: number): string {
  if (chaos >= 80) return "FRENZIED";
  if (chaos >= 60) return "HEATED";
  if (chaos >= 35) return "SIMMERING";
  return "CALM";
}

export function KaitoPriceTicker({ deck, stake = 500 }: { deck?: OVDeck; stake?: number }) {
  const active = deck ?? OV_DECKS[0];
  const { chaosMeter, streak, positions } = useGame();
  const metrics = usePlatformMetrics();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const live = isLiveMetrics(metrics);
  const stats: FeedStat[] = [
    { label: "MULTIPLIER", value: `${active.multiplier}x`, color: "#7cffc7" },
    { label: "MIN THRESHOLD", value: String(active.minThreshold), color: "#58a6ff" },
    { label: "SHIELD APY", value: `${active.yieldApy}%`, color: "#fbbf24" },
    { label: "δ-LIMIT", value: `${calculateDeltaLimit(active.multiplier, stake).toFixed(0)}δ`, color: "#c98aff" },
    { label: "SHIELD RESERVE", value: `$${(active.reservePool / 1_000_000).toFixed(1)}M`, color: "#34d399" },
    { label: "CROWD MOOD", value: crowdMood(chaosMeter), color: "#ff6b9d" },
    { label: "CHAOS METER", value: `${Math.round(chaosMeter)} / 100`, color: "#f5242a" },
    ...(live
      ? [
          { label: "OPEN MARKETS", value: String(metrics.activeMarkets), color: "#ffcf40" },
          { label: "PENDING WAGERS", value: String(metrics.openBets), color: "#00e5ff" },
          { label: "SCANDAL SENTIMENT", value: `${Math.round(metrics.chaos)} / 100 · ${crowdMood(metrics.chaos)}`, color: "#ff8a5c" },
        ]
      : []),
    { label: "YOUR STREAK", value: `${streak} DAY${streak === 1 ? "" : "S"}`, color: "#ffcf40" },
    { label: "YOUR OPEN BETS", value: String(positions.filter((p) => !p.resolved).length), color: "#00e5ff" },
    { label: "DECK SIZE", value: "992 CARDS", color: "#00ff88" },
    { label: "PLATFORM FEE", value: "1.88%", color: "#d69d41" },
  ];

  // One cadence for the whole feed. Runs only in the effect, never during
  // render, so the server and the first client paint agree (stat 0, no flip).
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => n + 1), FLIP_MS);
    return () => clearInterval(t);
  }, [paused]);

  const at = i % stats.length;
  const cur = stats[at];

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-850 bg-[#05070c] w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <HoldHint
        hint={{
          title: "Kaito feed",
          kind: "measured",
          body: "One stat at a time, flipping every 3.5 seconds: the active O-V deck's multiplier, minimum threshold, shield APY, δ-limit and reserve pool, then crowd mood, chaos, open markets, pending wagers, your streak and bets, deck size and fee. There are no prices here — the old simulated crypto tape was removed. Counters that need the database only appear when it answered. Hover or focus pauses it.",
        }}
      >
      <div className="flex items-center gap-1.5 shrink-0" tabIndex={0}>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
        <Radio className="w-3 h-3 text-yellow-400" />
        <span className="font-mono text-[8px] uppercase tracking-widest text-yellow-400 font-bold">
          KAITO FEED
        </span>
      </div>
      </HoldHint>

      {/* The flipping cell. Keyed on the stat so each change replays the flip;
          overflow is clipped so the rising value never spills into the label. */}
      <div
        className="flex-1 min-w-0 flex items-center justify-end gap-2 overflow-hidden"
        style={{ minHeight: 26 }}
        aria-live="off"
      >
        <div key={`${at}-${cur.label}`} className="mg-kf-flip flex items-baseline gap-1.5 min-w-0 justify-end">
          <span className="font-mono text-[8px] text-neutral-500 font-bold tracking-wider whitespace-nowrap">{cur.label}</span>
          <span className="font-mono text-[13px] font-black whitespace-nowrap" style={{ color: cur.color, textShadow: `0 0 10px ${cur.color}55` }}>
            {cur.value}
          </span>
        </div>
        <span className="font-mono text-[7px] text-neutral-600 shrink-0 tabular-nums" aria-hidden="true">
          {String(at + 1).padStart(2, "0")}/{String(stats.length).padStart(2, "0")}
        </span>
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
