"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Rarity, RARITY_TABLE, RARITY_ORDER, streakReward, nextEvolution, EVOLUTION_BURN_COSTS,
  isVrsTrigger, prizeForRank, calculateVictoryProbability, mmrDelta,
  zLiarMeter, ZLiarReading, Combatant, PLATFORM,
  OVDeck, OV_DECKS, calculateDeltaLimit, DEFAULT_SCENARIOS,
  shieldPhiRatio,
  ShieldStakeInfo, ShieldTier,
  createShieldOptIn, requestShieldUnstake,
  isShieldUnstakeComplete, shieldReturnCountdown,
  calculateShieldPayoutFull, calculateShieldPremium,
  WhaleEligibilityInput,
} from "../lib/gambit-game-math";

/* ─── Types ─────────────────────────────────────────────────────── */

export type Faction =
  | "Politicos" | "Disruptors" | "Pop Icons" | "Screen Gods"
  | "The Athletes" | "The Memes" | "The Villains" | "Classics & Influencers";

export const FACTIONS: { name: Faction; accent: string; glyph: string }[] = [
  { name: "Politicos",              accent: "#f43f5e", glyph: "⚖"  },
  { name: "Disruptors",             accent: "#7cffc7", glyph: "⚡" },
  { name: "Pop Icons",              accent: "#ec4899", glyph: "★"  },
  { name: "Screen Gods",            accent: "#c98aff", glyph: "🎬" },
  { name: "The Athletes",           accent: "#58a6ff", glyph: "🏆" },
  { name: "The Memes",              accent: "#ffd700", glyph: "😂" },
  { name: "The Villains",           accent: "#a855f7", glyph: "☠"  },
  { name: "Classics & Influencers", accent: "#fbbf24", glyph: "♛"  },
];

export interface NftCard {
  id: string;
  name: string;
  faction: Faction;
  rarity: Rarity;
  serial: number;
  caption: string;
  volatility: number;
  cloutPct: number;     // display value (1.8x clout = 180 here)
  odds: number;
  xp: number;
  durability: number;   // 0..1, 1=pristine
  stage: number;        // 1=Standard, 2=Evolved, 3=Ascended (hard cap)
  // ── Gen 2 canonical fields (source: SatiricalCard.kt + Card Game Logic Code Reference §2) ──
  apyBoost: number;      // from RARITY_TABLE.stakingApy / 100
  edgeMultiplier: number; // 1.0..1.5 edge bonus
  earnsCount: number;    // cumulative lifetime $MADx earned by this card
  canonicalFactionId: string; // on-chain snake_case faction ID
  artUrl?: string;       // optional real art (AI-Studio, keyed by serial); falls back to brand logo
}

export interface TournamentEntry {
  rank: number; handle: string; mmr: number; isUser: boolean;
}

/** A single open conviction stake — tracks shield, deck, δ-limit, outcome */
export interface OpenPosition {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  emoji: string;
  stake: number;
  shieldActive: boolean;   // derived: shield.status === 'active' (kept for compat)
  shield: ShieldStakeInfo; // full opt-in/opt-out state machine
  deckVersion: string;
  deltaLimit: number;
  convictionScore: number;
  openedAt: number;
  resolved: boolean;
  outcome: "pending" | "won" | "lost";
  payout?: number;
}

export interface SocialAccount {
  platform: "twitter" | "tiktok" | "discord";
  handle: string;
  linkedAt: number;
  trustScore: number;
}

export interface GameContextType {
  // cards
  cards: NftCard[];
  xp: number;
  addXp: (amount: number) => void;
  addCard: (c: NftCard) => void;
  evolveCard: (id: string) => { ok: boolean; message: string };
  // streak / dopamine
  streak: number;
  recordPick: (won: boolean) => { vrs: boolean; reward: ReturnType<typeof streakReward> };
  vrsFlash: boolean;
  chaosMeter: number;
  setChaosMeter: (n: number) => void;
  madCredits: number;
  adjustCredits: (delta: number) => void;
  // tournament
  tournamentPool: number;
  ladder: TournamentEntry[];
  userMmr: number;
  runPvpMatch: (cardId: string) => { won: boolean; pWin: number; delta: number; opponent: string } | null;
  // z-liar
  zLiarHistory: { id: string; statement: string; reading: ZLiarReading; time: string }[];
  runZLiar: (statement: string, knobs: { variance: number; credibility: number; corroboration: number }) => ZLiarReading;
  // positions — new v3
  positions: OpenPosition[];
  openPosition: (scenarioId: string, title: string, emoji: string, stake: number, shieldActive: boolean, deck: OVDeck) => string;
  resolvePosition: (id: string, won: boolean) => void;
  shieldTogglePosition: (id: string) => void; // legacy — still works as instant opt-in
  requestShieldUnstake: (id: string) => void; // opt-out with 2–24h return window
  shieldReturnCountdown: (id: string) => string; // human-readable countdown
  // social / EigenTrust
  socialAccounts: SocialAccount[];
  linkSocialAccount: (platform: SocialAccount["platform"], handle: string) => void;
  socialAmplification: number;
  // platform
  platform: typeof PLATFORM;
  setCards: React.Dispatch<React.SetStateAction<NftCard[]>>;
  saverTokens: number;
  useSaverToken: () => boolean;
  eigenTrustScore: number;           // live EigenTrust (0..100), from virality-eigen
  setEigenTrustScore: (score: number) => void; // written by EigenTrustWidget on each render
  
  // Auth (Two-Tier)
  socialAuth: { isAuthenticated: boolean; provider: string | null; email: string | null };
  setSocialAuth: React.Dispatch<React.SetStateAction<{ isAuthenticated: boolean; provider: string | null; email: string | null }>>;
  walletAuth: { isConnected: boolean; address: string | null };
  setWalletAuth: React.Dispatch<React.SetStateAction<{ isConnected: boolean; address: string | null }>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/* ─── Seed data ─────────────────────────────────────────────────── */
/* ─── Shield helpers ─────────────────────────────────────────────── */
const NULL_SHIELD: ShieldStakeInfo = {
  status: 'none', tier: null, premiumTier: 0, premiumPaid: 0,
  stakedAt: null, unstakeRequestedAt: null, estimatedReturnAt: null,
  returnWindowHours: 0,
};



const SEED_CARDS: NftCard[] = [
  { id:"card_don",       name:"THE DON: MOST WANTED",  faction:"Politicos",   rarity:"Legendary",  serial:4,   caption:"The face that launched a thousand memes.",       volatility:80, cloutPct:550, odds:1.5, xp:1200, durability:0.92, stage:3, apyBoost:0.48, edgeMultiplier:1.4, earnsCount:4888, canonicalFactionId:"mad-council" },
  { id:"card_visionary", name:"THE VISIONARY",          faction:"Disruptors",  rarity:"Epic",       serial:88,  caption:"Ships first, apologizes never.",                  volatility:64, cloutPct:320, odds:2.1, xp:640,  durability:0.85, stage:3, apyBoost:0.31, edgeMultiplier:1.2, earnsCount:1888, canonicalFactionId:"disruptors" },
  { id:"card_influencer",name:"THE INFLUENCER",          faction:"Pop Icons",   rarity:"Rare",       serial:488, caption:"Monetizing the algorithm since birth.",          volatility:52, cloutPct:240, odds:2.4, xp:180,  durability:0.7,  stage:2, apyBoost:0.22, edgeMultiplier:1.1, earnsCount:488, canonicalFactionId:"drama-guild" },
  { id:"card_analyst",   name:"THE ANALYST",             faction:"Disruptors",  rarity:"Uncommon",   serial:256, caption:"Has a chart for that.",                          volatility:38, cloutPct:180, odds:1.9, xp:120,  durability:0.95, stage:1, apyBoost:0.16, edgeMultiplier:1.0, earnsCount:256, canonicalFactionId:"disruptors" },
  { id:"card_fan",       name:"THE FAN",                 faction:"The Memes",   rarity:"Common",     serial:888, caption:"First in line, every time.",                    volatility:22, cloutPct:110, odds:1.3, xp:60,   durability:1.0,  stage:1, apyBoost:0.12, edgeMultiplier:1.0, earnsCount:0, canonicalFactionId:"degens" },
  { id:"card_architect", name:"THE ARCHITECT",           faction:"Classics & Influencers", rarity:"Golden Hand", serial:7888, caption:"Draws the blueprint nobody else can read.", volatility:71, cloutPct:880, odds:1.8, xp:3200, durability:0.88, stage:3, apyBoost:0.68, edgeMultiplier:1.5, earnsCount:7888, canonicalFactionId:"elites" },
];

const SEED_LADDER: TournamentEntry[] = [
  { rank:1, handle:"0xMADKing",      mmr:2840, isUser:false },
  { rank:2, handle:"ScandalScraper", mmr:2610, isUser:false },
  { rank:3, handle:"TopHatTommy",    mmr:2455, isUser:false },
  { rank:4, handle:"ConvictionCarl", mmr:2300, isUser:false },
  { rank:5, handle:"YOU",            mmr:2180, isUser:true  },
  { rank:6, handle:"LunarLiquidity", mmr:2090, isUser:false },
  { rank:7, handle:"FuhgeddaboudIt", mmr:1980, isUser:false },
  { rank:8, handle:"DegenDiana",     mmr:1875, isUser:false },
];

const OPPONENTS = ["ScandalScraper","TopHatTommy","LunarLiquidity","DegenDiana","0xMADKing","ConvictionCarl"];

/* ─── Provider ──────────────────────────────────────────────────── */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards]       = useState<NftCard[]>(SEED_CARDS);
  const [eigenTrustScore, setEigenTrustScore] = useState<number>(10); // default 10 (wallet-age only, no social)

  const [socialAuth, setSocialAuth] = useState<{ isAuthenticated: boolean; provider: string | null; email: string | null }>({
    isAuthenticated: false,
    provider: null,
    email: null
  });
  const [walletAuth, setWalletAuth] = useState<{ isConnected: boolean; address: string | null }>({
    isConnected: false,
    address: null
  });

  const [saverTokens, setSaverTokens] = useState<number>(() => {
    // Replenish to 1 on first load if a week has passed since last replenish
    if (typeof window === "undefined") return 1;
    const lastReplenish = parseInt(localStorage.getItem("saver_replenish") || "0");
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastReplenish > oneWeekMs) {
      localStorage.setItem("saver_replenish", Date.now().toString());
      return 1;
    }
    return parseInt(localStorage.getItem("saver_tokens") || "0");
  });
  const [streak, setStreak]     = useState(0);
  const [xp, setXp]             = useState(0); // player XP — earns on wins, costs on burn-ladder evolution
  const [vrsFlash, setVrsFlash] = useState(false);
  const [chaosMeter, setChaosMeter] = useState(62);
  const [madCredits, setMadCredits] = useState(8888);
  const [tournamentPool]        = useState(50000);
  const [ladder, setLadder]     = useState<TournamentEntry[]>(SEED_LADDER);
  const [userMmr, setUserMmr]   = useState(2180);
  const [zLiarHistory, setZLiarHistory] = useState<GameContextType["zLiarHistory"]>([]);
  // v3 additions
  const [positions, setPositions]           = useState<OpenPosition[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialAmplification, setSocialAmplification] = useState(0.1);

  // hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("mad_game_state_v3");
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.cards)) setCards(s.cards);
        if (typeof s.streak === "number") setStreak(s.streak);
        if (typeof s.madCredits === "number") setMadCredits(s.madCredits);
        if (typeof s.userMmr === "number") setUserMmr(s.userMmr);
        if (Array.isArray(s.ladder)) setLadder(s.ladder);
        if (Array.isArray(s.positions)) setPositions(s.positions);
        if (Array.isArray(s.socialAccounts)) setSocialAccounts(s.socialAccounts);
        if (typeof s.socialAmplification === "number") setSocialAmplification(s.socialAmplification);
      }
    } catch (e) { console.error("game state hydrate failed", e); }
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("mad_game_state_v3", JSON.stringify({
      cards, streak, madCredits, userMmr, ladder, positions, socialAccounts, socialAmplification
    }));
  }, [cards, streak, madCredits, userMmr, ladder, positions, socialAccounts, socialAmplification]);

  const addCard       = useCallback((c: NftCard) => setCards(p => [c, ...p]), []);
  const adjustCredits = useCallback((delta: number) => setMadCredits(p => Math.max(0, p + delta)), []);

  const addXp = useCallback((amount: number) => setXp(x => x + amount), []);

  /** Burn-ladder evolution — enforces canonical burn costs (Card Game Logic Code Reference §7) */
  const evolveCard = useCallback((id: string) => {
    let result = { ok: false, message: "" };
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card) { result = { ok: false, message: "Card not found" }; return prev; }
      const step = nextEvolution(card.rarity);
      if (!step) { result = { ok: false, message: `${card.rarity} is at the burn-ladder apex.` }; return prev; }
      // Canonical burn costs from §7
      const burnCost = EVOLUTION_BURN_COSTS[card.rarity as string] ?? { cards: 0, xp: step.xpRequired };
      const burnable = prev.filter(c => c.rarity === card.rarity && c.id !== id);
      if (burnable.length < burnCost.cards) {
        result = { ok: false, message: `Need ${burnCost.cards} ${card.rarity} cards (have ${burnable.length}) + ${burnCost.xp} XP` };
        return prev;
      }
      if (xp < burnCost.xp) {
        result = { ok: false, message: `Need ${burnCost.xp} XP (have ${xp})` };
        return prev;
      }
      setXp(x => x - burnCost.xp);
      const burnIds = new Set(burnable.slice(0, burnCost.cards).map(c => c.id));
      const remaining = prev.filter(c => !burnIds.has(c.id));
      const tier = RARITY_TABLE[step.to];
      result = { ok: true, message: `Evolved ${card.name}: ${card.rarity} → ${step.to}. Burned ${burnCost.cards} cards & ${burnCost.xp} XP.` };
      return remaining.map(c => c.id === id
        ? { ...c, rarity: step.to, stage: Math.min(c.stage + 1, 3), durability: 1.0, apyBoost: tier.stakingApy / 100, cloutPct: Math.round(tier.cloutMultiplier * 100) }
        : c
      );
    });
    return result;
  }, [xp]);

  const recordPick = useCallback((won: boolean) => {
    const newStreak = won ? streak + 1 : 0;
    setStreak(newStreak);
    const vrs = won && isVrsTrigger(newStreak);
    if (vrs) { setVrsFlash(true); setTimeout(() => setVrsFlash(false), 1400); setChaosMeter(c => Math.min(100, c + 12)); }
    else if (!won) { setChaosMeter(c => Math.max(0, c - 8)); }
    return { vrs, reward: streakReward(newStreak) };
  }, [streak]);

  const runPvpMatch = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return null;
    const tier = RARITY_TABLE[card.rarity];
    const user: Combatant = { powerLevel: tier.powerScore, stage: card.stage, durability: card.durability, cloutMultiplier: tier.cloutMultiplier };
    const oppName = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    const opp: Combatant = { powerLevel: 500 + Math.random() * 8000, stage: 1 + Math.floor(Math.random() * 6), durability: 0.6 + Math.random() * 0.4, cloutMultiplier: 1 + Math.random() * 6 };
    const pWin = calculateVictoryProbability(user, opp);
    const won = Math.random() < pWin;
    const delta = Math.round(mmrDelta(won, pWin, user));
    setUserMmr(m => Math.max(0, m + delta));
    setLadder(prev => { const next = prev.map(e => e.isUser ? { ...e, mmr: Math.max(0, e.mmr + delta) } : e); next.sort((a, b) => b.mmr - a.mmr); return next.map((e, i) => ({ ...e, rank: i + 1 })); });
    return { won, pWin, delta, opponent: oppName };
  }, [cards]);

  const runZLiar = useCallback((statement: string, knobs: { variance: number; credibility: number; corroboration: number }) => {
    const reading = zLiarMeter({ narrativeVariance: knobs.variance, sourceCredibility: knobs.credibility, corroboration: knobs.corroboration });
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setZLiarHistory(prev => [{ id: "zl_" + Date.now(), statement, reading, time }, ...prev].slice(0, 8));
    return reading;
  }, []);

  // v3 position tracking
  const openPosition = useCallback((
    scenarioId: string, title: string, emoji: string,
    stake: number,
    shieldActive: boolean, // legacy param — true = opt-in standard tier
    deck: OVDeck,
    shieldTier: ShieldTier = 'standard',
    premiumTier: number = 0
  ): string => {
    const scen = DEFAULT_SCENARIOS.find(s => s.id === scenarioId);
    const dl = calculateDeltaLimit(deck.multiplier, scen?.initialConviction ?? 500);
    const cappedStake = Math.min(stake, dl);
    const id = "pos_" + Date.now();
    const now = Date.now();

    // Build shield state only if user explicitly opted in
    let shield: ShieldStakeInfo = NULL_SHIELD;
    let actualStake = cappedStake;
    if (shieldActive) {
      const premium = calculateShieldPremium(cappedStake, shieldTier, premiumTier);
      shield = {
        status: 'active',
        tier: shieldTier,
        premiumTier,
        premiumPaid: premium,
        stakedAt: now,
        unstakeRequestedAt: null,
        estimatedReturnAt: null,
        returnWindowHours: 0,
      };
      actualStake = cappedStake + premium; // premium charged on top of stake
    }

    const pos: OpenPosition = {
      id, scenarioId, scenarioTitle: title, emoji,
      stake: cappedStake, shieldActive, shield,
      deckVersion: deck.version, deltaLimit: dl,
      convictionScore: scen?.initialConviction ?? 500,
      openedAt: now, resolved: false, outcome: "pending",
    };
    setPositions(p => [pos, ...p]);
    adjustCredits(-actualStake);
    return id;
  }, [adjustCredits]);

  const requestShieldUnstakePos = useCallback((id: string) => {
    setPositions(p => p.map(pos => {
      if (pos.id !== id || pos.shield.status !== 'active') return pos;
      const updated = requestShieldUnstake(pos.shield, pos.stake);
      return { ...pos, shieldActive: false, shield: updated };
    }));
  }, []);

  const getShieldReturnCountdown = useCallback((id: string): string => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return '';
    return shieldReturnCountdown(pos.shield);
  }, [positions]);

  const resolvePosition = useCallback((id: string, won: boolean) => {
    setPositions(p => p.map(pos => {
      if (pos.id !== id || pos.resolved) return pos;
      const baseReturn = won ? pos.stake * 1.88 : 0;
      // Shield payout uses calculateShieldPayoutFull — respects actual tier
      // (standard 28.8% / shielded dial / whale 60%).
      // Only pays out if shield was ACTIVE at resolution (not unstaking/returned).
      const shieldReturn = !won && pos.shield.status === 'active'
        ? calculateShieldPayoutFull(
            pos.stake,
            pos.shield.premiumTier,
            {
              lifetimeVolume: madCredits * 10, // proxy: 10× current balance as lifetime volume
              accountAgeDays: 90,              // placeholder — prod reads wallet creation date
              trustScore: eigenTrustScore,     // LIVE: from calculateEigenTrustScore in virality-eigen
              goldenHandCardsStaked: cards.filter(c => c.rarity === 'Golden Hand').length,
            },
            false
          ).payout
        : 0;
      const payout = baseReturn + shieldReturn - pos.stake;
      adjustCredits(baseReturn + shieldReturn);
      return { ...pos, resolved: true, outcome: won ? "won" : "lost", payout };
    }));
  }, [adjustCredits, cards, eigenTrustScore, madCredits]);

  const shieldTogglePosition = useCallback((id: string) => {
    setPositions(p => p.map(pos => {
      if (pos.id !== id) return pos;
      if (pos.shieldActive) {
        // Opt-out path: start the return window immediately
        const window = requestShieldUnstake(pos.shield, pos.stake);
        return { ...pos, shieldActive: false, shield: window };
      } else {
        // Opt-in path: standard tier, no premium dial (simple toggle)
        const now = Date.now();
        const premium = calculateShieldPremium(pos.stake, 'standard', 0);
        const shield: ShieldStakeInfo = {
          status: 'active', tier: 'standard', premiumTier: 0,
          premiumPaid: premium, stakedAt: now,
          unstakeRequestedAt: null, estimatedReturnAt: null,
          returnWindowHours: 0,
        };
        return { ...pos, shieldActive: true, shield };
      }
    }));
  }, []);

  const linkSocialAccount = useCallback((platform: SocialAccount["platform"], handle: string) => {
    const acct: SocialAccount = { platform, handle, linkedAt: Date.now(), trustScore: 0.8 };
    setSocialAccounts(p => [acct, ...p.filter(a => a.platform !== platform)]);
    setSocialAmplification(0.8);
  }, []);

  const useSaverToken = useCallback((): boolean => {
    if (saverTokens <= 0) return false;
    setSaverTokens(t => {
      const newVal = Math.max(0, t - 1);
      if (typeof window !== "undefined") localStorage.setItem("saver_tokens", newVal.toString());
      return newVal;
    });
    return true;
  }, [saverTokens]);

  const value = useMemo<GameContextType>(() => ({
    cards, addCard, evolveCard,
    streak, recordPick, vrsFlash, chaosMeter, setChaosMeter, madCredits, adjustCredits,
    tournamentPool, ladder, userMmr, runPvpMatch,
    zLiarHistory, runZLiar,
    positions, openPosition, resolvePosition, shieldTogglePosition, setCards,
    requestShieldUnstake: requestShieldUnstakePos,
    shieldReturnCountdown: getShieldReturnCountdown,
    saverTokens, useSaverToken, xp, addXp, eigenTrustScore, setEigenTrustScore,
    socialAccounts, linkSocialAccount, socialAmplification,
    socialAuth, setSocialAuth, walletAuth, setWalletAuth,
    platform: PLATFORM,
  }), [cards, addCard, evolveCard, streak, recordPick, vrsFlash, chaosMeter, madCredits,
       adjustCredits, tournamentPool, ladder, userMmr, runPvpMatch, zLiarHistory, runZLiar,
       positions, openPosition, resolvePosition, shieldTogglePosition,
       socialAccounts, linkSocialAccount, socialAmplification,
       socialAuth, walletAuth, setSocialAuth, setWalletAuth, setCards, requestShieldUnstakePos, getShieldReturnCountdown, saverTokens, useSaverToken, xp, addXp, eigenTrustScore]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be within GameProvider");
  return ctx;
}

export { RARITY_TABLE, RARITY_ORDER, prizeForRank };
