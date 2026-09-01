/**
 * Card lifecycle — Neon data access (Part Q).
 *
 * Ownership ledger over the `cards` table (sql/0003_cards.sql). Card economics
 * (rarity, wear, evolution) live in `gambit-game-math.ts`; this module only
 * persists and reads owned cards. Untyped `pool.query()` + typed mappers to
 * avoid the `QueryResultRow` index-signature constraint on pg generics.
 */
import type { Pool, PoolClient } from "pg";
import type { Rarity } from "./gambit-game-math";

export interface CardRow {
  id: number;
  walletAddress: string;
  cardUid: string;
  name: string;
  rarity: Rarity;
  faction: string;
  serial: number;
  durability: number;
  evolutionStage: number;
  xp: number;
  earnsCount: number;
  uses: number;
  createdAt: string;
  updatedAt: string;
}

interface RawCardRow {
  id: string | number;
  wallet_address: string;
  card_uid: string;
  name: string;
  rarity: string;
  faction: string;
  serial: string | number;
  durability: string | number;
  evolution_stage: string | number;
  xp: string | number;
  earns_count: string | number;
  uses: string | number;
  created_at: Date | string;
  updated_at: Date | string;
}

const toIso = (v: Date | string): string => (v instanceof Date ? v.toISOString() : String(v));

function mapRow(r: RawCardRow): CardRow {
  return {
    id: Number(r.id),
    walletAddress: r.wallet_address,
    cardUid: r.card_uid,
    name: r.name,
    rarity: r.rarity as Rarity,
    faction: r.faction,
    serial: Number(r.serial),
    durability: Number(r.durability),
    evolutionStage: Number(r.evolution_stage),
    xp: Number(r.xp),
    earnsCount: Number(r.earns_count),
    uses: Number(r.uses),
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  };
}

export interface InsertCardInput {
  walletAddress: string;
  cardUid: string;
  name: string;
  rarity: Rarity;
  faction: string;
  serial: number;
  durability?: number;
  evolutionStage?: number;
  xp?: number;
  earnsCount?: number;
}

/**
 * Persist a collected card to a wallet's ledger. Returns the stored row.
 *
 * Accepts a PoolClient as well as a Pool so a caller can mint INSIDE its own
 * transaction. That matters for pack opening: the debit and the five inserts
 * are one event, and a crash between them either charges for nothing or mints
 * for free.
 */
export async function insertCard(pool: Pool | PoolClient, input: InsertCardInput): Promise<CardRow> {
  const res = await pool.query(
    `INSERT INTO cards
       (wallet_address, card_uid, name, rarity, faction, serial,
        durability, evolution_stage, xp, earns_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.walletAddress.toLowerCase(),
      input.cardUid,
      input.name,
      input.rarity,
      input.faction,
      input.serial,
      input.durability ?? 1,
      input.evolutionStage ?? 1,
      input.xp ?? 0,
      input.earnsCount ?? 0,
    ],
  );
  return mapRow(res.rows[0] as RawCardRow);
}

/** List a wallet's owned cards, newest first. */
export async function listCards(pool: Pool, wallet: string, limit = 100): Promise<CardRow[]> {
  const res = await pool.query(
    `SELECT * FROM cards WHERE wallet_address = $1 ORDER BY created_at DESC LIMIT $2`,
    [wallet.toLowerCase(), limit],
  );
  return (res.rows as RawCardRow[]).map(mapRow);
}
