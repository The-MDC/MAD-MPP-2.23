/**
 * MAD Gambit — the unified market view-model.
 * ══════════════════════════════════════════════════════════════════════
 * Three market types exist in this codebase and none of them share a base:
 *
 *   Market         lib/markets.ts     — the binary YES/NO ledger, dated resolution
 *   MarketProposal lib/market-classifier.ts — a classifier's proposal, not yet a row
 *   PerpMarket     lib/perp-store.ts  — a perpetual, advanced by legs, never settled
 *
 * Six components were each re-deriving "what a card needs to show" from
 * whichever of the three they happened to hold, in two different style systems.
 * This module is the one normalisation: every card takes a `MarketView`, so a
 * card never knows which table its data came from, and adding a fourth market
 * type means writing one `toView` branch rather than editing six components.
 *
 * WHAT IS REAL AND WHAT IS DERIVED. The platform has no price series — no AMM,
 * no market_prices table, no odds history, and until this file no odds→
 * probability helper at all. `createMarket` defaults odds to 2.0 and nothing
 * ever recomputes them. So `series` here is DERIVED, deterministically, from
 * the market's own real signals (perpProbability, zliarScore, convictionPrior)
 * plus a seeded drift — exactly the way the perp deck draws its tapes.
 *
 * The seam is deliberate: when a real feed lands, `series` and `change24h` are
 * the only fields that change, and no card is touched. Deterministic matters
 * twice over — `Math.random()` would re-roll between server and client render
 * and blow hydration.
 */
import type { Market } from "@/lib/markets";
import type { MarketProposal, MarketType } from "@/lib/market-classifier";
import type { PerpMarket } from "@/lib/perp-store";
import type { AccentVar } from "@/lib/deck-tokens";

/* ── Taxonomy ──────────────────────────────────────────────────────────── */

/**
 * The three classes the brand sells: PREDICTION · CONVICTION · PERPS.
 *
 * Worth stating plainly, because it surprised us: these three words appear
 * nowhere in the type system. They live as a colour tuple in brand-lockup.tsx
 * and as copy in the deck. The actual discriminant the code carries is
 * `MarketType` (8 members). This is the first place the brand taxonomy and the
 * code taxonomy are reconciled.
 */
export type MarketClass = "prediction" | "conviction" | "perp";

/**
 * MarketType → MarketClass. Annotated as a full Record so the compiler fails
 * the build if a ninth market type is added and not classified here — the
 * classifier's own comment warns that hand-listed maps rot silently, and a
 * checked Record is how you take that warning seriously.
 *
 *   prediction — resolves on a date, against a stated criterion
 *   conviction — grades a belief's strength; no clean win/lose
 *   perp       — no expiry at all; advances by lunar leg
 */
export const CLASS_OF_TYPE: Record<MarketType, MarketClass> = {
  progression: "prediction",
  saga: "prediction",
  zliar: "conviction",
  epiphany: "conviction",
  perp: "perp",
  gossipcop: "perp",
  faces: "perp",
  zeitgeist: "perp",
};

/**
 * The six perp families the deck ships and the brand sells.
 *
 * NOTE the mismatch this papers over: `PerpFamily` in lib/perp-store.ts has
 * only three members (faces · zeitgeist · epiphany) because only those three
 * have `perp_markets` rows. Scandal, Z-Liar and Gossip-Cop are real signals
 * with real instruments but no tradeable venue yet. Rather than hide them or
 * pretend they're tradeable, `tradeable: false` flows through to a visible
 * SIGNAL ONLY badge — a card must never imply a position the backend rejects.
 */
export const PERP_FAMILIES = [
  "scandal", "zliar", "gossip", "epiphany", "faces", "zeitgeist",
] as const;

export type PerpFamily6 = (typeof PERP_FAMILIES)[number];

/**
 * Families backed by a `perp_markets` row. The other three are signal-only.
 *
 * EXPORTED, and it must stay exported. This is the ONE rule that separates the
 * six families — whether a card offers a position or a SIGNAL ONLY badge — and
 * it was previously private, which forced lib/perp-family-markets.ts to keep a
 * hand-written copy whose own comment admitted it ("Mirrors TRADEABLE_FAMILIES
 * in market-view.ts, which is not exported"). Two sources of truth for a
 * tradeability rule is how a card ends up offering a position the backend
 * rejects — exactly what `tradeable: false` exists to prevent.
 *
 * Typed on PerpFamily6 rather than string so a family that leaves PERP_FAMILIES
 * fails the build here instead of silently dropping out of the set.
 */
export const TRADEABLE_FAMILIES: ReadonlySet<PerpFamily6> = new Set<PerpFamily6>([
  "faces",
  "zeitgeist",
  "epiphany",
]);

/** Per-family presentation, matching the deck card-for-card. */
export const FAMILY_META: Record<PerpFamily6, {
  label: string; accent: AccentVar; sym: string; symGlow: string; kicker: string;
}> = {
  scandal: {
    label: "Scandal Velocity", accent: "--ac", kicker: "GARCH(1,1) chaos index",
    sym: "/brand/card-scandal.png", symGlow: "rgba(126,91,239,.6)",
  },
  zliar: {
    label: "Z-Liar Meter", accent: "--a2", kicker: "Narrative credibility",
    sym: "/brand/card-zliar.png", symGlow: "rgba(252,52,55,.6)",
  },
  gossip: {
    label: "Gossip-Cop Perp", accent: "--a2", kicker: "Long-arc claim contest",
    sym: "/brand/card-gossip.png", symGlow: "rgba(126,91,239,.6)",
  },
  epiphany: {
    label: "Perpetual Epiphanies", accent: "--ac", kicker: "Mental-model book",
    sym: "/brand/card-epi.png", symGlow: "rgba(0,229,255,.6)",
  },
  faces: {
    label: "Five Faces", accent: "--gd", kicker: "Permanent vs transitory mask",
    sym: "/brand/card-faces.png", symGlow: "rgba(214,157,65,.6)",
  },
  zeitgeist: {
    label: "Zeitgeist", accent: "--po", kicker: "Succession slate and turning",
    sym: "/brand/card-zeit.png", symGlow: "rgba(0,255,136,.6)",
  },
};

/** The accent a card of each class claims when it has no family of its own. */
export const CLASS_ACCENT: Record<MarketClass, AccentVar> = {
  prediction: "--ac",
  conviction: "--gd",
  perp: "--a2",
};

/* ── The view-model ────────────────────────────────────────────────────── */

export interface Outcome {
  label: string;
  /** 0..1, already de-vigged across the market's outcomes. */
  prob: number;
  /** Decimal payout multiplier, as shown on the card. */
  multiplier: number;
  avatar?: string;
}

export interface MarketView {
  id: string;
  cls: MarketClass;
  /** Set only for perps. */
  family?: PerpFamily6;
  title: string;
  category: string;
  /** Brand symbol, for the card header. */
  sym?: string;
  symGlow?: string;
  kicker?: string;
  accent: AccentVar;

  /** Prediction + conviction: the tradeable legs. Empty for a pure perp. */
  outcomes: Outcome[];

  /** Perp instrumentation. Undefined where the class has no such reading. */
  mark?: number;
  change24h?: number;
  oi?: number;
  leverage?: number;
  /** 0..100 — the up share of the split bar. */
  upPct?: number;

  volume: number;
  /** Set on a category tile that stands for several markets. */
  marketCount?: number;
  /** ISO. A perp's next leg close; a prediction's resolution. */
  closesAt?: string | null;
  /** False ⇒ render a SIGNAL ONLY badge and no trade affordance. */
  tradeable: boolean;
  /** Normalised 0..1 sparkline points, oldest → newest. */
  series: number[];
}

/* ── Odds ──────────────────────────────────────────────────────────────── */

/**
 * Decimal odds → implied probability. This did not exist anywhere in the
 * codebase, which is why every surface showed raw `2.0` instead of `50%`.
 *
 * Guards a real division hazard: odds ≤ 0 (or non-finite) would otherwise
 * produce Infinity and poison every downstream percentage.
 */
export function impliedProb(odds: number): number {
  if (!Number.isFinite(odds) || odds <= 0) return 0;
  return 1 / odds;
}

/**
 * De-vig a set of decimal odds into probabilities summing to 1.
 *
 * Book odds carry overround — the raw implied probabilities sum to more than
 * 1, and the excess is the margin. Displaying un-normalised implied
 * probabilities is the classic prediction-market UI bug: two sides reading
 * 55%/55%. Normalising is what makes a split bar honest.
 */
export function deVig(odds: number[]): number[] {
  const raw = odds.map(impliedProb);
  const total = raw.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    // No usable odds at all — fall back to a flat book rather than NaNs.
    return odds.map(() => (odds.length > 0 ? 1 / odds.length : 0));
  }
  return raw.map((p) => p / total);
}

/* ── Derived series ────────────────────────────────────────────────────── */

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * FNV-1a over the market id. Any stable string hash would do; the requirement
 * is only that it is pure, so server and client agree and hydration holds.
 */
function seedOf(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A plausible walk ending at `end`, seeded by the market id.
 *
 * This is a placeholder for real price history and is labelled as such
 * wherever it renders. It is shaped rather than random: amplitude decays
 * toward the present so the line converges on the live reading instead of
 * ending on an arbitrary spike, which is what makes a fake sparkline look
 * fake.
 */
export function deriveSeries(id: string, end: number, points = 24): number[] {
  const seed = seedOf(id);
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < points; i++) {
    // xorshift32 — cheap, deterministic, adequate for a decorative walk.
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    const noise = (s / 0xffffffff - 0.5) * 0.34;
    // Decay toward the true reading as we approach the right edge.
    const decay = (i + 1) / points;
    out.push(clamp01(end + noise * (1 - decay * 0.85)));
  }
  out[points - 1] = clamp01(end);
  return out;
}

/** Percentage change between the first and last points of a derived series. */
function changeOf(series: number[]): number {
  if (series.length < 2) return 0;
  const first = series[0];
  const last = series[series.length - 1];
  if (first <= 0) return 0;
  return ((last - first) / first) * 100;
}

/* ── Normalisation ─────────────────────────────────────────────────────── */

/** Discriminate the three types structurally — none carries a shared tag. */
function isPerpMarket(m: object): m is PerpMarket {
  return "legIndex" in m && "subjectRef" in m;
}
function isProposal(m: object): m is MarketProposal {
  return "perpProbability" in m && "zliarScore" in m;
}

/** The ledger's binary market → a two-outcome prediction card. */
function fromMarket(m: Market): MarketView {
  const [pYes, pNo] = deVig([m.yesOdds, m.noOdds]);
  const series = deriveSeries(m.id, pYes);
  return {
    id: m.id,
    cls: "prediction",
    title: m.title,
    category: m.category,
    kicker: m.description ?? undefined,
    accent: CLASS_ACCENT.prediction,
    outcomes: [
      { label: "Yes", prob: pYes, multiplier: m.yesOdds },
      { label: "No", prob: pNo, multiplier: m.noOdds },
    ],
    upPct: Math.round(pYes * 100),
    volume: m.volume,
    closesAt: m.resolutionAt,
    // Only an open market can take a position; resolving/resolved/disputed cannot.
    tradeable: m.status === "open",
    change24h: changeOf(series),
    series,
  };
}

/** A classifier proposal → whichever class its market type belongs to. */
function fromProposal(p: MarketProposal, id: string): MarketView {
  const cls = CLASS_OF_TYPE[p.type];
  const family = FAMILY_OF_TYPE[p.type];
  // Each class reads its confidence off the signal that actually means
  // something for it, rather than a single generic "score".
  const reading =
    cls === "perp" ? p.perpProbability
    : cls === "conviction" ? p.zliarScore / 100
    : p.convictionPrior;
  const series = deriveSeries(id, clamp01(reading));
  const meta = family ? FAMILY_META[family] : undefined;
  return {
    id,
    cls,
    family,
    title: p.title,
    category: p.type,
    sym: meta?.sym,
    symGlow: meta?.symGlow,
    kicker: meta?.kicker ?? p.resolutionCriteria,
    accent: meta?.accent ?? CLASS_ACCENT[cls],
    outcomes: cls === "perp" ? [] : [
      { label: "Yes", prob: clamp01(reading), multiplier: payoutFor(clamp01(reading)) },
      { label: "No", prob: 1 - clamp01(reading), multiplier: payoutFor(1 - clamp01(reading)) },
    ],
    mark: clamp01(reading) * 100,
    upPct: Math.round(clamp01(reading) * 100),
    volume: 0,
    // A proposal is a candidate, not a row. Nothing about it is tradeable yet.
    tradeable: false,
    closesAt: null,
    change24h: changeOf(series),
    series,
  };
}

/** A live perpetual → a perp card. */
function fromPerp(m: PerpMarket): MarketView {
  const family = m.family as PerpFamily6;
  const meta = FAMILY_META[family];
  // `details` is untyped JSON; read defensively rather than trusting a shape
  // the database does not enforce.
  const reading = readNumber(m.details, "reading") ?? 0.5;
  const series = deriveSeries(m.id, clamp01(reading));
  return {
    id: m.id,
    cls: "perp",
    family,
    title: m.title,
    category: m.family,
    sym: meta?.sym,
    symGlow: meta?.symGlow,
    kicker: `${meta?.kicker ?? "Perpetual"} · leg ${m.legIndex}`,
    accent: meta?.accent ?? CLASS_ACCENT.perp,
    outcomes: [],
    mark: clamp01(reading) * 100,
    upPct: Math.round(clamp01(reading) * 100),
    oi: readNumber(m.details, "openInterest") ?? undefined,
    leverage: readNumber(m.details, "maxLeverage") ?? undefined,
    volume: m.volume,
    closesAt: m.legClosesAt,
    tradeable: m.status === "open" && TRADEABLE_FAMILIES.has(m.family),
    change24h: changeOf(series),
    series,
  };
}

/** Market types that map onto one of the six deck families. */
const FAMILY_OF_TYPE: Partial<Record<MarketType, PerpFamily6>> = {
  faces: "faces",
  zeitgeist: "zeitgeist",
  epiphany: "epiphany",
  gossipcop: "gossip",
  zliar: "zliar",
  perp: "scandal",
};

/** Safely pull a finite number out of an untyped JSON blob. */
function readNumber(o: Record<string, unknown> | null | undefined, key: string): number | null {
  const v = o?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Decimal payout for a probability, carrying the platform's 1.88% fee.
 * A fair book pays 1/p; the venue's fee comes off that, which is what a
 * trader actually receives.
 */
function payoutFor(p: number): number {
  if (p <= 0) return 0;
  return Math.round((1 / p) * (1 - 0.0188) * 100) / 100;
}

/* ── Formatting ────────────────────────────────────────────────────────── */

/**
 * Compact money, instrument-style: 1.2M / 48.3K / 912.
 *
 * Hand-rolled rather than Intl.NumberFormat with `notation: "compact"`,
 * because Intl's compact output is locale-dependent and would differ between
 * a server in one locale and a browser in another — a hydration mismatch on
 * every card that shows volume.
 */
export function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

/** Signed percentage, for a 24h change reading. */
export function fmtChange(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/**
 * Normalise any of the three market types into a `MarketView`.
 *
 * `id` is required for a `MarketProposal` because a proposal has no identity
 * of its own — it is a classifier output, not a row — and the view-model needs
 * a stable key for both React and the seeded series.
 */
export function toView(m: Market | PerpMarket): MarketView;
export function toView(m: MarketProposal, id: string): MarketView;
export function toView(m: Market | MarketProposal | PerpMarket, id?: string): MarketView {
  if (isPerpMarket(m)) return fromPerp(m);
  if (isProposal(m)) return fromProposal(m, id ?? m.title);
  return fromMarket(m);
}
