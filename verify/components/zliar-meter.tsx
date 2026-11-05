"use client";

/**
 * MAD Gambit — Z-LIAR METER (hero instrument)
 * ------------------------------------------------------------------
 * A live narrative-credibility gauge. The needle is driven by the
 * composite zLiarMeter() (Sentinel BS-Index + GARCH volatility + lunar
 * tilt) — that maths was always real and is unchanged.
 *
 * The MADHAT'r's read is now real too: POST /api/v1/madhatr/zliar makes a
 * Gemini call in the shared persona voice against THIS claim, and returns
 * `quipSource` so the panel can distinguish a live read from the stock line
 * for that verdict band. It previously rendered a five-entry lookup keyed by
 * verdict, which ignored the user's statement entirely while the header said
 * "The MADHAT'r reads it".
 */

import React, { useMemo, useState } from "react";
import { useGame } from "@/context/game-context";
import { ZLiarVerdict } from "@/lib/gambit-game-math";
import { ShieldAlert, Search, Activity, Moon, X } from "lucide-react";
import AnalogDial from "@/components/analog-dial";
import SentimentEqualizer from "@/components/sentiment-equalizer";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import HoldHint from "@/components/hold-hint";
import { zliarMarketsByCredibility, credibilityColor, type ZLiarMarket } from "@/lib/zliar-markets";

// Canonical band names (17-corrections #1): STRAIGHT SHOOTER → MOSTLY CANDID
// → SLIPPERY → SERIAL EMBELLISHER → TOTAL FABRICATION.
const VERDICT_COLOR: Record<ZLiarVerdict, string> = {
  "STRAIGHT SHOOTER": "#7cffc7",
  "MOSTLY CANDID": "#fbbf24",
  "SLIPPERY": "#f59e0b",
  "SERIAL EMBELLISHER": "#f5242a",
  "TOTAL FABRICATION": "#ff00f0",
};

/**
 * The MADHAT'r line now comes from POST /api/v1/madhatr/zliar, which makes a
 * real Gemini call in the shared persona voice and hands back `quipSource`.
 *
 * This component used to render a five-entry lookup keyed by verdict under the
 * words "🎩 The MADHAT'r reads it" — a line that ignored the user's statement
 * entirely while implying something had read it. The table still exists as the
 * offline fallback, but it lives in the route now, so a canned line is always
 * labelled as one instead of being indistinguishable from a live read.
 */

export default function ZLiarMeter() {
  const { runZLiar, zLiarHistory } = useGame();
  const [quip, setQuip] = useState<{ text: string; source: "llm" | "canned" } | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [statement, setStatement] = useState("Bitcoin will hit $250k before the next halving — guaranteed.");
  const [variance, setVariance] = useState(0.7);
  const [credibility, setCredibility] = useState(0.35);
  const [corroboration, setCorroboration] = useState(0.2);
  const [marketsOpen, setMarketsOpen] = useState(false);

  const reading = useMemo(
    () => runZLiarPreview(variance, credibility, corroboration),
    [variance, credibility, corroboration]
  );
  // Derived from the same zLiarMeter() the needle above runs — see
  // lib/zliar-markets.ts. Fixed reference clock, so it is SSR-stable.
  const markets = useMemo(() => zliarMarketsByCredibility(), []);

  const color = VERDICT_COLOR[reading.verdict];

  return (
    // mg-zliar-shell is the container-query context. The grid below MUST be
    // measured against this card, not the viewport — see the note on the class
    // in globals.css.
    <div className="mg-zliar-shell relative w-full rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-4 sm:p-6 overflow-hidden">
      {/* Ambient glow. Sized in % rather than a 420px square: at the phone
          width the fixed square was wider than the card, so its blur bled to
          the edges instead of pooling behind the gauge. */}
      <div className="absolute -top-[18%] left-1/2 -translate-x-1/2 w-[120%] aspect-square rounded-full blur-[120px] pointer-events-none" style={{ background: color, opacity: 0.12 }} />

      <header className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="w-5 h-5 shrink-0" style={{ color }} />
          <div className="min-w-0">
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">The Z-Liar Meter</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Narrative Credibility Instrument · Sentinel Engine</p>
          </div>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 text-center" style={{ borderColor: color + "55", color }}>
          {reading.verdict}
        </span>
      </header>

      <div className="mg-zliar-grid relative items-center">
        {/* The gauge. Was `mx-auto w-[340px] max-w-full` inside a grid whose
            first COLUMN was a fixed 340px — so in the 393px device frame the
            column itself overflowed, shoving the dial off-centre to the right
            while the second column collapsed to near-zero width and left a
            tall empty band below. Both are fixed by the container query;
            the dial is now a fluid max-width box that centres in whatever
            space it gets. */}
        <div className="mx-auto w-full max-w-[340px]">
          <HoldHint
            hint={{
              title: "Z-Liar markets",
              kind: "measured",
              body: `Tap the gauge to open all ${markets.length} credibility markets. Each one is scored by the same zLiarMeter() driving this needle — BS-index, GARCH volatility and lunar tilt.`,
              action: { label: "Open all markets", onSelect: () => setMarketsOpen(true) },
            }}
          >
            <button
              type="button"
              onClick={() => setMarketsOpen(true)}
              aria-haspopup="dialog"
              aria-label={`Z-Liar score ${Math.round(reading.score)}, ${reading.verdict}. Open all Z-Liar markets.`}
              className="block w-full bg-transparent border-0 p-0 cursor-pointer"
            >
              <AnalogDial
                value={reading.score}
                label="Z-LIAR SCORE"
                unit="ZL"
                subLabel={reading.verdict}
                accentColor={color}
                dialId="zliar"
              />
            </button>
          </HoldHint>
        </div>

        {/* analysis + controls */}
        <div className="space-y-4 min-w-0">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={2}
            className="w-full bg-[#030508] border border-neutral-850 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 font-sans resize-none focus:outline-none focus:border-cyan-500/40"
            placeholder="Paste a claim, headline, or hot take to audit…"
          />

          {/* MADHAT'r quip */}
          <div className="rounded-xl border px-4 py-3" style={{ borderColor: color + "33", background: "#03050880" }}>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">🎩 The MADHAT&apos;r reads it</p>
              {quip && (
                <span
                  className="font-mono text-[8px] uppercase tracking-widest px-1 rounded"
                  title={
                    quip.source === "llm"
                      ? "Written by the model for this specific claim."
                      : "Model unavailable — this is the stock line for this verdict, not a read of your claim."
                  }
                  style={
                    quip.source === "llm"
                      ? { background: "#7cffc733", color: "#7cffc7" }
                      : { background: "#ffffff1a", color: "#9aa4b2" }
                  }
                >
                  {quip.source === "llm" ? "live" : "stock line"}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-200 italic leading-relaxed">
              {auditing
                ? "Sentinel is reading it…"
                : quip
                  ? quip.text
                  : "Run the Sentinel audit to get the MADHAT'r's read on this claim."}
            </p>
          </div>

          {/* breakdown */}
          <div className="grid grid-cols-3 gap-2.5">
            <Metric icon={<Search className="w-3.5 h-3.5" />} label="BS Index" value={`${Math.round(reading.bs)}%`} color="#f5242a" />
            <Metric icon={<Activity className="w-3.5 h-3.5" />} label="GARCH σ²" value={reading.volatility.toFixed(3)} color="#58a6ff" />
            <Metric icon={<Moon className="w-3.5 h-3.5" />} label="Lunar Tilt" value={`+${reading.lunarTilt.toFixed(1)}`} color="#c98aff" />
          </div>

          {/* live sentiment equalizer */}
          <SentimentEqualizer amplitude={reading.score / 100} />

          {/* knobs */}
          <div className="space-y-2.5 pt-1">
            <Knob label="Narrative Variance" value={variance} onChange={setVariance} color="#f5242a" />
            <Knob label="Source Credibility" value={credibility} onChange={setCredibility} color="#7cffc7" />
            <Knob label="Corroboration" value={corroboration} onChange={setCorroboration} color="#58a6ff" />
          </div>

          <button
            onClick={async () => {
              // Keep the local maths call — it drives the dials and the audit
              // log instantly, and it is the same canon zLiarMeter the server
              // runs. The fetch is for the VOICE, which is the only part that
              // was ever fake here.
              runZLiar(statement, { variance, credibility, corroboration });
              setAuditing(true);
              try {
                const res = await fetch("/api/v1/madhatr/zliar", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    statement,
                    narrativeVariance: variance,
                    sourceCredibility: credibility,
                    corroboration,
                  }),
                });
                const d = await res.json();
                if (d?.success && typeof d.quip === "string") {
                  setQuip({ text: d.quip, source: d.quipSource === "llm" ? "llm" : "canned" });
                }
              } catch {
                /* the dials already updated; the voice is the optional half */
              } finally {
                setAuditing(false);
              }
            }}
            className="w-full rounded-xl py-2.5 font-mono text-xs uppercase tracking-widest font-bold transition-all hover:scale-[1.01]"
            style={{ background: color + "18", border: `1px solid ${color}55`, color }}
          >
            {auditing ? "Auditing…" : "Run Sentinel Audit"}
          </button>
        </div>
      </div>

      {/* ALL Z-LIAR MARKETS — auto carousel, at the foot of the instrument.
          It lives inside this card rather than as a sibling section so the
          meter and the markets it grades cannot drift apart on a page that
          mounts one without the other. Same data as the pop-up, same ordering,
          least credible first. */}
      <div className="relative mt-5 pt-4 border-t border-neutral-900">
        <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-2">
          All Z-Liar Markets
          <AutoShowcaseBadge />
        </p>
        <Carousel auto ariaLabel="All Z-Liar credibility markets">
          {markets.map((m) => (
            <ZMarketCard key={m.id} m={m} onOpen={() => setMarketsOpen(true)} />
          ))}
        </Carousel>
      </div>

      {marketsOpen && <ZMarketsDialog markets={markets} onClose={() => setMarketsOpen(false)} />}

      {/* history */}
      {zLiarHistory.length > 0 && (
        <div className="relative mt-6 pt-4 border-t border-neutral-900">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 mb-2">Audit Log</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {zLiarHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                <span className="text-neutral-400 truncate flex-1">{h.statement}</span>
                <span className="shrink-0" style={{ color: VERDICT_COLOR[h.reading.verdict] }}>{Math.round(h.reading.score)} · {h.reading.verdict}</span>
                <span className="text-neutral-700 shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One market tile — the carousel unit, and the row unit inside the dialog. */
function ZMarketCard({ m, onOpen, wide }: { m: ZLiarMarket; onOpen?: () => void; wide?: boolean }) {
  const col = credibilityColor(m.credibility);
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#f0f0f8] truncate">{m.subject}</p>
        <span className="font-mono text-[13px] font-black shrink-0" style={{ color: col }}>{m.credibility}%</span>
      </div>
      <p className="font-sans text-[10px] italic text-neutral-500 mb-2" style={{ minHeight: wide ? undefined : 26 }}>{m.claim}</p>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-600 truncate">{m.verdict}</span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-700 shrink-0">credibility</span>
      </div>
      <div className="flex gap-1.5">
        <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: "#f5242a18", color: "#f5242a" }}>LIAR {m.liarOdds}x</span>
        <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: "#00ff8818", color: "#00ff88" }}>TRUTH {m.truthOdds}x</span>
      </div>
    </>
  );
  const cls = `rounded-xl border border-neutral-850 bg-[#111520] p-3 text-left ${wide ? "w-full" : "w-[168px]"}`;
  return onOpen ? (
    <button type="button" onClick={onOpen} className={`${cls} cursor-pointer`}>{body}</button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * Every Z-Liar market, opened by tapping the gauge.
 *
 * Non-modal dressing kept deliberately thin: backdrop click and Escape both
 * close, focus is not trapped, and the list scrolls inside a capped height so
 * the dialog can never grow past the phone viewport — the failure mode the
 * pop-out on the Octavian panel had until its aside was given minHeight:0.
 */
function ZMarketsDialog({ markets, onClose }: { markets: ZLiarMarket[]; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All Z-Liar credibility markets"
      onClick={onClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
      style={{ background: "rgba(3,4,10,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[86vh] flex flex-col rounded-2xl border border-neutral-850 bg-[#05070c] p-4"
        style={{ boxShadow: "0 18px 60px rgba(0,0,0,0.55)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#f5242a" }} />
          <h3 className="flex-1 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[#f0f0f8]">
            All Z-Liar Markets
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-7 h-7 rounded-lg border border-neutral-850 flex items-center justify-center text-neutral-500 cursor-pointer bg-transparent"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 mb-3">
          {markets.length} markets · scored by zLiarMeter() · least credible first
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
          {markets.map((m) => <ZMarketCard key={m.id} m={m} wide />)}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-neutral-850 bg-[#030508] px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>{icon}<span className="font-mono text-[8px] uppercase tracking-wider text-neutral-500">{label}</span></div>
      <p className="font-mono text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function Knob({ label, value, onChange, color }: { label: string; value: number; onChange: (n: number) => void; color: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-1">
        <span>{label}</span><span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input type="range" aria-label={label} min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: color, background: "#11151c" }} />
    </div>
  );
}

// local preview mirror of zLiarMeter (keeps needle live without committing to history)
import { zLiarMeter } from "@/lib/gambit-game-math";
function runZLiarPreview(variance: number, credibility: number, corroboration: number) {
  return zLiarMeter({ narrativeVariance: variance, sourceCredibility: credibility, corroboration });
}
