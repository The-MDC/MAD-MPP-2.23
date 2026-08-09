/**
 * MAD Gambit — tolerant JSON extraction for LLM output.
 * ------------------------------------------------------------------
 * Models wrap JSON in markdown fences, prepend "Here's the JSON:", append a
 * closing remark, or emit smart quotes. A bare `JSON.parse()` throws on every
 * one of those and 500s the caller. This module never throws: it returns a
 * discriminated result so routes can retry or fall back deterministically.
 *
 * Strategy, cheapest first:
 *   1. parse as-is
 *   2. strip markdown fences, parse again
 *   3. scan for the first *balanced* {...} or [...] (string/escape aware, so
 *      braces inside JSON string values don't end the scan early) and parse that
 *   4. repair the common cosmetic breakages (smart quotes, trailing commas)
 *
 * Pure + es5-safe. No dependencies.
 */

export type SafeParseResult<T> =
  | { ok: true; value: T; repaired: boolean }
  | { ok: false; error: string; raw: string };

/** Strip ```json ... ``` / ``` ... ``` fences anywhere in the text. */
function stripFences(s: string): string {
  const fenced = s.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : s.trim();
}

/**
 * First balanced JSON object/array in the text. Tracks string state and escapes
 * so a `{` or `}` inside a satire_take value can't terminate the scan.
 */
function firstBalanced(s: string): string | null {
  const start = s.search(/[{[]/);
  if (start === -1) return null;
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null; // unterminated
}

/** Cosmetic repairs only — never changes semantics of valid JSON. */
function repair(s: string): string {
  return s
    // smart quotes → straight (models love these in prose-heavy fields)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // trailing comma before a closer
    .replace(/,\s*([}\]])/g, "$1");
}

function attempt<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

/**
 * Parse JSON out of arbitrary model output. Never throws.
 * `repaired` reports whether we had to do more than a plain parse — useful for
 * telemetry on which prompts are drifting.
 */
export function safeParseJSON<T = unknown>(raw: string): SafeParseResult<T> {
  const input = typeof raw === "string" ? raw : String(raw ?? "");
  if (!input.trim()) return { ok: false, error: "empty response", raw: input };

  const direct = attempt<T>(input);
  if (direct !== undefined) return { ok: true, value: direct, repaired: false };

  const defenced = stripFences(input);
  const d = attempt<T>(defenced);
  if (d !== undefined) return { ok: true, value: d, repaired: true };

  const balanced = firstBalanced(defenced);
  if (balanced) {
    const b = attempt<T>(balanced);
    if (b !== undefined) return { ok: true, value: b, repaired: true };
    const r = attempt<T>(repair(balanced));
    if (r !== undefined) return { ok: true, value: r, repaired: true };
  }

  const r2 = attempt<T>(repair(defenced));
  if (r2 !== undefined) return { ok: true, value: r2, repaired: true };

  return {
    ok: false,
    error: "no parseable JSON object found",
    raw: input.slice(0, 400),
  };
}

/**
 * Run an async producer up to `attempts` times, returning the first output that
 * parses AND passes `validate`. Returns the last failure reason otherwise.
 * The producer receives the attempt index so callers can stiffen the prompt on
 * the retry.
 */
export async function parseWithRetry<T>(
  produce: (attemptIndex: number) => Promise<string>,
  validate: (value: unknown) => value is T,
  attempts = 2,
): Promise<SafeParseResult<T>> {
  let last: SafeParseResult<T> = { ok: false, error: "no attempts made", raw: "" };
  for (let i = 0; i < attempts; i++) {
    let text: string;
    try {
      text = await produce(i);
    } catch (e) {
      last = { ok: false, error: `producer threw: ${(e as Error).message}`, raw: "" };
      continue;
    }
    const parsed = safeParseJSON<unknown>(text);
    if (!parsed.ok) {
      last = { ok: false, error: parsed.error, raw: parsed.raw };
      continue;
    }
    if (!validate(parsed.value)) {
      last = { ok: false, error: "parsed JSON failed shape validation", raw: text.slice(0, 400) };
      continue;
    }
    return { ok: true, value: parsed.value, repaired: parsed.repaired };
  }
  return last;
}
