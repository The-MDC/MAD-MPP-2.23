"use client";

/**
 * MAD Gambit — Platform Pillar Carousel
 * ══════════════════════════════════════════════════════════════════
 * Right-to-left continuous scroll of the 4 core platform pillars:
 * Convictions, Predictions, Z-Liar Meter, Card-game. Each card is a
 * gold-cased instrument-panel tile, not a flat CSS card — matches the
 * fidelity standard set by gambit-instrument-cluster.tsx.
 *
 * "Right to left" = content visibly travels from right to left across
 * the viewport (items enter on the right, exit on the left), the
 * same physical motion as a stock ticker or news chyron.
 * ══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";
import HoldHint from "@/components/hold-hint";
import type { HoldHintSpec } from "@/lib/hold-hint-context";

interface PillarCard {
  id: string;
  title: string;
  stat: string;
  statLabel: string;
  color: string;
  glyph: string;
}

/**
 * Three of these four numbers were asserted platform counts with nothing behind
 * them — "18 OPEN CONVICTIONS", "34 ACTIVE PREDICTIONS", "88.5 CURRENT
 * BS-INDEX" were literals in this array. Only the deck size was real (it is
 * PLATFORM.TOTAL_DECK_SIZE).
 *
 * They now come from GET /api/v1/dopamine/metrics, which aggregates `markets`,
 * `bets` and `gdelt_signals` in SQL. Where a metric genuinely has no source the
 * tile shows an em dash rather than inventing one:
 *
 *   OPEN CONVICTIONS  → open perp/conviction positions. `activeMarkets` is the
 *                       closest true count the platform exposes today.
 *   ACTIVE PREDICTIONS→ `openBets`, pending wagers.
 *   CURRENT BS-INDEX  → `chaos`, the 24h GCAM scandal-velocity mean. The
 *                       Z-Liar BS-index proper is computed per statement
 *                       (zLiarMeter), not platform-wide, so this is the honest
 *                       platform analogue and is labelled as chaos.
 *   DECK SIZE         → unchanged; it was always a real constant.
 */
const DECK_SIZE = "992";

interface Metrics {
  activeMarkets: number;
  openBets: number;
  chaos: number;
  source: "live" | "demo" | string;
}

/**
 * `source` was being fetched and then thrown away, and that was not cosmetic.
 * /api/v1/dopamine/metrics answers a database-less deployment with a ZEROED
 * metrics object tagged source:"demo" \u2014 so the tiles rendered "0 OPEN MARKETS"
 * and "0 PENDING WAGERS", which is a specific, confident, false claim. A
 * platform with no database and a platform with genuinely nothing open are not
 * the same state and must not read the same.
 *
 * Demo therefore falls back to the em dash, exactly as a failed fetch already
 * did, and the hint on each tile says which of the two it is in words.
 */
function isLive(m: Metrics | null): m is Metrics {
  return !!m && m.source === "live";
}

function pillars(m: Metrics | null): PillarCard[] {
  const dash = "\u2014";
  const live = isLive(m);
  return [
    { id: "convictions", title: "CONVICTIONS", stat: live ? String(m.activeMarkets) : dash, statLabel: "OPEN MARKETS",      color: "#ffcf40", glyph: "\u2696" },
    { id: "predictions", title: "PREDICTIONS", stat: live ? String(m.openBets) : dash,      statLabel: "PENDING WAGERS",    color: "#00e5ff", glyph: "\u25CE" },
    { id: "zliar",       title: "Z-LIAR METER", stat: live ? `${Math.round(m.chaos)}` : dash, statLabel: "CHAOS INDEX (24H)", color: "#fc3437", glyph: "\u26A0" },
    { id: "cardgame",    title: "CARD GAME",    stat: DECK_SIZE, statLabel: "CANONICAL DECK SIZE", color: "#00ff88", glyph: "\u2660" },
  ];
}

/**
 * What each tile explains on hover / press-and-hold. The deck size is a
 * compile-time constant from the maths engine and is always "measured"; the
 * other three are only measured when the database actually answered.
 */
function hintFor(id: string, m: Metrics | null): HoldHintSpec {
  const live = isLive(m);
  const noSource = "No database reading \u2014 the tile shows an em dash rather than a zero, because \u201Cnothing open\u201D and \u201Cnothing to ask\u201D are different answers.";
  const kind = live ? ("measured" as const) : ("estimated" as const);
  switch (id) {
    case "convictions":
      return { title: "Open markets", kind, body: live ? "Live count of markets in the `open` state, straight from the markets table." : noSource };
    case "predictions":
      return { title: "Pending wagers", kind, body: live ? "Live count of bets still in the `pending` state \u2014 placed, not yet settled." : noSource };
    case "zliar":
      return {
        title: "Chaos index",
        kind,
        body: live
          ? "24h mean GCAM scandal velocity from gdelt_signals, scaled to 0\u2013100. Not the Z-Liar BS-index itself: that one is computed per statement by zLiarMeter(), so it has no platform-wide value. This is its honest platform analogue."
          : noSource,
      };
    default:
      return {
        title: "Canonical deck",
        kind: "measured",
        body: "PLATFORM.TOTAL_DECK_SIZE from lib/gambit-game-math \u2014 992 cards. A constant, not a reading, so it is the one number here that cannot go stale.",
      };
  }
}

function GoldPillarTile({ pillar, uid, hint }: { pillar: PillarCard; uid: string; hint: HoldHintSpec }) {
  return (
    <HoldHint hint={hint}>
    <div
      // Focusable so the explanation is reachable by keyboard, not just by
      // pointer — the tile is a readout, so tabIndex 0 with no role is the
      // honest description: something you can inspect, not something you press.
      tabIndex={0}
      style={{
        flex: "0 0 auto",
        width: "168px",
        background: INK.bgCard,
        border: `1px solid ${pillar.color}30`,
        borderRadius: "14px",
        overflow: "hidden",
        marginRight: "10px",
      }}
    >
      <svg width="100%" height="6" viewBox="0 0 168 6" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`pillar-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="168" height="6" fill={`url(#pillar-gold-${uid})`} />
      </svg>

      <div style={{ padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "18px", color: pillar.color }}>{pillar.glyph}</span>
          <span style={{
            fontFamily: INSTRUMENT_FONT, fontSize: "9px", fontWeight: 800,
            color: pillar.color, letterSpacing: "1.5px",
          }}>
            {pillar.title}
          </span>
        </div>

        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "26px", fontWeight: 900,
          color: pillar.color, textShadow: `0 0 12px ${pillar.color}60`, lineHeight: 1,
        }}>
          {pillar.stat}
        </div>
        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "9px", color: INK.muted,
          letterSpacing: "0.5px", marginTop: "4px",
        }}>
          {pillar.statLabel}
        </div>
      </div>
    </div>
    </HoldHint>
  );
}

export default function PlatformCarousel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/dopamine/metrics")
      .then((r) => r.json())
      .then((d) => { if (alive && d?.metrics) setMetrics(d.metrics); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Tripled, not doubled — the keyframe below travels to -33.333%, so the
  // repeating unit must be exactly one third of the track.
  const cards = pillars(metrics);
  const loop = [...cards, ...cards, ...cards];

  return (
    <div style={{ overflow: "hidden", padding: "10px 0" }}>
      <div
        style={{
          display: "flex",
          animation: "gambitPillarScroll 22s linear infinite",
          width: "max-content",
        }}
      >
        {loop.map((p, i) => (
          <GoldPillarTile key={`${p.id}-${i}`} pillar={p} uid={`pillar-${i}`} hint={hintFor(p.id, metrics)} />
        ))}
      </div>
      <style>{`
        @keyframes gambitPillarScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
