import { describe, expect, it } from "vitest";
import { accountSubjectGross, applyTrade, checkTrade, houseSubjectGross, type GateCaps, type Position } from "./exposure-gate";

/**
 * The gate's invariants, then a model test that throws random trades at it. After ANY accepted sequence: no account is
 * over the per-subject cap, the house is not over its cap, and no account holds both legs of one market.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const CAPS: GateCaps = { perAccountSubject: 100, houseSubject: 250 };
const P = (account: string, marketId: string, legId: string, direction: 1 | -1, notional: number, subject = "s1"): Position =>
  ({ account, subject, marketId, legId, direction, notional });

describe("per-subject cap, counted across every market naming the subject", () => {
  it("allows up to the cap and refuses the next unit", () => {
    expect(checkTrade([], P("a", "m1", "A", 1, 100), CAPS).ok).toBe(true);
    expect(checkTrade([P("a", "m1", "A", 1, 100)], P("a", "m1", "A", 1, 1), CAPS).ok).toBe(false);
  });

  it("counts a second market on the same subject against the same cap (the per-market cap that fails)", () => {
    const held = [P("a", "m1", "A", 1, 60)];
    expect(checkTrade(held, P("a", "m2", "A", 1, 50), CAPS)).toMatchObject({ ok: false });
    expect(checkTrade(held, P("a", "m2", "A", 1, 40), CAPS).ok).toBe(true);
  });

  it("a different subject has its own cap", () => {
    expect(checkTrade([P("a", "m1", "A", 1, 100)], P("a", "m9", "A", 1, 100, "s2"), CAPS).ok).toBe(true);
  });
});

describe("no hedged pairs", () => {
  it("holding the other leg of the same market is refused", () => {
    const r = checkTrade([P("a", "m1", "A", 1, 10)], P("a", "m1", "B", 1, 10), CAPS);
    expect(r).toMatchObject({ ok: false });
  });

  it("the opposite direction on a leg is refused when it would flip through zero, and allowed as a close", () => {
    const held = [P("a", "m1", "A", 1, 10)];
    expect(checkTrade(held, P("a", "m1", "A", -1, 15), CAPS).ok).toBe(false); // flips to -5
    expect(checkTrade(held, P("a", "m1", "A", -1, 10), CAPS).ok).toBe(true); // closes
    expect(checkTrade(held, P("a", "m1", "A", -1, 4), CAPS).ok).toBe(true); // reduces
  });

  it("after a full close the account may open the other leg", () => {
    const closed = [P("a", "m1", "A", 1, 10), P("a", "m1", "A", -1, 10)];
    expect(checkTrade(closed, P("a", "m1", "B", 1, 10), CAPS).ok).toBe(true);
  });

  it("another account may take the other leg (that is the market)", () => {
    expect(checkTrade([P("a", "m1", "A", 1, 10)], P("b", "m1", "B", 1, 10), CAPS).ok).toBe(true);
  });
});

describe("house cap", () => {
  it("many small accounts cannot together exceed it", () => {
    let pos: Position[] = [];
    let refused = 0;
    for (let i = 0; i < 10; i++) {
      const r = applyTrade(pos, P(`acct${i}`, "m1", "A", 1, 90), CAPS);
      pos = r.positions;
      if (!r.verdict.ok) refused++;
    }
    expect(houseSubjectGross(pos, "s1")).toBeLessThanOrEqual(250);
    expect(refused).toBeGreaterThan(0);
  });
});

describe("a trade that only reduces exposure is always allowed", () => {
  it("even when the account is somehow over the cap", () => {
    const over = [P("a", "m1", "A", 1, 500)];
    expect(checkTrade(over, P("a", "m1", "A", -1, 100), CAPS).ok).toBe(true);
  });
});

describe("purity", () => {
  it("never mutates its input, and a refused trade leaves the positions as they were", () => {
    const held = [P("a", "m1", "A", 1, 100)];
    const copy = JSON.stringify(held);
    const r = applyTrade(held, P("a", "m1", "A", 1, 1), CAPS);
    expect(r.verdict.ok).toBe(false);
    expect(r.positions).toHaveLength(1);
    expect(JSON.stringify(held)).toBe(copy);
  });
});

describe("model test: 4,000 random trades", () => {
  function rng(seed: number) {
    let s = seed >>> 0;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  }
  it("the invariants hold after every accepted trade", { timeout: 60_000 }, () => {
    const r = rng(2026);
    const accounts = ["a", "b", "c", "d", "e"];
    const subjects = ["s1", "s2", "s3"];
    let positions: Position[] = [];
    let accepted = 0;
    for (let i = 0; i < 4000; i++) {
      const subject = subjects[Math.floor(r() * subjects.length)];
      const market = `${subject}-m${Math.floor(r() * 2)}`; // two markets per subject
      const trade = P(accounts[Math.floor(r() * accounts.length)], market, r() < 0.5 ? "A" : "B", r() < 0.5 ? 1 : -1, 1 + Math.floor(r() * 60), subject);
      const out = applyTrade(positions, trade, CAPS);
      positions = out.positions;
      if (out.verdict.ok) accepted++;
      // Check what this step could have changed (O(n) per step); the full sweep runs once at the end.
      expect(accountSubjectGross(positions, trade.account, subject)).toBeLessThanOrEqual(CAPS.perAccountSubject + 1e-9);
      expect(houseSubjectGross(positions, subject)).toBeLessThanOrEqual(CAPS.houseSubject + 1e-9);
      const net = (acct: string, m: string, leg: string) => positions.filter((p) => p.account === acct && p.marketId === m && p.legId === leg).reduce((acc, p) => acc + p.direction * p.notional, 0);
      expect(Math.abs(net(trade.account, market, "A")) > 1e-9 && Math.abs(net(trade.account, market, "B")) > 1e-9).toBe(false);
    }
    for (const a of accounts) for (const s of subjects) expect(accountSubjectGross(positions, a, s)).toBeLessThanOrEqual(CAPS.perAccountSubject + 1e-9);
    for (const s of subjects) expect(houseSubjectGross(positions, s)).toBeLessThanOrEqual(CAPS.houseSubject + 1e-9);
    expect(accepted).toBeGreaterThan(100); // the test exercised real acceptances, not only refusals
    expect(accepted).toBeLessThan(4000); // and real refusals
  });
});
