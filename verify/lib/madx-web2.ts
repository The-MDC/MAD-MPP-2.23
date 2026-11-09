/**
 * MAD Gambit — Web2 $MADx (Beta) credit engine.
 * ------------------------------------------------------------------
 * An off-chain, Neon-backed credit ledger that MIRRORS the on-chain fair-launch
 * $MADx (MADDEX / "MADx", hard cap 224,573,096, mint-on-demand — see
 * docs/MAD_GAMBIT_MASTER.md) so the beta is fully functional before
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
  // The number this ledger ENFORCES: `mintAgainstCap` refuses any mint that would push
  // `madx_supply.total_minted` past it. It mirrors the deployed contract's mint cap
  // (lib/contracts.ts#MADX.maxSupplyCap). It is NOT the total supply: that is
  // PLATFORM.MADX_FIXED_SUPPLY = 888,888,888 (lib/gambit-game-math.ts), and the founder's
  // 2026-11-09 answer puts 270 million purchasable in the sale — above this cap. Which
  // number the beta should enforce is a founder call (MASTER PART 0 §3); until it is made
  // this stays the contract's cap, and lib/madx-supply-canon.test.ts fails loudly if it moves.
  cap: 224_573_096,
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

/**
 * The ledger's rounding granularity — 6 decimal places, applied to every $MADx
 * amount that touches `madx_accounts` or `madx_ledger`.
 *
 * Exported because callers that compute an amount before handing it to
 * `spendWithin` have to round it the SAME way. A caller rounding to 2 places
 * while the ledger rounds to 6 puts a residue on every row, and the residue is
 * the kind of thing that only shows up as a reconciliation mismatch months
 * later. One rounding rule, one place.
 */
export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
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
  return withTx(pool, (c) => spendWithin(c, owner, amount, note));
}

/**
 * The debit leg of `spend`, on a caller-owned transaction.
 *
 * `spend` opens its own transaction, which makes it unusable inside one — and a
 * market fill MUST be one transaction: debiting the buyer and moving the book
 * are the same event, and a crash between them either takes money without
 * giving shares or gives shares without taking money. Neither is recoverable
 * from the ledger, because there would be nothing in it to reverse.
 *
 * Returns false (does NOT throw) when the balance is short, so the caller can
 * roll back its own work and answer 409 rather than 500. The `balance >= $2`
 * predicate is what makes that atomic: two concurrent fills cannot both pass
 * it, because the row is locked by whichever UPDATE lands first.
 */
export async function spendWithin(
  c: PoolClient,
  owner: string,
  amount: number,
  note: string,
): Promise<boolean> {
  const o = norm(owner);
  const amt = round6(amount);
  if (amt <= 0) return false;
  const upd = await c.query(
    `UPDATE madx_accounts SET balance = balance - $2, updated_at = now() WHERE owner = $1 AND balance >= $2 RETURNING owner`,
    [o, amt],
  );
  if ((upd.rowCount ?? 0) === 0) return false;
  await insertLedger(c, o, "spend", amt, null, note);
  return true;
}

/**
 * The credit leg that undoes a `spendWithin`, on a caller-owned transaction.
 *
 * THE LEDGER'S SIGN CONVENTION. `spend` takes balance out of the account and
 * does NOT touch `madx_supply.total_minted`: the value leaves the account and
 * the platform keeps it. So the inverse must not touch `total_minted` either —
 * a refund hands back value that was already minted and spent, it does not mint
 * anything. Routing it through `mintAgainstCap` would count the same credits
 * against the 224,573,096 ceiling twice and, near the cap, refuse a legitimate
 * refund. (The mutation-audit lesson of CF2 applies here: the number that
 * matters is the one the ledger enforces, and a refund must not move it.)
 *
 * Takes the `kind = 'refund'` ledger row that `sql/0008` already permits, so no
 * migration. Returns false (does NOT throw) for a non-positive amount, so a
 * caller can treat "nothing to refund" as an outcome rather than an error.
 *
 * THE CALLER OWNS THE QUESTION "WAS THIS EVER DEBITED?". This function credits
 * unconditionally — it cannot know. A caller that refunds without proof of the
 * original debit mints money, so `lib/slot-auction-store.ts` looks for the
 * matching `spend` row before it calls this.
 */
export async function refundWithin(
  c: PoolClient,
  owner: string,
  amount: number,
  note: string,
): Promise<boolean> {
  const o = norm(owner);
  const amt = round6(amount);
  if (amt <= 0) return false;
  await ensureRow(c, o);
  await c.query(`UPDATE madx_accounts SET balance = balance + $2, updated_at = now() WHERE owner = $1`, [o, amt]);
  await insertLedger(c, o, "refund", amt, null, note);
  return true;
}

export async function getSupply(pool: Pool): Promise<{ minted: number; cap: number; remaining: number }> {
  const res = await pool.query(`SELECT total_minted FROM madx_supply WHERE id = 1`);
  const minted = Number(res.rows[0]?.total_minted ?? 0);
  return { minted, cap: MADX_BETA.cap, remaining: Math.max(0, MADX_BETA.cap - minted) };
}
