/**
 * MAD Gambit — Web2 $MADx (Beta) credit engine.
 * ------------------------------------------------------------------
 * An off-chain, Neon-backed credit ledger that MIRRORS the on-chain fair-launch
 * $MADx (MADDEX / "MADx", hard cap 224,573,096, mint-on-demand — see
 * docs/MECHANISM_ORACLE_MADX_RESEARCH.md) so the beta is fully functional before
 * the on-chain token has circulating supply. Behaviour parity with its web3
 * counterpart: balance, mint-to-cap onboarding/purchase, transfer, staking into
 * the real STAKING_TIERS (APY accrual mirroring MADStaking), claim, and spend.
 *
 * These are BETA CREDITS — labelled as such in the UI, intended to redeem 1:1 for
 * on-chain $MADx at TGE (that redemption is a placeholder for now). All mints are
 * capped by the same 224,573,096 supply ceiling, tracked atomically.
 */
import type { Pool, PoolClient } from "pg";
import { STAKING_TIERS, getStakingTier } from "@/lib/gambit-game-math";

export const MADX_BETA = {
  symbol: "MADx",
  label: "MADx · Beta",
  cap: 224_573_096, // mirrors the on-chain fair-launch hard cap
  welcomeGrant: 500, // onboarding faucet
  maxBuyPerTx: 100_000, // placeholder-purchase ceiling
  tiers: STAKING_TIERS,
  note: "Beta credits — off-chain, redeemable 1:1 for on-chain $MADx at TGE (placeholder).",
} as const;

const SECONDS_PER_YEAR = 365 * 24 * 3600;

export interface MadxTier {
  name: string;
  minMadx: number;
  apy: number;
}

export interface MadxAccount {
  owner: string;
  balance: number;
  staked: number;
  rewardAccrued: number;
  pendingRewards: number;
  tier: MadxTier | null;
  onboarded: boolean;
  onboardedAt: string | null;
  updatedAt: string | null;
}

interface RawAccountRow {
  owner: string;
  balance: string | number;
  staked: string | number;
  reward_accrued: string | number;
  last_accrual_at: Date | string;
  onboarded_at: Date | string | null;
  updated_at: Date | string | null;
}

const norm = (owner: string) => owner.trim().toLowerCase();
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const iso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

/** Linear APY accrual since the last settle — mirrors MADStaking._accruedSince. */
function accruedSince(staked: number, apy: number, last: Date | string): number {
  const t = (last instanceof Date ? last : new Date(last)).getTime();
  if (!Number.isFinite(t) || staked <= 0 || apy <= 0) return 0;
  const elapsed = Math.max(0, (Date.now() - t) / 1000);
  return staked * apy * (elapsed / SECONDS_PER_YEAR);
}

function mapAccount(r: RawAccountRow): MadxAccount {
  const staked = Number(r.staked);
  const tier = (getStakingTier(staked) as MadxTier | null) ?? null;
  const rewardAccrued = Number(r.reward_accrued);
  const pending = rewardAccrued + (tier ? accruedSince(staked, tier.apy, r.last_accrual_at) : 0);
  return {
    owner: r.owner,
    balance: Number(r.balance),
    staked,
    rewardAccrued,
    pendingRewards: round6(pending),
    tier,
    onboarded: true,
    onboardedAt: iso(r.onboarded_at),
    updatedAt: iso(r.updated_at),
  };
}

const EMPTY = (owner: string): MadxAccount => ({
  owner,
  balance: 0,
  staked: 0,
  rewardAccrued: 0,
  pendingRewards: 0,
  tier: null,
  onboarded: false,
  onboardedAt: null,
  updatedAt: null,
});

async function withTx<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function insertLedger(
  c: PoolClient,
  owner: string,
  kind: string,
  amount: number,
  counterparty: string | null,
  note: string | null,
): Promise<void> {
  await c.query(
    `INSERT INTO madx_ledger (owner, counterparty, kind, amount, note) VALUES ($1, $2, $3, $4, $5)`,
    [owner, counterparty, kind, amount, note],
  );
}

/** Atomically mint `amount` against the shared cap. Returns false if it would exceed. */
async function mintAgainstCap(c: PoolClient, amount: number): Promise<boolean> {
  const res = await c.query(
    `UPDATE madx_supply SET total_minted = total_minted + $1
     WHERE id = 1 AND total_minted + $1 <= $2 RETURNING total_minted`,
    [amount, MADX_BETA.cap],
  );
  return (res.rowCount ?? 0) > 0;
}

async function ensureRow(c: PoolClient, owner: string): Promise<void> {
  await c.query(`INSERT INTO madx_accounts (owner) VALUES ($1) ON CONFLICT (owner) DO NOTHING`, [owner]);
}

/** Settle accrued staking rewards into reward_accrued (call before staked changes). */
async function settle(c: PoolClient, owner: string): Promise<void> {
  const res = await c.query(
    `SELECT staked, last_accrual_at FROM madx_accounts WHERE owner = $1 FOR UPDATE`,
    [owner],
  );
  const row = res.rows[0];
  if (!row) return;
  const staked = Number(row.staked);
  const tier = getStakingTier(staked);
  const add = tier ? accruedSince(staked, tier.apy, row.last_accrual_at) : 0;
  await c.query(
    `UPDATE madx_accounts SET reward_accrued = reward_accrued + $2, last_accrual_at = now() WHERE owner = $1`,
    [owner, round6(add)],
  );
}

async function fetchAccount(c: PoolClient, owner: string): Promise<MadxAccount> {
  const res = await c.query(`SELECT * FROM madx_accounts WHERE owner = $1`, [owner]);
  return res.rows[0] ? mapAccount(res.rows[0] as RawAccountRow) : EMPTY(owner);
}

/* ─────────────────────────── public API ─────────────────────────── */

export async function getAccount(pool: Pool, owner: string): Promise<MadxAccount> {
  const o = norm(owner);
  const res = await pool.query(`SELECT * FROM madx_accounts WHERE owner = $1`, [o]);
  return res.rows[0] ? mapAccount(res.rows[0] as RawAccountRow) : EMPTY(o);
}

/** Onboard: idempotent welcome grant (minted against the cap, once per owner). */
export async function onboard(pool: Pool, owner: string): Promise<MadxAccount> {
  const o = norm(owner);
  return withTx(pool, async (c) => {
    await ensureRow(c, o);
    const prior = await c.query(`SELECT 1 FROM madx_ledger WHERE owner = $1 AND kind = 'welcome' LIMIT 1`, [o]);
    if ((prior.rowCount ?? 0) === 0 && (await mintAgainstCap(c, MADX_BETA.welcomeGrant))) {
      await c.query(`UPDATE madx_accounts SET balance = balance + $2, updated_at = now() WHERE owner = $1`, [
        o,
        MADX_BETA.welcomeGrant,
      ]);
      await insertLedger(c, o, "welcome", MADX_BETA.welcomeGrant, null, "beta onboarding grant");
    }
    return fetchAccount(c, o);
  });
}

/** Placeholder purchase: mints beta credits (labelled beta), capped per-tx + by supply. */
export async function buy(pool: Pool, owner: string, amount: number): Promise<{ account: MadxAccount; minted: boolean }> {
  const o = norm(owner);
  const amt = round6(Math.min(Math.max(amount, 0), MADX_BETA.maxBuyPerTx));
  return withTx(pool, async (c) => {
    await ensureRow(c, o);
    let minted = false;
    if (amt > 0 && (await mintAgainstCap(c, amt))) {
      await c.query(`UPDATE madx_accounts SET balance = balance + $2, updated_at = now() WHERE owner = $1`, [o, amt]);
      await insertLedger(c, o, "buy", amt, null, "beta placeholder purchase");
      minted = true;
    }
    return { account: await fetchAccount(c, o), minted };
  });
}

export async function transfer(pool: Pool, from: string, to: string, amount: number): Promise<boolean> {
  const f = norm(from);
  const t = norm(to);
  const amt = round6(amount);
  if (amt <= 0 || f === t || !t) return false;
  return withTx(pool, async (c) => {
    const debit = await c.query(
      `UPDATE madx_accounts SET balance = balance - $2, updated_at = now() WHERE owner = $1 AND balance >= $2 RETURNING owner`,
      [f, amt],
    );
    if ((debit.rowCount ?? 0) === 0) return false;
    await ensureRow(c, t);
    await c.query(`UPDATE madx_accounts SET balance = balance + $2, updated_at = now() WHERE owner = $1`, [t, amt]);
    await insertLedger(c, f, "transfer_out", amt, t, null);
    await insertLedger(c, t, "transfer_in", amt, f, null);
    return true;
  });
}

export async function stake(pool: Pool, owner: string, amount: number): Promise<MadxAccount | null> {
  const o = norm(owner);
  const amt = round6(amount);
  if (amt <= 0) return null;
  return withTx(pool, async (c) => {
    await ensureRow(c, o);
    await settle(c, o);
    const upd = await c.query(
      `UPDATE madx_accounts SET balance = balance - $2, staked = staked + $2, updated_at = now()
       WHERE owner = $1 AND balance >= $2 RETURNING *`,
      [o, amt],
    );
    if ((upd.rowCount ?? 0) === 0) return null;
    await insertLedger(c, o, "stake", amt, null, null);
    return mapAccount(upd.rows[0] as RawAccountRow);
  });
}

export async function unstake(pool: Pool, owner: string, amount: number): Promise<MadxAccount | null> {
  const o = norm(owner);
  const amt = round6(amount);
  if (amt <= 0) return null;
  return withTx(pool, async (c) => {
    await settle(c, o);
    const upd = await c.query(
      `UPDATE madx_accounts SET staked = staked - $2, balance = balance + $2, updated_at = now()
       WHERE owner = $1 AND staked >= $2 RETURNING *`,
      [o, amt],
    );
    if ((upd.rowCount ?? 0) === 0) return null;
    await insertLedger(c, o, "unstake", amt, null, null);
    return mapAccount(upd.rows[0] as RawAccountRow);
  });
}

/** Claim settled staking rewards → balance (minted against the cap). */
export async function claim(pool: Pool, owner: string): Promise<{ account: MadxAccount; claimed: number }> {
  const o = norm(owner);
  return withTx(pool, async (c) => {
    await ensureRow(c, o);
    await settle(c, o);
    const res = await c.query(`SELECT reward_accrued FROM madx_accounts WHERE owner = $1 FOR UPDATE`, [o]);
    const pending = round6(Number(res.rows[0]?.reward_accrued ?? 0));
    let claimed = 0;
    if (pending > 0 && (await mintAgainstCap(c, pending))) {
      await c.query(
        `UPDATE madx_accounts SET balance = balance + $2, reward_accrued = 0, updated_at = now() WHERE owner = $1`,
        [o, pending],
      );
      await insertLedger(c, o, "claim", pending, null, "staking rewards");
      claimed = pending;
    }
    return { account: await fetchAccount(c, o), claimed };
  });
}

/** Debit credits to back a market / bet / pack. Returns false on insufficient balance. */
export async function spend(pool: Pool, owner: string, amount: number, note: string): Promise<boolean> {
  const o = norm(owner);
  const amt = round6(amount);
  if (amt <= 0) return false;
  return withTx(pool, async (c) => {
    const upd = await c.query(
      `UPDATE madx_accounts SET balance = balance - $2, updated_at = now() WHERE owner = $1 AND balance >= $2 RETURNING owner`,
      [o, amt],
    );
    if ((upd.rowCount ?? 0) === 0) return false;
    await insertLedger(c, o, "spend", amt, null, note);
    return true;
  });
}

export async function getSupply(pool: Pool): Promise<{ minted: number; cap: number; remaining: number }> {
  const res = await pool.query(`SELECT total_minted FROM madx_supply WHERE id = 1`);
  const minted = Number(res.rows[0]?.total_minted ?? 0);
  return { minted, cap: MADX_BETA.cap, remaining: Math.max(0, MADX_BETA.cap - minted) };
}
