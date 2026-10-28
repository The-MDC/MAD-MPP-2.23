/**
 * MAD Gambit — margin explainers.
 *
 * One short blurb per section: what it is, the formula that runs it, and where
 * that formula lives. Any element carrying `data-explain="<key>"` registers; on
 * desktop the MarginExplainer shows the entry for the section in view (or the
 * last one tapped) in the margin outside the phone bezel.
 *
 * Every formula here is the one in code. If a line disagrees with verify/lib,
 * the code wins and this file is the bug.
 */
export interface Explainer {
  kicker: string;
  title: string;
  /** One or two formula lines, rendered monospace. */
  formula: string[];
  body: string;
  source: string;
}

export const EXPLAINERS: Record<string, Explainer> = {
  "om-lobby": {
    kicker: "Open Markets",
    title: "Every price is a live book",
    formula: ["pᵢ = e^(qᵢ/b) / Σⱼ e^(qⱼ/b)", "b = 1,200 · fee = 1.88% flat"],
    body: "No bookmaker sets a line. Each market is a DL-LMSR book: buying an outcome raises its share count q and re-prices every side at once, and the prices always sum to 1.",
    source: "lib/open-markets.ts · prices()",
  },
  "om-prediction": {
    kicker: "Prediction",
    title: "Dated, settled, de-vigged",
    formula: ["odds = 1 / (p · 1.0188)", "settles: Yes / No on the stated source"],
    body: "A prediction resolves against one named source on one date. Display odds carry exactly the 1.88% platform fee — no hidden margin anywhere else.",
    source: "lib/open-markets.ts · decimalOdds()",
  },
  "om-conviction": {
    kicker: "Conviction · The Paseome",
    title: "Bet the branch",
    formula: ["Σ branch prices = 1", "max maker loss = b · ln n"],
    body: "A Paseome tree forks a real event into 3–5 what-ifs. Forward trees settle at the leg roll and refund every untaken branch; counterfactual trees never resolve — they price how strongly a belief persists.",
    source: "lib/paseome.ts · frontierPrices(), settleFrontier()",
  },
  "om-certain": {
    kicker: "Certain-UnCertainty",
    title: "Everything around the uncertainty is certain",
    formula: ["maker loss ≤ b · ln n  (1,318 / 1,664 / 1,931)", "untaken branches → refunded"],
    body: "Platform-offered trees: the maker's worst case, the conservation of price, the refund, the 59.061-day roll and the 1.88% fee are fixed. Only the branch the world takes is left to trade.",
    source: "docs/product-sheets/PASEOME.md §0",
  },
  "om-perps": {
    kicker: "Perpetuals",
    title: "Legs, not expiries",
    formula: ["leg = 2 synodic months = 59.061 d", "Turning = 6 legs = 354.367 d"],
    body: "Perpetual markets never close. They roll on a global lunar grid; the roll settles first, then advances, and volatility state carries across the boundary.",
    source: "lib/lunar-legs.ts",
  },
  "om-create": {
    kicker: "Create",
    title: "Call it. Mint it. Earn on it.",
    formula: ["your share = 28.8% → 40% of platform net", "VIP 60% · 4,888 seats"],
    body: "Anyone signed in can open a prediction. Paseome trees open at MinorCreator or VIP. Creators earn their ladder share on their own markets; platform trees carry no creator cut.",
    source: "lib/gambit-game-math.ts · CREATOR_LADDER · lib/paseome.ts · canAuthorBranch()",
  },
  "om-ticket": {
    kicker: "Trade ticket",
    title: "What your stake buys",
    formula: ["net = stake × (1 − 0.0188)", "Δ = b · ln((Z·(e^(net/b) − 1) + Zᵢ) / Zᵢ)"],
    body: "The fee comes off first; the rest buys Δ shares, each paying 1 $MADx if your side is taken. Bigger stakes move the price more — the quote shows the price after your fill.",
    source: "lib/open-markets.ts · quote()",
  },
  "om-knife": {
    kicker: "Knife Edge sort",
    title: "The most contested book first",
    formula: ["binary: |p − 0.5|  ·  n branches: max pᵢ − 1/n", "ascending — closest to a coin flip on top"],
    body: "Most venues sort by volume, which points away from where one more informed trade is worth the most. Knife Edge puts the books nearest p = 0.5 first — the information frontier, and where the spread is widest.",
    source: "app/open-markets/page.tsx · knife() · Paseome spec M1",
  },
  "om-earn": {
    kicker: "Creator earnings",
    title: "Your cut of every trade on your market",
    formula: ["gross fee = volume × 1.88%", "you = gross fee × rung (28.8% → 40%)"],
    body: "Creators earn their ladder rung on the markets they open, lifetime. At the 40% rung, $100K of monthly volume pays $752 a month. The community pool takes 28.8% of what the platform keeps after that.",
    source: "lib/gambit-game-math.ts · CREATOR_LADDER · splitFee()",
  },
  "om-crowd": {
    kicker: "Crowd split",
    title: "Where the book leans",
    formula: ["split = current pᵢ per side"],
    body: "The bar is the book's live probability for each side — the crowd's money, not an opinion poll.",
    source: "lib/open-markets.ts · crowdSplit()",
  },
  "om-profile": {
    kicker: "Profile",
    title: "Marked to the live book",
    formula: ["mark = shares × current p", "P&L = mark − stake"],
    body: "Open positions are valued at the market's current price. A taken branch pays 1 $MADx per share; a refunded branch returns its stake.",
    source: "lib/open-markets.ts",
  },
  "perp-scandal": {
    kicker: "Perp · Scandal Velocity",
    title: "A GARCH reading, not an angle",
    formula: ["σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁", "bands: QUIET · WARMING · ACTIVE · HOT · PEAK"],
    body: "Volatility on the scandal series, read as a number. The band drives the card's copy: in QUIET the engine says monitor for entry, not execute.",
    source: "lib/gambit-game-math.ts · garchUpdate() · lib/scandal-bands.ts",
  },
  "perp-zliar": {
    kicker: "Perp · Z-Liar Meter",
    title: "Credibility, composited",
    formula: ["ZL = f(BS index, GARCH σ², lunar tilt)", "5 bands · statement only"],
    body: "Scores a statement's credibility from the Sentinel BS index, volatility on the claim series and the lunar tilt. The meter carries the statement only — it never names the speaker.",
    source: "lib/gambit-game-math.ts · zLiarVerdictFor()",
  },
  "perp-gossip": {
    kicker: "Perp · Gossip-Cop",
    title: "Long-arc claim contests",
    formula: ["heat = pickup velocity × source authority", "decay half-life = 21 d"],
    body: "Celebrity sagas as perpetual markets. Claims are contested across legs; sagas write off, they never die.",
    source: "lib/perp-reports.ts",
  },
  "perp-epiphany": {
    kicker: "Perp · Perpetual Epiphanies",
    title: "Laws hold forever",
    formula: ["closes_at = NULL", "persistence = live market reading"],
    body: "Murphy, Finagle, Peter, Hofstadter — mental models indexed as perpetual markets. Evidence moves the posterior; the market never closes.",
    source: "lib/perp-reports.ts",
  },
  "perp-faces": {
    kicker: "Perp · Five Faces",
    title: "Permanent vs transitory mask",
    formula: ["Σ five faces = 1  (capped simplex)", "divergence = τ_perm vs τ_trans"],
    body: "Allocation across Saint, White Rice, Megalomaniac, Narcissist and Sellout is an exact capped-simplex projection, so the five always sum to one.",
    source: "lib/perp-reports.ts",
  },
  "perp-zeitgeist": {
    kicker: "Perp · Zeitgeist",
    title: "Succession, slate and turning",
    formula: ["6 legs × 59.061 d = one Turning", "roll settles, then advances"],
    body: "A succession slate advanced leg by leg on the lunar almanac; CGARCH state carries forward across each boundary.",
    source: "lib/lunar-legs.ts",
  },
  "fee": {
    kicker: "Fee waterfall",
    title: "The price of certainty",
    formula: ["platform fee = 1.88% flat, every market", "community = 28.8% of platform net"],
    body: "One flat fee. Creators take their ladder share on their own markets first; the community pool takes 28.8% of what the platform nets.",
    source: "lib/gambit-game-math.ts · PLATFORM.FEE_BPS · splitFee()",
  },
  "shield": {
    kicker: "MAD Shield · stop loss",
    title: "A scale, not a switch",
    formula: ["premium = stake · P(win) · σ · 0.35  → clamp 2–4%", "recovery 28.8% → 40% · capped by tier"],
    body: "Opt-in loss mitigation. The premium moves recovery up the scale; your staking tier caps how far: Bronze 28.8 · Silver 32.8 · Gold 36.8 · MAD Tier 40%. 40% is the ceiling.",
    source: "lib/gambit-game-math.ts · STAKING_TIERS · calculateShieldPayoutFull()",
  },
  "affliction": {
    kicker: "Affliction · MADHAT's Gambit",
    title: "Rip the pack",
    formula: ["pack = 4.88 $MADx · 5 cards", "rarity = openCardPack(nonce) weighted"],
    body: "Packs roll dice; markets never do. The nonce derives server-side from your wallet and pack count, so a rip cannot be replayed for a better pull.",
    source: "lib/gambit-game-math.ts · openCardPack() · lib/pack-nonce.ts",
  },
};

export function explainerFor(key: string | null | undefined): Explainer | null {
  return key && EXPLAINERS[key] ? EXPLAINERS[key] : null;
}
