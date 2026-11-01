/**
 * MAD Gambit — the per-family mini report.
 * ────────────────────────────────────────────────────────────────
 * Each perp instrument opens a report read off THAT PERP'S OWN MARKET DATA —
 * its book, its flow and its implied prices — with the maths engine quoted as
 * the reading underneath the number, never as generic platform commentary.
 *
 * Ported from the Tickers-and-Dials design deck. Every figure was re-derived
 * against `lib/gambit-game-math.ts` before it was written down here:
 *
 *   Z-LIAR 77   bs 63 + √0.0181·100 (13.454) + 1.7·0.5 (0.85) = 77.30 → 77.
 *               σ² 0.0181 is `garchUpdate` on its own defaults:
 *               0.0001 + 0.05·0² + 0.90·0.02. Lunar tilt ∈ [0,15] from
 *               `getLunarPhaseMultiplier`, so +1.7 is in range. Score 77 is
 *               ≥60 and <80 → SERIAL EMBELLISHER, per `zLiarVerdictFor`.
 *   SCANDAL     σ² ×10⁴ = 44.9 → σ² 0.00449, under SCANDAL_BANDS' first rung
 *               edge of 0.010 → QUIET, whose cta is "Monitor for entry".
 *               Raw `garchUpdate` variance, not `garchSigma`'s clamped σ.
 *   FIVE FACES  .31 + .24 + .18 + .15 + .12 = 1.00 — the simplex closes, and
 *               matches perp-dials' WATERLINE weights exactly. τ perm .34 +
 *               τ trans .66 = 1.00.
 *   ZEITGEIST   Legs, not expiries. `lib/lunar-legs.ts`: LEG_DAYS 59.061177…
 *               (2 × LUNAR_CYCLE_MS), LEGS_PER_TURNING 6.
 *   FEES        Flat 1.88% platform rake. The community's 28.8%
 *               (PLATFORM.COMMUNITY_SHARE_BPS 2880) is taken off the NET that
 *               remains after the creator is paid, not off the gross — a
 *               two-stage waterfall. See `splitFee`.
 *
 * WHAT IS DELIBERATELY ABSENT. No funding rate, no mark/index basis, no
 * margin and no liquidation price. This platform's perpetuals are perpetual
 * CONVICTION markets — they roll on a leg, they carry a conviction layer and
 * they exit through a cooldown at a price locked at request. Writing futures
 * language over that schema would describe an instrument that does not exist.
 * See `sql/0012_perp_markets.sql`.
 */
import { LEG_DAYS, LEGS_PER_TURNING, currentLeg, legCountdown } from "@/lib/lunar-legs";

export interface ReportStat {
  k: string;
  v: string;
  c: string;
}

export interface ReportSection {
  label: string;
  /** Where the section is read from — printed next to the label, so no line
   *  of the report is unattributed. */
  src: string;
  lines: string[];
}

export interface PerpReport {
  title: string;
  kicker: string;
  stats: ReportStat[];
  sections: ReportSection[];
}

/** Keyed by DECK id — the ids in perp-dials' CARDS, not the family keys. */
export const PERP_REPORTS: Record<string, PerpReport> = {
  scandal: {
    title: "Scandal Velocity",
    kicker: "Read from the volatility book · epoch 137 · band QUIET",
    stats: [
      { k: "σ² ×10⁴", v: "44.9", c: "#8b93a7" },
      { k: "Implied HOT", v: "34%", c: "#d69d41" },
      { k: "Leg depth", v: "$305K", c: "#00e5ff" },
      { k: "Flow 24h", v: "+$41K", c: "#00ff88" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "The market prices a 34% chance of a HOT print before the next leg boundary, against 41% one leg ago. Conviction is leaving the tail, not the trade.",
        "Best bid sits 6 points under the engine's own band probability — the book is slower to believe a regime break than the model is.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "$41K net entered in 24h, 78% of it on the quiet side. Nine positions rolled at the last boundary; none exited.",
        "Average entry σ² 43.6 — the book is accumulating below the engine's current print.",
      ] },
      { label: "The maths underneath", src: "GARCH(1,1)", lines: [
        "σ² 0.00449, eleven epochs inside QUIET; last regime break epoch 126. Freshness half-life on the cluster is 19 hours.",
        "Band thresholds are fixed, so the call-to-action is a function of the print, not an editorial call.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "Positioning and price disagree about the same event, which is what makes the quiet band tradeable: the book pays for calm the model is only 34% sure will hold.",
      ] },
    ],
  },
  zliar: {
    title: "Z-Liar Meter",
    kicker: "Read from the audit book · verdict SERIAL EMBELLISHER",
    stats: [
      { k: "Z-Liar", v: "77", c: "#f5242a" },
      { k: "Implied fail", v: "71%", c: "#f5242a" },
      { k: "Audits 24h", v: "312", c: "#00e5ff" },
      { k: "Book skew", v: "3.1×", c: "#d69d41" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "Open conviction leans 71% toward the claim failing verification inside the leg — 3.1× more stake on fail than on hold.",
        "The market's implied score is 74 against the engine's 77. The book is fractionally kinder to the claim than the Sentinel is.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "312 audits in 24h; the twelve largest positions all entered above 70 ZL and none has trimmed.",
        "Corroboration ticked from 24% to 20% this session and the fail side added stake on every tick.",
      ] },
      { label: "The maths underneath", src: "Sentinel composite", lines: [
        "Score composites the BS-index (63%), GARCH volatility on the claim series (σ² 0.018) and the lunar tilt (+1.7): 63 + 13.45 + 0.85 = 77.",
        "Nine prior claims share this source lineage: six settled false — the prior the band is drawn against.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "Score and stake are moving together, so there is no edge in agreeing with the meter. The edge, if it exists, is in the 3-point gap between the book's implied 74 and the engine's 77.",
      ] },
    ],
  },
  gossip: {
    title: "Gossip-Cop Perp",
    kicker: "Read from the claim book · 12 live arcs · leg 2 of 6",
    stats: [
      { k: "Perp %", v: "61", c: "#f5242a" },
      { k: "Δ since roll", v: "+9", c: "#00ff88" },
      { k: "Leg depth", v: "$410K", c: "#00e5ff" },
      { k: "Claim heat", v: "61", c: "#d69d41" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "61% perp probability on claim #418, up 9 points since the last leg roll — the sharpest single-leg repricing in the family.",
        "Depth is thin above 70: $410K on the book, but only $38K of it sits in the top band.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "Three pickups against one retraction this leg, and stake followed the pickups within the hour on all three.",
        "Holders from leg 1 rolled 64% of notional rather than exiting at the boundary.",
      ] },
      { label: "The maths underneath", src: "claim heat", lines: [
        "Heat 61 is pickup velocity weighted by source authority and decayed on a 21-day half-life; the originating outlet scores 0.42 with two prior retractions in this subject class.",
        "Subject references are opaque and validated at the boundary — no name, handle or likeness enters the book.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "The repricing is running ahead of corroboration: four sources, one lineage. Thin depth above 70 means the next pickup moves the print further than the evidence justifies.",
      ] },
    ],
  },
  epi: {
    title: "Perpetual Epiphanies",
    kicker: "Read from the model book · 34 models · leg 3 of 6",
    stats: [
      { k: "Persistence", v: "77", c: "#00e5ff" },
      { k: "Book depth", v: "$2.1M", c: "#00ff88" },
      { k: "Leaders ↑", v: "3 of 4", c: "#00ff88" },
      { k: "Implied hold", v: "68%", c: "#d69d41" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "Chesterton Fence is priced to hold above 75 through the Turning at 68%; Lindy Pulse, the book's leader at 89, prices at 81%.",
        "Goodhart Watch is the only top-four model printing down, and it is the only one where the book is offered rather than bid.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "$2.1M across 34 models — the deepest family on the floor — but 61% of it sits in five names.",
        "Holds average 2.8 legs; almost nothing is traded inside a leg.",
      ] },
      { label: "The maths underneath", src: "persistence engine", lines: [
        "Persistence is a live market reading, not catalog metadata: a catalog re-sync never resets what the book has priced.",
        "Twelve of the 34 carry cross-domain evidence above 60; regional coverage is five.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "Concentration is the risk here, not direction. Five names carry the book, and their persistence prints move together when a leg rolls.",
      ] },
    ],
  },
  faces: {
    title: "Five Faces",
    kicker: "Read from the simplex book · crowned Saint · leg 3 of 6",
    stats: [
      { k: "Divergence", v: "88", c: "#d69d41" },
      { k: "Crown change", v: "27%", c: "#f5242a" },
      { k: "Leg depth", v: "$1.2M", c: "#00e5ff" },
      { k: "τ perm", v: ".34", c: "#00e5ff" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "Saint .31, White Rice .24, Megalomaniac .18, Narcissist .15, Sellout .12 — traded prices, projected onto the capped simplex, so the five always sum to one.",
        "A crown change before the Turning prices at 27%; the stake behind it is concentrated in Megalomaniac, not the runner-up.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "$1.2M open; the crowned face carries 44% of it, and slip-watchers holding the opposite side are up on the leg.",
        "Every new position since the last roll has been on a transitory face.",
      ] },
      { label: "The maths underneath", src: "CGARCH · simplex", lines: [
        "THE DIVERGENCE at 88 is the gap between permanent and transitory components; τ permanent .34, transitory .66, entropy .61.",
        "Each price ships with its Codex definition attached — there is no path that renders a face price without one.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "A .66 transitory weight against 44% of stake sitting on the crown is the imbalance in this book: the market owns the permanent story while the maths says two thirds of the mask is temporary.",
      ] },
    ],
  },
  zeit: {
    title: "Zeitgeist",
    kicker: "Read from the slate book · leg 3 of 6 · T−4d",
    stats: [
      { k: "Turning", v: "69", c: "#00ff88" },
      { k: "Survives reseed", v: "69%", c: "#00ff88" },
      { k: "Leg depth", v: "$880K", c: "#00e5ff" },
      { k: "Carry-through", v: "61%", c: "#d69d41" },
    ],
    sections: [
      { label: "What the book prices", src: "information market", lines: [
        "Slate 03 is priced to survive the reseed at 69%, four days out. The same slate priced 52% at the start of the leg.",
        "Ribbon depth 12; the burnout race is the only line on the slate the book is fading, down 21.",
      ] },
      { label: "Conviction flow", src: "position book", lines: [
        "$880K open, and 61% of holders roll rather than exit at the boundary — the highest carry-through on the floor.",
        "Exit requests lock their price at request, not at redemption, so the pre-Turning queue is not an option on the roll.",
      ] },
      { label: "The maths underneath", src: "lunar legs · succession", lines: [
        "Boundaries are global and anchored to the lunar epoch: two synodic months, 59.061 days, six legs to one Turning.",
        "The succession matrix is conserving this leg — the write path refuses a matrix that leaks holder value. Roll settles first, then advances; filter state carries forward.",
      ] },
      { label: "Insight", src: "derived", lines: [
        "A 17-point repricing inside one leg, with carry-through this high, means the book is positioned for continuity. A failed reseed would find very few sellers already out.",
      ] },
    ],
  },
};

/** How this family is classed, how deep its book is, and where it sits on the
 *  leg grid — the market-library row from the design deck. */
export interface LibraryRow {
  cls: "PREDICTION" | "CONVICTION" | "AFFLICTION";
  open: string;
  depth: string;
}

export const PERP_LIBRARY: Record<string, LibraryRow> = {
  faces: { cls: "PREDICTION", open: "18", depth: "$1.2M" },
  zeit: { cls: "PREDICTION", open: "12", depth: "$880K" },
  epi: { cls: "CONVICTION", open: "34", depth: "$2.1M" },
  zliar: { cls: "CONVICTION", open: "27", depth: "$640K" },
  gossip: { cls: "AFFLICTION", open: "12", depth: "$410K" },
  scandal: { cls: "AFFLICTION", open: "9", depth: "$305K" },
};

/** The one line that says what kind of instrument this is. Fixed text, from
 *  the constants — not a number anyone can drift. */
export const LEG_STRUCTURE_LINE =
  `Legs, not expiries · 2 synodic months = ${LEG_DAYS.toFixed(3)}d · ${LEGS_PER_TURNING} legs = one Turning`;

export interface LiveLeg {
  slot: string;
  countdown: string;
  progressPct: number;
  isTurningLeg: boolean;
}

/** The live position on the shared leg grid. Reads `Date.now()`, so call it
 *  from an effect — never during a render that the server also runs. */
export function liveLeg(atMs: number = Date.now()): LiveLeg {
  const leg = currentLeg(atMs);
  return {
    slot: `${leg.slotInTurning + 1} / ${LEGS_PER_TURNING}`,
    countdown: legCountdown(leg.closesAt, atMs),
    progressPct: Math.round(leg.progress * 100),
    isTurningLeg: leg.isTurningLeg,
  };
}
