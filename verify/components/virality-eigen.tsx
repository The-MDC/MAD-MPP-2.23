"use client";

/**
 * MΛĐ Gambit — Virality Meter + EigenTrust Score Display
 * ------------------------------------------------------------------
 * ViralityBadge: shows live virality index per scenario card.
 *   Color: cyan→pink→gold as score rises. Urgency = dopamine.
 * EigenTrustWidget: shows trust breakdown for user's linked accounts.
 * Both consume lib/gambit-game-math §22+§23.
 */

import React, { useEffect, useState } from "react";
import { viralityIndex, calculateEigenTrustScore, DEFAULT_SCENARIOS } from "@/lib/gambit-game-math";
import { useGame } from "@/context/game-context";
import { TrendingUp, Shield } from "lucide-react";

/* ── Virality Badge (per-scenario) ──────────────────────────────── */

interface ViralityBadgeProps {
  scenarioId: string;
  convictionAvg?: number;
  cardMultiplier?: number;
}

export function ViralityBadge({ scenarioId, convictionAvg = 0.5, cardMultiplier = 2.4 }: ViralityBadgeProps) {
  const scen = DEFAULT_SCENARIOS.find(s => s.id === scenarioId);
  const [ageHours, setAgeHours] = useState(Math.random() * 8); // simulated age

  useEffect(() => {
    const t = setInterval(() => setAgeHours(h => h + (1 / 120)), 30000); // +0.5m every 30s
    return () => clearInterval(t);
  }, []);

  if (!scen) return null;

  const idx = viralityIndex({
    baseScore: scen.baselineProbability,
    convictionAvg,
    cardMultiplier,
    eta: 0.3,
    rho: 0.2,
  }, ageHours);

  const color = idx >= 80 ? "#d69d41" : idx >= 60 ? "#f5242a" : idx >= 40 ? "#7cffc7" : "#00f0ff";
  const label = idx >= 80 ? "🔥 VIRAL" : idx >= 60 ? "📈 HOT" : idx >= 40 ? "⚡ ACTIVE" : "○ QUIET";

  return (
    <div className="flex items-center gap-1.5 transition-all duration-500">
      <TrendingUp className="w-2.5 h-2.5" style={{ color }} />
      <span className="font-mono text-[8px] font-black uppercase tracking-wider" style={{ color }}>{label}</span>
      <span className="font-mono text-[7px] text-neutral-600">{idx.toFixed(0)}</span>
      <span className="font-mono text-[7px] text-neutral-700">-{(ageHours * 3).toFixed(1)}%/hr</span>
    </div>
  );
}

/* ── EigenTrust Score Widget ─────────────────────────────────────── */

export function EigenTrustWidget() {
  const { socialAccounts, socialAmplification, setEigenTrustScore } = useGame();

  const engagements = [
    // Base wallet contribution (always present, low trust)
    { impact: 15, trustScore: 0.1, label: "Wallet Age" },
    // Social accounts
    ...socialAccounts.map(a => ({
      impact: 40,
      trustScore: a.trustScore,
      label: `${a.platform} @${a.handle}`,
    })),
  ];

  const eigenScore = calculateEigenTrustScore(
    engagements.map(e => ({ impact: e.impact, trustScore: e.trustScore }))
  );

  // Push live score to context so whale gate receives real trustScore
  // This is the critical Stage 11 wire: eigenScore → WhaleEligibilityInput.trustScore
  useEffect(() => {
    setEigenTrustScore(eigenScore);
  }, [eigenScore, setEigenTrustScore]);

  return (
    <div className="rounded-xl border border-neutral-850 bg-[#05070c]/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold">EigenTrust Score</p>
        </div>
        <span className="font-mono text-lg font-black text-cyan-400">{eigenScore.toFixed(1)}</span>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-1.5">
        {engagements.map((e, i) => (
          <div key={i}>
            <div className="flex justify-between font-mono text-[8px] text-neutral-600 mb-0.5">
              <span className="truncate">{e.label}</span>
              <span className="text-cyan-400 shrink-0 ml-2">R={e.trustScore} · d={Math.log1p(e.trustScore) * e.impact | 0}</span>
            </div>
            <div className="h-1 rounded-full bg-neutral-900 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${e.trustScore * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[7px] text-neutral-700 mt-2.5">
        d_i = Σ Impact·log(1+R_j). Bots: R_j=0. Your score: {eigenScore.toFixed(2)}/100.
      </p>
    </div>
  );
}
