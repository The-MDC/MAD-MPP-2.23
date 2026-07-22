/**
 * SIWE nonce store — durable across serverless instances.
 *
 * The previous store was a per-process `Map`, so a nonce issued by one Vercel
 * instance was unknown to the next → sign-in fails intermittently, and replay
 * protection is only as wide as one instance. This backs nonces with Neon
 * Postgres instead (our stack — no Redis dependency), falling back to an
 * in-memory Map only when DATABASE_URL is unset (local/demo, single instance).
 *
 * One-time schema (run as a migration):
 *   CREATE TABLE IF NOT EXISTS siwe_nonces (
 *     nonce      TEXT PRIMARY KEY,
 *     issued_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_siwe_nonces_issued ON siwe_nonces (issued_at);
 *   -- prune: DELETE FROM siwe_nonces WHERE issued_at < now() - interval '10 min';
 */
import { randomBytes } from 'crypto';
import { getDbPool } from './db';

const NONCE_TTL_MS = 5 * 60 * 1000;
const TTL_SQL = '5 minutes';

// Fallback store when no database is configured (dev/demo, single instance).
const mem = new Map<string, number>();

function useDb(): boolean {
  return !!process.env.DATABASE_URL;
}

/** Issue a fresh, server-side nonce. */
export async function issueNonce(): Promise<string> {
  const nonce = randomBytes(16).toString('hex');
  if (useDb()) {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO siwe_nonces (nonce) VALUES ($1)
       ON CONFLICT (nonce) DO NOTHING`,
      [nonce],
    );
    // Opportunistic prune of expired nonces (cheap, keeps the table small).
    await pool.query(`DELETE FROM siwe_nonces WHERE issued_at < now() - interval '${TTL_SQL}'`);
  } else {
    const now = Date.now();
    mem.forEach((t, n) => {
      if (now - t > NONCE_TTL_MS) mem.delete(n);
    });
    mem.set(nonce, now);
  }
  return nonce;
}

/**
 * Atomically consume a nonce. Returns true exactly once per valid, unexpired
 * nonce (single-use, even under concurrency), false otherwise.
 */
export async function consumeNonce(nonce: string): Promise<boolean> {
  if (!nonce) return false;
  if (useDb()) {
    const pool = getDbPool();
    const res = await pool.query(
      `DELETE FROM siwe_nonces
        WHERE nonce = $1 AND issued_at > now() - interval '${TTL_SQL}'
        RETURNING nonce`,
      [nonce],
    );
    return (res.rowCount ?? 0) > 0;
  }
  const issued = mem.get(nonce);
  if (issued === undefined) return false;
  mem.delete(nonce); // burn before validity check — single use even on expiry
  return Date.now() - issued <= NONCE_TTL_MS;
}
