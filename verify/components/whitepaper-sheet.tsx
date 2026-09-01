"use client";

/**
 * MAD Gambit — Abbreviated Whitepaper / Master Product Sheet
 * ------------------------------------------------------------------
 * Full-scope, single-view product sheet sourced from the canonical docs
 * (numbers locked): fee 1.88% · community 28.8% · creator 40% ·
 * $MADx 888,888,888 · seed $1.24M–$2.48M @ $12M pre.
 *
 * 2026-08-19 — reconciled against the published data room per Boardy's
 * consolidated brief. See docs/boardy/CANONICAL_NUMBERS_2026-08-19.md.
 *   · Y3 headline $154.5M → $139.6M base case ($177.7M is bull only).
 *   · Retention and Monte Carlo solvency relabelled as target / modelled —
 *     they were stated as achieved fact and are not evidenced.
 * Every claim here must trace to docs/boardy/FEATURE_TRACEABILITY_MATRIX.md.
 * Self-styled (INK tokens) for consistency across themes.
 */
import React from "react";
import { X, ExternalLink } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  { h: "01 · The Problem", body: "Prediction markets are truth machines (Polymarket/Kalshi) or liquidity machines (DraftKings/Stake) — none are entertainment-native or creator-owned. Culture moves faster than either can price." },
  { h: "02 · The Product — Conviction · Prediction · Affliction", body: "Creator-made scandal/culture markets with satirical NFT cards and a loss-mitigation shield. Positioned as a family of specialised perpetuals — Z-Liar, Gossip-Cop, Perpetual Epiphanies, Progression/Saga — not a binary prediction market. Retention target 70% D30; not yet measured." },
  { h: "03 · Card Economy", body: "992-card canonical deck, 7 rarities (Common→Mythic). Scandal Packs mint on an 8-tier Dutch-auction bonding curve — $8.88 floor → $95 (gradual) → $296 conviction cap. Evolution burns are the primary deflationary sink." },
  { h: "04 · MAD Shield", body: "Opt-in loss recovery: a 2–4% premium returns 28.8% of losses at standard tier, scaling to 40% by premium tier (60% VIP, gated). Funded from the fee allocation plus yield on pooled float. GARCH(1,1)-priced. Solvency is modelled, not audited — assumptions and Monte Carlo parameters are in the data room. Not insurance." },
  { h: "05 · Tokenomics & Markets", body: "$MADx — mint-on-purchase, capped at 888,888,888. Platform fee 1.88%. On creator-made markets the creator takes 40% of the fee (0.752% of volume) and the platform 60%; platform-made markets are 100% platform. Of the platform share, 28.8% goes to the community pool and DAO treasury for rewards, marketing and grants — alongside operations, the MAD Shield pool, token burn and reserve. Markets priced by DL-LMSR (volume-scaled bonding curve); Market Factory lets creators launch markets on-chain." },
  { h: "06 · Chain", body: "Arbitrum Nova (launch / gameplay, chain 42170) · Arbitrum One (liquidity, MAD Shield vaults, $MADx) · Ethereum L1 governance anchor · Base L2 Phase 3 · HyperEVM for AI-agent settlement. Foundry-built, SIWE auth." },
  { h: "07 · Projections (modelled)", body: "Y3 $139.6M gross, base case — $177.7M is bull case only and is not the headline. Modelled on $3.6B–$4.2B annual volume. Revenue-stream weighting is being re-run against the revised base case. Projections only: no revenue, users, or retention to date. 15,000 pre-registered is a waitlist." },
  { h: "08 · The Ask — three separate tranches", body: "(1) Infrastructure $15K–$20K: 3–6 months of build infrastructure, frontier-model usage, and a development machine. (2) Bridge $300K–$500K: product, testing, security, ecosystem, and an accountable technical partner against explicit milestones. (3) Seed $1.24M–$2.48M @ $12M pre — SAFE or equity, 10% token allocation. Use: 35% contracts & audits · 25% creator acquisition · 20% liquidity · 15% team · 5% legal. Seeking operator investors and studios, not passive capital." },
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
