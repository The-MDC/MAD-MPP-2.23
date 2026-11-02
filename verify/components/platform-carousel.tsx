"use client";

/**
 * MAD Gambit — Platform Pillar Carousel
 * ══════════════════════════════════════════════════════════════════
 * Right-to-left continuous scroll of the platform's standing numbers. Each card
 * is a gold-cased instrument-panel tile, not a flat CSS card — matches the
 * fidelity standard set by gambit-instrument-cluster.tsx.
 *
 * Eight tiles, two families:
 *   PLATFORM  — Convictions · Predictions · Z-Liar Meter · Card Game
 *   YOU       — Active Bets · Degen Streak · Chaos Meter · Ladder
 * The second family used to be a separate row of four tiles under the hub's
 * clock (ACTIVE BETS / DEGEN STREAK / CHAOS METER / TOP GAINERS). They were the
 * same kind of thing — a number with a label — in a different format, so they
 * now ride this carousel in the same tile, rather than as a second strip.
 *
 * Tiles are larger and carry a meter where the number has a natural scale
 * (chaos out of 100, the streak toward Savage mode), so a card shows where the
 * number sits as well as what it is.
 *
 * "Right to left" = content visibly travels from right to left across
 * the viewport (items enter on the right, exit on the left), the
 * same physical motion as a stock ticker or news chyron.
 * ══════════════════════════════════════════════════════════════════ */

import React from "react";
import { GOLD_CHISEL_STOPS, INSTRUMENT_FONT, INK } from "@/lib/gambit-design-tokens";
import HoldHint from "@/components/hold-hint";
import type { HoldHintSpec } from "@/lib/hold-hint-context";
import { useGame } from "@/context/game-context";
import { streakReward } from "@/lib/gambit-game-math";
import usePlatformMetrics, { isLiveMetrics, type PlatformMetrics } from "@/hooks/use-platform-metrics";

interface PillarCard {
  id: string;
  title: string;
  stat: string;
  statLabel: string;
  color: string;
  glyph: string;
  /** 0..1 — draws a meter under the number when the stat has a natural scale. */
  fill?: number;
  /** Caption under the meter, left and right. */
  meter?: [string, string];
  /** Short status line when there is no meter. */
  note?: string;
}

/**
 * Three of the platform numbers were once asserted counts with nothing behind
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
 *
 * The four YOU tiles read the player's own state from the game context — bets,
 * streak, the chaos meter, the ladder — which is local to this browser.
 */
const DECK_SIZE = "992";

/** Streak length at which Savage mode starts (streakReward: 7 → 2.4x). */
const SAVAGE_AT = 7;

function mood(chaos: number): string {
  if (chaos >= 80) return "FRENZIED";
  if (chaos >= 60) return "HEATED";
  if (chaos >= 35) return "SIMMERING";
  return "CALM";
}

interface YouState {
  activeBets: number;
  streak: number;
  chaosMeter: number;
  leader: { handle: string; mmr: number } | null;
}

function pillars(m: PlatformMetrics | null, you: YouState): PillarCard[] {
  const dash = "—";
  const live = isLiveMetrics(m);
  const reward = streakReward(you.streak);
  return [
    { id: "convictions", title: "CONVICTIONS", stat: live ? String(m.activeMarkets) : dash, statLabel: "OPEN MARKETS",      color: "#ffcf40", glyph: "⚖", note: live ? "● MEASURED" : "○ NO DATABASE READING" },
    { id: "predictions", title: "PREDICTIONS", stat: live ? String(m.openBets) : dash,      statLabel: "PENDING WAGERS",    color: "#00e5ff", glyph: "◎", note: live ? "● MEASURED" : "○ NO DATABASE READING" },
    {
      id: "zliar", title: "Z-LIAR METER", stat: live ? `${Math.round(m.chaos)}` : dash, statLabel: "CHAOS INDEX (24H)", color: "#f5242a", glyph: "⚠",
      ...(live ? { fill: Math.max(0, Math.min(1, m.chaos / 100)), meter: ["CALM", "FRENZY"] as [string, string] } : { note: "○ NO DATABASE READING" }),
    },
    { id: "cardgame", title: "CARD GAME", stat: DECK_SIZE, statLabel: "CANONICAL DECK SIZE", color: "#00ff88", glyph: "♠", note: "● A CONSTANT, NOT A READING" },

    { id: "bets", title: "ACTIVE BETS", stat: String(you.activeBets), statLabel: "YOUR OPEN POSITIONS", color: "#00e5ff", glyph: "=", note: you.activeBets ? "● LIVE" : "○ NONE OPEN" },
    {
      id: "streak", title: "DEGEN STREAK", stat: String(you.streak), statLabel: you.streak >= SAVAGE_AT ? "🔥 SAVAGE" : "DAY STREAK", color: "#ffcf40", glyph: "⚡",
      fill: Math.min(1, you.streak / SAVAGE_AT),
      meter: [reward.multiplier > 1 ? `${reward.multiplier}x` : "1.0x", `${SAVAGE_AT}d · 2.4x`],
    },
    {
      id: "chaos", title: "CHAOS METER", stat: String(Math.round(you.chaosMeter)), statLabel: `MOOD · ${mood(you.chaosMeter)}`, color: "#ff6b9d", glyph: "❀",
      fill: Math.max(0, Math.min(1, you.chaosMeter / 100)), meter: ["CALM", "FRENZY"],
    },
    {
      id: "ladder", title: "LADDER", stat: you.leader ? you.leader.mmr.toLocaleString() : dash, statLabel: you.leader ? `TOP · ${you.leader.handle}` : "NO LADDER YET", color: "#00ff88", glyph: "♛",
      note: "○ SAMPLE LADDER",
    },
  ];
}

/**
 * What each tile explains on hover / press-and-hold. The deck size is a
 * compile-time constant from the maths engine and is always "measured"; the
 * platform numbers are only measured when the database actually answered, and
 * the four personal ones are local game state, so they say so.
 */
function hintFor(id: string, m: PlatformMetrics | null, you: YouState): HoldHintSpec {
  const live = isLiveMetrics(m);
  const noSource = "No database reading — the tile shows an em dash rather than a zero, because “nothing open” and “nothing to ask” are different answers.";
  const kind = live ? ("measured" as const) : ("estimated" as const);
  switch (id) {
    case "convictions":
      return { title: "Open markets", kind, body: live ? "Live count of markets in the `open` state, straight from the markets table." : noSource };
    case "predictions":
      return { title: "Pending wagers", kind, body: live ? "Live count of bets still in the `pending` state — placed, not yet settled." : noSource };
    case "zliar":
      return {
        title: "Chaos index",
        kind,
        body: live
          ? "24h mean GCAM scandal velocity from gdelt_signals, scaled to 0–100. Not the Z-Liar BS-index itself: that one is computed per statement by zLiarMeter(), so it has no platform-wide value. This is its honest platform analogue."
          : noSource,
      };
    case "bets":
      return { title: "Active bets", kind: "measured", body: "Your unresolved positions on this device. Personal, not platform-wide." };
    case "streak":
      return { title: "Degen streak", kind: "measured", body: `Your current winning-pick streak. The meter fills toward Savage mode at ${SAVAGE_AT} (streakReward: 2.4x). ${you.streak >= 3 ? "Bonus active." : "Bonus starts at 3."}` };
    case "chaos":
      return { title: "Chaos meter", kind: "measured", body: "The game's own chaos reading, which drives the backdrop speed and the VRS flash. Mood is a label on that number: calm under 35, simmering to 60, heated to 80, then frenzied." };
    case "ladder":
      return { title: "Ladder", kind: "sample", body: "Top of the tournament ladder. The ladder is seeded with sample handles until PvP is live, so treat the name as a placeholder." };
    default:
      return {
        title: "Canonical deck",
        kind: "measured",
        body: "PLATFORM.TOTAL_DECK_SIZE from lib/gambit-game-math — 992 cards. A constant, not a reading, so it is the one number here that cannot go stale.",
      };
  }
}

const TILE_W = 204;

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
        width: `${TILE_W}px`,
        background: `linear-gradient(180deg, ${pillar.color}12 0%, ${INK.bgCard} 46%)`,
        border: `1px solid ${pillar.color}40`,
        borderRadius: "16px",
        overflow: "hidden",
        marginRight: "12px",
        boxShadow: `0 0 0 1px rgba(0,0,0,.4), 0 10px 22px -14px ${pillar.color}88`,
      }}
    >
      <svg width="100%" height="6" viewBox={`0 0 ${TILE_W} 6`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`pillar-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            {GOLD_CHISEL_STOPS.map(([offset, c]) => <stop key={offset} offset={`${offset}%`} stopColor={c} />)}
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={TILE_W} height="6" fill={`url(#pillar-gold-${uid})`} />
      </svg>

      <div style={{ padding: "13px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "30px", height: "30px", borderRadius: "50%", fontSize: "16px", color: pillar.color,
              background: `radial-gradient(circle at 35% 30%, ${pillar.color}33, ${pillar.color}0d)`,
              border: `1px solid ${pillar.color}55`, boxShadow: `0 0 12px -2px ${pillar.color}66`,
            }}
          >
            {pillar.glyph}
          </span>
          <span style={{
            fontFamily: INSTRUMENT_FONT, fontSize: "10.5px", fontWeight: 800,
            color: pillar.color, letterSpacing: "1.5px",
          }}>
            {pillar.title}
          </span>
        </div>

        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "38px", fontWeight: 900,
          color: pillar.color, textShadow: `0 0 16px ${pillar.color}70`, lineHeight: 1,
        }}>
          {pillar.stat}
        </div>
        <div style={{
          fontFamily: INSTRUMENT_FONT, fontSize: "10px", fontWeight: 700, color: INK.muted,
          letterSpacing: "0.8px", marginTop: "6px",
        }}>
          {pillar.statLabel}
        </div>

        {pillar.fill !== undefined && pillar.meter ? (
          <div style={{ marginTop: "11px" }}>
            <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,.08)", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(0,0,0,.6)" }}>
              <div style={{
                width: `${Math.max(3, pillar.fill * 100)}%`, height: "100%", borderRadius: "999px",
                background: `linear-gradient(90deg, ${pillar.color}88, ${pillar.color})`,
                boxShadow: `0 0 8px ${pillar.color}`, transition: "width .6s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontFamily: INSTRUMENT_FONT, fontSize: "8.5px", letterSpacing: "0.8px", color: INK.muted }}>
              <span>{pillar.meter[0]}</span><span>{pillar.meter[1]}</span>
            </div>
          </div>
        ) : pillar.note ? (
          <div style={{ marginTop: "11px", fontFamily: INSTRUMENT_FONT, fontSize: "8.5px", fontWeight: 800, letterSpacing: "1px", color: `${pillar.color}cc` }}>
            {pillar.note}
          </div>
        ) : null}
      </div>
    </div>
    </HoldHint>
  );
}

export default function PlatformCarousel() {
  const metrics = usePlatformMetrics();
  const { positions, streak, chaosMeter, ladder } = useGame();

  const top = ladder[0];
  const you: YouState = {
    activeBets: positions.filter((p) => !p.resolved).length,
    streak,
    chaosMeter,
    leader: top ? { handle: top.handle, mmr: top.mmr } : null,
  };

  // Tripled, not doubled — the keyframe below travels to -33.333%, so the
  // repeating unit must be exactly one third of the track.
  const cards = pillars(metrics, you);
  const loop = [...cards, ...cards, ...cards];

  return (
    <div style={{ overflow: "hidden", padding: "12px 0" }}>
      <div
        style={{
          display: "flex",
          // Eight tiles instead of four: the same speed over twice the length.
          animation: "gambitPillarScroll 48s linear infinite",
          width: "max-content",
        }}
      >
        {loop.map((p, i) => (
          <GoldPillarTile key={`${p.id}-${i}`} pillar={p} uid={`pillar-${i}`} hint={hintFor(p.id, metrics, you)} />
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
