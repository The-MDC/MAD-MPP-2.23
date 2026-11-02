/**
 * Admin suite — the report registry.
 * Each report is a pure function of a query runner, so it is testable without a database and degrades section by
 * section: a missing table (migration not applied) yields an empty table and a note, never a 500.
 */
import type { Pool } from "pg";
import type { Report, ReportTable, Cell } from "@/lib/report-render";
import { buildWeekly } from "@/lib/insights-run";

export type Q = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
export const poolQ = (pool: Pool): Q => async (sql, params) => (await pool.query(sql, params)).rows;

export interface ReportDef { id: string; title: string; blurb: string; build: (q: Q, now?: Date) => Promise<Report> }

const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const str = (v: unknown): string => (v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v));
const pct = (n: number, d: number): string => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "0.0%");
/** 0xabcd…1234 — pseudonymous wallet ids are shortened even in an admin extract; the full value is never needed to read a trend. */
export const shortWallet = (w: unknown): string => { const s = str(w); return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s; };

/** Run one section; on failure return its fallback and record why. */
async function section<T>(notes: string[], label: string, fallback: T, run: () => Promise<T>): Promise<{ value: T; ok: boolean }> {
  try { return { value: await run(), ok: true }; }
  catch { notes.push(`${label} was unavailable (table missing or database offline); shown empty.`); return { value: fallback, ok: false }; }
}

const base = (id: string, title: string, now: Date): Report => ({ id, title, generatedAt: now.toISOString(), source: "live", summary: [], tables: [], notes: [] });
const finish = (r: Report, anyOk: boolean): Report => { if (!anyOk) r.source = "demo"; return r; };
const table = (title: string, columns: string[], rows: Cell[][]): ReportTable => ({ title, columns, rows });

/** Heat: how much hotter the last 3 hours are than the 24h hourly average, scaled so 2x average = 100. */
export function heatScore(last3h: number, total24h: number): number {
  if (total24h <= 0) return 0;
  const avgPerHour = total24h / 24;
  const ratio = last3h / 3 / avgPerHour;
  return Math.max(0, Math.min(100, Math.round(ratio * 50)));
}

/* ── 1. platform usage and heat ─────────────────────────────────────── */

const platformUsage: ReportDef = {
  id: "platform-usage", title: "Platform usage and heat", blurb: "Events, unique wallets, per-event heat scores and hourly shape over 24 hours.",
  async build(q, now = new Date()) {
    const r = base(this.id, this.title, now);
    const totals = await section(r.notes, "Event totals", [] as Record<string, unknown>[], () => q(
      `SELECT count(*)::text AS total, count(DISTINCT wallet_address)::text AS wallets,
              count(*) FILTER (WHERE created_at > now() - interval '3 hours')::text AS last3
         FROM events_stream WHERE created_at > now() - interval '24 hours'`));
    const types = await section(r.notes, "Event types", [] as Record<string, unknown>[], () => q(
      `SELECT event_type, count(*)::text AS cnt,
              count(*) FILTER (WHERE created_at > now() - interval '3 hours')::text AS last3
         FROM events_stream WHERE created_at > now() - interval '24 hours'
        GROUP BY event_type ORDER BY count(*) DESC LIMIT 40`));
    const hours = await section(r.notes, "Hourly shape", [] as Record<string, unknown>[], () => q(
      `SELECT date_trunc('hour', created_at) AS bucket, count(*)::text AS events, count(DISTINCT wallet_address)::text AS wallets
         FROM events_stream WHERE created_at > now() - interval '24 hours' GROUP BY 1 ORDER BY 1`));
    const total = num(totals.value[0]?.total), last3 = num(totals.value[0]?.last3);
    r.summary = [
      ["Events (24h)", String(total)], ["Unique wallets (24h)", str(totals.value[0]?.wallets ?? 0)],
      ["Platform heat (0-100)", String(heatScore(last3, total))], ["Event types seen", String(types.value.length)],
    ];
    r.tables = [
      table("Heat by event type", ["Event type", "Events 24h", "Share", "Last 3h", "Heat"],
        types.value.map((t) => [str(t.event_type), num(t.cnt), pct(num(t.cnt), total), num(t.last3), heatScore(num(t.last3), num(t.cnt))])),
      table("Hourly", ["Hour (UTC)", "Events", "Wallets"], hours.value.map((h) => [str(h.bucket), num(h.events), num(h.wallets)])),
    ];
    r.notes.push("Heat compares the last 3 hours with the 24h hourly average; 50 is normal pace and 100 is double it.");
    return finish(r, totals.ok || types.ok || hours.ok);
  },
};

/* ── 2. user data (CDP) ─────────────────────────────────────────────── */

const userData: ReportDef = {
  id: "user-data", title: "User data (CDP)", blurb: "Profiles, growth, segments and the most active wallets, plus the beta waitlist.",
  async build(q, now = new Date()) {
    const r = base(this.id, this.title, now);
    const prof = await section(r.notes, "Profiles", [] as Record<string, unknown>[], () => q(
      `SELECT count(*)::text AS total,
              count(*) FILTER (WHERE first_seen > now() - interval '24 hours')::text AS new24,
              count(*) FILTER (WHERE first_seen > now() - interval '7 days')::text AS new7,
              count(*) FILTER (WHERE last_seen  > now() - interval '24 hours')::text AS active24,
              count(*) FILTER (WHERE last_seen  > now() - interval '7 days')::text AS active7
         FROM cdp_profiles`));
    const seg = await section(r.notes, "Segments", [] as Record<string, unknown>[], () => q(
      `SELECT s AS segment, count(*)::text AS cnt FROM cdp_profiles, jsonb_array_elements_text(segments) AS s
        GROUP BY s ORDER BY count(*) DESC LIMIT 40`));
    const top = await section(r.notes, "Top wallets", [] as Record<string, unknown>[], () => q(
      `SELECT wallet_address, event_count::text AS events, first_seen, last_seen FROM cdp_profiles ORDER BY event_count DESC LIMIT 50`));
    const beta = await section(r.notes, "Beta waitlist", [] as Record<string, unknown>[], () => q(
      `SELECT role, count(*)::text AS cnt FROM beta_signups GROUP BY role ORDER BY count(*) DESC`));
    const p = prof.value[0] ?? {};
    const waitlist = beta.value.reduce((a, b) => a + num(b.cnt), 0);
    r.summary = [
      ["Profiles", String(num(p.total))], ["New (24h / 7d)", `${num(p.new24)} / ${num(p.new7)}`],
      ["Active (24h / 7d)", `${num(p.active24)} / ${num(p.active7)}`], ["Beta waitlist", String(waitlist)],
    ];
    r.tables = [
      table("Segments", ["Segment", "Profiles", "Share"], seg.value.map((s) => [str(s.segment), num(s.cnt), pct(num(s.cnt), num(p.total))])),
      table("Most active wallets", ["Wallet", "Events", "First seen", "Last seen"], top.value.map((w) => [shortWallet(w.wallet_address), num(w.events), str(w.first_seen), str(w.last_seen)])),
      table("Beta waitlist by role", ["Role", "Sign-ups"], beta.value.map((b) => [str(b.role), num(b.cnt)])),
    ];
    r.notes.push("Wallets are pseudonymous and shortened in this extract. Waitlist emails are deliberately not included here.");
    return finish(r, prof.ok || seg.ok || top.ok || beta.ok);
  },
};

/* ── 3. card game ───────────────────────────────────────────────────── */

const cardGame: ReportDef = {
  id: "card-game", title: "Card game", blurb: "Cards minted by rarity and faction, wear, evolution and lifetime earnings.",
  async build(q, now = new Date()) {
    const r = base(this.id, this.title, now);
    const tot = await section(r.notes, "Card totals", [] as Record<string, unknown>[], () => q(
      `SELECT count(*)::text AS total, count(DISTINCT wallet_address)::text AS holders,
              coalesce(sum(earns_count),0)::text AS earned, coalesce(avg(durability),0)::text AS dur,
              count(*) FILTER (WHERE created_at > now() - interval '24 hours')::text AS new24
         FROM cards`));
    const rar = await section(r.notes, "Rarity", [] as Record<string, unknown>[], () => q(
      `SELECT rarity, count(*)::text AS cnt, coalesce(avg(evolution_stage),1)::text AS evo, coalesce(sum(earns_count),0)::text AS earned
         FROM cards GROUP BY rarity ORDER BY count(*) DESC`));
    const fac = await section(r.notes, "Factions", [] as Record<string, unknown>[], () => q(
      `SELECT faction, count(*)::text AS cnt, coalesce(sum(uses),0)::text AS uses FROM cards GROUP BY faction ORDER BY count(*) DESC`));
    const t = tot.value[0] ?? {};
    r.summary = [
      ["Cards minted", String(num(t.total))], ["Distinct holders", String(num(t.holders))], ["Minted (24h)", String(num(t.new24))],
      ["Lifetime $MADx earned by cards", num(t.earned).toFixed(2)], ["Mean durability", `${(num(t.dur) * 100).toFixed(1)}%`],
    ];
    r.tables = [
      table("By rarity", ["Rarity", "Cards", "Mean evolution", "$MADx earned"], rar.value.map((x) => [str(x.rarity), num(x.cnt), num(x.evo), num(x.earned)])),
      table("By faction", ["Faction", "Cards", "Uses"], fac.value.map((x) => [str(x.faction) || "(unset)", num(x.cnt), num(x.uses)])),
    ];
    return finish(r, tot.ok || rar.ok || fac.ok);
  },
};

/* ── 4. prediction markets ──────────────────────────────────────────── */

const predictionMarkets: ReportDef = {
  id: "prediction-markets", title: "Prediction markets", blurb: "Binary markets by status and category, top volume, and 24h bet flow.",
  async build(q, now = new Date()) {
    const r = base(this.id, this.title, now);
    const st = await section(r.notes, "Status", [] as Record<string, unknown>[], () => q(
      `SELECT status, count(*)::text AS cnt, coalesce(sum(volume),0)::text AS vol FROM markets GROUP BY status ORDER BY count(*) DESC`));
    const cat = await section(r.notes, "Category", [] as Record<string, unknown>[], () => q(
      `SELECT category, count(*)::text AS cnt, coalesce(sum(volume),0)::text AS vol FROM markets GROUP BY category ORDER BY sum(volume) DESC NULLS LAST LIMIT 30`));
    const top = await section(r.notes, "Top markets", [] as Record<string, unknown>[], () => q(
      `SELECT id, title, category, status, yes_odds::text AS yes_odds, no_odds::text AS no_odds, volume::text AS volume
         FROM markets ORDER BY volume DESC LIMIT 25`));
    const flow = await section(r.notes, "Bet flow", [] as Record<string, unknown>[], () => q(
      `SELECT count(*)::text AS bets, count(DISTINCT wallet_address)::text AS bettors, coalesce(sum(amount),0)::text AS amt
         FROM bets WHERE created_at > now() - interval '24 hours'`));
    const totalMarkets = st.value.reduce((a, b) => a + num(b.cnt), 0);
    const open = st.value.find((s) => str(s.status) === "open");
    const f = flow.value[0] ?? {};
    r.summary = [
      ["Markets", String(totalMarkets)], ["Open", String(num(open?.cnt))],
      ["Bets (24h)", String(num(f.bets))], ["Bettors (24h)", String(num(f.bettors))], ["Wagered (24h, $MADx)", num(f.amt).toFixed(2)],
    ];
    r.tables = [
      table("By status", ["Status", "Markets", "Volume"], st.value.map((s) => [str(s.status), num(s.cnt), num(s.vol)])),
      table("By category", ["Category", "Markets", "Volume"], cat.value.map((s) => [str(s.category), num(s.cnt), num(s.vol)])),
      table("Top by volume", ["Market", "Category", "Status", "YES odds", "NO odds", "Volume"],
        top.value.map((m) => [str(m.title), str(m.category), str(m.status), num(m.yes_odds), num(m.no_odds), num(m.volume)])),
    ];
    return finish(r, st.ok || cat.ok || top.ok || flow.ok);
  },
};

/* ── 5. conviction (perpetual) markets ──────────────────────────────── */

const convictionMarkets: ReportDef = {
  id: "conviction-markets", title: "Conviction markets", blurb: "Perpetual markets by family, open conviction, positions and leg cadence.",
  async build(q, now = new Date()) {
    const r = base(this.id, this.title, now);
    const fam = await section(r.notes, "Families", [] as Record<string, unknown>[], () => q(
      `SELECT family, status, count(*)::text AS cnt, coalesce(sum(volume),0)::text AS conviction FROM perp_markets GROUP BY family, status ORDER BY family, status`));
    const closing = await section(r.notes, "Legs closing", [] as Record<string, unknown>[], () => q(
      `SELECT id, title, family, leg_index::text AS leg, leg_closes_at, volume::text AS volume FROM perp_markets
        WHERE status = 'open' ORDER BY leg_closes_at ASC LIMIT 25`));
    const pos = await section(r.notes, "Positions", [] as Record<string, unknown>[], () => q(`SELECT count(*)::text AS cnt FROM perp_positions`));
    const open = fam.value.filter((f) => str(f.status) === "open").reduce((a, b) => a + num(b.cnt), 0);
    r.summary = [
      ["Perpetual markets", String(fam.value.reduce((a, b) => a + num(b.cnt), 0))], ["Open", String(open)],
      ["Net open conviction", fam.value.reduce((a, b) => a + num(b.conviction), 0).toFixed(2)], ["Positions", String(num(pos.value[0]?.cnt))],
    ];
    r.tables = [
      table("By family and status", ["Family", "Status", "Markets", "Net open conviction"], fam.value.map((f) => [str(f.family), str(f.status), num(f.cnt), num(f.conviction)])),
      table("Legs closing next", ["Market", "Family", "Leg", "Closes (UTC)", "Conviction"], closing.value.map((c) => [str(c.title), str(c.family), num(c.leg), str(c.leg_closes_at), num(c.volume)])),
    ];
    r.notes.push("Conviction is net open interest: redemptions reduce it, unlike cumulative turnover on binary markets.");
    return finish(r, fam.ok || closing.ok || pos.ok);
  },
};

/* ── 6. weekly insights (self-learning) ─────────────────────────────── */

const weeklyInsights: ReportDef = {
  id: "weekly-insights", title: "Anomalies and recommendations", blurb: "What changed against learned baselines, what to do about it, and the skills the engine has acquired.",
  async build(q, now = new Date()) { return buildWeekly(q, now, async () => null); },
};

export const REPORTS: ReportDef[] = [platformUsage, userData, cardGame, predictionMarkets, convictionMarkets, weeklyInsights];
export const findReport = (id: string): ReportDef | undefined => REPORTS.find((r) => r.id === id);

/** Every report in one document, for "export everything". */
export async function buildAll(q: Q, now = new Date()): Promise<Report> {
  const parts = await Promise.all(REPORTS.map((d) => d.build(q, now)));
  return {
    id: "all", title: "MAD Gambit - full platform report", generatedAt: now.toISOString(),
    source: parts.some((p) => p.source === "live") ? "live" : "demo",
    summary: parts.flatMap((p) => p.summary.map(([k, v]) => [`${p.title}: ${k}`, v] as [string, string])),
    tables: parts.flatMap((p) => p.tables.map((t) => ({ ...t, title: `${p.title} - ${t.title}` }))),
    notes: parts.flatMap((p) => p.notes),
  };
}
