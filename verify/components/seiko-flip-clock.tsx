"use client";

/**
 * MAD Gambit — Seiko Split-Flap Flip Clock
 * ────────────────────────────────────────────────────────────────
 * The mockup's top-right clock as a real split-flap (departure-board)
 * display, not flat glowing text: each digit is a gold-cased card whose
 * top leaf folds down (rotateX) to reveal the next value.
 *
 * - Tokens only: INK / GOLD_CHISEL_STOPS / INSTRUMENT_FONT (no local palette).
 * - Reduced-motion: honors prefers-reduced-motion — digits swap instantly,
 *   no fold animation.
 * - SSR-safe: renders a stable placeholder until mounted, so the server and
 *   first client paint match (no hydration mismatch from Date.now()).
 */
import React, { useEffect, useRef, useState } from "react";
import { INK, GOLD_CHISEL_STOPS, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

const CARD_W = 30;
const CARD_H = 44;
const FLIP_MS = 500;

const goldCss = `linear-gradient(160deg, ${GOLD_CHISEL_STOPS.map(([o, c]) => `${c} ${o}%`).join(", ")})`;

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

/** One half of a digit card — the glyph clipped to its top or bottom band. */
function Half({ digit, half }: { digit: string; half: "top" | "bottom" }) {
  const isTop = half === "top";
  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H / 2,
        overflow: "hidden",
        background: INK.bgCard,
        borderRadius: isTop ? "5px 5px 0 0" : "0 0 5px 5px",
        borderTop: isTop ? `1px solid ${INK.borderGold}` : "none",
        borderBottom: isTop ? "none" : `1px solid ${INK.borderGold}`,
        borderLeft: `1px solid ${INK.borderGold}`,
        borderRight: `1px solid ${INK.borderGold}`,
        boxShadow: isTop ? "inset 0 1px 2px rgba(255,255,255,0.08)" : "inset 0 -2px 4px rgba(0,0,0,0.5)",
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
          top: isTop ? 0 : -CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          lineHeight: `${CARD_H}px`,
          textAlign: "center",
          fontFamily: INSTRUMENT_FONT,
          fontSize: 30,
          fontWeight: 800,
          color: INK.goldLcd,
          textShadow: `0 0 8px ${INK.gold}55`,
          background: "transparent",
        }}
      >
        {digit}
      </div>
    </div>
  );
}

function FlipDigit({ value }: { value: string }) {
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
    <div style={{ position: "relative", width: CARD_W, height: CARD_H, perspective: 220 }}>
      {/* Settled halves: top already shows the new value, bottom still shows old */}
      <Half digit={current} half="top" />
      <Half digit={flipping ? previous : current} half="bottom" />

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
            <Half digit={previous} half="top" />
          </div>
          {/* Lower leaf of the NEW digit folding into place */}
          <div
            style={{
              position: "absolute",
              top: CARD_H / 2,
              left: 0,
              transformOrigin: "50% 0%",
              transformStyle: "preserve-3d",
              transform: "rotateX(90deg)",
              animation: `mgFlipBottom ${FLIP_MS}ms ease-out forwards`,
              zIndex: 3,
            }}
          >
            <Half digit={current} half="bottom" />
          </div>
        </>
      )}
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 6,
        padding: "0 3px",
      }}
      aria-hidden="true"
    >
      {[0, 1].map((i) => (
        <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: INK.gold, boxShadow: `0 0 5px ${INK.gold}` }} />
      ))}
    </div>
  );
}

export default function SeikoFlipClock({ label = "MAD·TIME UTC" }: { label?: string }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("00:00:00");

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
    cells.push(<FlipDigit key={`d${i}`} value={mounted ? d : "0"} />);
    if (i === 1 || i === 3) cells.push(<Separator key={`s${i}`} />);
  });

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          padding: 6,
          borderRadius: 10,
          background: goldCss,
          boxShadow: `0 2px 10px rgba(0,0,0,0.5), inset 0 0 0 1px ${INK.borderGold}`,
        }}
        role="timer"
        aria-label={`Platform clock ${time} UTC`}
      >
        {cells}
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
