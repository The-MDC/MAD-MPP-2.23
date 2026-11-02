/**
 * Support tickets and the beta programme — persistence (sql/0022). Every function takes a query runner.
 */
import { createHash, randomBytes } from "node:crypto";
import type { Q } from "@/lib/admin-reports";
import type { Category, Lane, Severity } from "@/lib/support/triage";

export type TicketStatus = "new" | "triaged" | "in-progress" | "waiting-user" | "resolved" | "closed";
export const TICKET_STATUSES: readonly TicketStatus[] = ["new", "triaged", "in-progress", "waiting-user", "resolved", "closed"];

const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const pick = (n: number) => Array.from(randomBytes(n), (b) => A[b % A.length]).join("");
export const hashToken = (t: string) => createHash("sha256").update(`mg-ticket|${t}`).digest("hex");
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ""));

export interface NewTicket { lane: Lane; channel: "concierge" | "form" | "staff"; category: Category | string; severity: Severity; summary: string; excerpt?: string | null; requester?: string | null; contact?: string | null; phase?: string | null }

export async function createTicket(q: Q, t: NewTicket): Promise<{ id: number; ref: string; token: string }> {
  const token = pick(10);
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = `MG-${pick(6)}`;
    const rows = await q(
      `INSERT INTO support_tickets (ref, token_hash, lane, channel, category, severity, summary, excerpt, requester, contact, beta_phase)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (ref) DO NOTHING RETURNING id`,
      [ref, hashToken(token), t.lane, t.channel, t.category, t.severity, t.summary.slice(0, 500), t.excerpt?.slice(0, 2000) ?? null, t.requester ?? null, t.contact ?? null, t.phase ?? null],
    );
    if (rows[0]) return { id: Number(rows[0].id), ref, token };
  }
  throw new Error("could not allocate a ticket ref");
}

/** What a user may see about their own ticket: status and the public updates. Wrong token = nothing. */
export async function ticketStatus(q: Q, ref: string, token: string) {
  const rows = await q(`SELECT id, ref, status, severity, category, created_at, updated_at FROM support_tickets WHERE ref = $1 AND token_hash = $2`, [ref, hashToken(token)]);
  const t = rows[0];
  if (!t) return null;
  const ev = await q(`SELECT body, created_at FROM support_events WHERE ticket_id = $1 AND kind = 'public' ORDER BY created_at`, [t.id]);
  return { ref: String(t.ref), status: String(t.status), severity: String(t.severity), category: String(t.category), createdAt: iso(t.created_at), updatedAt: iso(t.updated_at), updates: ev.map((e) => ({ at: iso(e.created_at), text: String(e.body ?? "") })) };
}

export async function listTickets(q: Q, lanes: Lane[], opts: { status?: string | null; limit?: number } = {}) {
  if (!lanes.length) return [];
  const status = opts.status && (TICKET_STATUSES as readonly string[]).includes(opts.status) ? opts.status : null;
  const rows = await q(
    `SELECT id, ref, lane, channel, category, severity, status, summary, excerpt, requester, contact, assignee, beta_phase, created_at, updated_at
       FROM support_tickets WHERE lane = ANY($1) AND ($2::text IS NULL AND status NOT IN ('resolved','closed') OR status = $2)
      ORDER BY severity, created_at LIMIT $3`,
    [lanes, status, Math.max(1, Math.min(300, opts.limit ?? 100))],
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), created_at: iso(r.created_at), updated_at: iso(r.updated_at) }));
}

export async function ticketLane(q: Q, id: number): Promise<Lane | null> {
  const r = await q(`SELECT lane FROM support_tickets WHERE id = $1`, [id]);
  return (r[0]?.lane as Lane) ?? null;
}

export async function updateTicket(q: Q, id: number, actor: string, u: { status?: TicketStatus; assignee?: string | null; note?: string; publicNote?: string }): Promise<void> {
  if (u.status) {
    await q(`UPDATE support_tickets SET status = $2, updated_at = now() WHERE id = $1`, [id, u.status]);
    await q(`INSERT INTO support_events (ticket_id, actor, kind, body) VALUES ($1,$2,'status',$3)`, [id, actor, u.status]);
  }
  if (u.assignee !== undefined) {
    await q(`UPDATE support_tickets SET assignee = $2, updated_at = now() WHERE id = $1`, [id, u.assignee]);
    await q(`INSERT INTO support_events (ticket_id, actor, kind, body) VALUES ($1,$2,'assign',$3)`, [id, actor, u.assignee ?? "unassigned"]);
  }
  if (u.note) await q(`INSERT INTO support_events (ticket_id, actor, kind, body) VALUES ($1,$2,'note',$3)`, [id, actor, u.note.slice(0, 2000)]);
  if (u.publicNote) {
    await q(`INSERT INTO support_events (ticket_id, actor, kind, body) VALUES ($1,$2,'public',$3)`, [id, actor, u.publicNote.slice(0, 1000)]);
    await q(`UPDATE support_tickets SET updated_at = now() WHERE id = $1`, [id]);
  }
}

export async function ticketEvents(q: Q, id: number) {
  return (await q(`SELECT actor, kind, body, created_at FROM support_events WHERE ticket_id = $1 ORDER BY created_at`, [id])).map((e) => ({ actor: String(e.actor), kind: String(e.kind), body: String(e.body ?? ""), at: iso(e.created_at) }));
}

export async function queueStats(q: Q) {
  try {
    return await q(`SELECT lane, severity, count(*)::int AS n FROM support_tickets WHERE status NOT IN ('resolved','closed') GROUP BY lane, severity ORDER BY lane, severity`);
  } catch { return []; }
}

export async function knownIssues(q: Q, includeFixed = false) {
  try {
    return (await q(`SELECT id, title, status, public_note, updated_at FROM beta_known_issues ${includeFixed ? "" : "WHERE status <> 'fixed'"} ORDER BY updated_at DESC LIMIT 30`))
      .map((r) => ({ id: Number(r.id), title: String(r.title), status: String(r.status), note: r.public_note ? String(r.public_note) : null, updatedAt: iso(r.updated_at) }));
  } catch { return []; }
}
