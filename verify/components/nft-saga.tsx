"use client";

/**
 * MAD Gambit — NFT SAGA
 * ------------------------------------------------------------------
 * Card collection + evolution + saga episodes. Renders the real card
 * faces (nft-card.tsx) with live MPP-2.23 stats, the evolution ladder
 * with burn ratios, and "Saga Mode" — chained prediction episodes that
 * resolve for a combined multiplier (TODO in original repo, built here).
 */

import React, { useState } from "react";
import { useGame } from "@/context/game-context";
import NftCardView from "@/components/nft-card";
import { RARITY_TABLE, RARITY_ORDER, EVOLUTION_LADDER, nextEvolution } from "@/lib/gambit-game-math";
import { Layers, ChevronRight, Flame, Lock, CheckCircle2, Sparkles } from "lucide-react";

// PLACEHOLDER saga content — prod pulls live chained markets from the
// markets service + Scandal Scraper (docs/BACKEND_PLACEHOLDERS.md → SAGA_FEED).
const SAGA = {
  title: "Season 1 — The Scandal Cycle",
  episodes: [
    { ep: 1, name: "The Leak", status: "resolved", mult: 1.3, outcome: "WON" },
    { ep: 2, name: "The Denial", status: "resolved", mult: 1.8, outcome: "WON" },
    { ep: 3, name: "The Cover-Up", status: "live", mult: 2.4, outcome: null },
    { ep: 4, name: "The Reckoning", status: "locked", mult: 3.2, outcome: null },
    { ep: 5, name: "The Comeback", status: "locked", mult: 5.5, outcome: null },
  ],
};

export default function NftSaga() {
  const { cards, evolveCard } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  const liveCard = cards.find((c) => c.id === selected) ?? null;
  const sagaCombined = SAGA.episodes.filter((e) => e.status === "resolved").reduce((m, e) => m * e.mult, 1);

  const [evolving, setEvolving] = useState(false);
  // Snapshot of the card mid-evolution, captured BEFORE evolveCard() can burn it.
  // On failure, liveCard goes null the instant the card is removed from `cards` —
  // but the result panel (flip + flash) must survive that removal so the user
  // actually witnesses the burn instead of the whole panel silently vanishing.
  const [evolvingSnapshot, setEvolvingSnapshot] = useState<typeof liveCard>(null);

  // Render target:
  //  - mid-flip (evolving=true): always the pre-evolution snapshot.
  //  - post-result on SUCCESS: the live card, so the user sees the actual
  //    upgraded stats during the celebration — not stale pre-evolution data.
  //  - post-result on FAILURE (burn): the snapshot, since liveCard is now
  //    null (the card was deleted) and the result panel must stay mounted.
  const card = evolving ? evolvingSnapshot : (liveCard ?? evolvingSnapshot);

  function doEvolve(id: string) {
    // Card-flip moment precedes the result reveal — gives the burn-or-ascend
    // decision a physical beat instead of an instant text swap. This is the
    // single highest-stakes action in the game; it should feel like one.
    const snapshot = cards.find((c) => c.id === id) ?? null;
    setEvolvingSnapshot(snapshot);
    setEvolving(true);
    setTimeout(() => {
      const r = evolveCard(id);
      setFlash({ ok: r.ok, msg: r.message });
      setEvolving(false);
      // Snapshot is kept alive through the flash window ONLY as a fallback
      // for the burn case (liveCard ?? evolvingSnapshot above already prefers
      // the live, upgraded card whenever it still exists).
      setTimeout(() => {
        setFlash(null);
        setEvolvingSnapshot(null);
      }, 3000);
    }, 600); // matches animate-card-flip duration in globals.css
  }

  return (
    <div className="space-y-6">
      {/* SAGA MODE */}
      <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6">
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">Saga Mode</h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">{SAGA.title}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Combined Multiplier</p>
            <p className="font-mono text-lg font-black text-purple-400">{sagaCombined.toFixed(1)}x</p>
          </div>
        </header>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {SAGA.episodes.map((e, i) => {
            const c = e.status === "resolved" ? "#7cffc7" : e.status === "live" ? "#fc3437" : "#475569";
            return (
              <React.Fragment key={e.ep}>
                <div className="flex-1 rounded-xl border px-3 py-2.5" style={{ borderColor: c + "44", background: "#03050880" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-500">EP {e.ep}</span>
                    {e.status === "resolved" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {e.status === "live" && <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />}
                    {e.status === "locked" && <Lock className="w-3 h-3 text-neutral-600" />}
                  </div>
                  <p className="font-sans text-xs font-bold text-neutral-200">{e.name}</p>
                  <p className="font-mono text-[10px] font-black mt-0.5" style={{ color: c }}>{e.mult}x{e.outcome ? ` · ${e.outcome}` : ""}</p>
                </div>
                {i < SAGA.episodes.length - 1 && <ChevronRight className="hidden sm:block w-4 h-4 text-neutral-700 self-center shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* COLLECTION */}
      <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6">
        <header className="flex items-center gap-2.5 mb-5">
          <Layers className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">Card Vault</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">{cards.length} of 992 · MADHAT&apos;s Gambit deck</p>
          </div>
        </header>

        {flash && (
          <div className={`mb-4 rounded-lg border px-3 py-2 font-mono text-[11px] ${
            flash.ok
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400 animate-resolve-win"
              : "border-rose-500/40 bg-rose-500/5 text-rose-300 animate-resolve-loss"
          }`}>
            <span className={flash.ok ? "animate-gold-jackpot inline-block" : ""}>{flash.ok ? "✦ " : ""}{flash.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <NftCardView key={c.id} card={c} compact onClick={() => setSelected(c.id === selected ? null : c.id)} />
          ))}
        </div>
      </div>

      {/* DETAIL / EVOLUTION */}
      {card && (
        <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6">
          <div className="grid md:grid-cols-[260px_1fr] gap-6">
            <div className={`max-w-[260px] ${evolving ? "animate-card-flip" : ""}`}><NftCardView card={card} /></div>
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-black text-white">{card.name}</h3>
                <p className="font-mono text-[11px] text-neutral-500 italic">{card.caption}</p>
              </div>

              {/* evolution */}
              {(() => {
                const step = nextEvolution(card.rarity);
                const tier = RARITY_TABLE[card.rarity];
                if (!step) return (
                  <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-pink-400 font-bold">Apex Tier — {card.rarity}</p>
                    <p className="font-mono text-[10px] text-neutral-500 mt-1">No further evolution. {tier.cloutMultiplier}x clout · {tier.stakingApy}% APY.</p>
                  </div>
                );
                const pct = Math.min(100, (card.xp / step.xpRequired) * 100);
                return (
                  <div className="rounded-xl border border-neutral-850 bg-[#030508] px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Evolution → {step.to}</span>
                      <span className="font-mono text-[10px] text-cyan-400">{card.xp}/{step.xpRequired} XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-900 overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-pink-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] text-neutral-600 flex items-center gap-1"><Flame className="w-3 h-3" /> Burns {step.cardsRequired} cards</span>
                      <button onClick={() => doEvolve(card.id)} disabled={card.xp < step.xpRequired}
                        className="font-mono text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        Evolve
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* full rarity ladder */}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 mb-2">Rarity Power Ladder</p>
                <div className="space-y-1">
                  {RARITY_ORDER.map((r) => {
                    const t = RARITY_TABLE[r];
                    const isCur = r === card.rarity;
                    return (
                      <div key={r} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${isCur ? "border" : ""}`} style={isCur ? { borderColor: t.accent + "66", background: t.accent + "10" } : {}}>
                        <span className="font-mono text-[10px] font-bold" style={{ color: t.accent }}>{r}{t.holographic ? " ✦" : ""}</span>
                        <span className="font-mono text-[10px] text-neutral-500">{t.powerScore.toLocaleString()} PWR · {t.cloutMultiplier}x · {t.stakingApy}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
