import { describe, expect, it } from "vitest";
import { accountPayoutFactor, calculateBookPrice, calculateMppPrice } from "./mpp-math";

/**
 * Remediation item 1: the public price must be a function of book state only. Both halves have to hold, or the fix
 * has only moved the hole: the price ignores who is asking, AND the account attributes still change that account's
 * own payoff.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
// A small deterministic generator, so a failure is reproducible.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

describe("book price vs account payoff", () => {
  it("the public price takes no account attribute at all (same state, same number, for any pair of accounts)", () => {
    expect(calculateBookPrice.length).toBe(6); // floor, conviction, slope, elasticity, epoch, maxEpochs — no multiplier
    const r = rng(2023);
    for (let i = 0; i < 500; i++) {
      const args = [1 + r() * 10, r() * 1e5, r() * 0.5, r() * 40, Math.floor(r() * 50), 50 + Math.floor(r() * 50)] as const;
      const a = calculateBookPrice(...args);
      const b = calculateBookPrice(...args);
      expect(a).toBe(b);
      expect(Number.isFinite(a)).toBe(true);
    }
  });

  it("account attributes DO change the account's own payoff, in the multiplier's direction", () => {
    expect(accountPayoutFactor(1)).toBe(1);
    expect(accountPayoutFactor(2)).toBeGreaterThan(accountPayoutFactor(1.5));
    expect(accountPayoutFactor(1.5)).toBeGreaterThan(accountPayoutFactor(1));
    const r = rng(7);
    for (let i = 0; i < 200; i++) {
      const lo = 1 + r();
      const hi = lo + 0.01 + r();
      expect(accountPayoutFactor(hi)).toBeGreaterThan(accountPayoutFactor(lo));
    }
  });

  it("the old per-account price is exactly the book price times the account's payoff factor (nothing else moved)", () => {
    const r = rng(99);
    for (let i = 0; i < 300; i++) {
      const floor = 1 + r() * 10, conv = r() * 1e5, slope = r() * 0.5, mult = 1 + r() * 2, el = r() * 40;
      const ep = Math.floor(r() * 50), max = 50 + Math.floor(r() * 50);
      const old = calculateMppPrice(floor, conv, slope, mult, el, ep, max);
      const split = calculateBookPrice(floor, conv, slope, el, ep, max) * accountPayoutFactor(mult);
      expect(old).toBeCloseTo(split, 9);
    }
  });

  it("the old price is what created the arbitrage: two multipliers, one book, two prices", () => {
    const hi = calculateMppPrice(5, 1000, 0.2, 2, 10, 5, 50);
    const lo = calculateMppPrice(5, 1000, 0.2, 1, 10, 5, 50);
    expect(hi).not.toBe(lo); // documents why the deprecated function must not be used to quote a market
    // The book price is pinned to a literal: floor 5, conviction 1000, slope 0.2, 10% elasticity at epoch 5 of 50.
    expect(calculateBookPrice(5, 1000, 0.2, 10, 5, 50)).toBeCloseTo(5 * (1 + 0.2 * Math.log1p(1000)) * 0.99, 9);
  });
});
