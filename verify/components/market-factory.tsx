"use client";

/**
 * MAD Gambit — Market Factory (frontend)
 * ------------------------------------------------------------------
 * Create-a-market flow for creator-made conviction markets. The on-chain
 * MADMarketFactory.sol exists and is tested but isn't deployed or called
 * from any frontend yet (see the security & oracle risk register) — until
 * it is, Create posts to /api/v1/markets, the same real, DB-backed path
 * markets-panel.tsx uses, seeded with this panel's live DL-LMSR preview
 * odds instead of the flat defaults that manual path falls back to. This
 * is a deliberate interim wiring, not a placeholder: the button used to
 * have no handler at all and did nothing when clicked.
 *   - 6 categories: Politics · Crypto · Sports · Entertainment · Technology · Custom
 *   - DL-LMSR (BondingCurve) pricing via calculateDLLMSRPrice / …Cost
 *   - creator earns the canonical 40% of the 1.88% fee (whitepaper S09)
 * Theme-aware (useTheme), INK tokens, no raw hex.
 */
import React, { useState, useMemo } from "react";
import { Factory, TrendingUp, Coins, ShieldCheck } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import { useTheme } from "@/context/theme-context";
import { calculateDLLMSRPrice, calculateDLLMSRCost, PLATFORM } from "@/lib/gambit-game-math";

const CATEGORIES = ["Politics", "Crypto", "Sports", "Entertainment", "Technology", "Custom"] as const;
type Category = (typeof CATEGORIES)[number];

const CREATION_FEE_MADX = 88; // → treasury (demo value; contract reads live)
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function MarketFactory() {
  const { tokens } = useTheme();
  const accent = tokens.primary;

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<Category>("Crypto");
  const [liquidityB, setLiquidityB] = useState<number>(PLATFORM.LMSR_DEFAULT_B);
  const [seedYes, setSeedYes] = useState(50); // initial share skew (demo)
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  // Live DL-LMSR outcome prices for a binary market at the current skew.
  const { pYes, pNo, seedCost } = useMemo(() => {
    const shares = [seedYes, 100 - seedYes];
    return {
      pYes: calculateDLLMSRPrice(shares[0], shares, liquidityB),
      pNo: calculateDLLMSRPrice(shares[1], shares, liquidityB),
      seedCost: calculateDLLMSRCost(shares, liquidityB, 0),
    };
  }, [seedYes, liquidityB]);

  // Canonical fee economics on an example $10k of volume.
  const exampleVol = 10_000;
  const grossFee = exampleVol * (PLATFORM.FEE_BPS / 10_000);
  const creatorCut = grossFee * (PLATFORM.CREATOR_SHARE_BPS / 10_000);

  const valid = question.trim().length >= 8;

  // Interim create path: POSTs to the real, DB-backed /api/v1/markets route
  // (the same one markets-panel.tsx uses) rather than the not-yet-deployed
  // on-chain factory. Seeds odds from this panel's own live DL-LMSR preview
  // (decimal odds = 1/probability) instead of the manual panel's flat 2.0/2.0
  // defaults, so at least the price a creator previewed here is what gets
  // stored, even though nothing on-chain prices it yet.
  const handleCreate = () => {
    if (!valid || busy) return;
    setBusy(true);
    setNote(null);
    fetch("/api/v1/markets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: question.trim(),
        category: category.toLowerCase(),
        yesOdds: 1 / Math.max(pYes, 0.01),
        noOdds: 1 / Math.max(pNo, 0.01),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setQuestion("");
          setNote({ text: "Created — live in Prediction Markets below.", ok: true });
        } else {
          setNote({
            text: d?.error === "markets need DATABASE_URL" ? "Connect the DB to create markets." : (d?.error || "Create failed."),
            ok: false,
          });
        }
      })
      .catch(() => setNote({ text: "Create failed — network error.", ok: false }))
      .finally(() => setBusy(false));
  };

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: INK.bgPanel, border: `1px solid ${INK.borderGold}` }}
    >
      <div className="flex items-center gap-2">
        <Factory className="w-5 h-5" style={{ color: accent }} />
        <h3 className="font-black tracking-wide text-sm" style={{ color: INK.white, fontFamily: "Georgia, serif" }}>
          MARKET FACTORY
        </h3>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded" style={{ color: INK.muted, border: `1px solid ${INK.border}` }}>
          DL-LMSR · Creator 40%
        </span>
      </div>

      {/* question */}
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Market Question</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Will ___ happen by ___?"
          className="mt-1 w-full rounded-lg px-3 py-2.5 text-sm outline-none"
          style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, color: INK.white }}
        />
      </label>

      {/* category */}
      <div>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Category</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: c === category ? accent : INK.bgCard,
                color: c === category ? "#05070c" : INK.muted,
                border: `1px solid ${c === category ? accent : INK.border}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* liquidity + skew */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Liquidity b: {liquidityB}</span>
          <input type="range" min={300} max={2400} step={100} value={liquidityB} onChange={(e) => setLiquidityB(+e.target.value)} className="mt-2 w-full" style={{ accentColor: accent }} />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Initial YES lean: {seedYes}</span>
          <input type="range" min={0} max={100} step={5} value={seedYes} onChange={(e) => setSeedYes(+e.target.value)} className="mt-2 w-full" style={{ accentColor: accent }} />
        </label>
      </div>

      {/* live DL-LMSR price preview */}
      <div className="rounded-xl p-3" style={{ background: INK.bgCard, border: `1px solid ${INK.border}` }}>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: INK.green }} />
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: INK.muted }}>Live DL-LMSR Preview</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg py-2 text-center" style={{ background: "rgba(0,255,136,0.08)", border: `1px solid ${INK.greenDim}` }}>
            <div className="font-black text-lg" style={{ color: INK.green }}>{pct(pYes)}</div>
            <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: INK.muted }}>YES</div>
          </div>
          <div className="flex-1 rounded-lg py-2 text-center" style={{ background: "rgba(245,36,42,0.08)", border: `1px solid ${INK.pinkDim}` }}>
            <div className="font-black text-lg" style={{ color: INK.pink }}>{pct(pNo)}</div>
            <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: INK.muted }}>NO</div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px]" style={{ color: INK.muted }}>Seed cost C(q) ≈ {seedCost.toFixed(2)} · α volume-scaled</div>
      </div>

      {/* economics */}
      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
        <div className="flex items-center gap-1.5" style={{ color: INK.muted }}>
          <Coins className="w-3.5 h-3.5" style={{ color: accent }} />
          Creation fee {CREATION_FEE_MADX} $MADx → treasury
        </div>
        <div className="flex items-center gap-1.5" style={{ color: INK.muted }}>
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: INK.green }} />
          Creator earns {usd(creatorCut)} / {usd(exampleVol)} vol (40%)
        </div>
      </div>

      {/* create */}
      <button
        disabled={!valid || busy}
        onClick={handleCreate}
        className="w-full rounded-xl py-3 font-black tracking-wide text-sm transition-all active:scale-[0.98]"
        style={{
          background: valid && !busy ? accent : INK.bgCard,
          color: valid && !busy ? "#05070c" : INK.muted,
          border: `1px solid ${valid && !busy ? accent : INK.border}`,
          opacity: valid && !busy ? 1 : 0.6,
          cursor: valid && !busy ? "pointer" : "default",
        }}
      >
        {busy ? "Creating…" : valid ? `Create ${category} Market` : "Enter a market question (≥ 8 chars)"}
      </button>
      {note && (
        <p className="font-mono text-[9px] text-center" style={{ color: note.ok ? INK.green : INK.pink }}>
          {note.text}
        </p>
      )}
      <p className="font-mono text-[9px] text-center" style={{ color: INK.muted }}>
        Creates a real market row today (DB-backed, odds seeded from the preview above).
        On-chain settlement via MADMarketFactory.sol is built and tested but not yet deployed
        or wired to this action — see the security &amp; oracle risk register.
      </p>
    </div>
  );
}
