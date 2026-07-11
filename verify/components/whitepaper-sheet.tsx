"use client";

/**
 * MAD Gambit — Abbreviated Whitepaper / Master Product Sheet
 * ------------------------------------------------------------------
 * Replaces the old "Sandbox Documentation" stub with a full-scope, single-view
 * product sheet sourced verbatim from the canonical docs (numbers locked):
 * fee 1.88% · community 28.8% · creator 40% · $MADx 888,888,888 · seed
 * $1.24M–$2.48M @ $12M pre · Y3 $154.5M on $3.6B–$4.2B vol. Links to the full
 * /pitch data room. Self-styled (INK tokens) for consistency across themes.
 */
import React from "react";
import { X, ExternalLink } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  { h: "01 · The Problem", body: "Prediction markets are truth machines (Polymarket/Kalshi) or liquidity machines (DraftKings/Stake) — none are entertainment-native or creator-owned. Culture moves faster than either can price." },
  { h: "02 · The Product — Conviction · Prediction · Affliction", body: "Creator-made scandal/culture markets with satirical NFT cards and a loss-mitigation shield. Emotional hedging → sticky retention (70%+ D30 target)." },
  { h: "03 · Card Economy", body: "992-card canonical deck, 7 rarities (Common→Mythic). Scandal Packs mint on an 8-tier Dutch-auction bonding curve — $8.88 floor → $95 (gradual) → $296 conviction cap. Evolution burns are the primary deflationary sink." },
  { h: "04 · MAD Shield", body: "Opt-in loss recovery: 2–4% premium returns 28.8% of losses (standard), premium-funded via 25% fee allocation + Lido/Aave yield. 100% USD solvency across 1,000 Monte-Carlo bear scenarios. GARCH(1,1)-priced." },
  { h: "05 · Tokenomics & Markets", body: "$MADx — 888,888,888 fixed supply. Platform fee 1.88% → 40% to the market creator, 28.8% smart-contract-enforced to the community pool. Markets priced by DL-LMSR (volume-scaled bonding curve); Market Factory lets creators launch markets on-chain." },
  { h: "06 · Chain", body: "Arbitrum Nova (launch / gameplay, chain 42170) · Arbitrum One (MAD Shield vaults + $MADx). HyperEVM + Base expansion. Foundry-built, SIWE auth." },
  { h: "07 · Traction & Projections", body: "Y1 $30.9M → Y2 $92.7M → Y3 $154.5M gross on $3.6B–$4.2B annual volume; ~$80M EBITDA; 750K DAU. 5 revenue streams (fees 51% · NFT 31% · staking/yield 12% · shield 6%)." },
  { h: "08 · The Ask", body: "Seed $1.24M–$2.48M at $12M pre-money — SAFE or equity. Use: 35% contracts & audits · 25% marketing/creator acquisition · 20% liquidity · 15% team · 5% legal." },
];

export default function WhitepaperSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="MAD Gambit master product sheet"
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 space-y-4"
        style={{ background: INK.bgDeep, border: `1px solid ${INK.borderGold}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${INK.border}` }}>
          <div>
            <div className="font-black tracking-wide text-base" style={{ color: INK.gold, fontFamily: "Georgia, serif" }}>MΛĐ GAMBIT</div>
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Abbreviated Whitepaper · Master Product Sheet</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: INK.muted }}><X className="w-5 h-5" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {SECTIONS.map((s) => (
            <div key={s.h} className="rounded-xl p-3" style={{ background: INK.bgCard, border: `1px solid ${INK.border}` }}>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: INK.gold }}>{s.h}</div>
              <p className="text-[11px] leading-relaxed" style={{ color: INK.white }}>{s.body}</p>
            </div>
          ))}
        </div>

        <a
          href="/pitch/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-sm transition-all"
          style={{ background: INK.gold, color: "#05070c" }}
        >
          Open Full Data Room <ExternalLink className="w-4 h-4" />
        </a>
        <p className="font-mono text-[9px] text-center" style={{ color: INK.muted }}>
          Informational only — not an offer or solicitation. © 2026 MAD Gambit LLC (New Mexico).
        </p>
      </div>
    </div>
  );
}
