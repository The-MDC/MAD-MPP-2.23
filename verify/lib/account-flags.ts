/**
 * Passive account flags.
 * ──────────────────────
 * When any defense layer sees something suspicious tied to an account — a refused or quarantined upload, prompt
 * injection, a ban, a leaked canary, scripted trading — the account is FLAGGED for staff review. Passive by design:
 * nothing changes for the user, nothing tells them, nothing is blocked by the flag itself (the defense that saw it has
 * already done its own blocking). Repeats raise the hit count on the same flag instead of piling up rows.
 *
 * Accounts are keyed by the same peppered subject hash as memory; the wallet is kept when known, for staff only.
 * Never throws: a flag that can't be written must not break the request that raised it.
 */
import type { Q } from "@/lib/admin-reports";
import { memorySubject } from "@/lib/concierge-memory";

export type FlagSeverity = "low" | "medium" | "high";

export async function flagAccount(q: Q, who: { wallet?: string | null; identity?: string | null }, reason: string, severity: FlagSeverity, source: string): Promise<void> {
  const wallet = who.wallet?.toLowerCase() ?? null;
  const identity = wallet ?? who.identity;
  if (!identity) return;
  try {
    await q(
      `INSERT INTO account_flags (subject, wallet, reason, severity, source) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (subject, reason, source) DO UPDATE SET hits = account_flags.hits + 1, last_at = now(),
         severity = CASE WHEN EXCLUDED.severity = 'high' OR account_flags.severity = 'high' THEN 'high'
                         WHEN EXCLUDED.severity = 'medium' OR account_flags.severity = 'medium' THEN 'medium' ELSE 'low' END,
         status = CASE WHEN account_flags.status = 'dismissed' THEN 'open' ELSE account_flags.status END`,
      [memorySubject(identity), wallet, reason.slice(0, 80), severity, source.slice(0, 40)],
    );
  } catch { /* passive: never fails the caller */ }
}

export async function listFlags(q: Q, status: string | null = "open", limit = 200) {
  return q(
    `SELECT id, subject, wallet, reason, severity, source, hits, status, first_at, last_at FROM account_flags
      WHERE ($1::text IS NULL OR status = $1) ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, last_at DESC LIMIT $2`,
    [status, Math.max(1, Math.min(500, limit))],
  );
}
