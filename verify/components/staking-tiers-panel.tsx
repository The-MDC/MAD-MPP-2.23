"use client";

/**
 * AGENT-GAMMA — Staking Tiers Panel
 * Displays all 6 canonical staking tiers, highlights user's current tier,
 * shows progress to next tier. Source: Card Game Logic Code Reference §6.
 */

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";
import { STAKING_TIERS, getStakingTier } from "@/lib/gambit-game-math";
import { Zap, Lock, ShieldCheck, X } from "lucide-react";

export default function StakingTiersPanel() {
  const { madCredits } = useGame();
  const currentTier = getStakingTier(madCredits);
  const currentTierIdx = STAKING_TIERS.findIndex(t => t.name === currentTier?.name);
  const nextTier = STAKING_TIERS[currentTierIdx + 1] ?? null;
  const progressPct = nextTier
    ? Math.min(100, ((madCredits - (currentTier?.minMadx ?? 0)) /
        (nextTier.minMadx - (currentTier?.minMadx ?? 0))) * 100)
    : 100;

  // Server-computed projected yield (mirrors on-chain MADStaking APY math).
  const [projection, setProjection] = useState<{ daily: number; monthly: number; annual: number } | null>(null);
  // The Shield cap per tier is a control, not a footnote: tap it to see the
  // stop-loss scale this tier unlocks.
  const [shieldTier, setShieldTier] = useState<(typeof STAKING_TIERS)[number] | null>(null);
  const [lossDemo, setLossDemo] = useState(100);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/staking?staked=${encodeURIComponent(madCredits)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.success && d.projectedYield) setProjection(d.projectedYield);
      })
      .catch(() => {
        if (!cancelled) setProjection(null);
      });
    return () => {
      cancelled = true;
    };
  }, [madCredits]);

  const TIER_COLORS = [
    "#cd7f32", "#c0c0c0", "#d69d41", "#b9f2ff", "#b9f2ff", "#fc3437",
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

      {/* Projected rewards — server-computed via /api/v1/staking */}
      {projection && currentTier && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 mb-4">
          <p className="font-mono text-[8px] text-cyan-500/80 uppercase tracking-wider mb-1.5">
            Projected Rewards · {currentTier.name} @ {(currentTier.apy * 100).toFixed(0)}% APY
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {([["Daily", projection.daily], ["Monthly", projection.monthly], ["Annual", projection.annual]] as const).map(
              ([label, val]) => (
                <div key={label}>
                  <p className="font-mono text-[11px] font-black text-cyan-300">
                    {val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="font-mono text-[7px] text-neutral-600 uppercase tracking-wide">{label} $MADx</p>
                </div>
              ),
            )}
          </div>
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
                  <button
                    type="button"
                    data-explain="shield"
                    onClick={() => setShieldTier(tier)}
                    aria-label={`${tier.name} MAD Shield stop loss — up to ${(tier.shieldRecoveryPct * 100).toFixed(1)}% recovery`}
                    className="font-mono text-[9px] font-black rounded-full px-2.5"
                    style={{ minHeight: 30, display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#1a1205", background: "var(--mg-gold-fill, #d69d41)", border: "none" }}
                  >
                    <ShieldCheck className="w-3 h-3" /> {(tier.shieldRecoveryPct * 100).toFixed(1)}%
                  </button>
                  {!isUnlocked && <Lock className="w-2.5 h-2.5 text-neutral-700" />}
                  {isActive && <Zap className="w-2.5 h-2.5 text-yellow-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {shieldTier ? (
        <div role="dialog" aria-modal="true" aria-label="MAD Shield stop loss" data-explain="shield" onClick={() => setShieldTier(null)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.72)", display: "grid", placeItems: "end center", padding: 12 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, borderRadius: 22, padding: 2, background: "var(--mg-gold-chisel)" }}>
            <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, #17130b, #0a0907)", color: "#f6f1e3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: "#f95639" }}>MAD Shield · stop loss</span>
                <button type="button" aria-label="Close" onClick={() => setShieldTier(null)} style={{ background: "none", border: "none", color: "#c9bfa9", cursor: "pointer", minWidth: 44, minHeight: 44, display: "grid", placeItems: "center" }}><X className="w-4 h-4" /></button>
              </div>
              <div className="mg-display" style={{ fontSize: 30, marginTop: 2 }}>{shieldTier.name} tier</div>
              <div style={{ fontSize: 12.5, color: "#cfc6b2", marginTop: 4, lineHeight: 1.5 }}>Opt-in loss mitigation. A 2–4% premium moves recovery up the 28.8% → 40% scale; this tier caps it at <b style={{ color: "#d69d41" }}>{(shieldTier.shieldRecoveryPct * 100).toFixed(1)}%</b>.</div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {STAKING_TIERS.map((t) => (
                  <div key={t.name} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 12, border: `1px solid ${t.name === shieldTier.name ? "#d69d41" : "rgba(214,157,65,.15)"}`, background: t.name === shieldTier.name ? "rgba(214,157,65,.1)" : "transparent" }}>
                    <div style={{ fontSize: 9, color: "#a99f8a", fontWeight: 800 }}>{t.name}</div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 800, color: "#d69d41" }}>{(t.shieldRecoveryPct * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
              <label style={{ display: "block", marginTop: 14, fontSize: 10, fontWeight: 900, letterSpacing: 1.2, color: "#a99f8a" }}>IF A POSITION LOSES · {lossDemo} $MADx</label>
              <input type="range" min={10} max={1000} step={10} value={lossDemo} onChange={(e) => setLossDemo(Number(e.target.value))} style={{ width: "100%", accentColor: "#d69d41" }} aria-label="Loss amount" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
                <span style={{ fontSize: 12, color: "#cfc6b2" }}>Shield returns up to</span>
                <span className="font-mono" style={{ fontSize: 26, fontWeight: 800, color: "#d69d41" }}>{(lossDemo * shieldTier.shieldRecoveryPct).toFixed(2)}</span>
              </div>
              <a href="/dashboard" style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 999, background: "var(--mg-gold-fill, #d69d41)", color: "#1a1205", fontWeight: 900, textDecoration: "none" }}>Get a live Shield quote ›</a>
              <div style={{ marginTop: 10, fontSize: 10.5, color: "#8e8a80", textAlign: "center" }}>40% is the ceiling. Loss mitigation, not a guarantee.</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
