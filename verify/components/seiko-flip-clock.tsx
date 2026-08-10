"use client";

/**
 * MAD Gambit — Seiko Split-Flap Flip Clock
 * ────────────────────────────────────────────────────────────────
 * The mockup's clock as a real split-flap (departure-board) display, not flat
 * glowing text: each digit is a gold-cased card whose top leaf folds down
 * (rotateX) to reveal the next value.
 *
 * - Tokens only: INK / GOLD_CHISEL_STOPS / INSTRUMENT_FONT (no local palette).
 * - `scale` prop: true layout scaling (card metrics multiply — no CSS transform
 *   blur, no overlap). scale={1.2} = the hub's 20%-enlarged chrono.
 * - Reduced-motion: honors prefers-reduced-motion — digits swap instantly.
 * - SSR-safe: renders a stable placeholder until mounted, so the server and
 *   first client paint match (no hydration mismatch from Date.now()).
 */
import React, { useEffect, useRef, useState } from "react";
import { INK, GOLD_CHISEL_STOPS, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

// Tile proportions follow the brief (taller than wide, ~0.68). Kept deliberately
// close to the pre-redesign footprint: the clock is flanked by the two analog
// dials in GambitInstrumentCluster on one centred, wrapping row, and a wider
// case pushes that row past its wrap threshold and drops the dials underneath.
const BASE_W = 32;
const BASE_H = 47;
const FLIP_MS = 500;

const goldCss = `linear-gradient(160deg, ${GOLD_CHISEL_STOPS.map(([o, c]) => `${c} ${o}%`).join(", ")})`;
/** Numerals are struck from the same chisel, top-lit — metal, not neon. */
const goldGlyph = `linear-gradient(180deg, ${GOLD_CHISEL_STOPS.map(([o, c]) => `${c} ${o}%`).join(", ")})`;

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

interface Metrics {
  w: number;
  h: number;
  fs: number;
  /** Tile corner radius. */
  r: number;
  /** Hinge-pin diameter. */
  pin: number;
}

/** One half of a digit card — the glyph clipped to its top or bottom band. */
function Half({ digit, half, m }: { digit: string; half: "top" | "bottom"; m: Metrics }) {
  const isTop = half === "top";
  return (
    <div
      style={{
        position: "relative",
        width: m.w,
        height: m.h / 2,
        overflow: "hidden",
        // Top leaf catches the light, bottom leaf falls into shadow — the
        // depth cue that makes a flat pair of divs read as one hinged card.
        background: isTop
          ? `linear-gradient(180deg, ${INK.bgCardHov}, ${INK.bgCard})`
          : `linear-gradient(180deg, ${INK.bgPanel}, ${INK.bgDeep})`,
        borderRadius: isTop ? `${m.r}px ${m.r}px 0 0` : `0 0 ${m.r}px ${m.r}px`,
        boxShadow: isTop
          ? "inset 0 1px 1px rgba(255,255,255,0.10)"
          : "inset 0 -2px 5px rgba(0,0,0,0.62)",
      }}
    >
      {/* Hairline seam between the two leaves */}
      <div
        style={{
          position: "absolute",
          top: isTop ? undefined : 0,
          bottom: isTop ? 0 : undefined,
          left: 0,
          right: 0,
          height: 1,
          background: "rgba(0,0,0,0.55)",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: isTop ? 0 : -m.h / 2,
          width: m.w,
          height: m.h,
          lineHeight: `${m.h}px`,
          textAlign: "center",
          fontFamily: INSTRUMENT_FONT,
          fontSize: m.fs,
          fontWeight: 900,
          // Struck metal, not neon: the chisel ramp is clipped to the glyph so
          // the numeral is lit top-down like the case around it. `color` stays
          // as the fallback for engines that ignore background-clip:text.
          color: INK.gold,
          background: goldGlyph,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: `drop-shadow(0 0 5px ${INK.gold}55)`,
        }}
      >
        {digit}
      </div>
    </div>
  );
}

function FlipDigit({ value, m }: { value: string; m: Metrics }) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const reduce = usePrefersReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (value === current) return;
    if (reduce) {
      setPrevious(value);
      setCurrent(value);
      return;
    }
    setPrevious(current);
    setCurrent(value);
    setFlipping(true);
    timer.current = setTimeout(() => setFlipping(false), FLIP_MS);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div style={{ position: "relative", width: m.w, height: m.h, perspective: Math.round(220 * (m.h / BASE_H)) }}>
      {/* Settled halves: top already shows the new value, bottom still shows old */}
      <Half digit={current} half="top" m={m} />
      <Half digit={flipping ? previous : current} half="bottom" m={m} />

      {/* Hinge pins — the axle the leaves pivot on, one each side at the seam. */}
      {(["left", "right"] as const).map((side) => (
        <span
          key={side}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: m.h / 2 - m.pin / 2,
            [side]: -m.pin / 2,
            width: m.pin,
            height: m.pin,
            borderRadius: "50%",
            background: goldCss,
            boxShadow: `0 0 3px ${INK.gold}88`,
            zIndex: 4,
          }}
        />
      ))}

      {flipping && (
        <>
          {/* Upper leaf of the OLD digit folding down */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transformOrigin: "50% 100%",
              transformStyle: "preserve-3d",
              animation: `mgFlipTop ${FLIP_MS}ms ease-in forwards`,
              zIndex: 3,
            }}
          >
            <Half digit={previous} half="top" m={m} />
          </div>
          {/* Lower leaf of the NEW digit folding into place */}
          <div
            style={{
              position: "absolute",
              top: m.h / 2,
              left: 0,
              transformOrigin: "50% 0%",
              transformStyle: "preserve-3d",
              transform: "rotateX(90deg)",
              animation: `mgFlipBottom ${FLIP_MS}ms ease-out forwards`,
              zIndex: 3,
            }}
          >
            <Half digit={current} half="bottom" m={m} />
          </div>
        </>
      )}
    </div>
  );
}

function Separator({ scale }: { scale: number }) {
  const dot = Math.max(3, Math.round(4 * scale));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: Math.round(6 * scale),
        padding: `0 ${Math.round(3 * scale)}px`,
      }}
      aria-hidden="true"
    >
      {[0, 1].map((i) => (
        <span key={i} style={{ width: dot, height: dot, borderRadius: "50%", background: INK.gold, boxShadow: `0 0 5px ${INK.gold}` }} />
      ))}
    </div>
  );
}

export default function SeikoFlipClock({ label = "MAD·TIME UTC", scale = 1 }: { label?: string; scale?: number }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("00:00:00");

  const m: Metrics = {
    w: Math.round(BASE_W * scale),
    h: Math.round(BASE_H * scale),
    fs: Math.round(32 * scale),
    r: Math.max(4, Math.round(7 * scale)),
    pin: Math.max(3, Math.round(4 * scale)),
  };

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const digits = time.replace(/:/g, "");
  const cells: React.ReactNode[] = [];
  digits.split("").forEach((d, i) => {
    cells.push(<FlipDigit key={`d${i}`} value={mounted ? d : "0"} m={m} />);
    if (i === 1 || i === 3) cells.push(<Separator key={`s${i}`} scale={scale} />);
  });

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {/* Gold case → recessed well → tiles. Three layers, because the case in
          the brief is a solid milled frame with the display sunk into it, not
          a gold rectangle with digits sitting on top of it. */}
      <div
        style={{
          padding: Math.round(9 * scale),
          borderRadius: Math.round(20 * scale),
          background: goldCss,
          boxShadow: [
            `0 0 26px ${INK.gold}33`,
            "0 6px 18px rgba(0,0,0,0.62)",
            "inset 0 1px 1px rgba(255,255,255,0.45)",
            "inset 0 -2px 5px rgba(0,0,0,0.42)",
          ].join(", "),
        }}
        role="timer"
        aria-label={`Platform clock ${time} UTC`}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: Math.round(4 * scale),
            padding: `${Math.round(6 * scale)}px ${Math.round(7 * scale)}px`,
            borderRadius: Math.round(13 * scale),
            background: `linear-gradient(180deg, ${INK.bgDeep}, #000000)`,
            boxShadow: `inset 0 3px 11px rgba(0,0,0,0.85), inset 0 0 0 1px ${INK.borderGold}`,
          }}
        >
          {cells}
        </div>
      </div>
      <span
        style={{
          fontFamily: INSTRUMENT_FONT,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 2,
          color: INK.muted,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      <style>{`
        @keyframes mgFlipTop {
          0%   { transform: rotateX(0deg); }
          100% { transform: rotateX(-90deg); }
        }
        @keyframes mgFlipBottom {
          0%   { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>
    </div>
  );
}
