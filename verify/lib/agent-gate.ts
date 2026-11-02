/**
 * Agent gate — the one call every model-backed route makes first.
 * Combines the stored mode (master admin, cached 20s), the env kill switch and the circuit breaker into a level, runs
 * the per-client screen, and records escalations in the admin audit log. Never throws.
 */
import { createHash } from "node:crypto";
import { audit } from "@/lib/admin-store";
import { browserish, breakerLevel, effectiveLevel, LEVELS, reportThreat, sameOrigin, screenClient, type Level, type Screen } from "@/lib/agent-defense";
import { clientIp } from "@/lib/rate-limit";
import { getDbPool } from "@/lib/db";
import { noteThreat } from "@/lib/threat-status";
import "@/lib/threat-persist";
import { hasDatabaseUrl } from "@/lib/database-url";

let cached: { at: number; mode: Level } | null = null;
const TTL = 20_000;

export async function storedMode(now = Date.now()): Promise<Level> {
  if (cached && now - cached.at < TTL) return cached.mode;
  let mode: Level = "normal";
  if (hasDatabaseUrl()) {
    try {
      const r = await getDbPool().query("SELECT mode FROM agent_control WHERE id = 1");
      const m = r.rows[0]?.mode;
      if ((LEVELS as readonly string[]).includes(m)) mode = m as Level;
    } catch { /* table missing: normal */ }
  }
  cached = { at: now, mode };
  return mode;
}

export async function setStoredMode(mode: Level, by: string, reason: string): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO agent_control (id, mode, reason, updated_by) VALUES (1,$1,$2,$3)
       ON CONFLICT (id) DO UPDATE SET mode = EXCLUDED.mode, reason = EXCLUDED.reason, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [mode, reason.slice(0, 200), by],
    );
    cached = { at: Date.now(), mode };
    await audit(pool, by, "agent-mode", `${mode}: ${reason.slice(0, 120)}`);
    return true;
  } catch { return false; }
}

export async function agentLevel(): Promise<Level> {
  return effectiveLevel({ stored: await storedMode() });
}

export const clientKey = (req: Request): string =>
  `${clientIp(req)}|${createHash("sha256").update(req.headers.get("user-agent") ?? "").digest("hex").slice(0, 8)}`;

export interface Gate { level: Level; key: string; screen: Screen | null; crossOrigin: boolean }

/** Level + (when `message` is given) the client screen. Escalations to the breaker are audited. */
export async function gateAgent(req: Request, message?: string): Promise<Gate> {
  const level = await agentLevel();
  const key = clientKey(req);
  const same = sameOrigin(req);
  let screen: Screen | null = null;
  if (message !== undefined) {
    const before = breakerLevel();
    screen = screenClient(key, message, { sameOrigin: same, browserish: browserish(req) });
    if (screen.reasons.length) {
      // Feed the monitor: a ban is an attack; anything else unusual is scanning.
      noteThreat(screen.allow ? "scan" : "attack", screen.allow ? screen.reasons[0] : "ban");
      const became = reportThreat(Math.max(1, Math.round(screen.score)));
      if (became && became !== before) {
        noteThreat("attack", `breaker-${became}`);
        await audit(hasDatabaseUrl() ? getDbPool() : null, "system", "agent-breaker", `auto-${became} (${screen.reasons.slice(0, 3).join(",")})`);
      }
    }
  }
  if (!same && message === undefined) noteThreat("scan", "cross-origin");
  return { level, key, screen, crossOrigin: !same };
}
