"use client";

/**
 * MAD Gambit — Dopamine glyphs (CSS 3D).
 * ────────────────────────────────────────────────────────────────
 * One bespoke animated glyph per platform-wide stat on the dopamine
 * carousel. Every glyph is real CSS 3D — `perspective` + `preserve-3d` on
 * actual transformed planes — not a 2D loop dressed up as depth, because
 * these sit directly under the Seiko and have to read as the same hardware.
 *
 * Each stat gets its OWN motion, and the motion is the stat's argument:
 * conviction turns a solid you can inspect from any face; prediction flips
 * a two-sided coin; sentiment tilts a bank of faders; impressions push
 * rings outward through Z; velocity orbits; liquidity stacks and settles.
 * Swapping any two would be wrong even though both would still animate.
 *
 * Motion is CSS-only so it costs no main-thread work and stops dead under
 * prefers-reduced-motion — declared once in GlyphStyles, not per glyph.
 */
import React from "react";

const BOX = 54;

/** Keyframes + the reduced-motion kill switch. Mount once per page. */
export function GlyphStyles() {
  return (
    <style>{`
      .mg-g { transform-style: preserve-3d; }
      @keyframes mgCubeSpin  { from { transform: rotateX(-22deg) rotateY(0deg); }
                               to   { transform: rotateX(-22deg) rotateY(360deg); } }
      @keyframes mgCoinFlip  { from { transform: rotateY(0deg); }
                               to   { transform: rotateY(360deg); } }
      @keyframes mgFader     { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
      @keyframes mgRingOut   { from { transform: translateZ(-26px) scale(0.35); opacity: 0; }
                               35%  { opacity: 1; }
                               to   { transform: translateZ(22px) scale(1.25); opacity: 0; } }
      @keyframes mgOrbit     { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      @keyframes mgOrbitFace { from { transform: rotateY(0deg); } to { transform: rotateY(-360deg); } }
      @keyframes mgStack     { 0%,100% { transform: translateY(0) rotateX(64deg); }
                               50%     { transform: translateY(-7px) rotateX(64deg); } }
      @media (prefers-reduced-motion: reduce) {
        .mg-g, .mg-g * { animation: none !important; }
      }
    `}</style>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: BOX,
        height: BOX,
        margin: "8px auto 6px",
        perspective: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

/** Conviction — a solid that turns so every face can be inspected. */
export function ConvictionCube({ color }: { color: string }) {
  const s = 30;
  const faces: React.CSSProperties[] = [
    { transform: `rotateY(0deg) translateZ(${s / 2}px)` },
    { transform: `rotateY(90deg) translateZ(${s / 2}px)` },
    { transform: `rotateY(180deg) translateZ(${s / 2}px)` },
    { transform: `rotateY(270deg) translateZ(${s / 2}px)` },
    { transform: `rotateX(90deg) translateZ(${s / 2}px)` },
    { transform: `rotateX(-90deg) translateZ(${s / 2}px)` },
  ];
  return (
    <Frame>
      <div className="mg-g" style={{ width: s, height: s, position: "relative", animation: "mgCubeSpin 7s linear infinite" }}>
        {faces.map((f, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: s,
              height: s,
              border: `1px solid ${color}`,
              background: `${color}14`,
              boxShadow: `0 0 10px ${color}55, inset 0 0 10px ${color}22`,
              ...f,
            }}
          />
        ))}
      </div>
    </Frame>
  );
}

/** Prediction — a two-sided coin; the market is a binary landing one way. */
export function PredictionCoin({ color, alt }: { color: string; alt: string }) {
  const d = 38;
  const face = (bg: string, label: string, back?: boolean): React.CSSProperties => ({
    position: "absolute",
    width: d,
    height: d,
    borderRadius: "50%",
    border: `2px solid ${bg}`,
    background: `radial-gradient(circle at 34% 30%, ${bg}44, transparent 70%)`,
    color: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.5,
    backfaceVisibility: "hidden",
    boxShadow: `0 0 12px ${bg}55`,
    transform: back ? "rotateY(180deg)" : undefined,
  });
  return (
    <Frame>
      <div className="mg-g" style={{ width: d, height: d, position: "relative", animation: "mgCoinFlip 4.2s ease-in-out infinite" }}>
        <span style={face(color, "YES")}>YES</span>
        <span style={face(alt, "NO", true)}>NO</span>
      </div>
    </Frame>
  );
}

/** Sentiment — a bank of faders, tilted into depth. */
export function SentimentFaders({ color, alt }: { color: string; alt: string }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <Frame>
      <div
        className="mg-g"
        style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 36, transform: "rotateX(16deg) rotateY(-20deg)" }}
      >
        {bars.map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 36,
              borderRadius: 2,
              transformOrigin: "bottom",
              background: `linear-gradient(180deg, ${i % 2 ? alt : color}, ${i % 2 ? alt : color}33)`,
              boxShadow: `0 0 8px ${i % 2 ? alt : color}66`,
              animation: `mgFader ${1.6 + i * 0.22}s ease-in-out ${i * 0.13}s infinite`,
            }}
          />
        ))}
      </div>
    </Frame>
  );
}

/** Impressions — rings pushed outward through Z, reach expanding. */
export function ImpressionRings({ color }: { color: string }) {
  return (
    <Frame>
      <div className="mg-g" style={{ position: "relative", width: 40, height: 40 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${color}`,
              boxShadow: `0 0 12px ${color}66`,
              animation: `mgRingOut 2.6s ease-out ${i * 0.86}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            inset: 15,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>
    </Frame>
  );
}

/** Velocity — a body on an orbit, the plane itself turning in 3D. */
export function VelocityOrbit({ color, alt }: { color: string; alt: string }) {
  const r = 40;
  return (
    <Frame>
      <div className="mg-g" style={{ position: "relative", width: r, height: r, animation: "mgOrbit 5s linear infinite" }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1.5px solid ${color}66`,
            transform: "rotateX(72deg)",
            boxShadow: `0 0 10px ${color}44`,
          }}
        />
        <span style={{ position: "absolute", inset: 14, borderRadius: "50%", background: `${color}`, boxShadow: `0 0 12px ${color}` }} />
        {/* Counter-rotated so the travelling body never reads as edge-on. */}
        <span
          className="mg-g"
          style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) rotateX(72deg) translateX(${r / 2}px)` }}
        >
          <span
            style={{
              display: "block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: alt,
              boxShadow: `0 0 10px ${alt}`,
              animation: "mgOrbitFace 5s linear infinite",
            }}
          />
        </span>
      </div>
    </Frame>
  );
}

/** Liquidity — depth as stacked plates that settle. */
export function LiquidityStack({ color }: { color: string }) {
  return (
    <Frame>
      <div className="mg-g" style={{ position: "relative", width: 40, height: 40 }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 8 + i * 7,
              height: 12,
              borderRadius: "50%",
              border: `1.5px solid ${color}`,
              background: `${color}1f`,
              boxShadow: `0 0 8px ${color}44`,
              animation: `mgStack ${2.2 + i * 0.2}s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
    </Frame>
  );
}
