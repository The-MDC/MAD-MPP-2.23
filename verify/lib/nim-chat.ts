/**
 * NVIDIA NIM chat adapter (OpenAI-compatible /chat/completions).
 * ──────────────────────────────────────────────────────────────
 * Server-side only. Off unless BOTH NIM_API_KEY and NIM_MODEL are set, so nothing changes until they are.
 *
 *   NIM_API_KEY   the key for your NIM host (never sent to the browser, never logged)
 *   NIM_MODEL     the model id on that host, e.g. "nvidia/<model>"  — no default on purpose: the right one is a
 *                 speed/quality call for chat (a 120B vision model is heavy for a one-line concierge reply)
 *   NIM_BASE_URL  optional; defaults to NVIDIA's hosted endpoint. Set it to your own NIM host's /v1 URL.
 *
 * `nimChat` never throws: any failure (no key, timeout, 4xx/5xx, empty or unusable reply) returns null so the caller
 * falls through to the next provider and finally to the knowledge file. A visitor should never see a NIM outage.
 */
export const NIM_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const TIMEOUT_MS = 8_000;

export interface NimTurn { role: "user" | "assistant"; content: string }

export interface NimConfig { baseUrl: string; apiKey: string; model: string }

export function nimConfig(env: Record<string, string | undefined> = process.env): NimConfig | null {
  const apiKey = env.NIM_API_KEY?.trim();
  const model = env.NIM_MODEL?.trim();
  if (!apiKey || !model) return null;
  const baseUrl = (env.NIM_BASE_URL?.trim() || NIM_DEFAULT_BASE_URL).replace(/\/+$/, "");
  return { baseUrl, apiKey, model };
}

export const nimEnabled = (env?: Record<string, string | undefined>): boolean => nimConfig(env) !== null;

/** Reasoning models can wrap their thinking in <think>…</think>; a visitor should only see the answer. */
export function cleanReply(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^\s*<think>[\s\S]*$/i, "").trim();
}

export async function nimChat(opts: {
  system: string;
  history?: readonly NimTurn[];
  input: string;
  maxTokens?: number;
  temperature?: number;
  config?: NimConfig | null;
  fetchImpl?: typeof fetch;
}): Promise<string | null> {
  const cfg = opts.config === undefined ? nimConfig() : opts.config;
  if (!cfg) return null;
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: opts.system },
          ...(opts.history ?? []).map((t) => ({ role: t.role, content: t.content })),
          { role: "user", content: opts.input },
        ],
        max_tokens: opts.maxTokens ?? 300,
        temperature: opts.temperature ?? 0.85,
        stream: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
    const reply = cleanReply(data.choices?.[0]?.message?.content);
    return reply || null;
  } catch {
    return null;
  }
}
