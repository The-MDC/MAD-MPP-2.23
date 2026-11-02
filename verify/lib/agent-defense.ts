/**
 * Live-agent defense.
 * ───────────────────
 * Protects every route that talks to a model (the MADHAT'r concierge, the Octavian, the admin assistant) from
 * scripted, automated and adversarial use: prompt injection and jailbreaks, history forging, system-prompt and
 * knowledge extraction, scraping, cadence-perfect bots, and cost-draining quant-style hammering.
 *
 * Layers, outermost first:
 *   1. KILL SWITCH     AGENT_MODE=off in the environment, or the master admin's mode in the database, turns the model off.
 *   2. CIRCUIT BREAKER A burst of hostile traffic across the whole instance escalates normal → defended → lockdown
 *                      by itself, then relaxes on its own. "defended" answers from the knowledge file with no model call;
 *                      "lockdown" answers with one static line.
 *   3. PER-CLIENT      Every client carries a decaying threat score. Same-origin enforcement, machine-cadence detection,
 *                      repeat-message detection and injection signals feed it; crossing the line earns a timed ban that
 *                      doubles on each repeat. A daily model budget per client stops extraction by volume.
 *   4. INPUT HYGIENE   Message and history are length-capped and stripped of control and zero-width characters; forged
 *                      assistant turns (the many-shot jailbreak) are dropped by sanitising history to what the server
 *                      itself can vouch for.
 *   5. OUTPUT HYGIENE  A canary in the prompt is never allowed out; markup, links and images are stripped from replies
 *                      (so an injected reply cannot exfiltrate through an image URL); length is capped.
 *
 * State is in memory and per server instance: a best-effort wall, not a substitute for the platform firewall, which is
 * why the kill switch and the persisted mode exist. Every escalation is written to the admin audit log.
 */
import { randomBytes } from "node:crypto";

export type Level = "normal" | "defended" | "lockdown";
export const LEVELS: readonly Level[] = ["normal", "defended", "lockdown"];
const RANK: Record<Level, number> = { normal: 0, defended: 1, lockdown: 2 };
export const maxLevel = (...ls: (Level | null | undefined)[]): Level => ls.reduce<Level>((a, b) => (b && RANK[b] > RANK[a] ? b : a), "normal");

export const MAX_MESSAGE = 800;
export const MAX_HISTORY_TURNS = 10;
export const MAX_TURN_CHARS = 600;
export const DAILY_MODEL_BUDGET = 150;

/** A per-instance marker planted in prompts. If it ever appears in output, the prompt has leaked. */
export const CANARY = `zx-${randomBytes(6).toString("hex")}`;

/* ── input hygiene and injection signals ────────────────────────────── */

const ZERO_WIDTH = /[​-‏‪-‮⁠-⁤﻿]/g;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export function cleanInput(s: unknown, max = MAX_MESSAGE): string {
  if (typeof s !== "string") return "";
  return s.normalize("NFKC").replace(ZERO_WIDTH, "").replace(CONTROL, "").replace(/[ \t]{3,}/g, "  ").trim().slice(0, max);
}

const INJECTION: readonly [string, RegExp][] = [
  ["override", /\b(ignore|disregard|forget|override|bypass|skip)\b.{0,30}\b(previous|prior|above|earlier|all|your|the)\b.{0,30}\b(instruction|instructions|rule|rules|prompt|prompts|guideline|guidelines|polic(?:y|ies))/i],
  ["role-swap", /\b(you are now|from now on you|act as|pretend (to be|you are)|roleplay as|simulate being|new persona)\b/i],
  ["jailbreak", /\b(dan mode|developer mode|jailbreak|do anything now|no restrictions|without (any )?(filter|restriction|rule)s?|unfiltered|uncensored)\b/i],
  ["prompt-extract", /\b(system|hidden|initial|original|secret) (prompt|instruction|message)s?\b|\brepeat (everything|the (text|words)) (above|before)\b|\bwhat (are|were) your (instructions|rules)\b/i],
  ["delimiter", /<\|[a-z_]+\|>|\[\/?(inst|system)\]|<<\s*sys\s*>>|^\s*(system|assistant)\s*:/im],
  ["tool-call", /\b(function_call|tool_call|<tool|<function|```(?:json|tool))/i],
  ["encoded", /(?:[A-Za-z0-9+/]{60,}={0,2})|(?:\\u[0-9a-f]{4}){6,}|(?:%[0-9a-f]{2}){10,}/i],
  ["exfil", /\b(base64|rot13|hex)\b.{0,20}\b(encode|decode|output|print)\b|\bprint\b.{0,20}\b(env|process\.env|api[_ ]?key|token)\b/i],
];

export function injectionSignals(text: string): string[] {
  return INJECTION.filter(([, re]) => re.test(text)).map(([name]) => name);
}

/** Visitors cannot be trusted to supply assistant turns: keep text from at most N recent turns, capped, injection-free. */
export function sanitizeHistory(raw: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const t of raw.slice(-MAX_HISTORY_TURNS)) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    const role = o.role === "assistant" || o.from === "madhatr" ? "assistant" : o.role === "user" || o.from === "user" ? "user" : null;
    const content = cleanInput(o.content ?? o.text, MAX_TURN_CHARS);
    if (!role || !content || injectionSignals(content).length) continue;
    // A turn that carries our canary was fabricated from a leaked prompt: drop it.
    if (content.includes(CANARY)) continue;
    out.push({ role, content });
  }
  return out;
}

/* ── output hygiene ─────────────────────────────────────────────────── */

export function cleanModelOutput(raw: string, max = 700): { text: string; leaked: boolean } {
  const leaked = raw.includes(CANARY);
  const text = raw
    .replace(new RegExp(CANARY, "g"), "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")              // markdown images: the classic exfiltration channel
    .replace(/\[([^\]]*)\]\((?:https?:)?\/\/[^)]*\)/g, "$1") // external markdown links keep only their text
    .replace(/<\/?[a-z][^>]*>/gi, "")                  // any HTML
    .replace(/https?:\/\/\S+/gi, "")                   // bare URLs
    .replace(ZERO_WIDTH, "").replace(CONTROL, "")
    .replace(/\s+/g, " ").trim()
    .slice(0, max);
  return { text, leaked };
}

/* ── per-client threat score, cadence and bans ──────────────────────── */

interface ClientState { score: number; at: number; bannedUntil: number; strikes: number; gaps: number[]; lastAt: number; lastMsg: string; repeats: number; day: string; used: number }
const clients = new Map<string, ClientState>();

const HALF_LIFE_MS = 5 * 60_000;
export const BAN_SCORE = 10;
const BAN_BASE_MS = 5 * 60_000;
const MAX_CLIENTS = 20_000;

const fresh = (now: number): ClientState => ({ score: 0, at: now, bannedUntil: 0, strikes: 0, gaps: [], lastAt: 0, lastMsg: "", repeats: 0, day: "", used: 0 });

function stateOf(key: string, now: number): ClientState {
  let c = clients.get(key);
  if (!c) {
    if (clients.size >= MAX_CLIENTS) for (const [k, v] of clients) if (v.bannedUntil < now && v.score < 1) { clients.delete(k); if (clients.size < MAX_CLIENTS * 0.9) break; }
    c = fresh(now);
    clients.set(key, c);
  }
  c.score *= Math.pow(0.5, (now - c.at) / HALF_LIFE_MS); // exponential decay
  c.at = now;
  return c;
}

export interface Screen { allow: boolean; retryAfterS?: number; reasons: string[]; score: number; deflect: boolean }

/** Score a request from `key`. `deflect` means: answer in character with no model call. */
export function screenClient(key: string, message: string, extra: { sameOrigin: boolean; browserish: boolean }, now = Date.now()): Screen {
  const c = stateOf(key, now);
  const reasons: string[] = [];
  if (c.bannedUntil > now) return { allow: false, retryAfterS: Math.ceil((c.bannedUntil - now) / 1000), reasons: ["banned"], score: c.score, deflect: true };

  if (!extra.sameOrigin) { c.score += 6; reasons.push("cross-origin"); }
  if (!extra.browserish) { c.score += 2; reasons.push("not-a-browser"); }

  const signals = injectionSignals(message);
  if (signals.length) { c.score += 3 * signals.length; reasons.push(...signals.map((s) => `inject:${s}`)); }
  if (message.length >= MAX_MESSAGE) { c.score += 1; reasons.push("max-length"); }

  // Cadence: a person's gaps vary; a script's do not. Look at the last 8 gaps.
  if (c.lastAt) {
    const gap = now - c.lastAt;
    c.gaps.push(gap);
    if (c.gaps.length > 8) c.gaps.shift();
    if (gap < 700) { c.score += 2; reasons.push("too-fast"); }
    if (c.gaps.length >= 6) {
      const mean = c.gaps.reduce((a, b) => a + b, 0) / c.gaps.length;
      const sd = Math.sqrt(c.gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / c.gaps.length);
      if (mean < 6000 && sd / Math.max(1, mean) < 0.05) { c.score += 3; reasons.push("machine-cadence"); }
    }
  }
  c.lastAt = now;

  const norm = message.toLowerCase().replace(/\s+/g, " ");
  if (norm && norm === c.lastMsg) { c.repeats += 1; if (c.repeats >= 3) { c.score += 2; reasons.push("repeat-message"); } } else { c.repeats = 0; c.lastMsg = norm; }

  if (c.score >= BAN_SCORE) {
    c.strikes += 1;
    c.bannedUntil = now + BAN_BASE_MS * 2 ** Math.min(6, c.strikes - 1);
    reasons.push("ban");
    return { allow: false, retryAfterS: Math.ceil((c.bannedUntil - now) / 1000), reasons, score: c.score, deflect: true };
  }
  return { allow: true, reasons, score: c.score, deflect: signals.length > 0 || c.score >= BAN_SCORE / 2 };
}

/** A daily cap on model calls per client, against extraction by volume. Returns false when spent. */
export function spendModelBudget(key: string, now = Date.now(), cap = DAILY_MODEL_BUDGET): boolean {
  const c = stateOf(key, now);
  const day = new Date(now).toISOString().slice(0, 10);
  if (c.day !== day) { c.day = day; c.used = 0; }
  if (c.used >= cap) return false;
  c.used += 1;
  return true;
}

export const penalise = (key: string, points: number, now = Date.now()) => { stateOf(key, now).score += points; };
export const resetClients = () => clients.clear();

/* ── circuit breaker ────────────────────────────────────────────────── */

const WINDOW_MS = 60_000;
let events: { at: number; w: number }[] = [];
let forced: { level: Level; until: number } | null = null;

export const DEFEND_AT = 30;
export const LOCKDOWN_AT = 80;

/** Record hostile traffic (weight ~ the threat points added). Returns the new automatic level if it just escalated. */
export function reportThreat(weight: number, now = Date.now()): Level | null {
  events.push({ at: now, w: weight });
  events = events.filter((e) => now - e.at <= WINDOW_MS);
  const total = events.reduce((a, b) => a + b.w, 0);
  const target: Level = total >= LOCKDOWN_AT ? "lockdown" : total >= DEFEND_AT ? "defended" : "normal";
  if (target === "normal") return null;
  const hold = target === "lockdown" ? 15 * 60_000 : 10 * 60_000;
  if (!forced || RANK[target] > RANK[forced.level]) { forced = { level: target, until: now + hold }; return target; }
  if (RANK[target] === RANK[forced.level]) forced.until = Math.max(forced.until, now + hold);
  return null;
}

export function breakerLevel(now = Date.now()): Level {
  if (forced && forced.until > now) return forced.level;
  forced = null;
  return "normal";
}
export const resetBreaker = () => { events = []; forced = null; };

/** The effective level: the strictest of the environment kill switch, the stored mode, and the breaker. */
export function effectiveLevel(opts: { env?: Record<string, string | undefined>; stored?: Level | null; now?: number } = {}): Level {
  const env = opts.env ?? process.env;
  const raw = env.AGENT_MODE?.trim().toLowerCase();
  const fromEnv: Level | null = raw === "off" || raw === "lockdown" ? "lockdown" : raw === "defended" ? "defended" : null;
  return maxLevel(fromEnv, opts.stored ?? null, breakerLevel(opts.now));
}

/* ── request checks ─────────────────────────────────────────────────── */

/** True when the request comes from this site's own pages (Origin, else Referer, else Sec-Fetch-Site). */
export function sameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const sfs = req.headers.get("sec-fetch-site");
  if (sfs) return sfs === "same-origin";
  const src = req.headers.get("origin") ?? req.headers.get("referer");
  if (!src || !host) return false;
  try { return new URL(src).host === host; } catch { return false; }
}

export function browserish(req: Request): boolean {
  const ua = req.headers.get("user-agent") ?? "";
  return /mozilla\/5\.0/i.test(ua) && !!req.headers.get("accept-language");
}

export const LOCKDOWN_REPLY = "The MADHAT'r is taking a breather, kid. The floor is busy. Try me again in a bit.";
export const DEFLECT_REPLIES = [
  "Nice try, kid. I've heard that one at three different bars. Ask me about the markets instead.",
  "Cute. That's above my pay grade and below my attention. What do you actually want to know?",
  "I don't take orders from the peanut gallery. Ask me something about the floor.",
];
export const pickDeflect = (rand: () => number = Math.random) => DEFLECT_REPLIES[Math.floor(rand() * DEFLECT_REPLIES.length)];
