import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Every scheduled job must be in proxy.ts's BEARER_PATHS, or the guest gate 401s Vercel Cron before the
// route's own secret check runs. The job then never runs, and nothing reports it.
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

describe("cron routes pass the guest gate", () => {
  const block = read("../proxy.ts").match(/const BEARER_PATHS = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
  const bearer = new Set([...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  const crons: { path: string }[] = JSON.parse(read("../vercel.json")).crons ?? [];

  it("finds the lists it checks", () => {
    expect(bearer.size).toBeGreaterThan(5);
    expect(crons.length).toBeGreaterThan(5);
  });

  it("lists every vercel.json cron in BEARER_PATHS", () => {
    const missing = crons.map((c) => c.path.split("?")[0]).filter((p) => !bearer.has(p));
    expect(missing).toEqual([]);
  });
});
