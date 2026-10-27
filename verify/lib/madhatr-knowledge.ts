/**
 * The MADHAT'r's knowledge base — loader and the fixed behaviours it drives.
 *
 * Source of truth: `content/madhatr/knowledge.md` (edit that, not this file).
 * Each `## ` heading is a topic with `Keywords:`, quotable `Say:` lines and
 * background `Facts:`. Two headings are special:
 *
 *   ## Greetings        — a hello is copied back verbatim; every 5th greeting in
 *                         a chat gets the next "Brush-offs:" line instead.
 *   ## Pay-grade ladder — one rung per unknown in a chat: rung 1, rung 2, then
 *                         the rest in rotation.
 *
 * Everything here is pure and deterministic — the escalation counts are read
 * back from the chat history the client already sends, so there is no server
 * state to keep.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface KBSection {
  title: string;
  keywords: string[];
  say: string[];
  facts: string[];
}

export interface KnowledgeBase {
  raw: string;
  sections: KBSection[];
  ladder: string[];
  brushOffs: string[];
  greetingWords: string[];
}

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SPECIAL = new Set(["greetings", "pay-grade ladder", "house rules", "sources"]);

const FALLBACK_LADDER = [
  "That's above my pay grade.",
  "Like I said, Compadre, way above my pay grade.",
];

export function parseKnowledge(md: string): KnowledgeBase {
  const sections: KBSection[] = [];
  let ladder: string[] = [];
  let brushOffs: string[] = [];
  let greetingWords: string[] = [];

  for (const chunk of md.split(/^## /m).slice(1)) {
    const lines = chunk.split("\n");
    const title = lines[0].trim();
    const sec: KBSection = { title, keywords: [], say: [], facts: [] };
    const extra: Record<string, string[]> = { ladder: [], brush: [] };
    let mode: "say" | "facts" | "ladder" | "brush" | null = null;
    for (const rawLine of lines.slice(1)) {
      const line = rawLine.trim();
      if (!line || line === "---") continue;
      if (/^keywords:/i.test(line)) {
        sec.keywords = line.replace(/^keywords:/i, "").split(",").map((k) => normalize(k)).filter(Boolean);
        mode = null;
        continue;
      }
      if (/^say:$/i.test(line)) { mode = "say"; continue; }
      if (/^facts:$/i.test(line)) { mode = "facts"; continue; }
      if (/^ladder:$/i.test(line)) { mode = "ladder"; continue; }
      if (/^brush-offs:$/i.test(line)) { mode = "brush"; continue; }
      if (line.startsWith("- ") && mode) {
        const item = line.slice(2).trim();
        if (mode === "say") sec.say.push(item);
        else if (mode === "facts") sec.facts.push(item);
        else extra[mode].push(item);
        continue;
      }
      mode = null; // prose between blocks ends the current list
    }
    const key = title.toLowerCase();
    if (key === "pay-grade ladder") ladder = extra.ladder;
    if (key === "greetings") { brushOffs = extra.brush; greetingWords = sec.keywords; }
    sections.push(sec);
  }

  return {
    raw: md,
    sections,
    ladder: ladder.length >= 2 ? ladder : FALLBACK_LADDER,
    brushOffs: brushOffs.length ? brushOffs : ["Don't you have somewhere to be?!"],
    greetingWords: greetingWords.length ? greetingWords : ["hi", "hey", "hello"],
  };
}

let cached: KnowledgeBase | null = null;

/** Reads `content/madhatr/knowledge.md` once per process; never throws. */
export function loadKnowledge(): KnowledgeBase {
  if (cached) return cached;
  try {
    cached = parseKnowledge(readFileSync(path.join(process.cwd(), "content", "madhatr", "knowledge.md"), "utf8"));
  } catch {
    cached = parseKnowledge("");
  }
  return cached;
}

/* ── Text helpers ─────────────────────────────────────────────────────────── */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9$'\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(w: string): string {
  return w.replace(/'s$/, "").replace(/(?<=..)s$/, "");
}

/** Accepts the client's `{from, text}` messages or `{role, content}` turns. */
export function normalizeHistory(history: unknown): Turn[] {
  if (!Array.isArray(history)) return [];
  const out: Turn[] = [];
  for (const h of history) {
    if (!h || typeof h !== "object") continue;
    const o = h as Record<string, unknown>;
    const who = String(o.role ?? o.from ?? "");
    const content = typeof o.content === "string" ? o.content : typeof o.text === "string" ? o.text : "";
    if (!content) continue;
    out.push({ role: who === "user" ? "user" : "assistant", content });
  }
  return out;
}

/* ── Greetings ────────────────────────────────────────────────────────────── */

const GREETING_FILLER = new Set(["there", "all", "everyone", "y'all", "yall", "man", "bro", "buddy", "pal", "friend", "mate", "boss", "madhatr", "madhat'r", "mad", "hatter", "hater", "madhater", "the", "again", "sir", "kid", "compadre", "folks", "team"]);

export function isGreeting(text: string, kb: KnowledgeBase): boolean {
  const t = normalize(text).replace(/'/g, "");
  if (!t) return false;
  const phrases = kb.greetingWords.map((p) => p.replace(/'/g, "")).sort((a, b) => b.length - a.length);
  const hit = phrases.find((p) => t === p || t.startsWith(p + " "));
  if (!hit) return false;
  const allowed = new Set<string>(GREETING_FILLER);
  for (const p of phrases) for (const w of p.split(" ")) allowed.add(w);
  const rest = t.slice(hit.length).trim();
  return !rest || rest.split(" ").every((w) => allowed.has(w));
}

/** Copy the greeting back; every 5th greeting in the chat, the next brush-off. */
export function greetingReply(text: string, history: Turn[], kb: KnowledgeBase): string {
  const prior = history.filter((h) => h.role === "user" && isGreeting(h.content, kb)).length;
  const n = prior + 1;
  if (n % 5 === 0) return kb.brushOffs[(n / 5 - 1) % kb.brushOffs.length];
  return text.trim();
}

/* ── Pay-grade ladder ─────────────────────────────────────────────────────── */

export function payGradeReply(history: Turn[], kb: KnowledgeBase): string {
  const rungs = new Set(kb.ladder);
  const prior = history.filter((h) => h.role === "assistant" && rungs.has(h.content.trim())).length;
  const fixed = Math.min(2, kb.ladder.length);
  if (prior < fixed) return kb.ladder[prior];
  const rotating = kb.ladder.length - fixed;
  if (rotating <= 0) return kb.ladder[kb.ladder.length - 1];
  return kb.ladder[fixed + ((prior - fixed) % rotating)];
}

/* ── Retrieval (used when no model key is configured) ─────────────────────── */

/**
 * Best-matching topic's next quotable line, or null when nothing in the file
 * covers the question. Multi-word keywords count double. A repeat question on
 * the same topic gets that topic's next line rather than the same one again.
 */
export function retrieve(text: string, history: Turn[], kb: KnowledgeBase): { reply: string; topic: string } | null {
  const t = normalize(text);
  if (!t) return null;
  const tokens = new Set(t.split(" ").map(stem));
  let best: KBSection | null = null;
  let bestScore = 0;
  for (const sec of kb.sections) {
    if (SPECIAL.has(sec.title.toLowerCase()) || !sec.say.length) continue;
    let score = 0;
    for (const k of sec.keywords) {
      if (k.includes(" ")) { if ((" " + t + " ").includes(" " + k + " ")) score += 2; }
      else if (tokens.has(stem(k))) score += 1;
    }
    if (score > bestScore) { best = sec; bestScore = score; }
  }
  if (!best) return null;
  // Within the topic, the line that shares the most words with the question;
  // ties (and repeats) go to a line not said yet in this chat.
  const said = new Set(history.filter((h) => h.role === "assistant").map((h) => h.content.trim()));
  const q = contentWords(t);
  const lineWords = best.say.map((line) => new Set(normalize(line).replace(/\$/g, "").split(" ").map(stem)));
  // A word that appears in every line of the topic says little about which
  // line fits; weight each shared word by how rare it is within the topic.
  const scored = best.say.map((line, i) => {
    let overlap = 0;
    q.forEach((w) => {
      if (!lineWords[i].has(w)) return;
      const df = lineWords.filter((ws) => ws.has(w)).length;
      overlap += 1 / df;
    });
    return { line, i, overlap, used: said.has(line) };
  });
  const top = Math.max(...scored.map((x) => x.overlap));
  const pool = top > 0 ? scored.filter((x) => x.overlap === top) : scored;
  const pick = pool.find((x) => !x.used) ?? scored.find((x) => !x.used) ?? pool[0];
  return { reply: pick.line, topic: best.title };
}

const STOP = new Set(["what", "whats", "what's", "is", "are", "was", "the", "a", "an", "of", "about", "tell", "me", "who", "whos", "who's", "how", "does", "do", "did", "in", "on", "for", "to", "and", "or", "i", "you", "your", "it", "its", "this", "that", "still", "why", "can", "could", "would", "will", "there", "any", "some", "with", "my", "we", "our", "us"]);

function contentWords(normalized: string): Set<string> {
  return new Set(normalized.replace(/\$/g, "").split(" ").filter((w) => w && !STOP.has(w)).map(stem));
}

/**
 * Opinion, advice and verdict questions go straight up the ladder (house
 * rules): "what do you think of…", "should I buy…", "who's right…".
 */
export function wantsOpinionOrAdvice(text: string): boolean {
  const t = normalize(text);
  return /\b(what do you think|what's your (take|opinion|view)|your opinion|do you (like|hate|support|trust)|who('s| is) (right|lying|better|worse)|is (he|she|they) (good|bad|a liar|lying)|should i (buy|sell|ape|invest|short)|will (it|madx|bitcoin|btc|eth) (go up|pump|moon|dump)|price prediction|financial advice|is it a good investment)\b/.test(t);
}

/* ── Model prompt ─────────────────────────────────────────────────────────── */

export const PAY_GRADE_MARKER = "[[PAY_GRADE]]";

/** The knowledge base and its rules, appended to the persona for the model. */
export function knowledgePrompt(kb: KnowledgeBase): string {
  return [
    "KNOWLEDGE BASE — the only source for facts about MAD Gambit, its people, numbers and markets. Quote its Say: lines freely; use Facts: to reason. Follow its House rules exactly.",
    `If the question is not covered by the knowledge base or solid general knowledge, asks for financial/legal/tax advice, fundraising terms, token prices, personal details, or your opinion of a politician, reply with exactly ${PAY_GRADE_MARKER} and nothing else.`,
    "Never invent numbers, dates or quotes. Keep replies under 90 words, in character.",
    "",
    kb.raw,
  ].join("\n");
}
