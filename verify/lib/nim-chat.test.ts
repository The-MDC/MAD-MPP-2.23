import { describe, it, expect, vi } from "vitest";
import { cleanReply, nimChat, nimConfig, nimEnabled, NIM_DEFAULT_BASE_URL } from "@/lib/nim-chat";

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
