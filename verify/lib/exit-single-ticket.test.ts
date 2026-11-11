import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { requestExit } from "./position-exit";

/**
 * Remediation item 3, checked against the code (2026-11-10): there is no ticket table to farm. Exit state is ONE
 * column on the position row, and the transition into `cooling` is a compare-and-set in SQL, so at most one live exit
 * exists per position and a second request changes nothing. There is no cancel path, so there is no
 * request/cancel/re-request loop. These tests pin that: if someone adds a ticket table or drops the predicate, they fail.
 *
 * `requestExit` itself is deliberately a pure function that always builds a ticket; the guard lives where the state lives.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const read = (p: string) => readFileSync(path.join(VERIFY, p), "utf8");

describe("one live exit per position", () => {
  const store = read("lib/perp-store.ts");
  const route = read("app/api/v1/faces/exit/route.ts");

  it("opening the valve only succeeds from 'active' (compare-and-set in SQL)", () => {
    const fn = store.slice(store.indexOf("export async function markPositionCooling"));
    expect(fn.slice(0, 900)).toMatch(/SET exit_status = 'cooling'[\s\S]*WHERE id = \$1 AND exit_status = 'active'/);
  });

  it("redemption only succeeds from 'cooling' and only once matured, in SQL", () => {
    const fn = store.slice(store.indexOf("export async function redeemPosition"));
    expect(fn.slice(0, 900)).toMatch(/WHERE id = \$1 AND exit_status = 'cooling' AND exit_ready_at <= now\(\)/);
  });

  it("the route refuses a second request while a ticket is live", () => {
    expect(route).toMatch(/position\.exitStatus !== "active"[\s\S]{0,200}status: 409/);
  });

  it("no code path moves a position back to 'active' (no cancel, so no request/cancel/re-request loop)", () => {
    expect(store).not.toMatch(/SET exit_status = 'active'/);
  });

  it("there is no separate ticket table anywhere in the migrations", () => {
    const sqlDir = path.join(VERIFY, "sql");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const files = (require("node:fs") as typeof import("node:fs")).readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));
    const all = files.map((f) => readFileSync(path.join(sqlDir, f), "utf8")).join("\n");
    expect(all).not.toMatch(/CREATE TABLE[^;]*exit_ticket/i);
  });

  it("the pure builder never mutates anything: two calls give two independent tickets", () => {
    const a = requestExit({ conviction: 10, marketConviction: 100, price: 1, nowMs: 0 });
    const b = requestExit({ conviction: 10, marketConviction: 100, price: 1, nowMs: 0 });
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
