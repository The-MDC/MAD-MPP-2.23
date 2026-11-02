import { describe, it, expect, vi, afterEach } from "vitest";
import { nimRoast, modelRoast } from "@/lib/nim-satire";

const reply = (content: string) =>
  ({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) }) as Response;

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("NIM roast tier", () => {
  it("is not configured without a key and a model, and modelRoast returns null", async () => {
    vi.stubEnv("NIM_API_KEY", ""); vi.stubEnv("NIM_MODEL", ""); vi.stubEnv("OLLAMA_MODEL", "");
    expect((await nimRoast("A headline", "headlines")).ok).toBe(false);
    expect(await modelRoast("A headline", "headlines")).toBeNull();
  });

  it("returns the model's JSON roast through the shared validator", async () => {
    vi.stubEnv("NIM_API_KEY", "test-key"); vi.stubEnv("NIM_MODEL", "nvidia/test");
    const fetchMock = vi.fn().mockResolvedValue(reply('{"satire_take":"Committee forms committee to study committee","scandal_velocity":40,"z_liar_index":22}'));
    vi.stubGlobal("fetch", fetchMock);
    const out = await modelRoast("Senate delays vote again", "headlines", "article text");
    expect(out?.engine).toBe("nim");
    expect(out?.model).toBe("nvidia/test");
    expect(out?.result.ok && out.result.value.satire_take).toContain("committee");
    // the untrusted article is sent as data in the user message, never in the system prompt
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).not.toContain("article text");
    expect(body.messages[1].content).toContain("article text");
  });

  it("does not trust a reply that is not the JSON shape, or that looks like a secret", async () => {
    vi.stubEnv("NIM_API_KEY", "test-key"); vi.stubEnv("NIM_MODEL", "nvidia/test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply("just some prose, not json")));
    expect((await nimRoast("H", "headlines")).ok).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply('{"satire_take":"key nvapi-AbCdEf1234567890","scandal_velocity":1,"z_liar_index":1}')));
    expect((await nimRoast("H", "headlines")).ok).toBe(false);
  });

  it("falls through to null when NIM is down and no local model is configured", async () => {
    vi.stubEnv("NIM_API_KEY", "test-key"); vi.stubEnv("NIM_MODEL", "nvidia/test"); vi.stubEnv("OLLAMA_MODEL", "");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await modelRoast("H", "headlines")).toBeNull();
  });
});
