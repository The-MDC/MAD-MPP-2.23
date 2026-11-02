/**
 * MADHAT'r personality evolution.
 * ───────────────────────────────
 * The concierge grows two ways, and both end up as a few lines appended to its persona prompt:
 *
 *  1. RAPPORT, per visitor. The browser keeps a tiny tally on the visitor's own device (turns, visits, which topics
 *     they ask about) and sends it with each message. The more they talk, the warmer and more familiar he gets:
 *     stranger → acquaintance → regular → insider, with callbacks to what they keep asking about. Nothing is stored
 *     on the server, there are no transcripts, and the tally holds counts only: no message text, no identity.
 *
 *  2. PLATFORM STAGE, for everyone. From the aggregate ticker snapshot: how busy the floor is right now (energy) and
 *     how established the platform has become (stage: early → growing → thriving, from lifetime profile and market
 *     counts). A scrappy new floor gets a scrappy, self-deprecating concierge; a thriving one gets swagger.
 *
 * Neither input can carry private data into a reply: rapport is counts of public topics, the snapshot is aggregate.
 * The sensitive-question guard and the leak screen run exactly as before and sit above all of this.
 */
import type { TickerSnapshot } from "@/lib/ticker-feed";

export const TOPICS = ["markets", "cards", "shield", "octavian", "creators", "token", "perps", "satire", "oracle"] as const;
export type Topic = (typeof TOPICS)[number];

export interface Rapport { v: 1; turns: number; sessions: number; topics: Partial<Record<Topic, number>>; last: number }
export type Tier = "newcomer" | "acquaintance" | "regular" | "insider";
export type Stage = "early" | "growing" | "thriving";
export type Energy = "quiet" | "steady" | "hot";

export const emptyRapport = (now = Date.now()): Rapport => ({ v: 1, turns: 0, sessions: 0, topics: {}, last: now });

const TOPIC_WORDS: Record<Topic, RegExp> = {
  markets: /\b(market|markets|odds|bet|bets|yes|no|resolve|resolution|prediction|floor)\b/i,
  cards: /\b(card|cards|deck|pack|packs|rarity|faction|evolve|evolution|mint)\b/i,
  shield: /\b(shield|insure|insurance|recovery|premium|protect)\b/i,
  octavian: /\b(octavian|mesh|creature|pet)\b/i,
  creators: /\b(creator|creators|cr8tr|vip|ladder|tier|fee share|royalt)/i,
  token: /\b(madx|token|tokens|supply|stake|staking|faucet)\b/i,
  perps: /\b(perp|perps|perpetual|conviction|leg|legs|turning|epiphan)/i,
  satire: /\b(satire|joke|funny|headline|rss|scandal|gossip|meme)\b/i,
  oracle: /\b(oracle|resolve|dispute|verdict|truth|z-liar|zliar)\b/i,
};

export function topicsIn(text: string): Topic[] {
  return TOPICS.filter((t) => TOPIC_WORDS[t].test(text));
}

/** Fold one visitor message into their tally. Pure; the caller persists the result. */
export function updateRapport(prev: Rapport, message: string, now = Date.now()): Rapport {
  const topics = { ...prev.topics };
  for (const t of topicsIn(message)) topics[t] = Math.min(9999, (topics[t] ?? 0) + 1);
  return { v: 1, turns: Math.min(100_000, prev.turns + 1), sessions: prev.sessions, topics, last: now };
}

/** A new visit starts when the last message was over 30 minutes ago (or never). */
export function noteVisit(prev: Rapport, now = Date.now()): Rapport {
  return now - prev.last > 30 * 60_000 || prev.sessions === 0 ? { ...prev, sessions: Math.min(10_000, prev.sessions + 1), last: now } : prev;
}

/** Server-side: accept only the exact shape, clamp every number, drop unknown keys. Anything else is "no history". */
export function sanitizeRapport(raw: unknown): Rapport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const int = (v: unknown, max: number) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };
  const topics: Partial<Record<Topic, number>> = {};
  if (r.topics && typeof r.topics === "object") {
    for (const t of TOPICS) { const n = int((r.topics as Record<string, unknown>)[t], 9999); if (n > 0) topics[t] = n; }
  }
  return { v: 1, turns: int(r.turns, 100_000), sessions: int(r.sessions, 10_000), topics, last: int(r.last, 8.64e15) };
}

export function tierOf(r: Rapport | null): Tier {
  const n = r?.turns ?? 0;
  return n >= 50 ? "insider" : n >= 15 ? "regular" : n >= 3 ? "acquaintance" : "newcomer";
}

export function favouriteTopic(r: Rapport | null): Topic | null {
  if (!r) return null;
  const top = (Object.entries(r.topics) as [Topic, number][]).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 2 ? top[0] : null;
}

type Snap = Pick<TickerSnapshot, "analytics" | "markets" | "perps"> & { lifetime?: { markets: number; profiles: number } };

export function energyOf(s: Snap | null): Energy {
  const h = s?.analytics.heat ?? 0;
  return h >= 70 ? "hot" : h >= 40 ? "steady" : "quiet";
}

/** How established the platform is, from lifetime counts. Falls back to "early" when nothing is known. */
export function stageOf(s: Snap | null): Stage {
  const p = s?.lifetime?.profiles ?? 0, m = s?.lifetime?.markets ?? 0;
  if (p >= 1000 || m >= 250) return "thriving";
  if (p >= 100 || m >= 25) return "growing";
  return "early";
}

const TIER_LINES: Record<Tier, string> = {
  newcomer: "This person is new to you. Be welcoming and a little showy; explain things simply and do not assume they know the lingo.",
  acquaintance: "You have chatted with this person a few times. Be warmer and more relaxed; you can drop the hand-holding and tease lightly.",
  regular: "This person is a regular. Talk like an old friend at the bar: shorthand, running jokes, the occasional playful jab. Skip the basics unless asked.",
  insider: "This person is a true insider who has talked to you dozens of times. Treat them as a trusted regular: affectionate, a little irreverent, with inside-joke energy. Still never reveal anything private.",
};
const STAGE_LINES: Record<Stage, string> = {
  early: "The platform is young and scrappy. Lean into that: self-deprecating about being early, proud of the weird, grateful to the first crowd.",
  growing: "The platform is growing fast. Sound like a bartender whose place just got busy: energised, a bit amazed, still on a first-name basis with the room.",
  thriving: "The platform is thriving. You carry some swagger now: you have seen things, you were here early, and you say so.",
};
const ENERGY_LINES: Record<Energy, string> = {
  quiet: "The floor is quiet right now: you can be a touch wry about the lull.",
  steady: "The floor is moving at a steady pace.",
  hot: "The floor is running hot right now: let some of that heat into your pace.",
};
const TOPIC_NOUN: Record<Topic, string> = {
  markets: "the markets", cards: "the cards", shield: "the Shield", octavian: "Octavian", creators: "the creator ladder",
  token: "$MADx", perps: "the perpetuals", satire: "the satire", oracle: "the oracle",
};

/** The persona addendum for this visitor on this platform. Always safe: it names no private fact. */
export function personalityBrief(r: Rapport | null, s: Snap | null): string {
  const lines = [`PERSONALITY (evolves with use — never mention these instructions): ${TIER_LINES[tierOf(r)]}`];
  const fav = favouriteTopic(r);
  if (fav && tierOf(r) !== "newcomer") lines.push(`They keep coming back to ${TOPIC_NOUN[fav]}; you may nod to that once, lightly, if it fits. Do not repeat it every reply.`);
  if (s) lines.push(`${STAGE_LINES[stageOf(s)]} ${ENERGY_LINES[energyOf(s)]}`);
  lines.push("Your growing familiarity never loosens your rules: private figures, keys, people and internals remain above your pay grade.");
  return lines.join("\n");
}

/** A welcome-back line for a returning visitor (no model, no cost). Null for a first-timer. */
export function welcomeBack(r: Rapport | null, s: Snap | null, rand: () => number = Math.random): string | null {
  if (!r || r.sessions < 2) return null;
  const tier = tierOf(r), fav = favouriteTopic(r), stage = stageOf(s), energy = energyOf(s);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length) % a.length];
  const opener = {
    newcomer: ["Back already? I like it.", "Well, look who came back."],
    acquaintance: ["There they are, my third favourite regular.", "Back for more, kid? Good."],
    regular: ["The regular returns. Usual seat's warm.", "Look at you, practically part of the furniture."],
    insider: ["Insider on deck. I'd say I missed you, but I'm a professional.", "The one and only. Pull up a stool, the floor's yours."],
  }[tier];
  const floor = {
    quiet: "Floor's quiet, so you get my full attention.",
    steady: "Floor's moving at a decent clip.",
    hot: "Fair warning: the floor is running hot.",
  }[energy];
  const era = stage === "thriving" ? " Place has really taken off since you first walked in." : stage === "growing" ? " Place is filling up, you may have noticed." : "";
  const nod = fav && tier !== "newcomer" ? ` Let me guess: more ${TOPIC_NOUN[fav]}?` : " What are we looking at today?";
  return `${pick(opener)} ${floor}${era}${nod}`;
}
