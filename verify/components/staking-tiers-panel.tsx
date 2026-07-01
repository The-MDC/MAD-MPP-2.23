"use client";

/**
 * AGENT-GAMMA — Staking Tiers Panel
 * Displays all 6 canonical staking tiers, highlights user's current tier,
 * shows progress to next tier. Source: Card Game Logic Code Reference §6.
 */

import React from "react";
import { useGame } from "@/context/game-context";
import { STAKING_TIERS, getStakingTier } from "@/lib/gambit-game-math";
import { Zap, Lock } from "lucide-react";

export default function StakingTiersPanel() {
  const { madCredits } = useGame();
  const currentTier = getStakingTier(madCredits);
  const currentTierIdx = STAKING_TIERS.findIndex(t => t.name === currentTier?.name);
  const nextTier = STAKING_TIERS[currentTierIdx + 1] ?? null;
  const progressPct = nextTier
    ? Math.min(100, ((madCredits - (currentTier?.minMadx ?? 0)) /
        (nextTier.minMadx - (currentTier?.minMadx ?? 0))) * 100)
    : 100;

  const TIER_COLORS = [
    "#cd7f32", "#c0c0c0", "#ffd700", "#b9f2ff", "#b9f2ff", "#ec4899",
  ];

  return (
    <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="inline-flex font-mono text-[9px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md">
            STAKING TIERS
          </span>
          <p className="font-mono text-[8px] text-neutral-600 mt-1">
            Source: Card Game Logic Code Reference §6
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] text-neutral-600">Your Balance</p>
          <p className="font-mono text-sm font-black text-neutral-200">{madCredits.toLocaleString()} $MADx</p>
        </div>
      </div>

      {/* Current tier highlight */}
      {currentTier && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-mono text-[10px] font-black text-yellow-400 uppercase tracking-wider">
                {currentTier.name} Tier
              </span>
            </div>
            <span className="font-mono text-[10px] font-black text-yellow-300">
              {(currentTier.apy * 100).toFixed(0)}% APY
            </span>
          </div>
          {nextTier && (
            <div className="mt-2">
              <div className="flex justify-between font-mono text-[7px] text-neutral-600 mb-1">
                <span>{madCredits.toLocaleString()} MADx</span>
                <span>{nextTier.minMadx.toLocaleString()} MADx → {nextTier.name}</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
          {!nextTier && (
            <p className="font-mono text-[8px] text-yellow-600 mt-1">◈ Maximum tier achieved</p>
          )}
        </div>
      )}

      {/* Tier ladder */}
      <div className="space-y-2">
        {STAKING_TIERS.map((tier, i) => {
          const isActive = tier.name === currentTier?.name;
          const isUnlocked = madCredits >= tier.minMadx;
          const color = TIER_COLORS[i];
          return (
            <div
              key={tier.name}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                isActive
                  ? "border border-yellow-500/30 bg-yellow-500/5"
                  : isUnlocked
                  ? "border border-neutral-800 bg-neutral-900/40"
                  : "border border-neutral-900 opacity-50"
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: isActive ? `0 0 8px ${color}` : undefined }} />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] font-bold" style={{ color: isActive ? color : "#94a3b8" }}>
                    {tier.name}
                  </span>
                  <span className="font-mono text-[7px] text-neutral-700 ml-2">
                    {tier.minMadx.toLocaleString()} MADx min
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-black" style={{ color: isActive ? color : "#64748b" }}>
                    {(tier.apy * 100).toFixed(0)}%
                  </span>
                  {!isUnlocked && <Lock className="w-2.5 h-2.5 text-neutral-700" />}
                  {isActive && <Zap className="w-2.5 h-2.5 text-yellow-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
