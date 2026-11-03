/**
 * File shield — storage. Only the sanitised text of an accepted file is kept, under the owner's subject hash, and it
 * expires with the owner's memory tier. Refused and quarantined files keep a scan record (hash, reasons) and nothing else.
 */
import { randomBytes } from "node:crypto";
import type { Q } from "@/lib/admin-reports";
import { RETENTION_MS, type MemoryTier } from "@/lib/concierge-memory";
import type { ScanOutcome } from "@/lib/file-shield/scan";

export const MAX_FILES_PER_SUBJECT = 5;

export async function loadBlocklist(q: Q): Promise<Set<string>> {
  try { return new Set((await q(`SELECT sha256 FROM file_hash_blocklist`)).map((r) => String(r.sha256))); } catch { return new Set(); }
}

export async function recordScan(q: Q, subject: string, o: ScanOutcome): Promise<void> {
  try {
    await q(`INSERT INTO chat_file_scans (subject, sha256, kind, bytes, verdict, reasons) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [subject, o.sha256, o.kind, o.size, o.verdict, JSON.stringify(o.reasons.slice(0, 10))]);
  } catch { /* the scan record is best effort */ }
}

export async function saveFile(q: Q, subject: string, tier: MemoryTier, o: ScanOutcome, now = Date.now()): Promise<string> {
  const publicId = `f_${randomBytes(12).toString("base64url")}`;
  // keep each person's shelf small: the oldest file goes when a sixth arrives
  await q(`DELETE FROM chat_files WHERE subject = $1 AND id NOT IN (SELECT id FROM chat_files WHERE subject = $1 ORDER BY created_at DESC LIMIT $2)`, [subject, MAX_FILES_PER_SUBJECT - 1]);
  await q(
    `INSERT INTO chat_files (public_id, subject, tier, name, kind, bytes, sha256, risk, notes, text, chars, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)`,
    [publicId, subject, tier, o.name, o.kind, o.size, o.sha256, o.risk, JSON.stringify(o.notes.slice(0, 20)), o.text, o.text.length, new Date(now + RETENTION_MS[tier]).toISOString()],
  );
  return publicId;
}

export async function getFile(q: Q, subject: string, publicId: string): Promise<{ name: string; kind: string; text: string; risk: string } | null> {
  if (!/^f_[\w-]{16}$/.test(publicId)) return null;
  try {
    const r = await q(`SELECT name, kind, text, risk FROM chat_files WHERE public_id = $1 AND subject = $2 AND expires_at > now()`, [publicId, subject]);
    return r[0] ? { name: String(r[0].name), kind: String(r[0].kind), text: String(r[0].text), risk: String(r[0].risk) } : null;
  } catch { return null; }
}

export async function listFiles(q: Q, subject: string) {
  try {
    return (await q(`SELECT public_id, name, kind, bytes, chars, risk, notes, created_at, expires_at FROM chat_files WHERE subject = $1 AND expires_at > now() ORDER BY created_at DESC`, [subject]))
      .map((r) => ({ id: String(r.public_id), name: String(r.name), kind: String(r.kind), bytes: Number(r.bytes), chars: Number(r.chars), risk: String(r.risk), notes: r.notes, createdAt: String(r.created_at), expiresAt: String(r.expires_at) }));
  } catch { return []; }
}

export async function deleteFile(q: Q, subject: string, publicId: string): Promise<boolean> {
  try { return (await q(`DELETE FROM chat_files WHERE public_id = $1 AND subject = $2 RETURNING id`, [publicId, subject])).length > 0; } catch { return false; }
}

/** Daily: drop expired files. */
export async function purgeExpiredFiles(q: Q): Promise<number> {
  try { return Number((await q(`WITH gone AS (DELETE FROM chat_files WHERE expires_at <= now() RETURNING 1) SELECT count(*)::int AS n FROM gone`))[0]?.n ?? 0); } catch { return 0; }
}
