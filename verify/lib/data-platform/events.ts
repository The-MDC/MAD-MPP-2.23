/**
 * MAD Gambit — Data Platform: event stream (V1)
 * Raw `pg` over Neon. Parameterized queries only.
 */
import type { Pool } from "pg";
import type { PlatformEvent, StoredEvent, EventRow } from "./types";

function toStored(r: EventRow): StoredEvent {
  return {
    id: Number(r.id),
    eventType: r.event_type,
    walletAddress: r.wallet_address,
    sessionId: r.session_id,
    payload: r.payload ?? {},
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

/** Append an event to events_stream. Returns the new id. */
export async function emitEvent(pool: Pool, e: PlatformEvent): Promise<number> {
  const wallet = e.walletAddress ? e.walletAddress.toLowerCase() : null;
  const res = await pool.query(
    `INSERT INTO events_stream (event_type, wallet_address, session_id, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id`,
    [e.eventType, wallet, e.sessionId ?? null, JSON.stringify(e.payload ?? {})],
  );
  return Number(res.rows[0].id);
}

export interface QueryOpts {
  sinceId?: number;
  type?: string;
  limit?: number;
}

/** Read events with id greater than `sinceId` (cursor tailing), ascending. */
export async function queryEvents(pool: Pool, opts: QueryOpts = {}): Promise<StoredEvent[]> {
  const sinceId = Number.isFinite(opts.sinceId) ? Number(opts.sinceId) : 0;
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const params: unknown[] = [sinceId];
  let sql = `SELECT id, event_type, wallet_address, session_id, payload, created_at
             FROM events_stream WHERE id > $1`;
  if (opts.type) {
    params.push(opts.type);
    sql += ` AND event_type = $${params.length}`;
  }
  params.push(limit);
  sql += ` ORDER BY id ASC LIMIT $${params.length}`;
  const res = await pool.query(sql, params);
  return res.rows.map((r) => toStored(r as EventRow));
}
