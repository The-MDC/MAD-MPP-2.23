/**
 * Concierge skills — fast, deterministic tools the MADHAT'r runs without a model.
 * ───────────────────────────────────────────────────────────────────────────────
 * A visitor types a slash command (/odds 62) or taps a skill chip. Each skill is a small, pure function over the
 * canonical maths library, the knowledge file or the public ticker snapshot: instant, free, identical every time and
 * impossible to talk into saying something else. Research skills read the knowledge base; platform skills calculate.
 *
 * Nothing here gives advice. Calculators explain what the engine would do with the numbers you give it.
 */
import { kellyFraction, getLunarIllumination, getLunarPhaseMultiplier, getStakingTier, PLATFORM, splitFee, STAKING_TIERS } from "@/lib/gambit-game-math";
import { currentLeg, legCountdown } from "@/lib/lunar-legs";
import { rankSections, type KnowledgeBase } from "@/lib/madhatr-knowledge";
import type { TickerSnapshot } from "@/lib/ticker-feed";

export interface SkillContext { kb: KnowledgeBase; snapshot?: TickerSnapshot | null; now?: number; extra?: { phaseName?: string; knownIssues?: string[]; threat?: string } }
export interface Skill { id: string; usage: string; kind: "research" | "platform"; about: string; run: (args: string[], ctx: SkillContext) => string }

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null;
  const n = Number(String(s).replace(/[%,$_]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const pctIn = (s: string | undefined): number | null => {
  const n = num(s);
  if (n === null) return null;
  const p = n > 1 ? n / 100 : n;
  return p > 0 && p < 1 ? p : null;
};
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const NOT_ADVICE = " That's the maths, not advice.";

/**
 * Research skills read the knowledge file. A short query ("volatility", "perps") is tried the ways people ask it
 * ("what is…", "how do… work"), and a topic whose title names the idea gets a boost, so the teaching section wins
 * over a section that merely mentions the word.
 */
function topic(kb: KnowledgeBase, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return null;
  const scores = new Map<KnowledgeBase["sections"][number], number>();
  for (const variant of [query, `what is ${query}`, `how do ${query} work`, `explain ${query}`]) {
    for (const { sec, score } of rankSections(variant, kb)) scores.set(sec, (scores.get(sec) ?? 0) + score);
  }
  const words = query.split(/\s+/).filter((w) => w.length > 2);
  for (const sec of kb.sections) {
    const title = sec.title.toLowerCase();
    if (words.length && words.every((w) => title.includes(w.replace(/s$/, "")))) scores.set(sec, (scores.get(sec) ?? 0) + 5);
  }
  return [...scores].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
}

export const SKILLS: readonly Skill[] = Object.freeze([
  { id: "help", kind: "research", usage: "/help", about: "List every skill.", run: () =>
      `Skills: ${SKILLS.filter((s) => s.id !== "help").map((s) => s.usage).join(" · ")}. Type one, kid.` },

  { id: "explain", kind: "research", usage: "/explain <idea>", about: "The plain-English version of any concept.", run: (a, { kb }) => {
      const q = a.join(" ").trim();
      if (!q) return "Explain what? Try /explain volatility, /explain market maker, /explain perps.";
      const s = topic(kb, q);
      return s && s.say.length ? s.say.slice(0, 2).join(" ") : `I don't have a write-up on "${q.slice(0, 40)}" yet. Try /topics.`;
    } },

  { id: "deeper", kind: "research", usage: "/deeper <idea>", about: "The formula and the facts behind an idea.", run: (a, { kb }) => {
      const q = a.join(" ").trim();
      const s = q ? topic(kb, q) : null;
      if (!s) return "Deeper on what? Try /deeper lmsr or /deeper garch.";
      return s.facts.length ? s.facts.slice(0, 3).join(" ") : s.say.slice(0, 2).join(" ");
    } },

  { id: "sources", kind: "research", usage: "/sources <idea>", about: "Where an idea comes from: papers, people, dates.", run: (a, { kb }) => {
      const s = topic(kb, a.join(" "));
      const lines = s ? s.facts.filter((f) => /\(\d{4}\)|\b(19|20)\d{2}\b|Source|History|Research/i.test(f)) : [];
      return lines.length ? lines.slice(0, 3).join(" ") : "No sources on file for that one. Try /sources lmsr, /sources garch, /sources kelly, /sources moon.";
    } },

  { id: "topics", kind: "research", usage: "/topics", about: "What I can teach.", run: (_a, { kb }) => {
      const skip = new Set(["greetings", "pay-grade ladder", "house rules", "sources", "welcome"]);
      return `I can walk you through: ${kb.sections.filter((s) => !skip.has(s.title.toLowerCase())).map((s) => s.title).slice(0, 40).join("; ")}.`;
    } },

  { id: "odds", kind: "platform", usage: "/odds <probability%>", about: "Probability to the decimal odds shown here.", run: (a) => {
      const p = pctIn(a[0]);
      if (p === null) return "Give me a probability between 1 and 99, like /odds 62.";
      const fair = 1 / p, shown = 1 / (p * (1 + PLATFORM.FEE_BPS / 10_000));
      return `${fmt(p * 100, 1)}% is fair odds of ${fmt(fair, 2)}; with the flat 1.88% fee folded in it shows as ${fmt(shown, 2)}. A 100 $MADx stake pays about ${fmt(100 * shown, 2)} back if it lands.`;
    } },

  { id: "prob", kind: "platform", usage: "/prob <decimal odds>", about: "Decimal odds back to a probability.", run: (a) => {
      const o = num(a[0]);
      if (o === null || o <= 1) return "Give me decimal odds above 1, like /prob 2.5.";
      return `Odds of ${fmt(o, 2)} imply about ${fmt(100 / o, 1)}% (before any fee).`;
    } },

  { id: "fee", kind: "platform", usage: "/fee <volume> [creator%]", about: "Where the 1.88% goes on a given volume.", run: (a) => {
      const v = num(a[0]);
      if (v === null || v <= 0) return "Give me a volume, like /fee 10000 or /fee 10000 28.8.";
      const rung = num(a[1]);
      const bps = rung === null ? 0 : Math.round(Math.min(40, Math.max(0, rung)) * 100);
      const f = splitFee(v, bps);
      return `On ${fmt(v)} $MADx the fee is ${fmt(f.grossFee)}${bps ? ` (creator rung ${bps / 100}%)` : " (platform-made market, no creator cut)"}: creator ${fmt(f.creatorCut)}, community ${fmt(f.communityCut)}, protocol ${fmt(f.platformNet - f.communityCut)}.`;
    } },

  { id: "kelly", kind: "platform", usage: "/kelly <win%> <decimal odds>", about: "Half-Kelly sizing for a stated edge.", run: (a) => {
      const p = pctIn(a[0]), o = num(a[1]);
      if (p === null || o === null || o <= 1) return "Give me your win chance and the decimal odds, like /kelly 60 2.0.";
      const f = kellyFraction(p, o - 1, 0.5);
      return f <= 0
        ? `At ${fmt(p * 100, 1)}% and odds ${fmt(o, 2)} there's no edge, so Kelly says bet nothing.${NOT_ADVICE}`
        : `Half-Kelly says ${fmt(f * 100, 1)}% of your bankroll at ${fmt(p * 100, 1)}% and odds ${fmt(o, 2)}.${NOT_ADVICE}`;
    } },

  { id: "shield", kind: "platform", usage: "/shield <stake> <win%> [volatility]", about: "What the Shield would cost and return.", run: (a) => {
      const stake = num(a[0]), p = pctIn(a[1]), sig = num(a[2]) ?? 0.2;
      if (stake === null || stake <= 0 || p === null) return "Give me a stake and a win chance, like /shield 100 50 0.2.";
      const s = Math.min(0.68, Math.max(0.09, sig));
      const raw = stake * p * Math.sqrt(s) * 0.35;
      const premium = Math.min(stake * PLATFORM.SHIELD_PREMIUM_MAX, Math.max(stake * PLATFORM.SHIELD_PREMIUM_MIN, raw));
      return `On ${fmt(stake)} $MADx at ${fmt(p * 100, 0)}% and σ ${fmt(s, 2)}, the premium is about ${fmt(premium)} (kept inside 2–4%). If it loses you'd get back ${fmt(stake * 0.288)} at the standard 28.8%, up to ${fmt(stake * 0.4)} at the 40% ceiling. Loss mitigation, not insurance.`;
    } },

  { id: "stake", kind: "platform", usage: "/stake <amount> [clout]", about: "Your staking tier and APY.", run: (a) => {
      const amt = num(a[0]), clout = Math.min(200, Math.max(0, num(a[1]) ?? 0));
      if (amt === null || amt < 0) return "Give me an amount, like /stake 1000 or /stake 1000 50.";
      const t = getStakingTier(amt);
      if (!t) return `${fmt(amt)} $MADx is below Bronze (${STAKING_TIERS[0].minMadx}). Tiers: ${STAKING_TIERS.map((x) => `${x.name} ${fmt(x.minMadx)}`).join(", ")}.`;
      return `${fmt(amt)} $MADx is ${t.name}: ${fmt(t.apy * 100, 1)}% APY, ${fmt(t.apy * (1 + clout / 200) * 100, 1)}% with clout ${clout}. Shield recovery cap ${fmt(t.shieldRecoveryPct * 100, 1)}%. Earned, never promised.`;
    } },

  { id: "moon", kind: "platform", usage: "/moon", about: "Moon phase, the lunar multiplier and the current leg.", run: (_a, { now }) => {
      const t = now ?? Date.now();
      const leg = currentLeg(t);
      const lit = getLunarIllumination(t);
      return `The moon is ${fmt(lit * 100, 0)}% lit; the lunar multiplier is ${fmt(getLunarPhaseMultiplier(t), 3)} (theme only, never fees or prices). Leg ${leg.globalLeg} closes in ${legCountdown(leg.closesAt, t)}.`;
    } },

  { id: "markets", kind: "platform", usage: "/markets", about: "The busiest markets this minute.", run: (_a, { snapshot }) => {
      const m = snapshot?.markets.filter((x) => x.kind === "binary").slice(0, 5) ?? [];
      return m.length ? `On the board: ${m.map((x) => `"${x.title}" ${x.yesPct}% YES`).join("; ")}.` : "The board is quiet right now. Make a market and give it something to talk about.";
    } },

  { id: "status", kind: "platform", usage: "/status", about: "Beta phase, known issues and the security colour.", run: (_a, { extra }) => {
      const issues = extra?.knownIssues?.length ? ` Known issues: ${extra.knownIssues.slice(0, 3).join("; ")}.` : " No known issues on file.";
      return `${extra?.phaseName ?? "Beta"}. Security: ${extra?.threat ?? "green"}.${issues}`;
    } },

  { id: "ticket", kind: "platform", usage: "/ticket <what happened>", about: "Open a support ticket.", run: () => "Tell me what happened in a sentence or two and say \"open a ticket\", or use the Support button once you're signed up." },
] as Skill[]);

/** Parse "/odds 62" (or "odds: 62") into a skill and its args, or null when the message isn't a skill call. */
export function parseSkill(text: string): { skill: Skill; args: string[] } | null {
  const m = text.trim().match(/^\/([a-z]+)\b\s*(.*)$/i);
  if (!m) return null;
  const skill = SKILLS.find((s) => s.id === m[1].toLowerCase());
  if (!skill) return null;
  return { skill, args: m[2].trim().split(/\s+/).filter(Boolean).slice(0, 6).map((x) => x.slice(0, 40)) };
}

export function runSkill(text: string, ctx: SkillContext): string | null {
  const p = parseSkill(text);
  if (!p) return null;
  try { return p.skill.run(p.args, ctx).slice(0, 700); } catch { return "That skill tripped over its own feet. Try /help."; }
}

export { SKILL_CHIPS } from "@/lib/concierge-skill-chips";
