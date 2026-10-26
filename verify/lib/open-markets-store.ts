"use client";

/**
 * MAD Gambit — Open Markets demo floor state.
 *
 * Free-play only: DEMO $MADx credits, held in this browser (localStorage), never
 * sent to the server and never mixed with the beta $MADx ledger. Signed-in
 * wallets trade real beta credits through POST /api/v1/markets/[id]/swap; this
 * store is what lets anyone create a market and take a position on stage
 * without a wallet. Every fill is priced by lib/open-markets.ts.
 */
import { useSyncExternalStore } from "react";
import {
  DEMO_START_CREDITS, OM_B, quote, prices, qForProbabilities, round2, seedMarkets,
  validateConviction, validatePrediction,
  type ConvictionDraft, type OMMarket, type OMPosition, type PredictionDraft,
} from "@/lib/open-markets";
import { nextLegClose } from "@/lib/lunar-legs";
import { openCardPack, PLATFORM, type Rarity } from "@/lib/gambit-game-math";

/** A card ripped on the demo floor — the generator's own output, trimmed. */
export interface RippedCard {
  id: string;
  name: string;
  rarity: Rarity;
  faction: string;
  serial: number;
  caption: string;
  at: number;
}

const KEY = "mg_open_markets_v2";

export interface OMState {
  markets: OMMarket[];
  positions: OMPosition[];
  credits: number;
  createdIds: string[];
  cards: RippedCard[];
  packCount: number;
  nonce: number;
}

let state: OMState | null = null;
const listeners = new Set<() => void>();

function fresh(): OMState {
  return { markets: seedMarkets(Date.now()), positions: [], credits: DEMO_START_CREDITS, createdIds: [], cards: [], packCount: 0, nonce: Math.floor(Math.random() * 1e6) };
}

function load(): OMState {
  if (state) return state;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as OMState;
      if (parsed && Array.isArray(parsed.markets) && parsed.markets.length) {
        state = { ...parsed, cards: parsed.cards ?? [], packCount: parsed.packCount ?? 0, nonce: parsed.nonce ?? Math.floor(Math.random() * 1e6) };
        return state;
      }
    }
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  state = fresh();
  return state;
}

function commit(next: OMState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — state still lives for this session */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const EMPTY: OMState = { markets: [], positions: [], credits: DEMO_START_CREDITS, createdIds: [], cards: [], packCount: 0, nonce: 0 };

/** Client snapshot; the server snapshot is empty so nothing hydrates against storage. */
export function useOpenMarkets(): OMState {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function getMarket(s: OMState, id: string): OMMarket | undefined {
  return s.markets.find((m) => m.id === id);
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function placeBet(marketId: string, outcomeId: string, stake: number): Result<OMPosition> {
  const s = load();
  const market = getMarket(s, marketId);
  if (!market) return { ok: false, error: "Market not found." };
  const idx = market.outcomes.findIndex((o) => o.id === outcomeId);
  if (idx < 0) return { ok: false, error: "Pick a side first." };
  if (!(stake >= 1)) return { ok: false, error: "Minimum stake is 1 $MADx." };
  if (stake > s.credits) return { ok: false, error: "Not enough demo $MADx — top up on your profile." };
  const qt = quote(market, idx, stake);
  const outcomes = market.outcomes.map((o, i) => (i === idx ? { ...o, q: o.q + qt.shares } : o));
  const updated: OMMarket = {
    ...market,
    outcomes,
    volume: round2(market.volume + stake),
    traders: market.traders + 1,
    history: market.history.concat([prices(outcomes, market.b)]).slice(-24),
  };
  const pos: OMPosition = {
    id: uid("pos"), marketId, outcomeId, stake, fee: qt.fee, shares: qt.shares, avgPrice: qt.avgPrice, at: Date.now(),
  };
  commit({
    ...s,
    markets: s.markets.map((m) => (m.id === marketId ? updated : m)),
    positions: [pos].concat(s.positions),
    credits: round2(s.credits - stake),
  });
  return { ok: true, value: pos };
}

export function createPrediction(d: PredictionDraft): Result<OMMarket> {
  const err = validatePrediction(d);
  if (err) return { ok: false, error: err };
  const s = load();
  const id = uid("om");
  const p = d.openingProbability;
  const q = qForProbabilities([p, 1 - p], OM_B);
  const m: OMMarket = {
    id, cls: "prediction", origin: "open", title: d.title.trim(), category: d.category || "General", emoji: "🎯",
    closesAt: d.closesAt, resolution: d.resolution.trim(), creator: "You", b: OM_B,
    outcomes: [{ id: `${id}-0`, label: "Yes", q: q[0] }, { id: `${id}-1`, label: "No", q: q[1] }],
    volume: 0, traders: 0, createdAt: Date.now(), history: [[p, 1 - p]],
  };
  commit({ ...s, markets: [m].concat(s.markets), createdIds: [id].concat(s.createdIds) });
  return { ok: true, value: m };
}

export function createConviction(d: ConvictionDraft): Result<OMMarket> {
  const err = validateConviction(d);
  if (err) return { ok: false, error: err };
  const s = load();
  const id = uid("om");
  const branches = d.branches.map((x) => x.trim()).filter(Boolean);
  const n = branches.length;
  // Every branch opens at q = 0: the frontier starts uniform at 1/n.
  const m: OMMarket = {
    id, cls: "conviction", side: d.side, origin: "open", title: d.root.trim(), category: d.category || "Paseome", emoji: "♞",
    closesAt: d.side === "forward" ? nextLegClose(Date.now()) : null,
    resolution: d.side === "forward"
      ? "Optimistic oracle at the leg boundary · untaken branches refunded"
      : "Never resolves — prices how strongly the belief persists",
    creator: "You", b: OM_B,
    outcomes: branches.map((label, i) => ({ id: `${id}-${i}`, label, q: 0 })),
    volume: 0, traders: 0, createdAt: Date.now(), history: [branches.map(() => 1 / n)],
  };
  commit({ ...s, markets: [m].concat(s.markets), createdIds: [id].concat(s.createdIds) });
  return { ok: true, value: m };
}

export function topUp(amount = 500) {
  const s = load();
  commit({ ...s, credits: round2(s.credits + amount) });
}

export function resetDemo() {
  commit(fresh());
}

/**
 * Buy and rip packs on the demo floor. Rarity comes from openCardPack() — the
 * same weighted generator the server's open-pack route runs — so what drops
 * here is the real distribution. Price per pack defaults to the canon basic
 * pack (PLATFORM.CARD_PACK_COST, 5 cards).
 */
export function ripPacks(count: number, pricePerPack: number = PLATFORM.CARD_PACK_COST): Result<RippedCard[]> {
  const s = load();
  const cost = round2(count * pricePerPack);
  if (cost > s.credits) return { ok: false, error: "Not enough demo $MADx — top up on your profile." };
  const out: RippedCard[] = [];
  for (let k = 0; k < count; k++) {
    const pack = openCardPack(s.nonce, s.packCount + k + 1);
    pack.cards.forEach((c) => out.push({ id: `${c.id}-${s.packCount + k + 1}`, name: c.name, rarity: c.rarity, faction: c.faction, serial: c.serial, caption: c.caption, at: Date.now() }));
  }
  commit({ ...s, credits: round2(s.credits - cost), cards: out.concat(s.cards).slice(0, 240), packCount: s.packCount + count });
  return { ok: true, value: out };
}
