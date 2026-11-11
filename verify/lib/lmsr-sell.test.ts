import { describe, expect, it } from "vitest";
import { calculateVolumeScalingAlpha } from "./gambit-game-math";
import { quote, type BookState } from "./lmsr-book";
import { bookAfterSell, sellQuote } from "./lmsr-sell";

/**
 * The sell path's invariants. The one that matters most: you can never make money by buying and immediately selling
 * back, because that would be a free option the house funds. Checked on thousands of random books, including ones where
 * the first trade raises α a lot (a thin, new book), which is exactly where a naive sell would pay out more than it took.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
const book = (q: number[], b = 1200, cumVolume = 0): BookState => ({ outcomes: q.map((_, i) => `o${i}`), q, b, cumVolume });

describe("a sale uses the same cost function as the entry", () => {
  it("selling what a buy just bought, at an unchanged α, returns exactly what reached the book (net of the fee)", () => {
    const b0 = book([100, 50], 1200, 5000);
    const buy = quote(b0, 0, 1000)!;
    // The book as the buy left it, but WITHOUT the volume bump, so α is unchanged: this isolates the cost function.
    const afterBuy = { ...b0, q: buy.qAfter };
    const sell = sellQuote(afterBuy, 0, buy.shares, { entryAlpha: buy.alpha })!;
    expect(sell.grossProceeds).toBeCloseTo(buy.netIn, 7);
    expect(sell.netProceeds).toBeLessThan(buy.netIn); // and the fee comes off the way out too
    for (let i = 0; i < 2; i++) expect(sell.qAfter[i]).toBeCloseTo(b0.q[i], 7); // the book is back where it started
  });

  it("is path independent: selling in two pieces equals selling at once (fixed α)", () => {
    const b0 = book([400, 300, 100], 800, 2000);
    const whole = sellQuote(b0, 0, 250, { entryAlpha: 1.2 })!;
    const first = sellQuote(b0, 0, 100, { entryAlpha: 1.2 })!;
    const second = sellQuote({ ...b0, q: first.qAfter }, 0, 150, { entryAlpha: 1.2 })!;
    expect(first.grossProceeds + second.grossProceeds).toBeCloseTo(whole.grossProceeds, 8);
    expect(second.priceAfter).toBeCloseTo(whole.priceAfter, 10);
  });

  it("prices sum to one before and after", () => {
    const s = sellQuote(book([300, 200, 100]), 1, 80)!;
    expect(s.pricesAfter.reduce((a, x) => a + x, 0)).toBeCloseTo(1, 12);
  });
});

describe("a seller bears the market's answer", () => {
  it("a larger sale gets a worse average price per share (the price moves against a large seller)", () => {
    const b0 = book([2000, 500], 1000, 1000);
    let prev = Infinity;
    for (const s of [10, 50, 200, 800, 1900]) {
      const q = sellQuote(b0, 0, s, { entryAlpha: 1.1 })!;
      const avg = q.grossProceeds / s;
      expect(avg).toBeLessThan(prev);
      prev = avg;
    }
  });

  it("selling lowers the sold outcome's price", () => {
    const q = sellQuote(book([500, 500]), 0, 100)!;
    expect(q.priceAfter).toBeLessThan(q.priceBefore);
  });

  it("proceeds are positive and rise with the number of shares sold", () => {
    const b0 = book([900, 100], 1000, 100);
    let prev = 0;
    for (const s of [1, 10, 100, 500, 900]) {
      const q = sellQuote(b0, 0, s, { entryAlpha: 1.05 })!;
      expect(q.grossProceeds).toBeGreaterThan(prev);
      prev = q.grossProceeds;
    }
  });
});

describe("no free option: buy then sell never profits", () => {
  it("over 4,000 random books and spends, including ones where the first trade raises α a lot", () => {
    const r = rng(1888);
    let tested = 0;
    let alphaJumped = 0;
    for (let i = 0; i < 4000; i++) {
      const n = 2 + Math.floor(r() * 3);
      const b = 100 + r() * 5000;
      const q = Array.from({ length: n }, () => r() * b * 3);
      const V = r() < 0.4 ? r() * 50 : r() * 1e6; // a lot of thin books
      const start: BookState = { outcomes: q.map((_, k) => `o${k}`), q, b, cumVolume: V };
      const spend = 1 + r() * (r() < 0.5 ? 200 : 5e4);
      const idx = Math.floor(r() * n);
      const buy = quote(start, idx, spend);
      if (!buy) continue;
      // the book as fill() leaves it: shares added AND turnover raised by the spend (so α rises)
      const afterBuy: BookState = { ...start, q: buy.qAfter, cumVolume: V + spend };
      if (calculateVolumeScalingAlpha(V + spend) > calculateVolumeScalingAlpha(V) * 1.05) alphaJumped++;
      const sell = sellQuote(afterBuy, idx, buy.shares, { entryAlpha: buy.alpha });
      expect(sell).not.toBeNull();
      // never more than the position cost the book, and (with both fees) strictly less than the money put in
      expect(sell!.grossProceeds).toBeLessThanOrEqual(buy.netIn * (1 + 1e-9));
      expect(sell!.netProceeds).toBeLessThan(spend);
      tested++;
    }
    expect(tested).toBeGreaterThan(3000);
    expect(alphaJumped).toBeGreaterThan(200); // the dangerous case was actually exercised
  });

  it("WITHOUT the entry-α cap the same round trip would profit (so the cap is doing real work)", () => {
    const start = book([0, 0], 1000, 0);
    const spend = 50_000;
    const buy = quote(start, 0, spend)!;
    const afterBuy: BookState = { ...start, q: buy.qAfter, cumVolume: spend };
    // Re-implement the uncapped sale: current α instead of min(entry, now).
    const alphaNow = calculateVolumeScalingAlpha(spend);
    expect(alphaNow).toBeGreaterThan(buy.alpha);
    const capped = sellQuote(afterBuy, 0, buy.shares, { entryAlpha: buy.alpha })!;
    const uncappedGross = (alphaNow / buy.alpha) * capped.grossProceeds;
    expect(uncappedGross).toBeGreaterThan(spend); // a naive sale pays out more than was ever paid in
    expect(capped.netProceeds).toBeLessThan(spend);
  });

  it("a position with no known entry α is sold at α = 1: never better for the seller", () => {
    const b0 = book([600, 400], 1000, 1e6);
    const known = sellQuote(b0, 0, 100, { entryAlpha: calculateVolumeScalingAlpha(1e6) })!;
    const unknown = sellQuote(b0, 0, 100)!;
    expect(unknown.alpha).toBe(calculateVolumeScalingAlpha(0));
    expect(unknown.grossProceeds).toBeLessThan(known.grossProceeds);
  });

  it("the α used never exceeds the book's current α", () => {
    const b0 = book([600, 400], 1000, 10);
    expect(sellQuote(b0, 0, 50, { entryAlpha: 9 })!.alpha).toBeLessThanOrEqual(calculateVolumeScalingAlpha(10));
  });
});

describe("refusals and numerics", () => {
  it("returns null for bad input and for selling more than the book holds", () => {
    const b0 = book([100, 100]);
    expect(sellQuote(b0, 0, 0)).toBeNull();
    expect(sellQuote(b0, 0, -5)).toBeNull();
    expect(sellQuote(b0, 0, NaN)).toBeNull();
    expect(sellQuote(b0, 2, 10)).toBeNull();
    expect(sellQuote(b0, 0, 100.0001)).toBeNull();
    expect(sellQuote({ ...b0, b: 0 }, 0, 10)).toBeNull();
  });

  it("does not overflow on a very lopsided book", () => {
    const q = sellQuote(book([2_000_000, 0], 1200, 1e6), 0, 1_000_000, { entryAlpha: 1.3 });
    expect(q).not.toBeNull();
    expect(Number.isFinite(q!.grossProceeds)).toBe(true);
  });

  it("bookAfterSell raises turnover by the gross proceeds and keeps the shares consistent", () => {
    const b0 = book([300, 200], 1000, 100);
    const q = sellQuote(b0, 0, 50, { entryAlpha: 1.1 })!;
    const after = bookAfterSell(b0, q);
    expect(after.cumVolume).toBeCloseTo(100 + q.grossProceeds, 9);
    expect(after.q[0]).toBeCloseTo(250, 9);
    expect(b0.q[0]).toBe(300); // the input book is untouched
  });
});
