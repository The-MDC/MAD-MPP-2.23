/**
 * Admin suite — persistence for subordinate admins and the audit trail (sql/0018).
 * Every function takes the pool, so tests inject a fake and routes pass `getDbPool()`.
 */
import type { Pool } from "pg";
import type { AdminRole } from "@/lib/admin-auth";

export interface AdminUser { id: number; email: string; role: Exclude<AdminRole, "master">; disabled: boolean; createdBy: string; createdAt: string; lastSignIn: string | null }
export interface AdminUserWithHash extends AdminUser { passwordHash: string }

const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v));
const toUser = (r: Record<string, unknown>): AdminUserWithHash => ({
  id: Number(r.id), email: String(r.email), role: r.role as AdminUser["role"], disabled: Boolean(r.disabled),
  createdBy: String(r.created_by), createdAt: iso(r.created_at), lastSignIn: r.last_sign_in ? iso(r.last_sign_in) : null,
  passwordHash: String(r.password_hash ?? ""),
});
const strip = (full: AdminUserWithHash): AdminUser => { const u: Partial<AdminUserWithHash> = { ...full }; delete u.passwordHash; return u as AdminUser; };

export async function findAdminByEmail(pool: Pool, email: string): Promise<AdminUserWithHash | null> {
  const r = await pool.query("SELECT * FROM admin_users WHERE lower(email) = lower($1)", [email]);
  return r.rows[0] ? toUser(r.rows[0]) : null;
}

export async function listAdmins(pool: Pool): Promise<AdminUser[]> {
  const r = await pool.query("SELECT * FROM admin_users ORDER BY created_at DESC LIMIT 200");
  return r.rows.map((x) => strip(toUser(x)));
}

/** Returns null when the email is already taken. */
export async function createAdmin(pool: Pool, a: { email: string; role: AdminUser["role"]; passwordHash: string; createdBy: string }): Promise<AdminUser | null> {
  const r = await pool.query(
    `INSERT INTO admin_users (email, role, password_hash, created_by) VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING RETURNING *`,
    [a.email, a.role, a.passwordHash, a.createdBy],
  );
  return r.rows[0] ? strip(toUser(r.rows[0])) : null;
}

export async function setAdminDisabled(pool: Pool, id: number, disabled: boolean): Promise<boolean> {
  const r = await pool.query("UPDATE admin_users SET disabled = $2 WHERE id = $1", [id, disabled]);
  return (r.rowCount ?? 0) > 0;
}

export async function setAdminPassword(pool: Pool, id: number, passwordHash: string): Promise<boolean> {
  const r = await pool.query("UPDATE admin_users SET password_hash = $2 WHERE id = $1", [id, passwordHash]);
  return (r.rowCount ?? 0) > 0;
}

export async function touchSignIn(pool: Pool, id: number): Promise<void> {
  await pool.query("UPDATE admin_users SET last_sign_in = now() WHERE id = $1", [id]);
}

/** Audit writes never throw: losing a log line must not break the action being logged. */
export async function audit(pool: Pool | null, actor: string, action: string, detail?: string): Promise<void> {
  if (!pool) return;
  try {
    await pool.query("INSERT INTO admin_audit (actor, action, detail) VALUES ($1,$2,$3)", [actor.slice(0, 254), action.slice(0, 64), detail?.slice(0, 500) ?? null]);
  } catch { /* best effort */ }
}

export async function recentAudit(pool: Pool, limit = 100): Promise<{ id: number; actor: string; action: string; detail: string | null; createdAt: string }[]> {
  const r = await pool.query("SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT $1", [Math.max(1, Math.min(500, limit))]);
  return r.rows.map((x) => ({ id: Number(x.id), actor: String(x.actor), action: String(x.action), detail: x.detail ? String(x.detail) : null, createdAt: iso(x.created_at) }));
}
