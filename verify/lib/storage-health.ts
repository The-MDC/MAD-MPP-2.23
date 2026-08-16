import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";

export type DatabaseHealth =
  | { configured: false; available: false; latencyMs: null }
  | { configured: true; available: boolean; latencyMs: number };

/** Checks only connectivity; it never returns a connection string or query data. */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!hasDatabaseUrl()) return { configured: false, available: false, latencyMs: null };

  const started = performance.now();
  try {
    await getDbPool().query("SELECT 1");
    return { configured: true, available: true, latencyMs: Math.round(performance.now() - started) };
  } catch {
    return { configured: true, available: false, latencyMs: Math.round(performance.now() - started) };
  }
}
