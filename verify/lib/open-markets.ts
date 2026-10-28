/**
 * MAD Gambit — Open Markets engine (client-safe, pure).
 *
 * One pricing path for every open market: the DL-LMSR cost function, run as a
 * numerically stable log-sum-exp so a binary prediction market (n = 2) and a
 * Paseome conviction frontier (n = 3..5) price identically. This is the same
 * maths as `frontierPrices` in lib/paseome.ts and the server book behind
 * POST /api/v1/markets/[id]/swap; it lives here as a pure module so the demo
 * floor can quote, fill and mark positions without a round trip.
 *
 * Canon used, never restated as literals elsewhere:
 *   PLATFORM.FEE_BPS        188   → 1.88% flat, every trade
 *   PLATFORM.LMSR_DEFAULT_B 1200  → liquidity b
 *   FRONTIER_MIN / _MAX     3 / 5 → Paseome branch bounds
 */
import { PLATFORM } from "@/lib/gambit-game-math";
import { FRONTIER_MIN, FRONTIER_MAX, hasIrrealisMood } from "@/lib/paseome";
import { LEG_DAYS, nextLegClose } from "@/lib/lunar-legs";

export type OMClass = "prediction" | "conviction";
/** Paseome sides. Internally foresight/hindsight; shown as forward/counterfactual. */
export type OMSide = "forward" | "counterfactual";
export type OMPerp = "scandal" | "zliar" | "gossip" | "epiphany" | "faces" | "zeitgeist";
export type OMOrigin = "open" | "platform";

export interface OMOutcome {
  id: string;
  label: string;
  /** Outstanding shares — the LMSR state for this outcome. */
  q: number;
}

export interface OMMarket {
  id: string;
  cls: OMClass;
  side?: OMSide;
  perp?: OMPerp;
  origin: OMOrigin;
  title: string;
  category: string;
  emoji: string;
  /** null = never resolves (counterfactual Paseome trees, perpetuals). */
  closesAt: number | null;
  resolution: string;
  creator: string;
  b: number;
  outcomes: OMOutcome[];
  volume: number;
  traders: number;
  createdAt: number;
  /** Price snapshots for the sparkline, oldest first. */
  history: number[][];
}

export interface OMPosition {
  id: string;
  marketId: string;
  outcomeId: string;
  stake: number;
  fee: number;
  shares: number;
  avgPrice: number;
  at: number;
}

export const FEE_RATE = PLATFORM.FEE_BPS / 10_000; // 0.0188
export const OM_B = PLATFORM.LMSR_DEFAULT_B; // 1200
export const DEMO_START_CREDITS = 1_000;
export const PERP_LABEL: Record<OMPerp, string> = {
  scandal: "Scandal Velocity",
  zliar: "Z-Liar Meter",
  gossip: "Gossip-Cop",
  epiphany: "Perpetual Epiphanies",
  faces: "Five Faces",
  zeitgeist: "Zeitgeist",
};
export const PERPS: OMPerp[] = ["scandal", "zliar", "gossip", "epiphany", "faces", "zeitgeist"];

export function isPerp(v: unknown): v is OMPerp {
  return typeof v === "string" && (PERPS as string[]).indexOf(v) !== -1;
}

/* ── Pricing ─────────────────────────────────────────────────────────────── */

/** p_i = e^{q_i/b} / Σ_j e^{q_j/b}, computed with a max shift (log-sum-exp). */
export function prices(outcomes: OMOutcome[], b: number = OM_B): number[] {
  const z = outcomes.map((o) => o.q / b);
  const m = Math.max.apply(null, z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / s);
}

/** Display odds with the platform's exact 1.88% overround: 1 / (p · 1.0188). */
export function decimalOdds(p: number): number {
  return 1 / (Math.max(p, 1e-6) * (1 + FEE_RATE));
}

export interface Quote {
  stake: number;
  fee: number;
  net: number;
  shares: number;
  avgPrice: number;
  /** Paid if this outcome is taken: one $MADx per share. */
  payout: number;
  priceBefore: number;
  priceAfter: number;
}

/**
 * Shares received for a stake on outcome i.
 * Fee comes off first (1.88%); the net buys Δ shares where
 *   C(q + Δe_i) − C(q) = net,  C(q) = b·ln Σ e^{q_j/b}
 * which inverts in closed form to
 *   Δ = b · ln( (Z·(e^{net/b} − 1) + Z_i) / Z_i ).
 */
export function quote(market: OMMarket, outcomeIdx: number, stake: number): Quote {
  const b = market.b;
  const fee = round2(stake * FEE_RATE);
  const net = Math.max(0, stake - fee);
  const z = market.outcomes.map((o) => o.q / b);
  const m = Math.max.apply(null, z);
  const e = z.map((v) => Math.exp(v - m));
  const Z = e.reduce((a, v) => a + v, 0);
  const Zi = e[outcomeIdx];
  const shares = net > 0 ? b * Math.log((Z * Math.expm1(net / b) + Zi) / Zi) : 0;
  const before = prices(market.outcomes, b)[outcomeIdx];
  const after = prices(
    market.outcomes.map((o, i) => (i === outcomeIdx ? { ...o, q: o.q + shares } : o)),
    b,
  )[outcomeIdx];
  return {
    stake,
    fee,
    net,
    shares,
    avgPrice: shares > 0 ? net / shares : before,
    payout: shares,
    priceBefore: before,
    priceAfter: after,
  };
}

/** Maximum the market maker can lose on an n-outcome book: b · ln n. */
export interface SellQuote {
  shares: number;
  /** Book proceeds before the fee: C(q) − C(q − Δ·eᵢ). */
  gross: number;
  fee: number;
  /** What lands back in the balance. */
  net: number;
  priceBefore: number;
  priceAfter: number;
}

/**
 * Cash out Δ shares of outcome i back into the book before it settles.
 * LMSR proceeds are the cost-function drop, in closed form:
 *   gross = b · ln( Z / (Z − Zᵢ + Zᵢ·e^(−Δ/b)) )
 * evaluated in max-shifted space so large q never overflows. The same flat
 * 1.88% comes off the proceeds — one rake, both directions.
 */
export function sellQuote(market: OMMarket, outcomeIdx: number, shares: number): SellQuote {
  const b = market.b;
  const z = market.outcomes.map((o) => o.q / b);
  const m = Math.max.apply(null, z);
  const e = z.map((v) => Math.exp(v - m));
  const Z = e.reduce((a, v) => a + v, 0);
  const Zi = e[outcomeIdx];
  const Zafter = Z - Zi + Zi * Math.exp(-shares / b);
  const gross = shares > 0 ? Math.max(0, b * Math.log(Z / Zafter)) : 0;
  const fee = round2(gross * FEE_RATE);
  const before = prices(market.outcomes, b)[outcomeIdx];
  const after = prices(
    market.outcomes.map((o, i) => (i === outcomeIdx ? { ...o, q: o.q - shares } : o)),
    b,
  )[outcomeIdx];
  return { shares, gross: round2(gross), fee, net: round2(gross - fee), priceBefore: before, priceAfter: after };
}

/**
 * Conviction accrues with time held: 1 − e^(−t/τ), τ = 30 days — 63% at a
 * month, 95% at three. A display reading on the demo floor; it never moves a
 * price (no clock term in the market maker).
 */
export const CONVICTION_TAU_DAYS = 30;
export function convictionHeld(at: number, now: number = Date.now()): number {
  const days = Math.max(0, (now - at) / 86_400_000);
  return 1 - Math.exp(-days / CONVICTION_TAU_DAYS);
}

/**
 * Content policy, enforced at write time before any book opens: no market on
 * death, violence or harm to a person. Permissionless creation without this
 * is how open venues ended up listing assassination markets.
 */
const POLICY_BLOCK = /\b(assassinat\w*|murder\w*|kill(?:s|ed|ing)?|suicid\w*|overdos\w*|shooting|terror(?:ist|ism)?\s+attack|bomb(?:s|ed|ing)?|kidnap\w*|hostage\w*|rap(?:e|ed|ist)|dies|died|dying|death\s+toll)\b/i;
export function policyViolation(...texts: string[]): string | null {
  return texts.some((t) => POLICY_BLOCK.test(t))
    ? "MAD Gambit doesn't list markets on death, violence or harm to a person. Satire punches at the story, never the body."
    : null;
}

export function maxMakerLoss(n: number, b: number = OM_B): number {
  return b * Math.log(n);
}

/** Crowd split: each outcome's share of the outstanding book, for the split bar. */
export function crowdSplit(market: OMMarket): number[] {
  return prices(market.outcomes, market.b);
}

/** LMSR state that opens a book at a chosen probability vector. */
export function qForProbabilities(p: number[], b: number = OM_B): number[] {
  const min = Math.min.apply(null, p.map((v) => Math.max(v, 1e-6)));
  return p.map((v) => b * Math.log(Math.max(v, 1e-6) / min));
}

/* ── Validation for creation ─────────────────────────────────────────────── */

export interface PredictionDraft {
  title: string;
  category: string;
  closesAt: number;
  resolution: string;
  openingProbability: number; // 0.02 .. 0.98
}

export interface ConvictionDraft {
  side: OMSide;
  root: string;
  branches: string[];
  category: string;
}

export function validatePrediction(d: PredictionDraft): string | null {
  if (d.title.trim().length < 12) return "Write the question in full — at least 12 characters.";
  if (!/\?\s*$/.test(d.title.trim())) return "A prediction is a question — end it with a question mark.";
  if (!d.resolution.trim()) return "Name the source that settles it.";
  const policy = policyViolation(d.title, d.resolution);
  if (policy) return policy;
  if (!(d.closesAt > Date.now())) return "Pick a close date in the future.";
  if (!(d.openingProbability >= 0.02 && d.openingProbability <= 0.98)) return "Opening probability must sit between 2% and 98%.";
  return null;
}

export function validateConviction(d: ConvictionDraft): string | null {
  if (d.root.trim().length < 8) return "Give the tree a root — the event it forks from.";
  const branches = d.branches.map((x) => x.trim()).filter(Boolean);
  if (branches.length < FRONTIER_MIN || branches.length > FRONTIER_MAX) {
    return `A Paseome frontier holds ${FRONTIER_MIN} to ${FRONTIER_MAX} branches.`;
  }
  const policy = policyViolation(d.root, ...branches);
  if (policy) return policy;
  if (d.side === "counterfactual") {
    const bad = branches.filter((x) => !hasIrrealisMood(x));
    if (bad.length) return "Counterfactual branches need the irrealis mood — \"What if it had…\".";
  }
  return null;
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
export function pct(p: number, dp = 0): string {
  return (p * 100).toFixed(dp) + "%";
}
export function madx(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function compact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}
export function closesLabel(m: OMMarket, now: number = Date.now()): string {
  if (m.closesAt === null) return m.perp ? "Rolls every leg" : "Never resolves";
  const d = Math.max(0, Math.ceil((m.closesAt - now) / 86_400_000));
  return d === 0 ? "Closes today" : `Closes in ${d}d`;
}

/* ── Seeds ───────────────────────────────────────────────────────────────── */

interface SeedOpts {
  id: string;
  cls: OMClass;
  side?: OMSide;
  perp?: OMPerp;
  origin: OMOrigin;
  title: string;
  category: string;
  emoji: string;
  closesAt: number | null;
  resolution: string;
  labels: string[];
  p?: number[];
  volume: number;
  traders: number;
}

function seed(o: SeedOpts, now: number): OMMarket {
  const n = o.labels.length;
  const p = o.p ?? o.labels.map(() => 1 / n);
  const q = qForProbabilities(p, OM_B);
  const outcomes = o.labels.map((label, i) => ({ id: `${o.id}-${i}`, label, q: q[i] }));
  // A short, deterministic drift into today's price so the sparkline has shape.
  const history: number[][] = [];
  for (let k = 7; k >= 0; k--) {
    const wobble = outcomes.map((_, i) => p[i] * (1 + 0.06 * Math.sin((k + 1) * (i + 2) * 0.9)));
    const s = wobble.reduce((a, v) => a + v, 0);
    history.push(wobble.map((v) => v / s));
  }
  history[history.length - 1] = p.slice();
  return {
    id: o.id, cls: o.cls, side: o.side, perp: o.perp, origin: o.origin,
    title: o.title, category: o.category, emoji: o.emoji, closesAt: o.closesAt,
    resolution: o.resolution, creator: o.origin === "platform" ? "MAD Gambit" : "Founding creators",
    b: OM_B, outcomes, volume: o.volume, traders: o.traders, createdAt: now - 3 * 86_400_000, history,
  };
}

const YN = ["Yes", "No"];

/** The 8 creator examples, the platform's Paseome trees, and two markets per perpetual. */
export function seedMarkets(now: number = Date.now()): OMMarket[] {
  const leg = nextLegClose(now);
  const dec31 = Date.UTC(2026, 11, 31, 23, 59);
  const mar31 = Date.UTC(2027, 2, 31, 23, 59);
  const S = (o: SeedOpts) => seed(o, now);
  return [
    // ── Prediction · open (creator examples) ──
    S({ id: "seed-unprecedented", cls: "prediction", origin: "open", category: "Business", emoji: "📈",
      title: "Will \"unprecedented\" be said on 40+ S&P 500 earnings calls this quarter?",
      resolution: "Earnings-call transcripts, tallied at quarter close", closesAt: dec31, labels: YN, p: [0.62, 0.38], volume: 48_200, traders: 412 }),
    S({ id: "seed-ai-toaster", cls: "prediction", origin: "open", category: "Tech", emoji: "🤖",
      title: "Will a top-5 US retailer list a toaster marketed as \"AI-powered\" before Dec 31?",
      resolution: "Product page on a top-5 US retailer", closesAt: dec31, labels: YN, p: [0.41, 0.59], volume: 31_900, traders: 288 }),
    S({ id: "seed-magical", cls: "prediction", origin: "open", category: "Tech", emoji: "✨",
      title: "Will the next flagship-phone keynote say \"magical\" 3 or more times?",
      resolution: "Official keynote transcript", closesAt: mar31, labels: YN, p: [0.33, 0.67], volume: 22_400, traders: 197 }),
    S({ id: "seed-touch-grass", cls: "prediction", origin: "open", category: "Culture", emoji: "🌱",
      title: "Will a major English dictionary add \"touch grass\" before the next leg roll?",
      resolution: "Publisher's new-words announcement", closesAt: leg, labels: YN, p: [0.18, 0.82], volume: 12_750, traders: 133 }),
    // ── Conviction · The Paseome · open (creator examples) ──
    S({ id: "seed-rto", cls: "conviction", side: "forward", origin: "open", category: "Work", emoji: "🏢",
      title: "A company announces a return-to-office mandate.", closesAt: leg,
      resolution: "Optimistic oracle at the leg boundary · untaken branches refunded",
      labels: ["What if the badge readers go down on day one?", "What if attendance peaks only during free-bagel hour?", "What if it's postponed by a calendar invite nobody accepts?", "What if the office Wi-Fi requests remote work?"],
      p: [0.34, 0.29, 0.22, 0.15], volume: 19_600, traders: 164 }),
    S({ id: "seed-meter", cls: "conviction", side: "forward", origin: "open", category: "City", emoji: "🅿️",
      title: "A city installs its first AI-run parking meter.", closesAt: leg,
      resolution: "Optimistic oracle at the leg boundary · untaken branches refunded",
      labels: ["What if it starts ticketing pigeons?", "What if it discounts anyone who says please?", "What if it only accepts payment in compliments?"],
      p: [0.41, 0.36, 0.23], volume: 9_850, traders: 101 }),
    S({ id: "seed-email", cls: "conviction", side: "counterfactual", origin: "open", category: "Work", emoji: "📧",
      title: "If the meeting had been an email.", closesAt: null,
      resolution: "Never resolves — prices how strongly the belief persists",
      labels: ["What if it had been replied-all to 300 people?", "What if only out-of-office bots had answered?", "What if it had become a meeting anyway?"],
      p: [0.31, 0.21, 0.48], volume: 14_300, traders: 152 }),
    S({ id: "seed-groupchat", cls: "conviction", side: "counterfactual", origin: "open", category: "Social", emoji: "💬",
      title: "If the group chat had never been muted.", closesAt: null,
      resolution: "Never resolves — prices how strongly the belief persists",
      labels: ["What if the trip had actually been booked?", "What if the poll had reached a decision?", "What if the birthday reminder had arrived on the birthday?", "What if someone had read the 400 unread messages?"],
      p: [0.22, 0.17, 0.26, 0.35], volume: 11_200, traders: 118 }),
    // ── Certain-UnCertainty · platform-offered Paseome trees (no creator cut) ──
    S({ id: "plat-merger", cls: "conviction", side: "forward", origin: "platform", category: "Certain-UnCertainty", emoji: "♞",
      title: "The merger vote lands this leg.", closesAt: leg,
      resolution: "Optimistic oracle at the leg boundary · untaken branches refunded",
      labels: ["What if the vote is postponed and the paperwork resigns in protest?", "What if it passes and nobody notices for a month?", "What if it fails and the building keeps holding meetings anyway?", "What if the vote happens twice and both results stand?"],
      p: [0.395, 0.29, 0.225, 0.09], volume: 64_000, traders: 530 }),
    S({ id: "plat-deal", cls: "conviction", side: "counterfactual", origin: "platform", category: "Certain-UnCertainty", emoji: "♞",
      title: "If the deal had collapsed in the first leg.", closesAt: null,
      resolution: "Never resolves — prices how strongly the belief persists",
      labels: ["What if the committee had simply never been formed?", "What if the memo had leaked one day earlier?", "What if the quarterly review had achieved sentience and adjourned itself?"],
      p: [0.52, 0.31, 0.17], volume: 41_500, traders: 377 }),
    // ── Perpetuals · two per family, no expiry, roll each 59.061-day leg ──
    S({ id: "perp-scandal-hot", cls: "conviction", perp: "scandal", origin: "platform", category: "Scandal Velocity", emoji: "⚡", closesAt: null,
      title: "Scandal Velocity prints HOT before the leg rolls?", resolution: "GARCH(1,1) σ² band at the leg boundary", labels: YN, p: [0.34, 0.66], volume: 30_500, traders: 241 }),
    S({ id: "perp-scandal-pickup", cls: "conviction", perp: "scandal", origin: "platform", category: "Scandal Velocity", emoji: "⚡", closesAt: null,
      title: "Cross-source pickup triples inside one hour this leg?", resolution: "Wire pickup counter, hourly rollup", labels: YN, p: [0.22, 0.78], volume: 18_100, traders: 150 }),
    S({ id: "perp-zliar-dog", cls: "conviction", perp: "zliar", origin: "platform", category: "Z-Liar Meter", emoji: "🎭", closesAt: null,
      title: "\"The dog ate the quarterly report\" scores 60+ ZL (Serial Embellisher)?", resolution: "Sentinel Z-Liar score — statement only, never a name", labels: YN, p: [0.58, 0.42], volume: 26_800, traders: 233 }),
    S({ id: "perp-zliar-pivot", cls: "conviction", perp: "zliar", origin: "platform", category: "Z-Liar Meter", emoji: "🎭", closesAt: null,
      title: "\"We were always planning to pivot\" is rated Total Fabrication?", resolution: "Sentinel Z-Liar score — statement only, never a name", labels: YN, p: [0.27, 0.73], volume: 15_400, traders: 140 }),
    S({ id: "perp-gossip-418", cls: "conviction", perp: "gossip", origin: "platform", category: "Gossip-Cop", emoji: "🕵️", closesAt: null,
      title: "Claim #418 is substantiated before the leg rolls?", resolution: "Independent source count on the claim arc", labels: YN, p: [0.61, 0.39], volume: 41_000, traders: 318 }),
    S({ id: "perp-gossip-wedding", cls: "conviction", perp: "gossip", origin: "platform", category: "Gossip-Cop", emoji: "🕵️", closesAt: null,
      title: "The \"secret wedding\" rumor gets a second independent source?", resolution: "Independent source count on the claim arc", labels: YN, p: [0.38, 0.62], volume: 22_900, traders: 205 }),
    S({ id: "perp-epi-lindy", cls: "conviction", perp: "epiphany", origin: "platform", category: "Perpetual Epiphanies", emoji: "Φ", closesAt: null,
      title: "Lindy Pulse holds above 75 persistence this leg?", resolution: "Persistence reading at the leg boundary", labels: YN, p: [0.62, 0.38], volume: 37_200, traders: 296 }),
    S({ id: "perp-epi-murphy", cls: "conviction", perp: "epiphany", origin: "platform", category: "Perpetual Epiphanies", emoji: "Φ", closesAt: null,
      title: "Murphy's Law out-persists Goodhart's Law this leg?", resolution: "Persistence reading at the leg boundary", labels: YN, p: [0.55, 0.45], volume: 19_700, traders: 172 }),
    S({ id: "perp-faces-crown", cls: "conviction", perp: "faces", origin: "platform", category: "Five Faces", emoji: "👑", closesAt: null,
      title: "The crown changes faces before the Turning?", resolution: "Capped-simplex allocation at the Turning", labels: YN, p: [0.27, 0.73], volume: 28_400, traders: 214 }),
    S({ id: "perp-faces-five", cls: "conviction", perp: "faces", origin: "platform", category: "Five Faces", emoji: "👑", closesAt: null,
      title: "Which face wears the crown at the next leg roll?", resolution: "Capped-simplex allocation at the leg boundary",
      labels: ["Saint", "White Rice", "Megalomaniac", "Narcissist", "Sellout"], p: [0.31, 0.24, 0.18, 0.15, 0.12], volume: 33_100, traders: 260 }),
    S({ id: "perp-zeit-slate", cls: "conviction", perp: "zeitgeist", origin: "platform", category: "Zeitgeist", emoji: "⏳", closesAt: null,
      title: "Slate 03 survives the reseed?", resolution: "Succession slate at the leg boundary", labels: YN, p: [0.7, 0.3], volume: 24_600, traders: 190 }),
    S({ id: "perp-zeit-turning", cls: "conviction", perp: "zeitgeist", origin: "platform", category: "Zeitgeist", emoji: "⏳", closesAt: null,
      title: "The Turning lands on leg 6, not before?", resolution: `Six legs × ${LEG_DAYS.toFixed(3)} d on the lunar grid`, labels: YN, p: [0.44, 0.56], volume: 16_300, traders: 128 }),
  ];
}

/** Templates the create studio offers as "Start from an example". */
export const PREDICTION_EXAMPLES = seedMarkets(0).filter((m) => m.origin === "open" && m.cls === "prediction");
export const CONVICTION_EXAMPLES = seedMarkets(0).filter((m) => m.origin === "open" && m.cls === "conviction");
