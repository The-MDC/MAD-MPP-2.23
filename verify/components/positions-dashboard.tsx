"use client";

/**
 * MΛĐ Gambit — Active Conviction Positions Dashboard
 * ------------------------------------------------------------------
 * Shows all open positions from game-context. Per-position card shows
 * δ-limit, shield status, φ-ratio recovery, GARCH σ², projected payout.
 * Resolves animate green (win) / red (loss) via CSS class swap.
 * Source: Gen 2 SustainableInsurancePanel userHoldings + Gen 1 ConvictionDashboard
 */

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";
import { shieldPhiRatio, garchUpdate, PHI, shieldReturnCountdown } from "@/lib/gambit-game-math";
import { Shield, ShieldOff, ShieldCheck, TrendingUp, TrendingDown, Clock, Zap, Timer } from "lucide-react";

// Rolling σ² for display (same seed as ScandalVelocityMeter)
function getCurrentSigma(): number {
  const epoch = Math.floor(Date.now() / 3000) % 200;
  let s = 0.02;
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 2147483648; return seed / 2147483648; };
  for (let i = 0; i < epoch; i++) { s = garchUpdate(0.008, 0.12, 0.82, s, (rand() - 0.5) * 0.3); }
  return s;
}

function elapsed(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export default function PositionsDashboard() {
  const { positions, resolvePosition, shieldTogglePosition, requestShieldUnstake, madCredits } = useGame();
  const [sigma2, setSigma2] = useState(getCurrentSigma);
  const [now, setNow] = useState(Date.now()); // ticks every 30s for return countdown
  const [resolving, setResolving] = useState<Record<string, "won" | "lost">>({});

  useEffect(() => {
    const t = setInterval(() => { setSigma2(getCurrentSigma()); setNow(Date.now()); }, 3000);
    return () => clearInterval(t);
  }, []);

  function resolve(id: string, won: boolean) {
    setResolving(r => ({ ...r, [id]: won ? "won" : "lost" }));
    setTimeout(() => {
      resolvePosition(id, won);
      setResolving(r => { const n = { ...r }; delete n[id]; return n; });
    }, 800);
  }

  const open = positions.filter(p => !p.resolved);
  const closed = positions.filter(p => p.resolved).slice(0, 5);
  const totalLiabilityCover = open.reduce((sum, p) => {
    const recovery = p.shieldActive ? shieldPhiRatio(p.stake, Math.sqrt(sigma2) * 10, false) : 0;
    return sum + p.stake + recovery;
  }, 0);

  return (
    <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-bold">Active Conviction Positions</p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700">{open.length} open · σ² {(sigma2 * 10000).toFixed(1)} × 10⁻⁴</p>
          </div>
        </div>
        {totalLiabilityCover > 0 && (
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600">Total Liability Cover</p>
            <p className="font-mono text-sm font-black text-emerald-400">{totalLiabilityCover.toFixed(0)} $MADx</p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2.5">
        {/* Empty state */}
        {open.length === 0 && closed.length === 0 && (
          <div className="text-center py-10">
            <p className="font-mono text-2xl mb-2">🎯</p>
            <p className="font-mono text-xs text-neutral-400 font-bold">No open positions.</p>
            <p className="font-mono text-[10px] text-neutral-600 mt-1">Start predicting the scandal on The Floor.</p>
          </div>
        )}

        {/* Open positions */}
        {open.map(pos => {
          const resolveState = resolving[pos.id];
          const phiRecovery = pos.shieldActive ? shieldPhiRatio(pos.stake, Math.sqrt(sigma2) * 10, false) : 0;
          const projectedWin = pos.stake * 1.88 - pos.stake;
          const projectedLoss = pos.shieldActive ? -(pos.stake - phiRecovery) : -pos.stake;

          return (
            <div key={pos.id}
              className={`rounded-xl border p-3.5 transition-all duration-500 ${
                resolveState === "won" ? "animate-resolve-win border-emerald-500/60 bg-emerald-500/5" :
                resolveState === "lost" ? "animate-resolve-loss border-rose-500/60 bg-rose-500/5" :
                "border-neutral-850 bg-[#030508]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{pos.emoji}</span>
                  <div>
                    <p className="font-mono text-[10px] font-bold text-neutral-200 leading-tight">{pos.scenarioTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[8px] text-neutral-600">{pos.deckVersion}</span>
                      <span className="font-mono text-[8px] text-neutral-700">·</span>
                      <Clock className="w-2.5 h-2.5 text-neutral-700" />
                      <span className="font-mono text-[8px] text-neutral-600">{elapsed(pos.openedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xs font-black text-neutral-200">{pos.stake} $MADx</p>
                  <p className="font-mono text-[8px] text-neutral-600">δ {pos.deltaLimit.toFixed(0)}</p>
                </div>
              </div>

              {/* Shield + payout display */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                <MiniStat
                  label="If WIN"
                  value={`+${projectedWin.toFixed(0)}`}
                  color="#7cffc7"
                  icon={<TrendingUp className="w-2.5 h-2.5" />}
                />
                <MiniStat
                  label="If LOSS"
                  value={projectedLoss.toFixed(0)}
                  color={pos.shieldActive ? "#fbbf24" : "#f43f5e"}
                  icon={<TrendingDown className="w-2.5 h-2.5" />}
                />
                {pos.shieldActive ? (
                  <MiniStat
                    label="φ-Protection"
                    value={`+${phiRecovery.toFixed(0)}`}
                    color="#ffd700"
                    icon={<Shield className="w-2.5 h-2.5" />}
                  />
                ) : (
                  <MiniStat label="Shield" value="OFF" color="#475569" icon={<Shield className="w-2.5 h-2.5" />} />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* ── Shield opt-in / opt-out control ── */}
                {pos.shield.status === 'none' && (
                  /* No shield — offer to opt in */
                  <button
                    onClick={() => shieldTogglePosition(pos.id)}
                    disabled={pos.resolved}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider transition-all bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-yellow-500/30 disabled:opacity-40"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    Add Shield
                  </button>
                )}
                {pos.shield.status === 'active' && (
                  /* Shield active — show tier + premium + opt-out */
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/40">
                      <ShieldCheck className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-yellow-400">
                        {pos.shield.tier === 'whale' ? '60%' : pos.shield.tier === 'shielded' ? `${Math.round((0.288 + pos.shield.premiumTier * 0.112) * 100)}%` : '28.8%'} SHIELD
                      </span>
                    </div>
                    <button
                      onClick={() => requestShieldUnstake(pos.id)}
                      disabled={pos.resolved}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider transition-all bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-rose-400 hover:border-rose-500/30 disabled:opacity-40"
                      title="Opt out — funds return in 2–24h"
                    >
                      <ShieldOff className="w-2.5 h-2.5" />
                      Opt Out
                    </button>
                  </div>
                )}
                {pos.shield.status === 'unstaking' && (
                  /* Unstaking — show return countdown */
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <Timer className="w-2.5 h-2.5 text-orange-400" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-orange-400">
                      {shieldReturnCountdown(pos.shield, now)}
                    </span>
                  </div>
                )}
                {pos.shield.status === 'returned' && (
                  /* Returned — neutral confirmation */
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <ShieldOff className="w-2.5 h-2.5 text-neutral-600" />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-600">Shield Returned</span>
                  </div>
                )}

                <div className="flex-1" />

                {/* Resolve buttons (for testing — in prod these fire via Oracle) */}
                <button onClick={() => resolve(pos.id, false)}
                  className="px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all">
                  RESOLVE LOSS
                </button>
                <button onClick={() => resolve(pos.id, true)}
                  className="px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                  RESOLVE WIN
                </button>
              </div>
            </div>
          );
        })}

        {/* Closed position history */}
        {closed.length > 0 && (
          <div className="pt-2 border-t border-neutral-900">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 mb-2">Recent Closes</p>
            <div className="space-y-1.5">
              {closed.map(pos => (
                <div key={pos.id} className="flex items-center gap-2 rounded-lg border border-neutral-900 bg-[#030508] px-3 py-1.5">
                  <span className="text-sm">{pos.emoji}</span>
                  <span className="font-mono text-[9px] text-neutral-400 flex-1 truncate">{pos.scenarioTitle}</span>
                  <span className={`font-mono text-[9px] font-bold ${pos.outcome === "won" ? "text-emerald-400" : "text-rose-400"}`}>
                    {pos.outcome === "won" ? "+" : ""}{pos.payout?.toFixed(0)} $MADx
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-850 bg-[#05070c] px-2 py-1.5 text-center">
      <div className="flex items-center justify-center gap-0.5 mb-0.5" style={{ color }}>
        {icon}
        <span className="font-mono text-[7px] uppercase tracking-wider text-neutral-600">{label}</span>
      </div>
      <p className="font-mono text-xs font-black" style={{ color }}>{value}</p>
    </div>
  );
}
