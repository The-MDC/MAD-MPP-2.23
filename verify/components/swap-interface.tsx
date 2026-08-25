"use client";

/**
 * MΛĐ Gambit — DL-LMSR Swap Interface
 * ------------------------------------------------------------------
 * Port of Gen 1 SwapInterface() from MainActivity.kt.
 *
 * WHAT CHANGED, AND WHY THE BADGE MATTERS
 *
 * The maths here was always the canon maths. The BOOK was not: `shares` started
 * at a literal {YES:50, NO:50} in useState, `volume` at 0, and executeSwap()
 * mutated both plus a five-row local history while debiting a localStorage
 * credit balance. Nothing left the browser. The panel said "DL-LMSR SWAP ENGINE"
 * over a React state object.
 *
 * It now trades against a real server-side book: GET .../book loads the live
 * share vector, POST .../swap settles the fill inside one transaction, and the
 * response — not an optimistic local guess — is what gets rendered.
 *
 * THE PREVIEW AND THE FILL USE THE SAME FUNCTION. `quote()` comes from
 * lib/lmsr-book.ts, which is pure and isomorphic, and the swap route calls the
 * identical function against the row it has locked. The old preview used
 * `netIn / (price · b)`, which is not the LMSR inverse and disagreed with any
 * honest settlement. Now the only difference between quote and fill is other
 * people's trades landing in between — which is what the impact warning is for.
 *
 * `source` is surfaced as a live/demo badge, the same contract news-carousel,
 * faces-waterline and madx-wallet-panel already honour. Without a database
 * there is no book, so the panel prices a fresh even one and SAYS SO rather
 * than implying depth that does not exist.
 *
 * One behaviour deliberately dropped: the old share count was multiplied by
 * `deck.multiplier`, which inflated the quote by an OV-deck factor that no
 * settlement would ever have honoured. The deck is still shown in the header;
 * it no longer silently changes what you receive.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { OV_DECKS, OVDeck, PLATFORM, calculateVolumeScalingAlpha } from "@/lib/gambit-game-math";
import { bookPrices, emptyBook, quote, type BookState } from "@/lib/lmsr-book";
import { ArrowUpDown, Zap, AlertTriangle } from "lucide-react";

interface SwapRecord {
  id: string; direction: string; amountIn: number; amountOut: number;
  fee: number; price: number; ts: number;
}

interface BookResponse {
  success: boolean;
  source?: "live" | "demo";
  book?: {
    outcomes: string[]; q: number[]; b: number;
    cumVolume: number; openInterest: number; sigma: number;
  };
}

const LIQUIDITY_B = PLATFORM.LMSR_DEFAULT_B;

export default function SwapInterface({
  activeDeck,
  /** Which market's book to trade. Without one there is nothing to price against. */
  marketId,
}: {
  activeDeck?: OVDeck;
  marketId?: string;
}) {
  const deck = activeDeck ?? OV_DECKS[0];

  const [amountIn, setAmountIn] = useState("100");
  const [buyingYes, setBuyingYes] = useState(true);
  const [book, setBook] = useState<BookState>(() => emptyBook(["YES", "NO"], LIQUIDITY_B));
  const [openInterest, setOpenInterest] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [source, setSource] = useState<"live" | "demo">("demo");
  const [history, setHistory] = useState<SwapRecord[]>([]);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Neither existing mount (mpp2.23, module-shelf) knows which market it is
  // showing, so without a fallback the panel would be permanently inert — a
  // worse outcome than the fake it replaces. Resolve the most recent open
  // market instead. An explicit `marketId` prop always wins.
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  useEffect(() => {
    if (marketId) { setResolvedId(marketId); return; }
    let cancelled = false;
    fetch("/api/v1/markets?status=open&limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const first = Array.isArray(d?.markets) ? d.markets[0] : null;
        setResolvedId(first?.id ?? null);
      })
      .catch(() => { if (!cancelled) setResolvedId(null); });
    return () => { cancelled = true; };
  }, [marketId]);

  const activeMarketId = marketId ?? resolvedId;

  const loadBook = useCallback(() => {
    if (!activeMarketId) return;
    fetch(`/api/v1/markets/${encodeURIComponent(activeMarketId)}/book`)
      .then((r) => r.json())
      .then((d: BookResponse) => {
        if (!d?.success || !d.book) return;
        setBook({
          outcomes: d.book.outcomes,
          q: d.book.q,
          b: d.book.b,
          cumVolume: d.book.cumVolume,
        });
        setOpenInterest(d.book.openInterest);
        setSource(d.source === "live" ? "live" : "demo");
      })
      .catch(() => {});
  }, [activeMarketId]);

  const loadBalance = useCallback(() => {
    // Session-scoped: the route reads the wallet from the signed session, not
    // from a query string. A 401 here means "not signed in", which is a real
    // state the panel shows rather than papering over with a fake balance.
    fetch("/api/v1/madx/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBalance(d?.account ? Number(d.account.balance) : null))
      .catch(() => setBalance(null));
  }, []);

  useEffect(() => { loadBook(); }, [loadBook]);
  useEffect(() => { loadBalance(); }, [loadBalance]);

  const parsed = parseFloat(amountIn) || 0;
  const outcomeIndex = buyingYes ? 0 : 1;

  // The exact same call the server makes to settle.
  const q = useMemo(
    () => quote(book, outcomeIndex, parsed),
    [book, outcomeIndex, parsed],
  );

  const livePrices = useMemo(() => bookPrices(book), [book]);
  const priceYes = livePrices[0] ?? 0;
  const priceNo = livePrices[1] ?? 0;

  const sharesOut = q?.shares ?? 0;
  const feeGross = q?.fee ?? parsed * (PLATFORM.FEE_BPS / 10_000);
  const priceImpact = q?.impact ?? 0;
  const highSlippage = priceImpact > 0.05;

  const canExecute =
    !!activeMarketId && !busy && parsed > 0 && !!q && balance !== null && parsed <= balance;

  async function executeSwap() {
    if (!canExecute || !activeMarketId) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/markets/${encodeURIComponent(activeMarketId)}/swap`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: book.outcomes[outcomeIndex], amount: parsed }),
      });
      const d = await res.json();

      if (!res.ok || !d?.success) {
        setNotice(typeof d?.error === "string" ? d.error : "swap failed");
        return;
      }

      // Render what SETTLED, not what was previewed.
      setBook({
        outcomes: d.book.outcomes,
        q: d.book.q,
        b: d.book.b,
        cumVolume: d.book.cumVolume,
      });
      setOpenInterest(Number(d.book.openInterest));
      setSource("live");
      setHistory((h) => [
        {
          id: `sw_${d.fill.betId}`,
          direction: String(d.fill.outcome),
          amountIn: Number(d.fill.spend),
          amountOut: Number(Number(d.fill.shares).toFixed(4)),
          fee: Number(d.fill.fee),
          price: Number(d.fill.priceAfter),
          ts: Date.now(),
        },
        ...h,
      ].slice(0, 5));
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
      setAmountIn("100");
      loadBalance();
    } catch {
      setNotice("swap failed — the book was not touched");
    } finally {
      setBusy(false);
    }
  }

  const alpha = calculateVolumeScalingAlpha(book.cumVolume);

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
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-md">
              DL-LMSR SWAP ENGINE
              <span
                className="px-1 rounded"
                style={{
                  background: source === "live" ? "#00ff8830" : "#ffffff20",
                  color: source === "live" ? "#00ff88" : "#cbd5e1",
                }}
                title={
                  source === "live"
                    ? "Trading against the persisted market book."
                    : "No book on this market yet — prices come from a fresh, even book. Nothing settles."
                }
              >
                {source}
              </span>
            </span>
            <p className="font-mono text-[8px] text-neutral-600 mt-1">
              α(V) = {alpha.toFixed(4)} · b = {book.b} · OI {openInterest.toFixed(0)} · Deck {deck.version}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600">Balance</p>
            <p className="font-mono text-sm font-black text-neutral-200">
              {balance === null ? "— sign in" : `${balance.toLocaleString()} $MADx`}
            </p>
          </div>
        </div>

        {/* Price display */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-lg border px-3 py-2 ${buyingYes ? "border-emerald-500/40 bg-emerald-500/5" : "border-neutral-850 bg-[#030508]"}`}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-0.5">
              {book.outcomes[0] ?? "YES"} Price
            </p>
            <p className="font-mono text-lg font-black text-emerald-400">{priceYes.toFixed(4)}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2 ${!buyingYes ? "border-rose-500/40 bg-rose-500/5" : "border-neutral-850 bg-[#030508]"}`}>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-0.5">
              {book.outcomes[1] ?? "NO"} Price
            </p>
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
            <p className="font-mono text-[8px] text-neutral-700 mt-1">Fee: {feeGross.toFixed(2)} $MADx (1.88%)</p>
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

        {/* Why the button is disabled, if it is. Silence would read as a bug. */}
        {notice && (
          <p className="font-mono text-[9px] text-rose-400 font-bold">{notice}</p>
        )}
        {!activeMarketId && (
          <p className="font-mono text-[8px] text-neutral-600">
            No market selected — the engine is priced against a fresh book and nothing will settle.
          </p>
        )}
        {activeMarketId && balance === null && (
          <p className="font-mono text-[8px] text-neutral-600">
            Sign in to trade. Prices above are the live book; a fill needs a session.
          </p>
        )}

        {/* Execute button — exact Gen 1 copy */}
        <button
          onClick={executeSwap}
          disabled={!canExecute}
          className="w-full rounded-xl py-3.5 font-mono text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 hover:scale-[1.01] flex items-center justify-center gap-2"
          style={{ background: "#00f0ff18", border: "1px solid #00f0ff55", color: "#00f0ff" }}
        >
          <Zap className="w-4 h-4" /> {busy ? "SETTLING…" : "EXECUTE CONVICTION"}
        </button>

        {/* Swap history */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-neutral-900">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700 mb-2">Swap History</p>
            <div className="space-y-1.5">
              {history.map(sw => (
                <div key={sw.id} className="flex items-center gap-2 text-[9px] font-mono">
                  <span className={sw.direction === (book.outcomes[0] ?? "YES") ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{sw.direction}</span>
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
