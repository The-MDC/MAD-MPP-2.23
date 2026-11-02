/**
 * Insights engine — the database side: collect today's metrics, learn, acquire skills, build and store the weekly report.
 * Everything takes a query runner (`Q`) so it can be tested without a database.
 */
import type { Q } from "@/lib/admin-reports";
import {
  buildInsightReport, detectAnomalies, proposeSkills, recommend, standingAdvice,
  type Feedback, type History, type Skill,
} from "@/lib/insights";
import { topicsIn } from "@/lib/concierge-personality";
import { nimChat } from "@/lib/nim-chat";
import { looksLikeLeak } from "@/lib/madhatr-guard";
import type { Report } from "@/lib/report-render";
import { declaredDeps, scanSecurityIntel, type IntelItem } from "@/lib/security-intel";
import pkg from "@/package.json";

const num = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const HISTORY_DAYS = 60;

/** Today's headline metrics, each as its own safe read (a missing table just drops that metric). */
export async function collectToday(q: Q): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const one = async (metric: string, sql: string, col = "v") => { try { out[metric] = num((await q(sql))[0]?.[col]); } catch { /* table missing */ } };
  await Promise.all([
    one("m:events24h", `SELECT count(*)::text AS v FROM events_stream WHERE created_at > now() - interval '24 hours'`),
    one("m:wallets24h", `SELECT count(DISTINCT wallet_address)::text AS v FROM events_stream WHERE created_at > now() - interval '24 hours'`),
    one("m:bets24h", `SELECT count(*)::text AS v FROM bets WHERE created_at > now() - interval '24 hours'`),
    one("m:wager24h", `SELECT coalesce(sum(amount),0)::text AS v FROM bets WHERE created_at > now() - interval '24 hours'`),
    one("m:profiles_new24h", `SELECT count(*)::text AS v FROM cdp_profiles WHERE first_seen > now() - interval '24 hours'`),
    one("m:cards_new24h", `SELECT count(*)::text AS v FROM cards WHERE created_at > now() - interval '24 hours'`),
    one("m:markets_open", `SELECT count(*)::text AS v FROM markets WHERE status = 'open'`),
    one("m:perps_open", `SELECT count(*)::text AS v FROM perp_markets WHERE status = 'open'`),
  ]);
  try {
    for (const r of await q(`SELECT event_type, count(*)::text AS c FROM events_stream WHERE created_at > now() - interval '24 hours' GROUP BY 1 ORDER BY 2 DESC LIMIT 40`)) out[`ev:${r.event_type}`] = num(r.c);
  } catch { /* no events table */ }
  return out;
}

/** Record a day's metrics (idempotent per day). */
export async function recordMetrics(q: Q, metrics: Record<string, number>): Promise<void> {
  for (const [metric, value] of Object.entries(metrics)) {
    await q(`INSERT INTO insight_metrics (day, metric, value) VALUES (current_date, $1, $2)
             ON CONFLICT (day, metric) DO UPDATE SET value = EXCLUDED.value`, [metric, value]);
  }
}

export async function loadHistory(q: Q, days = HISTORY_DAYS): Promise<History> {
  let rows: Record<string, unknown>[] = [];
  try { rows = await q(`SELECT day::text AS day, metric, value::text AS value FROM insight_metrics
                         WHERE day < current_date AND day >= current_date - $1::int ORDER BY day`, [days]); } catch { return {}; }
  const h: History = {};
  for (const r of rows) (h[String(r.metric)] ??= []).push({ day: String(r.day), value: num(r.value) });
  return h;
}

export async function loadFeedback(q: Q): Promise<Feedback[]> {
  try { return (await q(`SELECT rule, useful, dismissed FROM insight_feedback`)).map((r) => ({ rule: String(r.rule), useful: num(r.useful), dismissed: num(r.dismissed) })); }
  catch { return []; }
}

export async function loadSkills(q: Q): Promise<Skill[]> {
  try {
    return (await q(`SELECT * FROM insight_skills ORDER BY status, created_at DESC LIMIT 300`)).map((r) => ({
      id: String(r.id), kind: r.kind as Skill["kind"], title: String(r.title), status: r.status as Skill["status"], evidence: String(r.evidence ?? ""),
      uses: num(r.uses), hits: num(r.hits), misses: num(r.misses),
    }));
  } catch { return []; }
}

/** Acquire skills from the evidence: returns the ones newly added. */
export async function acquireSkills(q: Q): Promise<Skill[]> {
  const existing = new Set((await loadSkills(q)).map((s) => s.id));
  const types = await q(`SELECT metric, count(*)::text AS days, avg(value)::text AS avg FROM insight_metrics
                          WHERE metric LIKE 'ev:%' AND day >= current_date - 14 GROUP BY metric`);
  const gaps = await q(`SELECT substr(metric, 5) AS topic, sum(value)::text AS c FROM insight_metrics
                         WHERE metric LIKE 'gap:%' AND day >= current_date - 14 GROUP BY 1`);
  const fresh = proposeSkills({
    eventTypes: types.map((t) => ({ type: String(t.metric).slice(3), days: num(t.days), avgDaily: num(t.avg) })),
    gaps: gaps.map((g) => ({ topic: String(g.topic), count: num(g.c) })),
    existing,
  });
  for (const s of fresh) {
    await q(`INSERT INTO insight_skills (id, kind, title, status, evidence) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`, [s.id, s.kind, s.title, s.status, s.evidence]);
  }
  return fresh;
}

/** The daily job: record, learn, acquire. */
export async function runDaily(q: Q): Promise<{ metrics: number; acquired: string[] }> {
  const metrics = await collectToday(q);
  await recordMetrics(q, metrics);
  const acquired = await acquireSkills(q);
  return { metrics: Object.keys(metrics).length, acquired: acquired.map((s) => s.id) };
}

/** Count a concierge question the knowledge base could not answer, by public topic only (never the text). */
export async function recordGap(q: Q, text: string): Promise<void> {
  const topics = topicsIn(text);
  const metric = `gap:${topics[0] ?? "other"}`;
  await q(`INSERT INTO insight_metrics (day, metric, value) VALUES (current_date, $1, 1)
           ON CONFLICT (day, metric) DO UPDATE SET value = insight_metrics.value + 1`, [metric]);
}

/** Run the weekly scan and keep the result for the week. Public sources only; never throws. */
export async function runIntelScan(q: Q, now = new Date(), fetchImpl?: typeof fetch): Promise<IntelItem[]> {
  const items = await scanSecurityIntel({ deps: declaredDeps(pkg as { dependencies?: Record<string, string> }), fetchImpl, now: now.getTime() });
  try {
    await q(`INSERT INTO insight_intel (week_start, items) VALUES (date_trunc('week', $1::timestamptz)::date, $2::jsonb)
             ON CONFLICT (week_start) DO UPDATE SET items = EXCLUDED.items, scanned_at = now()`, [now.toISOString(), JSON.stringify(items)]);
  } catch { /* table missing: the report still carries this run's items */ }
  return items;
}

export async function loadLatestIntel(q: Q): Promise<IntelItem[] | undefined> {
  try {
    const r = await q(`SELECT items FROM insight_intel ORDER BY week_start DESC LIMIT 1`);
    return r[0] ? (r[0].items as IntelItem[]) : undefined;
  } catch { return undefined; }
}

const NARRATE = "You summarise a weekly platform report for its owner in at most 70 words: what happened, what matters most, what to do first. Use only the numbers given. No advice about money. No names or private data.";

/** Build the weekly report from live data; `ask` is injectable for tests. */
export async function buildWeekly(q: Q, now = new Date(), ask: typeof nimChat = nimChat, intelIn?: IntelItem[]): Promise<Report> {
  const intel = intelIn ?? (await loadLatestIntel(q));
  const [today, history, feedback, skills] = await Promise.all([collectToday(q), loadHistory(q), loadFeedback(q), loadSkills(q)]);
  const anomalies = detectAnomalies(history, today);
  const gapTop = Object.entries(today).filter(([k]) => k.startsWith("gap:")).sort((a, b) => b[1] - a[1])[0]?.[0]?.slice(4) ?? null;
  // Security items that hit a package this app declares become top-priority recommendations.
  const secRecs = (intel ?? []).filter((t) => t.affectsUs && t.source !== "feed").slice(0, 5).map((t) => ({
    rule: "security-upgrade", priority: t.severity === "critical" ? 20 : t.severity === "high" ? 14 : 9, text: `Security: ${t.title}. ${t.why}`,
  }));
  const recs = [...secRecs, ...recommend(anomalies, feedback), ...standingAdvice({ markets_open: today["m:markets_open"], bets24h: today["m:bets24h"], events24h: today["m:events24h"], wallets24h: today["m:wallets24h"], gapTop }, feedback)]
    .sort((a, b) => b.priority - a.priority).slice(0, 10);

  const weekly = ["m:events24h", "m:wallets24h", "m:bets24h", "m:wager24h", "m:profiles_new24h", "m:cards_new24h"].map((metric) => {
    const pts = history[metric] ?? [];
    const sum = (xs: { value: number }[]) => xs.reduce((a, b) => a + b.value, 0);
    return { metric, thisWeek: sum(pts.slice(-7)), lastWeek: sum(pts.slice(-14, -7)) };
  });
  const days = Math.max(0, ...Object.values(history).map((p) => p.length));

  const report = buildInsightReport({ now, anomalies, recommendations: recs, skills, newSkills: [], weekly, daysOfHistory: days, intel });
  const digest = JSON.stringify({ anomalies: anomalies.slice(0, 6).map((a) => ({ m: a.metric, v: a.value, usual: Math.round(a.expected), kind: a.direction })), top: recs.slice(0, 3).map((r) => r.text), weekly });
  const line = await ask({ system: NARRATE, input: digest, maxTokens: 140, temperature: 0.4 });
  if (line && !looksLikeLeak(line)) report.notes.unshift(`MoE read of the week: ${line.replace(/\s+/g, " ").trim()}`);
  return report;
}
