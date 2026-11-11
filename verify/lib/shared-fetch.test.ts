import { beforeEach, describe, expect, it } from "vitest";
import { clearSharedFetch, fetchJsonShared } from "./shared-fetch";

/**
 * Three components read /api/v1/news/satirical on one page. They must cost one request, a failure must never be
 * remembered, and a cached answer must expire.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
function counting(body: unknown, ok = true) {
  const calls: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  const fetcher = async (url: string) => {
    calls.push(url);
    await gate;
    return { ok, json: async () => body };
  };
  return { fetcher, calls, release };
}

beforeEach(() => clearSharedFetch());

describe("fetchJsonShared", () => {
  it("three concurrent callers cost one request and all get the same answer", async () => {
    const c = counting({ success: true, n: 7 });
    const all = Promise.all([1, 2, 3].map(() => fetchJsonShared("/x", 30_000, c.fetcher)));
    c.release();
    const out = await all;
    expect(c.calls).toEqual(["/x"]);
    expect(out.map((o) => o.n)).toEqual([7, 7, 7]);
  });

  it("serves a successful answer from memory until the TTL passes, then asks again", async () => {
    let t = 1_000;
    const c = counting({ v: 1 });
    c.release();
    await fetchJsonShared("/y", 5_000, c.fetcher, () => t);
    await fetchJsonShared("/y", 5_000, c.fetcher, () => t + 4_999);
    expect(c.calls.length).toBe(1);
    await fetchJsonShared("/y", 5_000, c.fetcher, () => t + 5_000);
    expect(c.calls.length).toBe(2);
  });

  it("never remembers a non-ok answer, so a transient 503 does not stick", async () => {
    const bad = counting({ success: false }, false);
    bad.release();
    expect((await fetchJsonShared("/z", 30_000, bad.fetcher)).success).toBe(false);
    const good = counting({ success: true });
    good.release();
    expect((await fetchJsonShared("/z", 30_000, good.fetcher)).success).toBe(true);
    expect(good.calls.length).toBe(1);
  });

  it("never remembers a thrown error, and lets the next caller retry", async () => {
    const boom = async () => { throw new Error("network"); };
    await expect(fetchJsonShared("/e", 30_000, boom)).rejects.toThrow("network");
    const ok = counting({ ok: 1 });
    ok.release();
    expect((await fetchJsonShared("/e", 30_000, ok.fetcher)).ok).toBe(1);
  });

  it("different URLs do not share", async () => {
    const a = counting({ a: 1 }); a.release();
    const b = counting({ b: 2 }); b.release();
    expect((await fetchJsonShared("/a", 30_000, a.fetcher)).a).toBe(1);
    expect((await fetchJsonShared("/b", 30_000, b.fetcher)).b).toBe(2);
  });

  it("clearSharedFetch forgets a URL", async () => {
    const c = counting({ v: 1 }); c.release();
    await fetchJsonShared("/c", 30_000, c.fetcher);
    clearSharedFetch("/c");
    await fetchJsonShared("/c", 30_000, c.fetcher);
    expect(c.calls.length).toBe(2);
  });
});
