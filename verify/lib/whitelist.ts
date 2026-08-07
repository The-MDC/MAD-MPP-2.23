/**
 * MAD Gambit — celebrity whitelist (Part S build).
 *
 * The serverless-native replacement for the eBPF/chokidar "hot-reload a JSON
 * file" pattern (which cannot run on Vercel). The whitelist lives in Neon and is
 * read per-request with a short per-instance TTL cache; writes bust the cache,
 * so the next read re-queries — an effective "hot reload" with no kernel probe,
 * no long-running watcher process, and correct behaviour across serverless
 * instances.
 */
import type { Pool } from "pg";

let cache: { set: Set<string>; at: number } | null = null;
const TTL_MS = 60_000;

/** Load the whitelist (lowercased names) with a 60s per-instance cache. */
export async function getWhitelist(pool: Pool, force = false): Promise<Set<string>> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.set;
  const res = await pool.query(`SELECT name FROM celebrity_whitelist`);
  const set = new Set((res.rows as { name: string }[]).map((r) => r.name));
  cache = { set, at: Date.now() };
  return set;
}

/** Add (or update) a celebrity. Normalizes to lowercase; busts the cache. */
export async function addToWhitelist(pool: Pool, name: string, displayName?: string): Promise<string | null> {
  const norm = name.trim().toLowerCase();
  if (!norm) return null;
  await pool.query(
    `INSERT INTO celebrity_whitelist (name, display_name)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name`,
    [norm, displayName ?? name.trim()],
  );
  cache = null;
  return norm;
}

/** Remove a celebrity; busts the cache. */
export async function removeFromWhitelist(pool: Pool, name: string): Promise<void> {
  await pool.query(`DELETE FROM celebrity_whitelist WHERE name = $1`, [name.trim().toLowerCase()]);
  cache = null;
}
