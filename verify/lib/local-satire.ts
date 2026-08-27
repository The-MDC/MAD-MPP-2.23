/**
 * MAD Gambit — local-model roast tier (Ollama).
 * ------------------------------------------------------------------
 * MAD Magazine × South Park, written by a model running on YOUR machine
 * rather than a hosted API. Sits between the Gemini tier and the deterministic
 * floor in `app/api/satire-engine/route.ts`.
 *
 * NO NEW DEPENDENCY, AND THAT IS DELIBERATE. `npm install` is 403 from the
 * agent container and every CI job runs `npm ci`, so a new package would mean
 * hand-editing `package-lock.json` — which this repo forbids. Ollama's HTTP
 * API is plain JSON over `fetch`, so a client is ~40 lines and adds nothing to
 * the lockfile. `@langchain/community` ships a ChatOllama, but reaching for it
 * would buy an import-path gamble we cannot verify locally for no benefit.
 *
 * THIS MODULE IS ROUTE-ONLY. `lib/satire-headline.ts` documents determinism as
 * a contract: it renders on the server and again on the client, and any
 * divergence is a React hydration error. A model call is non-deterministic by
 * definition, so it must never be imported into a component render path. It
 * lives behind a route handler, is fetched, and degrades to the deterministic
 * writer when absent.
 *
 * WHERE IT RUNS. Ollama listens on the machine that started it. A Vercel
 * serverless function cannot reach your desktop, so in a normal Vercel
 * deployment this tier is simply unreachable and the route degrades exactly as
 * it does today. It is genuinely useful for local development and for a
 * self-hosted deployment where the model sits beside the app. That is stated
 * here because nothing else in the repo said it.
 */
import { parseWithRetry, type SafeParseResult } from "@/lib/safe-json";
import type { NewsCategory } from "@/lib/satire-headline";

/** Where Ollama listens. Operator-set only — never taken from a request. */
const DEFAULT_BASE = "http://127.0.0.1:11434";
/** Roasts are short; a local model still needs more headroom than a hosted one. */
const TIMEOUT_MS = 20_000;
const PROBE_TIMEOUT_MS = 1_500;
/** The carousel and the perp book both render this inline. */
export const MAX_ROAST_CHARS = 100;

/** Abort after `ms`. `AbortSignal.timeout` would do this in one line, but its
 *  presence depends on the bundled DOM lib version, and this repo cannot run a
 *  full type-check locally — a controller is portable and certain. */
function abortAfter(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

export interface LocalRoast {
  satire_take: string;
  scandal_velocity: number;
  z_liar_index: number;
}

export interface LocalSatireConfig {
  baseUrl: string;
  model: string;
  configured: boolean;
}

/** Reads the environment once per call — cheap, and keeps tests hermetic. */
export function localSatireConfig(): LocalSatireConfig {
  const raw = (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE).trim().replace(/\/+$/, "");
  const model = (process.env.OLLAMA_MODEL ?? "").trim();
  let baseUrl = "";
  try {
    const u = new URL(raw);
    // Scheme allow-list. The value is operator-set, not user input, but an
    // unvalidated URL here would still be a request forgery primitive.
    if (u.protocol === "http:" || u.protocol === "https:") baseUrl = u.origin;
  } catch { /* leave empty — treated as unconfigured */ }
  return { baseUrl, model, configured: Boolean(baseUrl && model) };
}

export function isLocalRoast(v: unknown): v is LocalRoast {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.satire_take === "string" &&
    o.satire_take.trim().length > 0 &&
    Number.isFinite(Number(o.scandal_velocity)) &&
    Number.isFinite(Number(o.z_liar_index))
  );
}

/** Is a model actually listening? Cheap GET, short timeout, never throws. */
export async function localSatireAvailable(): Promise<boolean> {
  const cfg = localSatireConfig();
  if (!cfg.configured) return false;
  const guard = abortAfter(PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${cfg.baseUrl}/api/tags`, { signal: guard.signal });
    if (!res.ok) return false;
    const body = (await res.json()) as { models?: { name?: string }[] };
    const names = (body.models ?? []).map((m) => String(m.name ?? ""));
    // Tag match is prefix-based: "llama3.1" should satisfy "llama3.1:latest".
    return names.some((n) => n === cfg.model || n.split(":")[0] === cfg.model.split(":")[0]);
  } catch {
    return false;
  } finally {
    guard.done();
  }
}

/**
 * THE VOICE. Three constraints do the work, and each is load-bearing:
 *
 *  1. CHANGE EXACTLY ONE THING. Concepts that violate exactly one expectation
 *     are recalled and retransmitted best; zero violations is just news, two
 *     or more is noise. This is the whole craft rule of a good one-liner and
 *     it is the term `m_meme` in MADConv is trying to measure.
 *  2. THE JOKE LANDS ON THE SITUATION. Humour needs a violation that is
 *     simultaneously benign. Aiming at a situation keeps the violation benign;
 *     aiming at a person's character removes the benign half, and what is left
 *     is not a joke, it is a claim.
 *  3. NO CHECKABLE ASSERTIONS ABOUT REAL PEOPLE. Absurdity is protected in a
 *     way that a false statement of fact is not. This is also enforced after
 *     the fact by `assertionRiskOf`, because a prompt is a request and a gate
 *     is a control.
 */
function systemPrompt(): string {
  return [
    "You write one-line satirical headlines for a prediction market.",
    "Voice: MAD Magazine crossed with South Park. Absurd, deadpan, specific, mean about SITUATIONS and never about people.",
    "",
    "RULES, all mandatory:",
    "1. Change EXACTLY ONE thing about reality. One absurd twist, played completely straight. Two twists is noise.",
    "2. The joke lands on the situation, the institution, or the absurdity of the cycle. Never on a person's character, appearance, or private life.",
    "3. Never assert a checkable fact about a real person. No crimes, no health claims, no affairs, no accusations. Exaggerate the situation instead.",
    `4. One sentence. Under ${MAX_ROAST_CHARS} characters. No quotes, no emoji, no hashtags, no markdown.`,
    "5. Do not reuse the source headline's wording. Write a new sentence.",
    "",
    "Reply with raw JSON only, no code fences:",
    '{"satire_take": string, "scandal_velocity": number 1-100, "z_liar_index": number 1-100}',
    "scandal_velocity = how fast this story is burning. z_liar_index = how much of it smells invented.",
  ].join("\n");
}

function userPrompt(headline: string, category: NewsCategory, article: string, stiffen: boolean): string {
  const body = article.trim().slice(0, 1800);
  const parts = [
    `CATEGORY: ${category}`,
    `HEADLINE: ${headline}`,
    body ? `STORY (truncated):\n${body}` : "",
    "",
    "Write the one-liner.",
  ];
  if (stiffen) {
    parts.push(
      "",
      "Your last reply was not valid JSON. Reply with ONLY the JSON object, starting with { and ending with }.",
    );
  }
  return parts.filter(Boolean).join("\n");
}

/** Trim a model's line to the contract the UI renders against. */
export function fitRoast(line: string): string {
  const clean = (line ?? "").replace(/\s+/g, " ").replace(/^["'`]+|["'`]+$/g, "").trim();
  if (clean.length <= MAX_ROAST_CHARS) return clean;
  const cut = clean.slice(0, MAX_ROAST_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-\s]+$/, "") + "…";
}

/**
 * Ask the local model for a roast. Never throws — returns a SafeParseResult so
 * the caller degrades on `ok: false` exactly as it does for the hosted tier.
 */
export async function localRoast(
  headline: string,
  category: NewsCategory,
  article: string = "",
): Promise<SafeParseResult<LocalRoast>> {
  const cfg = localSatireConfig();
  if (!cfg.configured) {
    return { ok: false, error: "OLLAMA_BASE_URL / OLLAMA_MODEL not configured", raw: "" };
  }

  return parseWithRetry<LocalRoast>(
    async (attempt) => {
      const guard = abortAfter(TIMEOUT_MS);
      try {
      const res = await fetch(`${cfg.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: guard.signal,
        body: JSON.stringify({
          model: cfg.model,
          stream: false,
          // Ollama's own JSON mode. Belt to safeParseJSON's braces.
          format: "json",
          options: {
            // High enough to be funny, not so high it stops making sentences.
            temperature: attempt > 0 ? 0.7 : 0.95,
            top_p: 0.92,
            num_predict: 220,
          },
          messages: [
            { role: "system", content: systemPrompt() },
            { role: "user", content: userPrompt(headline, category, article, attempt > 0) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`ollama ${res.status}`);
      const body = (await res.json()) as { message?: { content?: string } };
      return String(body?.message?.content ?? "");
      } finally {
        guard.done();
      }
    },
    isLocalRoast,
    2,
  );
}
