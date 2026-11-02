/**
 * The concierge's memory, with tiered retention.
 * ──────────────────────────────────────────────
 *   user                      remembered for 48 hours, then dumped
 *   vip, staff (admin, dev,   remembered for 7 days; before each weekly dump a log of what is about to go is written
 *   support, master)          (memory_purge_logs) so staff can review it
 *
 * What is stored is the conversation, REDACTED first (no emails, keys, card numbers, seed phrases, phone numbers) and
 * capped per turn, under a peppered hash of the person, never their raw wallet or IP. Retention is enforced twice:
 * every read ignores expired rows (so forgetting is on time to the second), and the crons delete them for real.
 *
 * Server memory is also a security feature: the model sees turns the server itself recorded, not whatever history a
 * client chooses to send.
 */
import { createHash } from "node:crypto";
import type { Q } from "@/lib/admin-reports";
import { redact } from "@/lib/support/triage";
import { VIP_STATUS_MIN_MADX } from "@/lib/gambit-game-math";

export type MemoryTier = "user" | "vip" | "staff";
export const RETENTION_MS: Record<MemoryTier, number> = { user: 48 * 3600_000, vip: 7 * 86_400_000, staff: 7 * 86_400_000 };
export const MEMORY_TURNS = 10;
export const TURN_CHARS = 600;

function pepper(env: Record<string, string | undefined> = process.env): string {
  return env.MEMORY_PEPPER?.trim() || env.SESSION_SECRET?.trim() || "mg-memory";
}

/** A stable, non-reversible subject id for a person: wallet when signed in, else the client key. */
export const memorySubject = (identity: string, env?: Record<string, string | undefined>): string =>
  createHash("sha256").update(`${pepper(env)}|${identity.toLowerCase()}`).digest("hex").slice(0, 32);

/** Staff (any admin-suite role) and VIP wallets keep a week; everyone else 48 hours. */
export async function memoryTier(q: Q, opts: { isStaff: boolean; wallet: string | null }): Promise<MemoryTier> {
  if (opts.isStaff) return "staff";
  if (!opts.wallet) return "user";
  try {
    const r = await q(`SELECT (balance + staked)::float8 AS total FROM madx_accounts WHERE lower(owner) = lower($1)`, [opts.wallet]);
    return Number(r[0]?.total ?? 0) >= VIP_STATUS_MIN_MADX ? "vip" : "user";
  } catch { return "user"; }
}

export async function recall(q: Q, subject: string, limit = MEMORY_TURNS): Promise<{ role: "user" | "assistant"; content: string }[]> {
  try {
    const rows = await q(
      `SELECT role, content FROM concierge_memory WHERE subject = $1 AND expires_at > now() ORDER BY created_at DESC, id DESC LIMIT $2`,
      [subject, limit],
    );
    return rows.reverse().map((r) => ({ role: r.role === "assistant" ? "assistant" : "user", content: String(r.content) }));
  } catch { return []; }
}

export async function remember(q: Q, subject: string, tier: MemoryTier, turns: { role: "user" | "assistant"; content: string }[], now = Date.now()): Promise<void> {
  const expires = new Date(now + RETENTION_MS[tier]).toISOString();
  for (const t of turns) {
    const content = redact(t.content).slice(0, TURN_CHARS);
    if (!content) continue;
    try {
      await q(`INSERT INTO concierge_memory (subject, tier, role, content, expires_at) VALUES ($1,$2,$3,$4,$5)`, [subject, tier, t.role, content, expires]);
    } catch { return; }
  }
}

/** Daily: dump every expired user-tier memory. Logs counts only. */
export async function purgeUserMemory(q: Q): Promise<{ rows: number; subjects: number }> {
  const r = await q(`WITH gone AS (DELETE FROM concierge_memory WHERE tier = 'user' AND expires_at <= now() RETURNING subject)
                     SELECT count(*)::int AS rows, count(DISTINCT subject)::int AS subjects FROM gone`);
  const out = { rows: Number(r[0]?.rows ?? 0), subjects: Number(r[0]?.subjects ?? 0) };
  await q(`INSERT INTO memory_purge_logs (scope, rows, subjects, body_md) VALUES ('daily-user', $1, $2, $3)`,
    [out.rows, out.subjects, `Daily user-memory dump: ${out.rows} turns from ${out.subjects} conversations older than 48 hours.`]);
  return out;
}

/** Build the markdown log of the privileged memory that is about to be dumped. Pure, for tests. */
export function buildPurgeLog(rows: { subject: string; tier: string; role: string; content: string; created_at: string }[], now = new Date()): string {
  const by = new Map<string, typeof rows>();
  for (const r of rows) by.set(r.subject, [...(by.get(r.subject) ?? []), r]);
  const out = [
    `# Concierge memory: weekly dump log`,
    ``,
    `Run ${now.toISOString()}. ${rows.length} turns from ${by.size} staff, admin, developer and VIP conversations past their 7-day retention. Content was redacted when stored. Subjects are hashed.`,
    ``,
  ];
  for (const [subject, turns] of by) {
    const first = turns[0]?.created_at ?? "", last = turns[turns.length - 1]?.created_at ?? "";
    out.push(`## ${subject.slice(0, 12)} · ${turns[0]?.tier} · ${turns.length} turns · ${first.slice(0, 16)} → ${last.slice(0, 16)}`, ``);
    for (const t of turns.slice(-20)) out.push(`- ${t.created_at.slice(0, 16)} ${t.role}: ${t.content.replace(/\s+/g, " ").slice(0, 300)}`);
    out.push(``);
  }
  return out.join("\n");
}

/** Weekly: write the log FIRST, then dump expired staff/admin/dev/VIP memory. If the log cannot be written, nothing is deleted. */
export async function purgePrivilegedMemory(q: Q, now = new Date()): Promise<{ rows: number; subjects: number; logged: boolean }> {
  const rows = (await q(
    `SELECT subject, tier, role, content, created_at FROM concierge_memory WHERE tier IN ('vip','staff') AND expires_at <= now() ORDER BY subject, created_at, id LIMIT 50000`,
  )).map((r) => ({ subject: String(r.subject), tier: String(r.tier), role: String(r.role), content: String(r.content), created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at) }));
  const subjects = new Set(rows.map((r) => r.subject)).size;
  await q(`INSERT INTO memory_purge_logs (scope, rows, subjects, body_md) VALUES ('weekly-privileged', $1, $2, $3)`, [rows.length, subjects, buildPurgeLog(rows, now)]);
  if (rows.length) await q(`DELETE FROM concierge_memory WHERE tier IN ('vip','staff') AND expires_at <= now()`);
  return { rows: rows.length, subjects, logged: true };
}
