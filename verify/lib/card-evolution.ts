/**
 * MAD Gambit — Card Evolution engine (Part V build).
 *
 * Living MADCards: virtual off-chain stats that evolve through battles /
 * predictions / saga contributions, only minted on-chain at max level (L3+).
 * Faithful TS port of the Card-Evolution + VRF handoff's math, plus Neon
 * persistence (raw pg + typed mappers — no ORM).
 *
 * The on-chain VRF mint (EvolutionVRFConsumer.sol) is the gated final step; this
 * module runs the entire hybrid off-chain scoring/level/clown/ability system.
 */
import type { Pool } from "pg";

export type EvolutionLevel = 1 | 2 | 3 | 4;

export interface SagaContributions {
  madConvDelta: number;
  memesContributed: number;
  liesCalled: number;
  garchEventsSurvived: number;
  calibrationScore: number;
  treeNodesTraversed: string[];
}

export interface CardStats {
  id: string;
  owner: string;
  name: string | null;
  faction: string | null;
  evolutionLevel: EvolutionLevel;
  wins: number;
  losses: number;
  netPerformance: number;
  scandalMeter: number;
  buzzScore: number;
  specialAbilities: string[];
  isClown: boolean;
  clownUntil: number | null;
  isMinted: boolean;
  tokenId: string | null;
  metadataURI: string | null;
  sagaContributions: SagaContributions;
  lastEvolutionTs: number | null;
  virtualSeed: string | null;
  createdAt: number;
  updatedAt: number;
}

export const MINT_GATE_LEVEL: EvolutionLevel = 3;
const CLOWN_DURATION_MS = 1000 * 60 * 60 * 48; // 48h

/** The six special abilities; `unlock` is the evolution level that grants it
 *  (Clown Revenge is recovery-only → unlock 99 so level thresholds never grant it). */
export const CARD_ABILITIES = [
  { key: "chaos_amplifier", name: "Chaos Amplifier", unlock: 2 },
  { key: "lie_detector", name: "Lie Detector", unlock: 2 },
  { key: "meme_lord", name: "Meme Lord", unlock: 3 },
  { key: "scandal_shield", name: "Scandal Shield", unlock: 3 },
  { key: "saga_oracle", name: "Saga Oracle", unlock: 3 },
  { key: "clown_revenge", name: "Clown Revenge", unlock: 99 },
] as const;

export function abilitiesForLevel(level: EvolutionLevel): string[] {
  return CARD_ABILITIES.filter((a) => a.unlock <= level).map((a) => a.name);
}

/** Hybrid evolution score: W/L + owner MADConv^1.45 + buzz + GARCH survived − scandal. */
export function calculateEvolutionScore(
  stats: Pick<CardStats, "wins" | "losses" | "scandalMeter" | "buzzScore" | "sagaContributions">,
  ownerMADConv: number,
): number {
  const net = stats.wins - stats.losses * 1.2;
  const madConvContrib = Math.pow(Math.max(0, ownerMADConv) / 100, 1.45) * 40;
  const buzz = stats.buzzScore * 0.15;
  const garchBonus = (stats.sagaContributions?.garchEventsSurvived || 0) * 12;
  const scandalPenalty = stats.scandalMeter * 0.85;
  return net * 10 + madConvContrib + buzz + garchBonus - scandalPenalty;
}

export function determineLevel(score: number): EvolutionLevel {
  if (score >= 280) return 4; // Mythic / Saga-Legendary
  if (score >= 160) return 3; // Legendary — mint gate opens
  if (score >= 70) return 2; // Enhanced
  return 1; // Base
}

export function shouldEnterClownState(
  stats: Pick<CardStats, "scandalMeter" | "losses" | "wins">,
): boolean {
  return stats.scandalMeter > 72 || (stats.losses > stats.wins + 4 && stats.scandalMeter > 45);
}

export interface EvolutionResult {
  score: number;
  level: EvolutionLevel;
  leveledUp: boolean;
  mintGateOpen: boolean; // level ≥ 3 and not yet minted
  isClown: boolean;
  clownUntil: number | null;
  abilities: string[];
}

/** Pure evolution step — given current stats + owner MADConv, compute next state. */
export function evolve(stats: CardStats, ownerMADConv: number, now: number = Date.now()): EvolutionResult {
  const score = calculateEvolutionScore(stats, ownerMADConv);
  const level = determineLevel(score);
  const enteringClown = shouldEnterClownState(stats);
  const clownUntil = enteringClown
    ? now + CLOWN_DURATION_MS
    : stats.clownUntil && stats.clownUntil > now
      ? stats.clownUntil
      : null;
  const isClown = clownUntil !== null && clownUntil > now;
  return {
    score,
    level,
    leveledUp: level > stats.evolutionLevel,
    mintGateOpen: level >= MINT_GATE_LEVEL && !stats.isMinted,
    isClown,
    clownUntil,
    abilities: abilitiesForLevel(level),
  };
}

/* ── Neon persistence (untyped query + typed mapper) ─────────────────── */

interface RawCardStatsRow {
  id: string;
  owner: string;
  name: string | null;
  faction: string | null;
  evolution_level: string | number;
  wins: string | number;
  losses: string | number;
  net_performance: string | number;
  scandal_meter: string | number;
  buzz_score: string | number;
  special_abilities: string[] | null;
  is_clown: boolean;
  clown_until: Date | string | null;
  is_minted: boolean;
  token_id: string | null;
  metadata_uri: string | null;
  saga_contributions: Partial<SagaContributions> | null;
  last_evolution_ts: Date | string | null;
  virtual_seed: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

const EMPTY_SAGA: SagaContributions = {
  madConvDelta: 0,
  memesContributed: 0,
  liesCalled: 0,
  garchEventsSurvived: 0,
  calibrationScore: 0,
  treeNodesTraversed: [],
};

const ms = (v: Date | string | null): number | null =>
  v == null ? null : v instanceof Date ? v.getTime() : new Date(v).getTime();

function mapRow(r: RawCardStatsRow): CardStats {
  const lvl = Number(r.evolution_level);
  return {
    id: r.id,
    owner: r.owner,
    name: r.name,
    faction: r.faction,
    evolutionLevel: (lvl >= 1 && lvl <= 4 ? lvl : 1) as EvolutionLevel,
    wins: Number(r.wins),
    losses: Number(r.losses),
    netPerformance: Number(r.net_performance),
    scandalMeter: Number(r.scandal_meter),
    buzzScore: Number(r.buzz_score),
    specialAbilities: Array.isArray(r.special_abilities) ? r.special_abilities : [],
    isClown: Boolean(r.is_clown),
    clownUntil: ms(r.clown_until),
    isMinted: Boolean(r.is_minted),
    tokenId: r.token_id,
    metadataURI: r.metadata_uri,
    sagaContributions: { ...EMPTY_SAGA, ...(r.saga_contributions ?? {}) },
    lastEvolutionTs: ms(r.last_evolution_ts),
    virtualSeed: r.virtual_seed,
    createdAt: ms(r.created_at) ?? Date.now(),
    updatedAt: ms(r.updated_at) ?? Date.now(),
  };
}

export interface CreateCardInput {
  id: string;
  owner: string;
  name?: string | null;
  faction?: string | null;
  virtualSeed?: string | null;
}

/** Create a fresh virtual (unminted, Level-1) card. */
export async function createCardStats(pool: Pool, input: CreateCardInput): Promise<CardStats> {
  const res = await pool.query(
    `INSERT INTO card_stats (id, owner, name, faction, virtual_seed, saga_contributions)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [input.id, input.owner, input.name ?? null, input.faction ?? null, input.virtualSeed ?? null, JSON.stringify(EMPTY_SAGA)],
  );
  if (res.rows[0]) return mapRow(res.rows[0] as RawCardStatsRow);
  const existing = await getCardStats(pool, input.id);
  if (existing) return existing;
  throw new Error("card create failed");
}

export async function getCardStats(pool: Pool, id: string): Promise<CardStats | null> {
  const res = await pool.query(`SELECT * FROM card_stats WHERE id = $1`, [id]);
  return res.rows[0] ? mapRow(res.rows[0] as RawCardStatsRow) : null;
}

export async function listCardStatsByOwner(pool: Pool, owner: string, limit = 100): Promise<CardStats[]> {
  const res = await pool.query(
    `SELECT * FROM card_stats WHERE owner = $1 ORDER BY evolution_level DESC, updated_at DESC LIMIT $2`,
    [owner, limit],
  );
  return (res.rows as RawCardStatsRow[]).map(mapRow);
}

/** Record a battle result, recompute net performance, optionally adjust scandal/buzz. */
export async function recordBattleResult(
  pool: Pool,
  id: string,
  win: boolean,
  scandalDelta = 0,
  buzzDelta = 0,
): Promise<CardStats | null> {
  const res = await pool.query(
    `UPDATE card_stats SET
       wins   = wins   + $2,
       losses = losses + $3,
       net_performance = (wins + $2) - (losses + $3) * 1.2,
       scandal_meter = LEAST(100, GREATEST(0, scandal_meter + $4)),
       buzz_score    = GREATEST(0, buzz_score + $5),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, win ? 1 : 0, win ? 0 : 1, scandalDelta, buzzDelta],
  );
  return res.rows[0] ? mapRow(res.rows[0] as RawCardStatsRow) : null;
}

/** Compute + persist the evolution state for a card given owner MADConv. */
export async function applyEvolution(
  pool: Pool,
  id: string,
  ownerMADConv: number,
): Promise<{ stats: CardStats; result: EvolutionResult } | null> {
  const current = await getCardStats(pool, id);
  if (!current) return null;
  const result = evolve(current, ownerMADConv);
  const res = await pool.query(
    `UPDATE card_stats SET
       evolution_level = $2,
       special_abilities = $3,
       is_clown = $4,
       clown_until = $5,
       last_evolution_ts = now(),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      result.level,
      JSON.stringify(result.abilities),
      result.isClown,
      result.clownUntil ? new Date(result.clownUntil).toISOString() : null,
    ],
  );
  return { stats: mapRow(res.rows[0] as RawCardStatsRow), result };
}
