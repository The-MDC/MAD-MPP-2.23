/**
 * The self-learning insights engine (pure part).
 * ──────────────────────────────────────────────
 * Three things that get better with use, all deterministic and inspectable:
 *
 *  1. BASELINES. "Normal" is learned per metric from its own daily history (median and MAD, which a single freak day
 *     cannot drag). An anomaly is a day that sits far outside what this platform usually does.
 *  2. RECOMMENDATION WEIGHTS. Each recommendation rule carries a learned weight from the owner's feedback
 *     (useful / dismissed). Rules the owner values float up the weekly report; ones they dismiss sink.
 *  3. SKILL ACQUISITION. The engine widens what it can do. When a new event type shows sustained volume it ACQUIRES a
 *     read-only watcher for it. When visitors keep asking the concierge things it has no answer for, it PROPOSES a
 *     knowledge-gap skill (write a knowledge entry for that topic) and waits for an administrator's yes. Skills are
 *     data, never code: nothing here can execute anything, and every skill is monitored read-only or advisory.
 *     Proficiency (novice → competent → expert) comes from how often its flags were marked useful.
 *
 * The MoE (NIM) only narrates the finished, aggregate report; every number is computed here.
 */
import type { Report } from "@/lib/report-render";
import type { IntelItem } from "@/lib/security-intel";

/* ── baselines and anomalies ────────────────────────────────────────── */

export interface Point { day: string; value: number }
export type History = Record<string, Point[]>;

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Median absolute deviation scaled to be comparable to a standard deviation. */
export function mad(xs: number[]): number {
  const m = median(xs);
  return 1.4826 * median(xs.map((x) => Math.abs(x - m)));
}

export interface Anomaly { metric: string; value: number; expected: number; z: number; direction: "spike" | "drop" | "flatline"; days: number }

export const MIN_HISTORY = 7;
export const Z_THRESHOLD = 3;

/** Compare today's values with each metric's own learned baseline. Metrics with under a week of history are skipped, not guessed at. */
export function detectAnomalies(history: History, today: Record<string, number>): Anomaly[] {
  const out: Anomaly[] = [];
  for (const [metric, value] of Object.entries(today)) {
    const vals = (history[metric] ?? []).map((p) => p.value);
    if (vals.length < MIN_HISTORY) continue;
    const exp = median(vals);
    // A floor on the spread so a near-constant series does not flag every wobble.
    const spread = Math.max(mad(vals), Math.abs(exp) * 0.1, 1);
    const z = (value - exp) / spread;
    if (value === 0 && exp >= 5) out.push({ metric, value, expected: exp, z, direction: "flatline", days: vals.length });
    else if (Math.abs(z) >= Z_THRESHOLD) out.push({ metric, value, expected: exp, z, direction: z > 0 ? "spike" : "drop", days: vals.length });
  }
  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}

/* ── recommendations that learn from feedback ───────────────────────── */

export interface Feedback { rule: string; useful: number; dismissed: number }
export interface Recommendation { rule: string; text: string; metric?: string; priority: number }

const NICE: Record<string, string> = {
  events24h: "platform events", wallets24h: "active wallets", bets24h: "bets placed", wager24h: "$MADx wagered",
  profiles_new24h: "new profiles", cards_new24h: "cards minted", markets_open: "open markets", perps_open: "open perpetuals",
};
export const niceMetric = (m: string): string =>
  NICE[m.replace(/^m:/, "")] ?? (m.startsWith("ev:") ? `${m.slice(3)} events` : m.startsWith("gap:") ? `unanswered ${m.slice(4)} questions` : m);

interface Rule { id: string; match: (a: Anomaly) => boolean; text: (a: Anomaly) => string; base: number }

const RULES: Rule[] = [
  { id: "activity-drop", base: 5, match: (a) => /m:(events24h|wallets24h)$/.test(a.metric) && a.direction !== "spike",
    text: (a) => `${niceMetric(a.metric)} fell to ${a.value} against a usual ${Math.round(a.expected)}. Check for a failing deploy, a broken sign-in path or an ingest outage before anything else.` },
  { id: "activity-spike", base: 3, match: (a) => /m:(events24h|wallets24h)$/.test(a.metric) && a.direction === "spike",
    text: (a) => `${niceMetric(a.metric)} jumped to ${a.value} against a usual ${Math.round(a.expected)}. Find the source (a share, a creator, a bot) and, if it is organic, put a market in front of it while it is warm.` },
  { id: "wager-spike", base: 4, match: (a) => a.metric === "m:wager24h" && a.direction === "spike",
    text: (a) => `$MADx wagered hit ${Math.round(a.value)} against a usual ${Math.round(a.expected)}. Review the top markets for a one-sided book or a resolution risk.` },
  { id: "bets-drop", base: 4, match: (a) => a.metric === "m:bets24h" && a.direction !== "spike",
    text: (a) => `Bets fell to ${a.value} against a usual ${Math.round(a.expected)}. Odds may look stale or the floor may be empty of fresh markets: seed new ones.` },
  { id: "signup-drop", base: 3, match: (a) => a.metric === "m:profiles_new24h" && a.direction !== "spike",
    text: () => `New profiles slowed. Check the beta gate and sign-in flow, then consider a fresh invite wave from the waitlist.` },
  { id: "cards-drop", base: 2, match: (a) => a.metric === "m:cards_new24h" && a.direction !== "spike",
    text: () => `Card minting slowed. A new pack, faction event or evolution window can restart it.` },
  { id: "markets-drop", base: 4, match: (a) => a.metric === "m:markets_open" && a.direction !== "spike",
    text: (a) => `Open markets fell to ${a.value} from a usual ${Math.round(a.expected)}. Resolve or relist, and use the market suggester to refill the floor.` },
  { id: "event-type", base: 3, match: (a) => a.metric.startsWith("ev:"),
    text: (a) => `The "${a.metric.slice(3)}" event ${a.direction === "spike" ? "surged" : a.direction === "flatline" ? "stopped" : "fell"} (${a.value} vs a usual ${Math.round(a.expected)}). Something upstream of that feature changed.` },
  { id: "knowledge-gap", base: 2, match: (a) => a.metric.startsWith("gap:") && a.direction === "spike",
    text: (a) => `Visitors are asking the concierge about ${a.metric.slice(4)} more than usual and it has no answer. Add a knowledge entry for it.` },
];
const GENERIC: Rule = { id: "generic", base: 1, match: () => true, text: (a) => `${niceMetric(a.metric)} is ${a.direction === "spike" ? "above" : "below"} its usual range (${a.value} vs ${Math.round(a.expected)}). Worth a look.` };

/** Weight in (0, 2): 1 with no feedback, rising when the owner finds a rule useful and falling when they dismiss it. */
export function ruleWeight(fb: Feedback | undefined): number {
  const u = fb?.useful ?? 0, d = fb?.dismissed ?? 0;
  return 2 * ((u + 1) / (u + d + 2));
}

export function recommend(anomalies: Anomaly[], feedback: Feedback[] = [], limit = 8): Recommendation[] {
  const fb = new Map(feedback.map((f) => [f.rule, f]));
  return anomalies
    .map((a) => {
      const rule = RULES.find((r) => r.match(a)) ?? GENERIC;
      return { rule: rule.id, text: rule.text(a), metric: a.metric, priority: Math.round(rule.base * Math.min(6, Math.abs(a.z)) * ruleWeight(fb.get(rule.id)) * 100) / 100 };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/** Improvements that need no anomaly: standing advice from the shape of the week. Ranked with the same learned weights. */
export function standingAdvice(week: { markets_open?: number; bets24h?: number; events24h?: number; wallets24h?: number; gapTop?: string | null }, feedback: Feedback[] = []): Recommendation[] {
  const fb = new Map(feedback.map((f) => [f.rule, f]));
  const out: Recommendation[] = [];
  const add = (rule: string, text: string, base: number) => out.push({ rule, text, priority: Math.round(base * ruleWeight(fb.get(rule)) * 100) / 100 });
  if ((week.markets_open ?? 0) < 10) add("seed-markets", "Fewer than 10 markets are open. A thin floor caps activity: seed more, including with the market suggester.", 6);
  if ((week.wallets24h ?? 0) > 0 && (week.bets24h ?? 0) / Math.max(1, week.wallets24h ?? 1) < 0.5) add("activation", "Fewer than one bet per two active wallets: visitors are looking but not betting. Shorten the first-bet path and surface a starter market.", 5);
  if (week.gapTop) add("knowledge-gap-top", `The concierge's biggest unanswered topic this week is ${week.gapTop}. Write a knowledge entry for it.`, 4);
  return out;
}

/* ── skill acquisition ──────────────────────────────────────────────── */

export type SkillKind = "watch" | "gap";
export type SkillStatus = "proposed" | "active" | "retired";
export interface Skill { id: string; kind: SkillKind; title: string; status: SkillStatus; evidence: string; uses: number; hits: number; misses: number }
export type Proficiency = "novice" | "competent" | "expert";

export const proficiency = (s: Pick<Skill, "uses" | "hits" | "misses">): Proficiency => {
  const judged = s.hits + s.misses;
  if (s.uses < 5 || judged < 3) return "novice";
  const precision = s.hits / judged;
  return judged >= 10 && precision >= 0.7 ? "expert" : precision >= 0.4 ? "competent" : "novice";
};

export const WATCH_MIN_DAYS = 7;
export const WATCH_MIN_DAILY = 5;
export const GAP_MIN_COUNT = 5;

/**
 * Decide which skills to acquire from the evidence. `watch` skills are read-only and activate on their own; `gap`
 * skills are advisory and are only PROPOSED. Existing skills (any status, including retired) are never re-proposed.
 */
export function proposeSkills(input: {
  eventTypes: { type: string; days: number; avgDaily: number }[];
  gaps: { topic: string; count: number }[];
  existing: Set<string>;
}): Skill[] {
  const out: Skill[] = [];
  for (const e of input.eventTypes) {
    const id = `watch:ev:${e.type}`;
    if (input.existing.has(id) || e.days < WATCH_MIN_DAYS || e.avgDaily < WATCH_MIN_DAILY) continue;
    out.push({ id, kind: "watch", title: `Watch the "${e.type}" event`, status: "active", evidence: `Seen on ${e.days} days, about ${Math.round(e.avgDaily)} a day.`, uses: 0, hits: 0, misses: 0 });
  }
  for (const g of input.gaps) {
    const id = `gap:${g.topic}`;
    if (input.existing.has(id) || g.count < GAP_MIN_COUNT) continue;
    out.push({ id, kind: "gap", title: `Learn to answer ${g.topic} questions`, status: "proposed", evidence: `${g.count} concierge questions about ${g.topic} went unanswered.`, uses: 0, hits: 0, misses: 0 });
  }
  return out;
}

/* ── the weekly report ──────────────────────────────────────────────── */

export function buildInsightReport(i: {
  now: Date;
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  skills: Skill[];
  newSkills: Skill[];
  weekly: { metric: string; thisWeek: number; lastWeek: number }[];
  daysOfHistory: number;
  narrative?: string | null;
  intel?: IntelItem[];
}): Report {
  const pctChange = (a: number, b: number) => (b === 0 ? (a === 0 ? "0%" : "new") : `${(((a - b) / b) * 100).toFixed(0)}%`);
  const active = i.skills.filter((s) => s.status === "active");
  return {
    id: "weekly-insights",
    title: "MAD Gambit - weekly anomalies and recommendations",
    generatedAt: i.now.toISOString(),
    source: i.daysOfHistory > 0 ? "live" : "demo",
    summary: [
      ["Days of history learned from", String(i.daysOfHistory)],
      ["Anomalies this week", String(i.anomalies.length)],
      ["Recommendations", String(i.recommendations.length)],
      ["Skills active / proposed", `${active.length} / ${i.skills.filter((s) => s.status === "proposed").length}`],
      ["Skills acquired this run", String(i.newSkills.length)],
    ],
    tables: [
      { title: "Recommendations (ranked)", columns: ["#", "Recommendation", "Priority", "Rule"], rows: i.recommendations.map((r, n) => [n + 1, r.text, r.priority, r.rule]) },
      { title: "Anomalies", columns: ["Measure", "Now", "Usual", "Deviation", "Kind"], rows: i.anomalies.map((a) => [niceMetric(a.metric), a.value, Math.round(a.expected), `${a.z.toFixed(1)}σ`, a.direction]) },
      { title: "Week on week", columns: ["Measure", "This week", "Last week", "Change"], rows: i.weekly.map((w) => [niceMetric(w.metric), Math.round(w.thisWeek), Math.round(w.lastWeek), pctChange(w.thisWeek, w.lastWeek)]) },
      {
        title: "Security upgrades to consider (weekly scan of GitHub, OSV, CISA KEV and maintainer feeds)",
        columns: ["Affects us", "Severity", "Source", "Item", "Why it matters", "Link"],
        rows: (i.intel ?? []).map((t) => [t.affectsUs ? "yes" : "check", t.severity ?? "", t.source, t.title, t.why, t.link]),
      },
      { title: "Skills", columns: ["Skill", "Kind", "Status", "Proficiency", "Evidence"], rows: i.skills.map((s) => [s.title, s.kind, s.status, proficiency(s), s.evidence]) },
    ],
    notes: [
      ...(i.narrative ? [`MoE read of the week: ${i.narrative}`] : []),
      ...(i.daysOfHistory < MIN_HISTORY ? [`Only ${i.daysOfHistory} day(s) of history so far: anomaly detection starts after ${MIN_HISTORY}. The engine is learning what normal looks like.`] : []),
      ...(i.intel === undefined ? [] : i.intel.length === 0 ? ["The weekly security scan found nothing new for this stack, or its sources were unreachable."] : []),
      "Anomalies are judged against each measure's own learned baseline (median and MAD), not a fixed threshold.",
      "Recommendation order learns from your feedback: mark them useful or dismiss them in the admin console.",
      "Proposed skills wait for an administrator's approval in the admin console; watch skills are read-only and activate on their own.",
    ],
  };
}
