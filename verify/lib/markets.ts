/**
 * MAD Gambit — Prediction-market ledger (Part W).
 *
 * Neon data access for markets / bets / audit_log (sql/0007_markets.sql). Raw
 * pg + typed mappers (no ORM). Fee/creator splits stay in gambit-game-math
 * (splitFee) — this module is the persistence + query layer.
 */
import type { Pool } from "pg";

export type MarketStatus = "open" | "resolving" | "resolved" | "disputed";
export type BetSide = "YES" | "NO";
export type BetStatus = "pending" | "won" | "lost" | "cancelled";

export interface Market {
  id: string;
  title: string;
  category: string;
  description: string | null;
  creatorWallet: string | null;
  yesOdds: number;
  noOdds: number;
  status: MarketStatus;
  outcome: BetSide | null;
  volume: number;
  resolutionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bet {
  id: number;
  marketId: string;
  walletAddress: string;
  side: BetSide;
  amount: number;
  oddsAtBet: number;
  status: BetStatus;
  createdAt: string;
}

const toIso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

interface RawMarketRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  creator_wallet: string | null;
  yes_odds: string | number;
  no_odds: string | number;
  status: string;
  outcome: string | null;
  volume: string | number;
  resolution_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function mapMarket(r: RawMarketRow): Market {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    creatorWallet: r.creator_wallet,
    yesOdds: Number(r.yes_odds),
    noOdds: Number(r.no_odds),
    status: r.status as MarketStatus,
    outcome: (r.outcome as BetSide | null) ?? null,
    volume: Number(r.volume),
    resolutionAt: toIso(r.resolution_at),
    createdAt: toIso(r.created_at) ?? "",
    updatedAt: toIso(r.updated_at) ?? "",
  };
}

interface RawBetRow {
  id: string | number;
  market_id: string;
  wallet_address: string;
  side: string;
  amount: string | number;
  odds_at_bet: string | number;
  status: string;
  created_at: Date | string;
}

function mapBet(r: RawBetRow): Bet {
  return {
    id: Number(r.id),
    marketId: r.market_id,
    walletAddress: r.wallet_address,
    side: r.side as BetSide,
    amount: Number(r.amount),
    oddsAtBet: Number(r.odds_at_bet),
    status: r.status as BetStatus,
    createdAt: toIso(r.created_at) ?? "",
  };
}

export interface CreateMarketInput {
  id: string;
  title: string;
  category?: string;
  description?: string | null;
  creatorWallet?: string | null;
  yesOdds?: number;
  noOdds?: number;
  resolutionAt?: string | null;
}

export async function createMarket(pool: Pool, input: CreateMarketInput): Promise<Market> {
  const res = await pool.query(
    `INSERT INTO markets (id, title, category, description, creator_wallet, yes_odds, no_odds, resolution_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      input.id,
      input.title,
      input.category ?? "general",
      input.description ?? null,
      input.creatorWallet ? input.creatorWallet.toLowerCase() : null,
      input.yesOdds ?? 2.0,
      input.noOdds ?? 2.0,
      input.resolutionAt ?? null,
    ],
  );
  if (res.rows[0]) {
    await logAudit(pool, "market", input.id, "create", { title: input.title }, input.creatorWallet ?? null);
    return mapMarket(res.rows[0] as RawMarketRow);
  }
  const existing = await getMarket(pool, input.id);
  if (existing) return existing;
  throw new Error("market create failed");
}

export async function getMarket(pool: Pool, id: string): Promise<Market | null> {
  const res = await pool.query(`SELECT * FROM markets WHERE id = $1`, [id]);
  return res.rows[0] ? mapMarket(res.rows[0] as RawMarketRow) : null;
}

export async function listMarkets(pool: Pool, status?: MarketStatus, limit = 50): Promise<Market[]> {
  const res = status
    ? await pool.query(`SELECT * FROM markets WHERE status = $1 ORDER BY created_at DESC LIMIT $2`, [status, limit])
    : await pool.query(`SELECT * FROM markets ORDER BY created_at DESC LIMIT $1`, [limit]);
  return (res.rows as RawMarketRow[]).map(mapMarket);
}

export interface PlaceBetInput {
  marketId: string;
  walletAddress: string;
  side: BetSide;
  amount: number;
}

/** Place a bet: captures current odds, records the bet, bumps market volume. */
export async function placeBet(pool: Pool, input: PlaceBetInput): Promise<Bet | null> {
  const market = await getMarket(pool, input.marketId);
  if (!market || market.status !== "open") return null;
  const odds = input.side === "YES" ? market.yesOdds : market.noOdds;
  const res = await pool.query(
    `INSERT INTO bets (market_id, wallet_address, side, amount, odds_at_bet)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.marketId, input.walletAddress.toLowerCase(), input.side, input.amount, odds],
  );
  await pool.query(`UPDATE markets SET volume = volume + $2, updated_at = now() WHERE id = $1`, [
    input.marketId,
    input.amount,
  ]);
  await logAudit(pool, "bet", input.marketId, "bet", { side: input.side, amount: input.amount }, input.walletAddress);
  return res.rows[0] ? mapBet(res.rows[0] as RawBetRow) : null;
}

export async function listBetsByWallet(pool: Pool, wallet: string, limit = 100): Promise<Bet[]> {
  const res = await pool.query(
    `SELECT * FROM bets WHERE wallet_address = $1 ORDER BY created_at DESC LIMIT $2`,
    [wallet.toLowerCase(), limit],
  );
  return (res.rows as RawBetRow[]).map(mapBet);
}

/** Append-only audit entry. Best-effort — never throws into the caller path. */
export async function logAudit(
  pool: Pool,
  entityType: string,
  entityId: string,
  action: string,
  details: Record<string, unknown>,
  wallet: string | null,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, details, wallet_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, action, JSON.stringify(details), wallet ? wallet.toLowerCase() : null],
    );
  } catch (e) {
    console.error("audit_log insert failed:", e);
  }
}
