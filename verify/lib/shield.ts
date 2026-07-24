/**
 * MAD Shield — Neon data access (Part P, P-2).
 *
 * Thin persistence layer over `shield_positions` (sql/0002_shield.sql). The
 * Shield economics live in `gambit-game-math.ts`; this module only records and
 * reads opt-in state. Uses untyped `pool.query()` + typed mapper functions to
 * avoid the `QueryResultRow` index-signature constraint on pg generics.
 */
import type { Pool } from "pg";
import type { ShieldTier, ShieldStatus } from "./gambit-game-math";

export interface ShieldPositionRow {
  id: number;
  walletAddress: string;
  positionRef: string | null;
  tier: ShieldTier;
  premiumTier: number;
  stakeAmount: number;
  premiumPaid: number;
  status: ShieldStatus;
  stakedAt: string | null;
  unstakeRequestedAt: string | null;
  estimatedReturnAt: string | null;
  returnWindowHours: number;
  createdAt: string;
}

interface RawShieldRow {
  id: string | number;
  wallet_address: string;
  position_ref: string | null;
  tier: string;
  premium_tier: string | number;
  stake_amount: string | number;
  premium_paid: string | number;
  status: string;
  staked_at: Date | string | null;
  unstake_requested_at: Date | string | null;
  estimated_return_at: Date | string | null;
  return_window_hours: string | number;
  created_at: Date | string;
}

const toIso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

function mapRow(r: RawShieldRow): ShieldPositionRow {
  return {
    id: Number(r.id),
    walletAddress: r.wallet_address,
    positionRef: r.position_ref,
    tier: r.tier as ShieldTier,
    premiumTier: Number(r.premium_tier),
    stakeAmount: Number(r.stake_amount),
    premiumPaid: Number(r.premium_paid),
    status: r.status as ShieldStatus,
    stakedAt: toIso(r.staked_at),
    unstakeRequestedAt: toIso(r.unstake_requested_at),
    estimatedReturnAt: toIso(r.estimated_return_at),
    returnWindowHours: Number(r.return_window_hours),
    createdAt: toIso(r.created_at) ?? "",
  };
}

export interface InsertShieldInput {
  walletAddress: string;
  positionRef?: string | null;
  tier: ShieldTier;
  premiumTier: number;
  stakeAmount: number;
  premiumPaid: number;
  status: ShieldStatus;
  stakedAt: number | null; // epoch ms
  returnWindowHours: number;
}

/** Record a Shield opt-in. Returns the persisted row. */
export async function insertShieldPosition(
  pool: Pool,
  input: InsertShieldInput,
): Promise<ShieldPositionRow> {
  const res = await pool.query(
    `INSERT INTO shield_positions
       (wallet_address, position_ref, tier, premium_tier, stake_amount,
        premium_paid, status, staked_at, return_window_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0), $9)
     RETURNING *`,
    [
      input.walletAddress.toLowerCase(),
      input.positionRef ?? null,
      input.tier,
      input.premiumTier,
      input.stakeAmount,
      input.premiumPaid,
      input.status,
      input.stakedAt,
      input.returnWindowHours,
    ],
  );
  return mapRow(res.rows[0] as RawShieldRow);
}

/** List a wallet's Shield positions, newest first. */
export async function listShieldPositions(
  pool: Pool,
  wallet: string,
  limit = 50,
): Promise<ShieldPositionRow[]> {
  const res = await pool.query(
    `SELECT * FROM shield_positions
     WHERE wallet_address = $1 ORDER BY created_at DESC LIMIT $2`,
    [wallet.toLowerCase(), limit],
  );
  return (res.rows as RawShieldRow[]).map(mapRow);
}
