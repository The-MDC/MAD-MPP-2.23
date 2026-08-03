/**
 * MAD Gambit — THE NODE CONTENT REGISTRY (D14 §4, S0.5)
 * ------------------------------------------------------------------
 * Data objects only. All copy final. All numbers canonical — imported
 * from gambit-game-math where a constant exists, so the registry can
 * never drift from the engine (single source of truth).
 *
 * Registry rules (binding):
 * - Every node: exactly ONE live element. One. The restraint is the design.
 * - Stat rows render monospace. Headlines render in --font-stencil with
 *   font-synthesis-weight: none.
 * - raise/cap-table content stays in the DECK ONLY — never an MPP popup
 *   (investor-facing ≠ user-facing).
 * - Coming-soon nodes still celebrate: opening one fires the micro burst.
 *   Anticipation is the product.
 *
 * Canon supersessions vs the original D14 table (founder sign-offs,
 * 31 Jul 2026): 4-tier staking eights ladder (not 6) · Creator Ladder
 * 28.8→40→60% (not flat 40%) · Shield copy is compliance-clean (loss
 * mitigation — never the i-word) · projections Y3 $139.6M base /
 * $4.83B exit run-rate · rarity row matches RARITY_DROP_WEIGHTS.
 */
import { PLATFORM, STAKING_TIERS, CREATOR_LADDER } from "@/lib/gambit-game-math";

export type NodeId =
  | "fee-waterfall" | "tokenomics" | "staking" | "shield" | "garch"
  | "zliar" | "vrs" | "madconv" | "markets-all" | "wallet"
  | "profile" | "market-plus" | "gossip-cop" | "perp-epiphanies"
  | "ticker-legend" | "market-preview" | "beta-gate" | "intel"
  | "team" | "legal-lite";

/** One animated thing per node — rendered by key in GambitNode. */
export type LiveElement =
  | { kind: "bars"; bars: { label: string; value: number; color?: string }[]; unit?: string }
  | { kind: "counter"; to: number; durationMs: number; label: string }
  | { kind: "slider"; formula: "effApy" | "shieldFee"; label: string }
  | { kind: "dial"; zones: [string, string, string]; needle: number; sweetSpot: number; min: number; max: number }
  | { kind: "gauge"; sweepTo: number; bands: string[] }
  | { kind: "streak" }
  | { kind: "strip"; states: string[]; counter?: { label: string; value: number } }
  | { kind: "bar"; label: string; pct: number }
  | { kind: "capture" }
  | { kind: "dash"; stats: { label: string; value: string }[] }
  | { kind: "chips"; chips: string[] }
  | { kind: "none" };

export interface NodeCta {
  label: string;
  /** route = next/router push · scroll = in-page section id · node = nested
   *  node · external = new tab · dismiss = close (still celebrates). */
  kind: "route" | "scroll" | "node" | "external" | "dismiss";
  target?: string;
}

export interface GambitNodeDef {
  id: NodeId;
  badge: string;
  accent: string; // observed hex only (tokens.css palette + skin golds)
  headline: string;
  body: string;
  live: LiveElement;
  stat: string; // monospace canonical stat row
  quip: string; // satire quip, italic
  cta: NodeCta | null;
  comingSoon?: boolean;
}

// The canonical Maths Engine Room — the deep-math CTA target until /engine
// lands in Sprint 1 (S1.3 serves it same-origin).
const ENGINE_URL = "https://madgambit.io/maths-engine-room.html";
const DECK_URL = "https://o-vdeck26.vercel.app";

const pct = (bps: number) => `${(bps / 100).toFixed(1).replace(/\.0$/, "")}%`;

export const NODE_REGISTRY: Record<NodeId, GambitNodeDef> = {
  "fee-waterfall": {
    id: "fee-waterfall",
    badge: "FEE",
    accent: "var(--gold)",
    headline: "THE PRICE OF CERTAINTY",
    body: `One flat ${pct(PLATFORM.FEE_BPS * 10)} fee on every market. Non-additive waterfall: the creator's ladder share comes off their own markets first; the platform side splits four ways.`,
    live: {
      kind: "bars",
      bars: [
        { label: "GROSS FEE", value: 100, color: "var(--gold)" },
        { label: "CREATOR (LADDER 28.8–60)", value: 40, color: "var(--blood-1)" },
        { label: "OPS 35", value: 35 },
        { label: "SHIELD 25", value: 25 },
        { label: "BURN 10", value: 10 },
        { label: "COMMUNITY 30", value: 30 },
      ],
      unit: "%",
    },
    stat: "1.88% flat · every market",
    quip: "Certainty. Retail price: 1.88%.",
    cta: { label: "See the math → Math Engine", kind: "external", target: ENGINE_URL },
  },
  tokenomics: {
    id: "tokenomics",
    badge: "$MADx",
    accent: "var(--gold)",
    headline: "EIGHTS ALL THE WAY DOWN",
    body: "Fixed supply, minted once. The Furnace buys back and burns from the platform side — capped so the eights outlive the hype.",
    live: { kind: "counter", to: PLATFORM.MADX_FIXED_SUPPLY, durationMs: 1200, label: "$MADx FIXED SUPPLY" },
    stat: `Fixed supply · Furnace cap ${(PLATFORM.FURNACE_BURN_CAP * 100).toFixed(1)}%/30d`,
    quip: "We minted eights. The furnace eats the rest.",
    cta: { label: "Tokenomics deep-dive → the deck", kind: "external", target: DECK_URL },
  },
  staking: {
    id: "staking",
    badge: "TIERS",
    accent: "var(--tier-bronze)",
    headline: "CONVICTION COMPOUNDS",
    body: "Four tiers, all eights. Staking is the MAD-Shield gate — the deeper the tier, the higher your recovery cap. Clout multiplies APY: tenure outmuscles capital.",
    live: { kind: "slider", formula: "effApy", label: "DRAG CLOUT 0–200 · APY RECALCS LIVE" },
    stat: `${STAKING_TIERS[0].name} ${(STAKING_TIERS[0].apy * 100).toFixed(1)}% → ${STAKING_TIERS[3].name} ${(STAKING_TIERS[3].apy * 100).toFixed(1)}% base`,
    quip: "Tenure outmuscles capital. The exponent says so.",
    cta: { label: "View all 4 tiers", kind: "scroll", target: "mg-market-plus" },
  },
  shield: {
    id: "shield",
    badge: "SHIELD",
    accent: "var(--dopamine-active, #7cffc7)",
    headline: "DIGNITY NOT SAFETY",
    body: "Opt-in loss mitigation. Pay a small MAD-Shield opt-in fee at stake time; if the market turns on you, your staking tier's recovery cap softens the landing.",
    live: { kind: "slider", formula: "shieldFee", label: "STAKE × P(WIN) × σ × 0.35 · CLAMPED 2–4%" },
    stat: "Recovery 28.8 / 40 / 60% · φ=1.618 whale",
    quip: "Not a promise. A stop-loss. 40% max — 60% for VIPs.",
    cta: { label: "How the Shield works", kind: "external", target: ENGINE_URL },
  },
  garch: {
    id: "garch",
    badge: "σ",
    accent: "var(--blood-2)",
    headline: "AMPLIFIED NOT DETONATED",
    body: "GARCH(1,1) tracks each market's chaos and clamps it. Volatility amplifies rewards — inside a hard ceiling the math enforces.",
    live: { kind: "dial", zones: ["COOL", "SWEET", "HOT"], needle: 0.231, sweetSpot: 0.385, min: PLATFORM.SIGMA_MIN, max: PLATFORM.SIGMA_MAX },
    stat: `σ∈[${PLATFORM.SIGMA_MIN}, ${PLATFORM.SIGMA_MAX}] · amp ≤1.544×`,
    quip: "Peak lunacy. Optimal. Contained.",
    cta: { label: "What is GARCH?", kind: "external", target: ENGINE_URL },
  },
  zliar: {
    id: "zliar",
    badge: "Z-LIAR",
    accent: "var(--blood-1)",
    headline: "THE NEEDLE KNOWS",
    body: "Every narrative gets a credibility score, 0–100. Five bands from candor to fiction — the needle does not negotiate.",
    live: { kind: "gauge", sweepTo: 67, bands: ["STRAIGHT SHOOTER", "MOSTLY CANDID", "SLIPPERY", "SERIAL EMBELLISHER", "TOTAL FABRICATION"] },
    stat: "5 bands · STRAIGHT SHOOTER → TOTAL FABRICATION",
    quip: "Slippery is a compliment here.",
    cta: { label: "Z-Liar methodology", kind: "external", target: ENGINE_URL },
  },
  vrs: {
    id: "vrs",
    badge: "STREAK",
    accent: "var(--gold)",
    headline: "FIBONACCI SEES YOU",
    body: "Your session streak is live right now. Every meaningful tap counts; at 5, 8, 13, 21 and 34 the platform celebrates — scaled by the sequence itself.",
    live: { kind: "streak" },
    stat: "[5,8,13,21,34] → [8,13,21,34,55]",
    quip: "You're at {n}. Fibonacci is watching.",
    cta: { label: "Keep clicking.", kind: "dismiss" },
  },
  madconv: {
    id: "madconv",
    badge: "ENGINE",
    accent: "var(--dopamine-calm, #00f0ff)",
    headline: "TIME BEATS CAPITAL",
    body: "MADConv weighs time held above capital deployed — the exponents are the ideology. Hold longer, contribute more, and the score compounds past bigger wallets.",
    live: {
      kind: "bars",
      bars: [
        { label: "t^1.35 TIME", value: 87, color: "var(--gold)" },
        { label: "c^0.75 CAPITAL", value: 52 },
        { label: "d^1.45 CONTRIBUTION", value: 95, color: "var(--blood-1)" },
        { label: "ψ^1.15 PSYCH", value: 68 },
      ],
    },
    stat: "M = t^1.35·c^0.75·d^1.45·ψ^1.15·…",
    quip: "Hold longer. The math is on your side.",
    cta: { label: "Full formula → Math Engine", kind: "external", target: ENGINE_URL },
  },
  "markets-all": {
    id: "markets-all",
    badge: "MARKETS",
    accent: "var(--dopamine-peak, #ec4899)",
    headline: "FIVE WAYS TO BE RIGHT",
    body: "Progression, Saga, Z-Liar, GossipCop and Perpetual markets — classified by a first-match cascade. Perps never close.",
    live: { kind: "chips", chips: ["PROGRESSION", "SAGA", "Z-LIAR", "GOSSIPCOP", "PERP ∞"] },
    stat: "First-match cascade · perp closes never",
    quip: "Binary markets are dead. We checked.",
    cta: { label: "Browse markets", kind: "scroll", target: "mg-markets" },
  },
  wallet: {
    id: "wallet",
    badge: "WALLET",
    accent: "var(--gold)",
    headline: "YOUR $MADx LIVES HERE",
    body: `A pack is ${PLATFORM.CARD_PACK_COST} $MADx for ${PLATFORM.CARD_PACK_SIZE} cards from the ${PLATFORM.TOTAL_DECK_SIZE}-deep deck. Rarity shimmer included at no extra charge.`,
    live: {
      kind: "bars",
      bars: [
        { label: "COMMON 56.8%", value: 56.8 },
        { label: "UNCOMMON 23.6%", value: 23.6 },
        { label: "RARE 12%", value: 12 },
        { label: "EPIC 6%", value: 6, color: "var(--tier-obsidian)" },
        { label: "LEGENDARY 1%", value: 1, color: "var(--gold)" },
        { label: "GOLDEN HAND 0.6%", value: 0.6, color: "var(--blood-1)" },
      ],
      unit: "%",
    },
    stat: `7 tiers · pack ${PLATFORM.CARD_PACK_COST} $MADx / ${PLATFORM.CARD_PACK_SIZE} cards · seed ${PLATFORM.CARD_GENERATION_SEED}`,
    quip: "The deck is 992 deep. Seed 8888.",
    cta: { label: "Reserve your seat", kind: "node", target: "beta-gate" },
  },
  profile: {
    id: "profile",
    badge: "YOU",
    accent: "var(--dopamine-active, #7cffc7)",
    headline: "YOUR CONVICTION RECORD",
    body: "MADConv score, Clout 0–200, tier chip. Effective APY is your tier times your clout — earned, never promised.",
    live: { kind: "slider", formula: "effApy", label: "effApy = tier × (1 + clout/200)" },
    stat: "effApy = tier × (1+clout/200)",
    quip: "Your streak is showing.",
    cta: { label: "Sign in to claim it", kind: "node", target: "beta-gate" },
  },
  "market-plus": {
    id: "market-plus",
    badge: "CREATE",
    accent: "var(--blood-1)",
    headline: "MINT YOUR OWN MARKET",
    body: "Anyone can mint a market and earn on it. Traction climbs the Creator Ladder: 12 tractioned markets makes you a MinorCreator; 34 plus 888 followers is full CR8TR status.",
    live: {
      kind: "bars",
      bars: [
        { label: "USER 28.8%", value: 28.8 },
        { label: "MINORCREATOR 40%", value: 40, color: "var(--tier-silver)" },
        { label: "CR8TR 60%", value: 60, color: "var(--gold)" },
      ],
      unit: "%",
    },
    stat: `${pct(CREATOR_LADDER[0].shareBps)} → ${pct(CREATOR_LADDER[1].shareBps)} → ${pct(CREATOR_LADDER[2].shareBps)} · your own markets only`,
    quip: "You call it. You climb to 60%.",
    cta: { label: "Join creator waitlist", kind: "node", target: "beta-gate" },
  },
  "gossip-cop": {
    id: "gossip-cop",
    badge: "SOON",
    accent: "var(--dopamine-peak, #ec4899)",
    headline: "GOSSIP-COP™",
    body: "Celebrity sagas as perpetual markets. Sagas write off — they never die. Kenny's fate is a tracked metric.",
    live: { kind: "strip", states: ["LIVE", "AFFLICTION", "GOLDEN_AURA", "KILLED_KENNY"], counter: { label: "KENNY DEATHS", value: 0 } },
    stat: "Perp family 2 · writes-off, never dies",
    quip: "Kenny status: alive. For now.",
    cta: { label: "Notify me", kind: "node", target: "beta-gate" },
    comingSoon: true,
  },
  "perp-epiphanies": {
    id: "perp-epiphanies",
    badge: "SOON",
    accent: "var(--gold)",
    headline: "LAWS HOLD FOREVER",
    body: "Murphy, Finagle, Peter, Hofstadter — the eternal laws, indexed as perpetual markets. Evidence moves the posterior; the market never closes.",
    live: { kind: "bar", label: "MURPHY PERSISTENCE", pct: 97 },
    stat: "Perp family 3 · closes_at = NULL",
    quip: "Murphy filed first. We indexed him.",
    cta: { label: "Notify me", kind: "node", target: "beta-gate" },
    comingSoon: true,
  },
  "ticker-legend": {
    id: "ticker-legend",
    badge: "TICKER",
    accent: "var(--dopamine-calm, #00f0ff)",
    headline: "THREE FEEDS, ONE TAP",
    body: "The ticker cycles Crypto → Gambit → Scandal. Double-tap to switch feeds — the sacred gesture. Single-tap brought you here.",
    live: { kind: "strip", states: ["CRYPTO", "GAMBIT", "SCANDAL"] },
    stat: "Double-tap to cycle · sacred gesture",
    quip: "The ticker never sleeps. Neither does scandal.",
    cta: { label: "Got it", kind: "dismiss" },
  },
  "market-preview": {
    id: "market-preview",
    badge: "HEAT",
    accent: "var(--blood-2)",
    headline: "THIS ONE'S WARMING UP",
    body: "Heat is a five-signal composite — velocity, cross-source pickup, publisher weight, satire score, recency. Hot stories become markets.",
    live: { kind: "bar", label: "HEAT", pct: 72 },
    stat: "Heat = 5-signal composite",
    quip: "Murphy would have bet YES.",
    cta: { label: "Conviction YES", kind: "node", target: "beta-gate" },
  },
  "beta-gate": {
    id: "beta-gate",
    badge: "BETA",
    accent: "var(--gold)",
    headline: "RESERVE YOUR SEAT",
    body: "Closed beta. Guest logins are counted, wallets are allow-listed, and the door knows your name before you knock.",
    live: { kind: "capture" },
    stat: "Closed beta · ALLOWED_WALLETS",
    quip: "The bouncer is a smart contract.",
    cta: { label: "Request access", kind: "dismiss" },
  },
  intel: {
    id: "intel",
    badge: "INTEL",
    accent: "var(--dopamine-active, #7cffc7)",
    headline: "THE PLATFORM, LIVE",
    body: "The trajectory, static-canonical until the live intel API lands: the projection ladder is market-anchored (Aug 2026 comps) plus fifteen percent.",
    live: {
      kind: "dash",
      stats: [
        { label: "Y3 REVENUE (BASE)", value: "$139.6M" },
        { label: "EXIT RUN-RATE", value: "$4.83B" },
        { label: "Y3 DAU TARGET", value: "750K" },
        { label: "COMMUNITY POOL", value: "28.8% net" },
      ],
    },
    stat: "vs Kalshi $21–31B/mo vol · Polymarket ~$1B rev/yr",
    quip: "We watch the watchers. Ourselves included.",
    cta: { label: "Full metrics → the deck", kind: "external", target: DECK_URL },
  },
  team: {
    id: "team",
    badge: "TEAM",
    accent: "var(--paper)",
    headline: "THE MAD FEW",
    body: "A founder, a builder, counsel, and a DAO with opinions.",
    live: { kind: "chips", chips: ["NICK", "CARLO", "ZENAIB SHAH", "MADDAO"] },
    stat: "MAD GAMBIT LLC · NM",
    quip: "Adults supervised by a DAO.",
    cta: null,
  },
  "legal-lite": {
    id: "legal-lite",
    badge: "LEGAL",
    accent: "var(--ink-3)",
    headline: "THE FINE PRINT",
    body: "Beta software. Markets are entertainment. Nothing here is financial advice, and the moon phase genuinely does affect the vibes.",
    live: { kind: "none" },
    stat: "Beta software · not financial advice",
    quip: "Even Murphy reads the terms.",
    cta: null,
  },
};

export const NODE_IDS = Object.keys(NODE_REGISTRY) as NodeId[];
