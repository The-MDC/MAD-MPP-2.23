"use client";

/**
 * MAD Gambit — DOPAMINE ENGINE
 * ------------------------------------------------------------------
 * The "Affliction" layer made visible. Implements the neuroscience
 * mechanics the dossier specced but the simulator never shipped:
 *   - Variable Reward Schedule on Fibonacci nodes [5,8,13,21,34]
 *   - Streak multiplier ladder (1.3x→3.2x) with perks
 *   - Chaos meter (ambient dopamine gauge)
 *   - Near-miss animation + loss-aversion (2.5x) framing
 * All math from lib/gambit-game-math (VRS_TRIGGERS, streakReward,
 * LOSS_AVERSION, isVrsTrigger). Pure client; no external calls.
 */

import React, { useState } from "react";
import { useGame } from "@/context/game-context";
import { VRS_TRIGGERS, LOSS_AVERSION, streakReward } from "@/lib/gambit-game-math";
import { Flame, Zap, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export default function DopamineEngine() {
  const { streak, recordPick, vrsFlash, chaosMeter, madCredits, adjustCredits, cards } = useGame();
  const [lastResult, setLastResult] = useState<{ won: boolean; vrs: boolean; perk: string; mult: number } | null>(null);
  const [nearMiss, setNearMiss] = useState(false);

  const reward = streakReward(streak);
  const nextNode = VRS_TRIGGERS.find((n) => n > streak) ?? null;

  function pick(direction: "yes" | "no") {
    // PLACEHOLDER outcome: simulated coin-lean. Prod resolves via
    // Triple-Threat Oracle (Chainlink + News APIs + community).
    const roll = Math.random();
    const won = roll < 0.52; // house-fair-ish
    const isNear = !won && roll < 0.58; // near-miss band
    setNearMiss(isNear);
    if (isNear) setTimeout(() => setNearMiss(false), 900);

    const { vrs, reward: r } = recordPick(won);
    const stake = 100;
    if (won) {
      const payout = Math.round(stake * r.multiplier * (vrs ? 1.5 : 1));
      adjustCredits(payout);
      setLastResult({ won: true, vrs, perk: r.perk, mult: r.multiplier });
    } else {
      adjustCredits(-stake);
      setLastResult({ won: false, vrs: false, perk: "", mult: 0 });
    }
  }

  return (
    <div className="relative rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6 overflow-hidden">
      {/* VRS jackpot flash — uses the real vrsBurst + goldJackpot keyframes from
          globals.css (the shared celebration system), not an ad-hoc animation. */}
      {vrsFlash && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-vrs-burst">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/25 via-pink-500/18 to-cyan-400/25" />
          <div className="relative text-center animate-gold-jackpot">
            <Sparkles className="w-10 h-10 mx-auto text-yellow-400" />
            <p className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 mt-2">VRS JACKPOT</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-300">Fibonacci node {streak} hit · 1.5x burst</p>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-orange-400" />
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">Dopamine Engine</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Variable Reward · Affliction Layer</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">MΛĐ Credits</p>
          <p className="font-mono text-lg font-black text-yellow-400">{madCredits.toLocaleString()}</p>
        </div>
      </header>

      {/* streak ladder */}
      <div className="mb-5">
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-2">
          <span>Win Streak</span>
          <span className={streak >= 3 ? "animate-streak-fire font-black" : "text-cyan-400"}>{streak} · {reward.multiplier}x{reward.perk ? ` · ${reward.perk}` : ""}</span>
        </div>
        <div className="flex gap-1.5">
          {VRS_TRIGGERS.map((node) => {
            const hit = streak >= node;
            return (
              <div key={node} className="flex-1 relative">
                <div className={`h-2 rounded-full transition-all duration-500 ${hit ? "bg-gradient-to-r from-yellow-400 to-pink-500" : "bg-neutral-900"}`} />
                <span className={`block text-center font-mono text-[8px] mt-1 ${hit ? "text-yellow-400" : "text-neutral-700"}`}>{node}</span>
              </div>
            );
          })}
        </div>
        {nextNode && <p className="font-mono text-[9px] text-neutral-600 mt-1.5">Next VRS node in {nextNode - streak} win{nextNode - streak > 1 ? "s" : ""} →</p>}
      </div>

      {/* chaos meter */}
      <div className="mb-5">
        <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-1.5">
          <span>Chaos Meter</span><span className="text-pink-400">{Math.round(chaosMeter)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-900 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 transition-all duration-700" style={{ width: `${chaosMeter}%` }} />
        </div>
      </div>

      {/* near-miss flash — uses the real nearMissShake keyframe, previously defined
          in globals.css but never called anywhere in the app until now. */}
      {nearMiss && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-center animate-near-miss">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">⚡ SO CLOSE — missed by a hair</p>
        </div>
      )}

      {/* last result — wins/losses get the same resolve animations used everywhere
          else a position resolves (positions-dashboard.tsx), for a consistent feel
          across every place in the app where money changes hands. */}
      {lastResult && !nearMiss && (
        <div className={`mb-3 rounded-lg border px-3 py-2 ${lastResult.won ? "border-emerald-500/40 bg-emerald-500/5 animate-resolve-win" : "border-rose-500/40 bg-rose-500/5 animate-resolve-loss"}`}>
          <div className="flex items-center gap-2">
            {lastResult.won ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
            <p className={`font-mono text-[11px] font-bold ${lastResult.won ? "text-emerald-400" : "text-rose-400"}`}>
              {lastResult.won ? `WON · ${lastResult.mult}x${lastResult.vrs ? " · VRS 1.5x burst" : ""}` : `LOST · loss weighted ${LOSS_AVERSION}x in recovery path`}
            </p>
          </div>
        </div>
      )}

      {/* pick mechanic */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => pick("yes")} className="rounded-xl py-3 font-mono text-sm font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" /> YES
        </button>
        <button onClick={() => pick("no")} className="rounded-xl py-3 font-mono text-sm font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" /> NO
        </button>
      </div>
      <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 text-center mt-2">Stake 100 MΛĐ · outcomes simulated (Triple-Threat Oracle in prod)</p>
    </div>
  );
}
