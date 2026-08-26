"use client";

/**
 * MAD Gambit — the market deck.
 * ══════════════════════════════════════════════════════════════════════
 * All three market classes rendered from ONE view-model, on ONE set of
 * primitives, under ONE accent system: PREDICTION · CONVICTION · PERPS.
 *
 * This is the surface that proves the refactor. Every card below is built by
 * `toView()` from a genuinely different source type — the binary ledger, a
 * classifier proposal, a perpetual row — and none of the three card
 * components knows or cares which. Before this, six components each
 * re-derived that mapping by hand in two competing style systems.
 *
 * The sample rows are shaped exactly like their real counterparts so that
 * swapping in a fetch is a one-line change per deck, not a rewrite.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { DeckShell, DeckGrid, SectionTitle, DeckStyles, Pill } from "@/components/deck-primitives";
import { PredictionCard } from "@/components/market-card-prediction";
import { ConvictionCard } from "@/components/market-card-conviction";
import { PerpCard } from "@/components/market-card-perp";
import { deckVars, ROLE, TYPE, CANON, GEO, ENGRAVED } from "@/lib/deck-tokens";
import { toView, FAMILY_META, PERP_FAMILIES, type MarketView } from "@/lib/market-view";
import type { Market } from "@/lib/markets";
import type { PerpMarket } from "@/lib/perp-store";
import type { MarketProposal } from "@/lib/market-classifier";

/* ── Sample rows, shaped like the real tables ──────────────────────────── */

const ISO = (days: number) =>
  new Date(Date.UTC(2026, 7, 7) + days * 86400000).toISOString();

const PREDICTIONS: Market[] = [
  {
    id: "mkt-oscar-host", title: "Oscars host announced before October",
    category: "awards", description: "Resolves on the Academy's official announcement",
    creatorWallet: null, yesOdds: 1.62, noOdds: 2.55, status: "open", outcome: null,
    volume: 184_200, resolutionAt: ISO(54), createdAt: ISO(-30), updatedAt: ISO(-1),
  },
  {
    id: "mkt-label-split", title: "Label split confirmed this quarter",
    category: "music", description: "Any filing or statement from either party",
    creatorWallet: null, yesOdds: 3.4, noOdds: 1.38, status: "open", outcome: null,
    volume: 61_800, resolutionAt: ISO(23), createdAt: ISO(-12), updatedAt: ISO(-1),
  },
  {
    id: "mkt-tour-cancel", title: "Stadium leg cancelled before first date",
    category: "touring", description: "Promoter or artist confirmation required",
    creatorWallet: null, yesOdds: 6.2, noOdds: 1.14, status: "open", outcome: null,
    volume: 429_500, resolutionAt: ISO(9), createdAt: ISO(-40), updatedAt: ISO(-1),
  },
];

const CONVICTIONS: { id: string; p: MarketProposal }[] = [
  {
    id: "cv-comeback",
    p: {
      type: "zliar", zliarEligible: true, perpEligible: false,
      title: "Z-Liar: how real is the comeback narrative?",
      headline: "comeback narrative", horizonDays: 90,
      resolutionCriteria: "Sentinel BS-index across corroborating sources",
      zliarScore: 71, perpProbability: 0.4, sentiment: { valence: -0.6, intensity: 0.7, dopaminePotential: true },
      convictionPrior: 0.62, score: 0.78,
    },
  },
  {
    id: "cv-jevons",
    p: {
      type: "epiphany", zliarEligible: false, perpEligible: true,
      title: "Epiphany: does the Jevons read still hold?",
      headline: "Jevons paradox", horizonDays: 540,
      resolutionCriteria: "Model persistence across regions",
      zliarScore: 34, perpProbability: 0.77, sentiment: { valence: 0.05, intensity: 0.4, dopaminePotential: false },
      convictionPrior: 0.55, score: 0.66,
    },
  },
  {
    id: "cv-feud",
    p: {
      type: "zliar", zliarEligible: true, perpEligible: false,
      title: "Z-Liar: is the feud manufactured?",
      headline: "manufactured feud", horizonDays: 30,
      resolutionCriteria: "Source lineage and pickup pattern",
      zliarScore: 22, perpProbability: 0.3, sentiment: { valence: -0.6, intensity: 0.7, dopaminePotential: true },
      convictionPrior: 0.31, score: 0.59,
    },
  },
];

/** One perp per family, so all six — tradeable and signal-only alike — show. */
const PERPS: PerpMarket[] = PERP_FAMILIES.map((family, i) => ({
  id: `perp-${family}`,
  // The three signal-only families are not in PerpFamily; the cast is the
  // honest expression of that gap, and `tradeable` is what surfaces it.
  family: family as PerpMarket["family"],
  subjectRef: `subject-${family}-idx`,
  subjectClass: "index",
  title: FAMILY_META[family].label,
  status: "open",
  legIndex: 3,
  legOpenedAt: ISO(-18),
  legClosesAt: ISO(4 + i * 3),
  paramCommit: null,
  paramEpoch: 137,
  volume: 92_000 + i * 41_500,
  details: {
    reading: [0.72, 0.63, 0.61, 0.77, 0.34, 0.58][i],
    openInterest: 210_000 + i * 88_000,
    maxLeverage: [5, 3, 3, 10, 10, 5][i],
  },
  createdAt: ISO(-90),
  updatedAt: ISO(-1),
}));

/* ── Deck ──────────────────────────────────────────────────────────────── */

function Deck({ title, note, views, render, anchorId }: {
  title: string;
  note: string;
  views: MarketView[];
  render: (v: MarketView) => React.ReactNode;
  /**
   * Anchor id, so the four desk buttons on /preview can deep-link straight to
   * the class they name (/markets#prediction) instead of dumping the visitor
   * at the top of an undifferentiated list. scrollMarginTop keeps the heading
   * clear of the sticky header on arrival.
   */
  anchorId?: string;
}) {
  return (
    <DeckShell>
      <div id={anchorId} style={{ scrollMarginTop: 72, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <SectionTitle>{title}</SectionTitle>
        <span style={{ ...TYPE.brandSub, color: ENGRAVED }}>{note}</span>
      </div>
      <DeckGrid>{views.map((v) => <React.Fragment key={v.id}>{render(v)}</React.Fragment>)}</DeckGrid>
    </DeckShell>
  );
}

export default function MarketDeck() {
  const { skin, name, toggle } = useSkin();

  // Built once: toView is pure, and the derived series are seeded off ids, so
  // re-deriving them every render would be wasted work for identical output.
  const predictions = React.useMemo(() => PREDICTIONS.map((m) => toView(m)), []);
  const convictions = React.useMemo(() => CONVICTIONS.map(({ id, p }) => toView(p, id)), []);
  const perps = React.useMemo(() => PERPS.map((m) => toView(m)), []);

  return (
    <div style={{ ...deckVars(skin, { cols: 3 }), background: ROLE.bg, minHeight: "100vh", padding: "clamp(10px,2vw,22px)" }}>
      <DeckStyles />
      <div style={{ maxWidth: GEO.maxWidth, margin: "0 auto", display: "flex", flexDirection: "column", gap: GEO.gap }}>

        <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...TYPE.brand, color: ROLE.gold }}>MAD Gambit · Markets</div>
            <div style={{ ...TYPE.brandSub, color: ENGRAVED, marginTop: 3 }}>
              Prediction · Conviction · Perps — one view-model, one instrument language
            </div>
          </div>
          <Pill tone={ROLE.accent}>Fee {CANON.platformFee}</Pill>
          <Pill>Community {CANON.community}</Pill>
          <button
            type="button" onClick={toggle} className="mg-focusable"
            style={{ ...TYPE.chip, color: ROLE.text, background: "transparent", border: `1px solid ${ROLE.gold}`, borderRadius: GEO.pillRadius, padding: "5px 12px", cursor: "pointer" }}
          >
            Skin: {name}
          </button>
        </header>

        <Deck
          title="Prediction"
          anchorId="prediction"
          note="dated · resolves against a stated criterion · de-vigged"
          views={predictions}
          render={(v) => <PredictionCard view={v} />}
        />

        <Deck
          title="Conviction"
          anchorId="conviction"
          note="graded belief · no settle leg · creator ladder"
          views={convictions}
          render={(v) => <ConvictionCard view={v} />}
        />

        <Deck
          title="Perps"
          anchorId="perps"
          note="no expiry · advanced by lunar leg · three families are signal-only"
          views={perps}
          render={(v) => <PerpCard view={v} />}
        />

        <footer style={{ ...TYPE.brandSub, color: ENGRAVED, textAlign: "center", padding: "8px 0 24px" }}>
          Traces are modelled from live signals, not price history — the platform has no feed yet.
        </footer>
      </div>
    </div>
  );
}
