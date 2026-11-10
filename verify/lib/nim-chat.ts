/**
 * NVIDIA NIM chat adapter (OpenAI-compatible /chat/completions).
 * ──────────────────────────────────────────────────────────────
 * Server-side only. Off unless BOTH NIM_API_KEY and NIM_MODEL are set, so nothing changes until they are.
 *
 *   NIM_API_KEY   the key for your NIM host (never sent to the browser, never logged)
 *   NIM_MODEL     the model id on that host, e.g. "nvidia/<model>"  — no default on purpose: the right one is a
 *                 speed/quality call for chat (a 120B vision model is heavy for a one-line concierge reply)
 *   NIM_BASE_URL  optional; defaults to NVIDIA's hosted endpoint. Set it to your own NIM host's /v1 URL.
 *   NIM_FALLBACK_MODEL  optional; a second model on the same host and key, tried when NIM_MODEL fails, times out or
 *                 answers nothing. This is how a big, slow or not-yet-warm model (e.g. a 31B vision-language one) can
 *                 be the primary without a visitor ever waiting on it: after one failure it is skipped for two minutes
 *                 (per server instance) and the fallback answers straight away, then it is tried again.
 *   NIM_TIMEOUT_MS  optional; how long the primary model may take, 2000–60000, default 8000. The fallback always
 *                 gets the 8000 default.
 *   NIM_THINKING  optional; "off" asks the PRIMARY model not to think before answering (chat_template_kwargs
 *                 enable_thinking=false). Reasoning models such as Nemotron 3 Nano Omni then answer in about a second
 *                 instead of four. Never sent to the fallback, so a model that rejects the field cannot break it.
 *   NIM_THINKING_HEADROOM  optional; extra tokens (0–4000) added to the PRIMARY model's max_tokens when it thinks.
 *                 A reasoning model's thinking counts against max_tokens, so on a long prompt a 300-token budget can
 *                 be spent before the answer starts and the reply comes back empty. Ignored when NIM_THINKING=off.
 *
 * `nimChat` never throws: any failure (no key, timeout, 4xx/5xx, empty or unusable reply) returns null so the caller
 * falls through to the next provider and finally to the knowledge file. A visitor should never see a NIM outage.
 */
export const NIM_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const TIMEOUT_MS = 8_000;
/** How long a failed primary model is skipped when a fallback exists. */
export const NIM_BREAKER_MS = 120_000;

export interface NimTurn { role: "user" | "assistant"; content: string }

export interface NimConfig { baseUrl: string; apiKey: string; model: string; fallbackModel?: string; timeoutMs?: number; thinkingOff?: boolean; thinkingHeadroom?: number }

export function nimConfig(env: Record<string, string | undefined> = process.env): NimConfig | null {
  const apiKey = env.NIM_API_KEY?.trim();
  const model = env.NIM_MODEL?.trim();
  if (!apiKey || !model) return null;
  const baseUrl = (env.NIM_BASE_URL?.trim() || NIM_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const fallback = env.NIM_FALLBACK_MODEL?.trim();
  const asked = Number(env.NIM_TIMEOUT_MS);
  const cfg: NimConfig = { baseUrl, apiKey, model };
  if (fallback && fallback !== model) cfg.fallbackModel = fallback;
  if (Number.isFinite(asked) && asked > 0) cfg.timeoutMs = Math.max(2_000, Math.min(60_000, Math.round(asked)));
  if (env.NIM_THINKING?.trim().toLowerCase() === "off") cfg.thinkingOff = true;
  const room = Number(env.NIM_THINKING_HEADROOM);
  if (Number.isFinite(room) && room > 0) cfg.thinkingHeadroom = Math.min(4_000, Math.round(room));
  return cfg;
}

/** `${baseUrl}|${model}` → when the primary may be tried again. Module scope: one entry per warm server instance. */
const skipUntil = new Map<string, number>();
export function resetNimBreaker(): void { skipUntil.clear(); }

export const nimEnabled = (env?: Record<string, string | undefined>): boolean => nimConfig(env) !== null;

/** Reasoning models can wrap their thinking in <think>…</think>; a visitor should only see the answer. */
export function cleanReply(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*<think>[\s\S]*$/i, "").trim();
}

interface NimCall {
  system: string;
  history?: readonly NimTurn[];
  input: string;
  maxTokens?: number;
  temperature?: number;
  config?: NimConfig | null;
  fetchImpl?: typeof fetch;
  /** Clock for the skip window; tests inject one. */
  now?: () => number;
  /**
   * "off" asks the primary model not to think for THIS call, whatever NIM_THINKING says. For answers that must be a
   * strict machine-readable shape (the satire JSON): a reasoning model can spend the whole token budget thinking
   * about a long rules prompt and return nothing, which a one-line chat reply does not suffer from.
   */
  thinking?: "off";
}

/** One model, one attempt. Null on any failure. */
async function askModel(cfg: NimConfig, model: string, timeoutMs: number, opts: NimCall, primary = false): Promise<string | null> {
  const noThink = primary && (!!cfg.thinkingOff || opts.thinking === "off");
  const headroom = primary && !noThink ? (cfg.thinkingHeadroom ?? 0) : 0;
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          ...(opts.history ?? []).map((t) => ({ role: t.role, content: t.content })),
          { role: "user", content: opts.input },
        ],
        max_tokens: (opts.maxTokens ?? 300) + headroom,
        temperature: opts.temperature ?? 0.85,
        stream: false,
        ...(noThink ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const reply = cleanReply(data.choices?.[0]?.message?.content);
    return reply || null;
  } catch {
    return null;
  }
}

export async function nimChat(opts: NimCall): Promise<string | null> {
  const cfg = opts.config === undefined ? nimConfig() : opts.config;
  if (!cfg) return null;
  const now = opts.now ?? Date.now;
  const fallback = cfg.fallbackModel && cfg.fallbackModel !== cfg.model ? cfg.fallbackModel : null;

  // No fallback: there is nothing to skip to, so the one model is always tried.
  if (!fallback) return askModel(cfg, cfg.model, cfg.timeoutMs ?? TIMEOUT_MS, opts, true);

  const key = `${cfg.baseUrl}|${cfg.model}`;
  if ((skipUntil.get(key) ?? 0) <= now()) {
    const reply = await askModel(cfg, cfg.model, cfg.timeoutMs ?? TIMEOUT_MS, opts, true);
    if (reply) { skipUntil.delete(key); return reply; }
    skipUntil.set(key, now() + NIM_BREAKER_MS);
  }
  return askModel(cfg, fallback, TIMEOUT_MS, opts);
}
