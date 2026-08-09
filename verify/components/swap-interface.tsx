"use client";

/**
 * MΛĐ Gambit — DL-LMSR Swap Interface
 * ------------------------------------------------------------------
 * Port of Gen 1 SwapInterface() from MainActivity.kt.
 * Live AMM pricing via calculateDLLMSRCost() / calculateDLLMSRPrice().
 * Volume-scaled alpha displayed live. "EXECUTE CONVICTION" CTA (exact Gen 1 copy).
 * 1.88% fee shown on every swap. Slippage warning > 5% price impact.
 * Swap history: last 5 swaps below.
 * Dopamine: "CONVICTION EXECUTED" cyan flash on swap.
 */

import React, { useState, useMemo } from "react";
import { useGame } from "@/context/game-context";
import {
  calculateDLLMSRPrice, calculateDLLMSRCost,
  calculateVolumeScalingAlpha, splitFee, OV_DECKS, OVDeck, PLATFORM,
} from "@/lib/gambit-game-math";
import { ArrowUpDown, Zap, AlertTriangle } from "lucide-react";

interface SwapRecord {
  id: string; direction: "YES" | "NO"; amountIn: number; amountOut: number;
  fee: number; price: number; ts: number;
}

// Initial shares for a balanced market (YES=50, NO=50, b = canonical 1200)
const INIT_SHARES = { YES: 50, NO: 50 };
const LIQUIDITY_B = PLATFORM.LMSR_DEFAULT_B;

export default function SwapInterface({ activeDeck }: { activeDeck?: OVDeck }) {
  const deck = activeDeck ?? OV_DECKS[0];
  const { madCredits, adjustCredits } = useGame();
  const [amountIn, setAmountIn] = useState("100");
  const [buyingYes, setBuyingYes] = useState(true);
  const [shares, setShares] = useState(INIT_SHARES);
  const [volume, setVolume] = useState(0);
  const [history, setHistory] = useState<SwapRecord[]>([]);
  const [flash, setFlash] = useState(false);

  const parsed = parseFloat(amountIn) || 0;
  const alpha = calculateVolumeScalingAlpha(volume);
  const shareArr = [shares.YES, shares.NO];

  // Price of YES outcome
  const priceYes = calculateDLLMSRPrice(shares.YES, shareArr, LIQUIDITY_B);
  const priceNo  = calculateDLLMSRPrice(shares.NO,  shareArr, LIQUIDITY_B);
  const currentPrice = buyingYes ? priceYes : priceNo;

  // Output shares purchased (simplified: amount / price per share with liquidity scaling)
  const feeCalc = useMemo(() => splitFee(parsed, 0), [parsed]);
  const netIn = parsed - feeCalc.grossFee;
  const sharesOut = netIn > 0 ? (netIn / (currentPrice * LIQUIDITY_B)) * deck.multiplier : 0;

  // Price impact
  const simulatedNewShareArr = buyingYes
    ? [shares.YES + sharesOut, shares.NO]
    : [shares.YES, shares.NO + sharesOut];
  const newPrice = calculateDLLMSRPrice(
    buyingYes ? simulatedNewShareArr[0] : simulatedNewShareArr[1],
    simulatedNewShareArr, LIQUIDITY_B
  );
  const priceImpact = Math.abs(newPrice - currentPrice) / currentPrice;
  const highSlippage = priceImpact > 0.05;

  function executeSwap() {
    if (parsed <= 0 || parsed > madCredits) return;
    adjustCredits(-parsed);
    const record: SwapRecord = {
      id: "sw_" + Date.now(),
      direction: buyingYes ? "YES" : "NO",
      amountIn: parsed,
      amountOut: parseFloat(sharesOut.toFixed(4)),
      fee: feeCalc.grossFee,
      price: currentPrice,
      ts: Date.now(),
    };
    setShares(prev => buyingYes
      ? { ...prev, YES: prev.YES + sharesOut }
      : { ...prev, NO: prev.NO + sharesOut }
    );
    setVolume(v => v + parsed);
    setHistory(h => [record, ...h].slice(0, 5));
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
    setAmountIn("100");
  }

  return (
    <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md overflow-hidden">
      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 z-20 rounded-3xl animate-scandal-flash pointer-events-none"
          style={{ background: "rgba(0,240,255,0.12)" }} />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex font-mono text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-md">DL-LMSR SWAP ENGINE</span>
            <p className="font-mono text-[8px] text-neutral-600 mt-1">α(V) = {alpha.toFixed(4)} · b = {LIQUIDITY_B} · Deck {deck.version}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600">Balance</p>
            <p className="font-mono text-sm font-black text-neutral-200">{madCredits.toLocaleString()} $MADx</p>
          </div>
        </div>

        {/* Price display */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-lg border px-3 py-2 ${buyingYes ? "border-emerald-500/40 bg-emerald-500/5" : "border-neutral-850 bg-[#030508]"}`}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-0.5">YES Price</p>
            <p className="font-mono text-lg font-black text-emerald-400">{priceYes.toFixed(4)}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2 ${!buyingYes ? "border-rose-500/40 bg-rose-500/5" : "border-neutral-850 bg-[#030508]"}`}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-0.5">NO Price</p>
            <p className="font-mono text-lg font-black text-rose-400">{priceNo.toFixed(4)}</p>
          </div>
        </div>

        {/* Swap inputs */}
        <div className="space-y-2">
          <div className="rounded-xl border border-neutral-800 bg-[#030508] px-3.5 py-2.5">
            <p className="font-mono text-[8px] uppercase tracking-wider text-neutral-600 mb-1">Amount In ($MADx)</p>
            <input
              type="number" min={0} value={amountIn}
              onChange={e => setAmountIn(e.target.value)}
              className="w-full bg-transparent font-mono text-xl font-black text-neutral-100 focus:outline-none"
              placeholder="0"
            />
            <p className="font-mono text-[8px] text-neutral-700 mt-1">Fee: {feeCalc.grossFee.toFixed(2)} $MADx (1.88%)</p>
          </div>

          {/* Direction toggle */}
          <div className="flex items-center justify-center">
            <button onClick={() => setBuyingYes(b => !b)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-800 bg-[#030508] text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all font-mono text-[9px] font-bold">
              <ArrowUpDown className="w-3 h-3" />
              {buyingYes ? "Buying HIGH VIRALITY shares" : "Buying LOW VIRALITY shares"}
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-[#030508] px-3.5 py-2.5">
            <p className="font-mono text-[8px] uppercase tracking-wider text-neutral-600 mb-1">
              Outcome: {buyingYes ? "High Virality Shares" : "Low Virality Shares"}
            </p>
            <p className="font-mono text-xl font-black text-neutral-100">{sharesOut > 0 ? sharesOut.toFixed(4) : "0"}</p>
            <p className="font-mono text-[8px] text-neutral-700 mt-1">
              Price impact: {(priceImpact * 100).toFixed(2)}% {highSlippage ? "⚠" : "✓"}
            </p>
          </div>
        </div>

        {/* High slippage warning */}
        {highSlippage && parsed > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/8 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="font-mono text-[9px] text-amber-400 font-bold">
              High price impact: {(priceImpact * 100).toFixed(1)}%. Order moves market significantly.
            </p>
          </div>
        )}

        {/* Execute button — exact Gen 1 copy */}
        <button
          onClick={executeSwap}
          disabled={parsed <= 0 || parsed > madCredits}
          className="w-full rounded-xl py-3.5 font-mono text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 hover:scale-[1.01] flex items-center justify-center gap-2"
          style={{ background: "#00f0ff18", border: "1px solid #00f0ff55", color: "#00f0ff" }}
        >
          <Zap className="w-4 h-4" /> EXECUTE CONVICTION
        </button>

        {/* Swap history */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-neutral-900">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 mb-2">Swap History</p>
            <div className="space-y-1.5">
              {history.map(sw => (
                <div key={sw.id} className="flex items-center gap-2 text-[9px] font-mono">
                  <span className={sw.direction === "YES" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{sw.direction}</span>
                  <span className="text-neutral-400">{sw.amountIn} $MADx → {sw.amountOut} shares</span>
                  <span className="text-neutral-600 ml-auto">@{sw.price.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
