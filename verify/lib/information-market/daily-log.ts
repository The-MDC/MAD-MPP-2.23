/**
 * The information market's daily logs.
 * ────────────────────────────────────
 * Initiated each day by the concierge's back end (agent "madhatr-concierge"), for the previous UTC day:
 *
 *   1. PLATFORM LOG  logs/platform/<day>.jsonl  — one large file: a header, then one record per measure and per
 *      section (events by type, markets, bets, perps, cards, beta, support, security, insights, memory purges,
 *      admin actions). Counts and aggregates only.
 *   2. USER LOG      logs/users/<day>.jsonl     — one record per active user, under a peppered hash: events by type,
 *      bets and amount wagered, cards minted, tickets opened. Never message text, emails or raw wallets.
 *   3. WAREHOUSE     the same data, structured: im_daily_platform (day, metric, value) and im_daily_users (day,
 *      subject, …), which reports, the insights engine and the admin assistant query.
 *
 * Every source is read defensively: a table that is missing contributes nothing and is named in the header, so one
 * absent migration never stops the day's log. Re-running a day replaces it (idempotent).
 */
import { createHash } from "node:crypto";
import type { Q } from "@/lib/admin-reports";
import { memorySubject } from "@/lib/concierge-memory";

export interface DayLog { folder: "platform" | "users"; day: string; path: string; body: string; records: number; sha256: string }

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
export const dayBounds = (day: string) => [`${day}T00:00:00.000Z`, new Date(Date.parse(`${day}T00:00:00.000Z`) + 86_400_000).toISOString()] as const;
export const yesterday = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)).toISOString().slice(0, 10);

const MAX_BYTES = 12 * 1024 * 1024;

/** Each section: a name, a query over [$1, $2) and how to turn its rows into records. */
const SECTIONS: { name: string; sql: string }[] = [
  { name: "events_by_type", sql: `SELECT event_type AS key, count(*)::int AS n, count(DISTINCT wallet_address)::int AS wallets FROM events_stream WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 2 DESC LIMIT 200` },
  { name: "events_by_hour", sql: `SELECT to_char(date_trunc('hour', created_at), 'HH24') AS key, count(*)::int AS n FROM events_stream WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1` },
  { name: "markets_created", sql: `SELECT category AS key, count(*)::int AS n FROM markets WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 2 DESC` },
  { name: "markets_by_status", sql: `SELECT status AS key, count(*)::int AS n, coalesce(sum(volume),0)::float8 AS volume FROM markets GROUP BY 1` },
  { name: "bets", sql: `SELECT side AS key, count(*)::int AS n, coalesce(sum(amount),0)::float8 AS amount, count(DISTINCT wallet_address)::int AS wallets FROM bets WHERE created_at >= $1 AND created_at < $2 GROUP BY 1` },
  { name: "top_markets_by_flow", sql: `SELECT m.title AS key, count(*)::int AS n, coalesce(sum(b.amount),0)::float8 AS amount FROM bets b JOIN markets m ON m.id = b.market_id WHERE b.created_at >= $1 AND b.created_at < $2 GROUP BY 1 ORDER BY 3 DESC LIMIT 25` },
  { name: "perps_by_family", sql: `SELECT family || ':' || status AS key, count(*)::int AS n, coalesce(sum(volume),0)::float8 AS conviction FROM perp_markets GROUP BY 1` },
  { name: "cards_minted", sql: `SELECT rarity AS key, count(*)::int AS n FROM cards WHERE created_at >= $1 AND created_at < $2 GROUP BY 1` },
  { name: "beta", sql: `SELECT 'signups' AS key, count(*) FILTER (WHERE created_at >= $1 AND created_at < $2)::int AS n, count(*) FILTER (WHERE admitted_at >= $1 AND admitted_at < $2)::int AS admitted, count(*) FILTER (WHERE invited_at >= $1 AND invited_at < $2)::int AS invited FROM beta_signups` },
  { name: "support_tickets", sql: `SELECT lane || ':' || severity AS key, count(*)::int AS n FROM support_tickets WHERE created_at >= $1 AND created_at < $2 GROUP BY 1` },
  { name: "security_and_admin", sql: `SELECT action AS key, count(*)::int AS n FROM admin_audit WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 2 DESC` },
  { name: "insight_metrics", sql: `SELECT metric AS key, value::float8 AS n FROM insight_metrics WHERE day = $1::date` },
  { name: "memory_purges", sql: `SELECT scope AS key, sum(rows)::int AS n, sum(subjects)::int AS subjects FROM memory_purge_logs WHERE run_at >= $1 AND run_at < $2 GROUP BY 1` },
];

export async function buildPlatformLog(q: Q, day: string, narrative?: string | null): Promise<{ log: DayLog; metrics: Record<string, number> }> {
  const [from, to] = dayBounds(day);
  const lines: string[] = [];
  const metrics: Record<string, number> = {};
  const missing: string[] = [];
  const records: string[] = [];
  for (const s of SECTIONS) {
    try {
      const rows = await q(s.sql, [from, to]);
      for (const r of rows) {
        const { key, ...rest } = r;
        records.push(JSON.stringify({ section: s.name, key: String(key ?? ""), ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, typeof v === "number" ? v : num(v)])) }));
        metrics[`${s.name}:${String(key ?? "")}`.slice(0, 120)] = num(r.n);
      }
      metrics[`${s.name}:_rows`] = rows.length;
    } catch { missing.push(s.name); }
  }
  lines.push(JSON.stringify({ type: "header", log: "platform", day, initiated_by: "madhatr-concierge", generated_at: new Date().toISOString(), sections: SECTIONS.length, unavailable: missing, ...(narrative ? { narrative } : {}) }));
  lines.push(...records);
  const body = clip(lines);
  return { log: finish("platform", day, body), metrics };
}

export async function buildUserLog(q: Q, day: string): Promise<{ log: DayLog; rows: UserDay[] }> {
  const [from, to] = dayBounds(day);
  const by = new Map<string, UserDay>();
  const get = (wallet: string) => {
    const subject = memorySubject(wallet);
    let u = by.get(subject);
    if (!u) { u = { subject, events: 0, eventTypes: {}, bets: 0, wagered: 0, cardsMinted: 0, tickets: 0, firstSeen: null, lastSeen: null }; by.set(subject, u); }
    return u;
  };
  const missing: string[] = [];
  const read = async (name: string, sql: string, apply: (r: Record<string, unknown>) => void) => {
    try { for (const r of await q(sql, [from, to])) if (r.w) apply(r); } catch { missing.push(name); }
  };
  await read("events", `SELECT lower(wallet_address) AS w, event_type, count(*)::int AS n, min(created_at) AS f, max(created_at) AS l FROM events_stream WHERE created_at >= $1 AND created_at < $2 AND wallet_address IS NOT NULL GROUP BY 1, 2 LIMIT 500000`, (r) => {
    const u = get(String(r.w));
    u.events += num(r.n);
    u.eventTypes[String(r.event_type)] = (u.eventTypes[String(r.event_type)] ?? 0) + num(r.n);
    const f = iso(r.f), l = iso(r.l);
    if (f && (!u.firstSeen || f < u.firstSeen)) u.firstSeen = f;
    if (l && (!u.lastSeen || l > u.lastSeen)) u.lastSeen = l;
  });
  await read("bets", `SELECT lower(wallet_address) AS w, count(*)::int AS n, coalesce(sum(amount),0)::float8 AS a FROM bets WHERE created_at >= $1 AND created_at < $2 GROUP BY 1`, (r) => { const u = get(String(r.w)); u.bets += num(r.n); u.wagered += num(r.a); });
  await read("cards", `SELECT lower(wallet_address) AS w, count(*)::int AS n FROM cards WHERE created_at >= $1 AND created_at < $2 GROUP BY 1`, (r) => { get(String(r.w)).cardsMinted += num(r.n); });
  await read("tickets", `SELECT lower(requester) AS w, count(*)::int AS n FROM support_tickets WHERE created_at >= $1 AND created_at < $2 AND requester LIKE '0x%' GROUP BY 1`, (r) => { get(String(r.w)).tickets += num(r.n); });

  const rows = [...by.values()];
  const lines = [JSON.stringify({ type: "header", log: "users", day, initiated_by: "madhatr-concierge", generated_at: new Date().toISOString(), users: rows.length, unavailable: missing, identity: "peppered hash; no raw wallets, emails or message text" })];
  for (const u of rows) lines.push(JSON.stringify(u));
  return { log: finish("users", day, clip(lines)), rows };
}

export interface UserDay { subject: string; events: number; eventTypes: Record<string, number>; bets: number; wagered: number; cardsMinted: number; tickets: number; firstSeen: string | null; lastSeen: string | null }

function clip(lines: string[]): string {
  let size = 0;
  const out: string[] = [];
  for (const l of lines) {
    size += Buffer.byteLength(l) + 1;
    if (size > MAX_BYTES) { out.push(JSON.stringify({ type: "truncated", reason: `file capped at ${MAX_BYTES} bytes` })); break; }
    out.push(l);
  }
  return out.join("\n") + "\n";
}

function finish(folder: DayLog["folder"], day: string, body: string): DayLog {
  return { folder, day, path: `logs/${folder}/${day}.jsonl`, body, records: body.split("\n").filter(Boolean).length, sha256: createHash("sha256").update(body).digest("hex") };
}

async function saveFile(q: Q, f: DayLog) {
  await q(
    `INSERT INTO im_log_files (folder, day, path, records, bytes, sha256, body) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (folder, day) DO UPDATE SET path = EXCLUDED.path, records = EXCLUDED.records, bytes = EXCLUDED.bytes, sha256 = EXCLUDED.sha256, body = EXCLUDED.body, created_at = now()`,
    [f.folder, f.day, f.path, f.records, Buffer.byteLength(f.body), f.sha256, f.body],
  );
}

/** The whole daily run: both files, then the warehouse load. Returns what was written. */
export async function runDailyLog(q: Q, day: string, narrative?: string | null) {
  const platform = await buildPlatformLog(q, day, narrative);
  const users = await buildUserLog(q, day);
  await saveFile(q, platform.log);
  await saveFile(q, users.log);
  await q(`DELETE FROM im_daily_platform WHERE day = $1`, [day]);
  for (const [metric, value] of Object.entries(platform.metrics)) {
    await q(`INSERT INTO im_daily_platform (day, metric, value) VALUES ($1,$2,$3) ON CONFLICT (day, metric) DO UPDATE SET value = EXCLUDED.value`, [day, metric, value]);
  }
  await q(`DELETE FROM im_daily_users WHERE day = $1`, [day]);
  for (const u of users.rows) {
    await q(
      `INSERT INTO im_daily_users (day, subject, events, event_types, bets, wagered, cards_minted, tickets, first_seen, last_seen) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10)`,
      [day, u.subject, u.events, JSON.stringify(u.eventTypes), u.bets, u.wagered, u.cardsMinted, u.tickets, u.firstSeen, u.lastSeen],
    );
  }
  return {
    day,
    files: [platform.log, users.log].map((f) => ({ path: f.path, records: f.records, bytes: Buffer.byteLength(f.body), sha256: f.sha256 })),
    warehouse: { platformMetrics: Object.keys(platform.metrics).length, userRows: users.rows.length },
  };
}

/** What the admin-level concierge may read: the warehouse over a window, aggregated (no subject ids). */
export async function warehouseDigest(q: Q, days = 14) {
  try {
    const plat = await q(
      `SELECT day::text AS day, metric, value::float8 AS value FROM im_daily_platform
        WHERE day >= current_date - $1::int AND (metric LIKE 'events_by_type:%' OR metric LIKE 'bets:%' OR metric LIKE 'markets_created:%' OR metric LIKE 'cards_minted:%' OR metric LIKE 'support_tickets:%' OR metric LIKE 'beta:%' OR metric LIKE 'security_and_admin:threat%')
        ORDER BY day, metric LIMIT 3000`, [days]);
    const users = await q(
      `SELECT day::text AS day, count(*)::int AS active, coalesce(sum(bets),0)::int AS bets, coalesce(sum(wagered),0)::float8 AS wagered,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY events)::float8 AS median_events, max(events)::int AS max_events,
              count(*) FILTER (WHERE tickets > 0)::int AS with_tickets
         FROM im_daily_users WHERE day >= current_date - $1::int GROUP BY day ORDER BY day`, [days]);
    const files = await q(`SELECT folder, day::text AS day, records, bytes FROM im_log_files WHERE day >= current_date - $1::int ORDER BY day DESC, folder`, [days]);
    return { platform: plat, users, files };
  } catch {
    return null;
  }
}
