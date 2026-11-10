/**
 * NVIDIA NIM tier for the satire engine (the one-liner headline maker).
 * ─────────────────────────────────────────────────────────────────────
 * Same voice, same rules, same JSON contract as the local-model tier (lib/local-satire.ts) — the prompts are
 * imported, not copied, so the two can never drift. Unlike the local tier, NIM is HOSTED, so it works on Vercel.
 *
 * `modelRoast` is the single entry point both routes call: NIM first (when NIM_API_KEY + NIM_MODEL are set), then
 * the local Ollama model (when reachable), else null so the caller falls through to Gemini and the deterministic
 * writer. Nothing the model returns is trusted on its own: callers still run satireMetrics / assertion-risk gating on
 * the output, the take is fitted to MAX_ROAST_CHARS, and a reply that looks like a leaked secret is dropped.
 *
 * The headline and article text are UNTRUSTED (they come from RSS feeds and scraped pages). They are passed as
 * data inside the user message, the system prompt says what to do with them, and the output is a closed JSON shape
 * that is validated — so an article that says "ignore your instructions" can at worst produce a bad joke, which the
 * brand-safety gate then holds for human review.
 */
import { parseWithRetry, type SafeParseResult } from "@/lib/safe-json";
import type { NewsCategory } from "@/lib/satire-headline";
import { isLocalRoast, localRoast, localSatireAvailable, localSatireConfig, roastPrompts, type LocalRoast } from "@/lib/local-satire";
import { nimChat, nimConfig } from "@/lib/nim-chat";
import { looksLikeLeak } from "@/lib/madhatr-guard";

export type RoastEngine = "nim" | "ollama";
export interface ModelRoast { result: SafeParseResult<LocalRoast>; engine: RoastEngine; model: string }

/** Ask NIM for a roast. Never throws; a failure is an `ok: false` result. */
export async function nimRoast(headline: string, category: NewsCategory, article = ""): Promise<SafeParseResult<LocalRoast>> {
  const cfg = nimConfig();
  if (!cfg) return { ok: false, error: "NIM_API_KEY / NIM_MODEL not configured", raw: "" };
  const { system, user } = roastPrompts(headline, category, article);

  return parseWithRetry<LocalRoast>(
    async (attempt) => {
      const text = await nimChat({
        system,
        input: user(attempt > 0),
        maxTokens: 220,
        temperature: attempt > 0 ? 0.7 : 0.95,
        // The answer is a strict JSON object: a thinking model burns the budget on the long rules prompt first.
        thinking: "off",
      });
      if (text === null) throw new Error("nim unavailable");
      if (looksLikeLeak(text)) throw new Error("nim reply rejected");
      return text;
    },
    isLocalRoast,
    2,
  );
}

/** NIM first, then the local model; null when neither is available. */
export async function modelRoast(headline: string, category: NewsCategory, article = ""): Promise<ModelRoast | null> {
  const nim = nimConfig();
  if (nim) {
    const result = await nimRoast(headline, category, article);
    if (result.ok) return { result, engine: "nim", model: nim.model };
    console.warn("satire: NIM unusable, trying the local model —", result.error);
  }
  const local = localSatireConfig();
  if (local.configured && (await localSatireAvailable())) {
    return { result: await localRoast(headline, category, article), engine: "ollama", model: local.model };
  }
  return null;
}
