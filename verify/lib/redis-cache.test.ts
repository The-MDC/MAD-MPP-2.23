import { afterEach, describe, expect, it, vi } from "vitest";
import { getCachedJson } from "@/lib/redis-cache";

afterEach(() => { delete process.env.KV_REST_API_URL; delete process.env.KV_REST_API_TOKEN; vi.unstubAllGlobals(); });

describe("Redis cache", () => {
  it("does not make network calls when the integration is not configured", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(getCachedJson("x")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
