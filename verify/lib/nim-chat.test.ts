import { beforeEach, describe, it, expect, vi } from "vitest";
import { cleanReply, nimChat, nimConfig, nimEnabled, resetNimBreaker, NIM_BREAKER_MS, NIM_DEFAULT_BASE_URL } from "@/lib/nim-chat";

beforeEach(() => resetNimBreaker());

const CFG = { baseUrl: "https://nim.example/v1", apiKey: "test-key", model: "nvidia/test-model" };
const ok = (content: unknown) => ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) }) as Response;

describe("nimConfig", () => {
  it("is off unless both the key and the model are set", () => {
    expect(nimConfig({})).toBeNull();
    expect(nimConfig({ NIM_API_KEY: "k" })).toBeNull();
    expect(nimConfig({ NIM_MODEL: "m" })).toBeNull();
    expect(nimEnabled({ NIM_API_KEY: "k", NIM_MODEL: "m" })).toBe(true);
  });
  it("defaults the host and trims a trailing slash", () => {
    expect(nimConfig({ NIM_API_KEY: "k", NIM_MODEL: "m" })?.baseUrl).toBe(NIM_DEFAULT_BASE_URL);
    expect(nimConfig({ NIM_API_KEY: "k", NIM_MODEL: "m", NIM_BASE_URL: "https://h/v1///" })?.baseUrl).toBe("https://h/v1");
  });
  it("reads an optional fallback model (never the same as the primary) and a clamped timeout", () => {
    const base = { NIM_API_KEY: "k", NIM_MODEL: "big" };
    expect(nimConfig(base)?.fallbackModel).toBeUndefined();
    expect(nimConfig({ ...base, NIM_FALLBACK_MODEL: " small " })?.fallbackModel).toBe("small");
    expect(nimConfig({ ...base, NIM_FALLBACK_MODEL: "big" })?.fallbackModel).toBeUndefined();
    expect(nimConfig(base)?.timeoutMs).toBeUndefined();
    expect(nimConfig({ ...base, NIM_TIMEOUT_MS: "20000" })?.timeoutMs).toBe(20_000);
    expect(nimConfig({ ...base, NIM_TIMEOUT_MS: "5" })?.timeoutMs).toBe(2_000);
    expect(nimConfig({ ...base, NIM_TIMEOUT_MS: "999999" })?.timeoutMs).toBe(60_000);
    expect(nimConfig({ ...base, NIM_TIMEOUT_MS: "soon" })?.timeoutMs).toBeUndefined();
  });
  it("turns thinking off only when NIM_THINKING is exactly off", () => {
    const base = { NIM_API_KEY: "k", NIM_MODEL: "m" };
    expect(nimConfig(base)?.thinkingOff).toBeUndefined();
    expect(nimConfig({ ...base, NIM_THINKING: "on" })?.thinkingOff).toBeUndefined();
    expect(nimConfig({ ...base, NIM_THINKING: " OFF " })?.thinkingOff).toBe(true);
    expect(nimConfig(base)?.thinkingHeadroom).toBeUndefined();
    expect(nimConfig({ ...base, NIM_THINKING_HEADROOM: "700" })?.thinkingHeadroom).toBe(700);
    expect(nimConfig({ ...base, NIM_THINKING_HEADROOM: "99999" })?.thinkingHeadroom).toBe(4_000);
    expect(nimConfig({ ...base, NIM_THINKING_HEADROOM: "-5" })?.thinkingHeadroom).toBeUndefined();
  });
});

describe("cleanReply", () => {
  it("drops reasoning blocks and whitespace", () => {
    expect(cleanReply("<think>plan the joke</think>  Hello there ")).toBe("Hello there");
    expect(cleanReply("<think>never closed")).toBe("");
    expect(cleanReply(42)).toBe("");
  });
});

describe("nimChat", () => {
  it("returns null without calling anything when not configured", async () => {
    const f = vi.fn();
    expect(await nimChat({ system: "s", input: "hi", config: null, fetchImpl: f as unknown as typeof fetch })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the key as a bearer token and the conversation in order", async () => {
    const f = vi.fn().mockResolvedValue(ok("Reply"));
    const out = await nimChat({
      system: "SYS", history: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }], input: "now",
      config: CFG, fetchImpl: f as unknown as typeof fetch,
    });
    expect(out).toBe("Reply");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://nim.example/v1/chat/completions");
    expect(init.headers.authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("nvidia/test-model");
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant", "user"]);
    expect(body.stream).toBe(false);
  });

  it("falls through (null) on an HTTP error, a thrown error, or an empty reply", async () => {
    const mk = (f: unknown) => nimChat({ system: "s", input: "x", config: CFG, fetchImpl: f as typeof fetch });
    expect(await mk(vi.fn().mockResolvedValue({ ok: false, status: 429 }))).toBeNull();
    expect(await mk(vi.fn().mockRejectedValue(new Error("timeout")))).toBeNull();
    expect(await mk(vi.fn().mockResolvedValue(ok("<think>only thinking</think>")))).toBeNull();
    expect(await mk(vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))).toBeNull();
  });
});

describe("nimChat primary + fallback", () => {
  const WITH_FALLBACK = { ...CFG, model: "nvidia/big", fallbackModel: "nvidia/small" };
  const modelOf = (f: ReturnType<typeof vi.fn>, i: number) => JSON.parse(f.mock.calls[i][1].body).model;
  const run = (f: unknown, now: () => number) =>
    nimChat({ system: "s", input: "x", config: WITH_FALLBACK, fetchImpl: f as typeof fetch, now });

  it("answers from the primary when it works, and never touches the fallback", async () => {
    const f = vi.fn().mockResolvedValue(ok("from big"));
    expect(await run(f, () => 0)).toBe("from big");
    expect(f).toHaveBeenCalledTimes(1);
    expect(modelOf(f, 0)).toBe("nvidia/big");
  });

  it("falls back in the same call when the primary times out, errors or answers nothing", async () => {
    for (const bad of [
      vi.fn().mockRejectedValueOnce(new Error("timeout")),
      vi.fn().mockResolvedValueOnce({ ok: false, status: 503 }),
      vi.fn().mockResolvedValueOnce(ok("<think>only thinking</think>")),
    ]) {
      resetNimBreaker();
      const f = bad.mockResolvedValue(ok("from small"));
      expect(await run(f, () => 0)).toBe("from small");
      expect(f).toHaveBeenCalledTimes(2);
      expect([modelOf(f, 0), modelOf(f, 1)]).toEqual(["nvidia/big", "nvidia/small"]);
    }
  });

  it("skips a failed primary for the skip window, then tries it again", async () => {
    let t = 1_000;
    const f = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(ok("answer"));
    await run(f, () => t); // primary fails, fallback answers
    expect(f).toHaveBeenCalledTimes(2);
    await run(f, () => (t += 10_000)); // inside the window: straight to the fallback
    expect(f).toHaveBeenCalledTimes(3);
    expect(modelOf(f, 2)).toBe("nvidia/small");
    await run(f, () => (t += NIM_BREAKER_MS)); // window over: primary again
    expect(modelOf(f, 3)).toBe("nvidia/big");
  });

  it("sends enable_thinking=false to the primary only, never to the fallback", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(ok("from small"));
    await nimChat({ system: "s", input: "x", config: { ...WITH_FALLBACK, thinkingOff: true }, fetchImpl: f as unknown as typeof fetch, now: () => 0 });
    expect(JSON.parse(f.mock.calls[0][1].body).chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(JSON.parse(f.mock.calls[1][1].body).chat_template_kwargs).toBeUndefined();
    const g = vi.fn().mockResolvedValue(ok("plain"));
    await nimChat({ system: "s", input: "x", config: WITH_FALLBACK, fetchImpl: g as unknown as typeof fetch, now: () => 0 });
    expect(JSON.parse(g.mock.calls[0][1].body).chat_template_kwargs).toBeUndefined();
  });

  it("lets one call turn thinking off (strict JSON answers) without changing the config", async () => {
    const f = vi.fn().mockResolvedValue(ok("{}"));
    await nimChat({ system: "s", input: "x", maxTokens: 220, thinking: "off", config: { ...WITH_FALLBACK, thinkingHeadroom: 700 }, fetchImpl: f as unknown as typeof fetch, now: () => 0 });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(body.max_tokens).toBe(220);
  });

  it("adds the thinking headroom to the primary's max_tokens only, and not when thinking is off", async () => {
    const tokens = (f: ReturnType<typeof vi.fn>, i: number) => JSON.parse(f.mock.calls[i][1].body).max_tokens;
    const f = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(ok("from small"));
    await nimChat({ system: "s", input: "x", maxTokens: 300, config: { ...WITH_FALLBACK, thinkingHeadroom: 700 }, fetchImpl: f as unknown as typeof fetch, now: () => 0 });
    expect([tokens(f, 0), tokens(f, 1)]).toEqual([1000, 300]);
    const g = vi.fn().mockResolvedValue(ok("quick"));
    await nimChat({ system: "s", input: "x", config: { ...WITH_FALLBACK, thinkingHeadroom: 700, thinkingOff: true }, fetchImpl: g as unknown as typeof fetch, now: () => 0 });
    expect(tokens(g, 0)).toBe(300);
  });

  it("returns null when both models fail, and with no fallback always retries the one model", async () => {
    expect(await run(vi.fn().mockRejectedValue(new Error("down")), () => 0)).toBeNull();
    const f = vi.fn().mockRejectedValue(new Error("down"));
    await nimChat({ system: "s", input: "x", config: CFG, fetchImpl: f as unknown as typeof fetch, now: () => 0 });
    await nimChat({ system: "s", input: "x", config: CFG, fetchImpl: f as unknown as typeof fetch, now: () => 1 });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
