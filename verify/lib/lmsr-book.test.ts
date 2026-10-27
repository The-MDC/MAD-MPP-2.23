import { describe, it, expect } from "vitest";
import {
  bookPrices,
  emptyBook,
  isUsableBook,
  markOf,
  oddsFromPrice,
  quote,
  type BookState,
} from "./lmsr-book";
import {
  calculateDLLMSRCost,
  calculateVolumeScalingAlpha,
  PLATFORM,
} from "./gambit-game-math";

const B = PLATFORM.LMSR_DEFAULT_B; // 1200

const book = (over: Partial<BookState> = {}): BookState => ({
  outcomes: ["YES", "NO"],
  q: [0, 0],
  b: B,
  cumVolume: 0,
  ...over,
});

describe("bookPrices", () => {
  it("prices a fresh book at exactly even, whatever b is", () => {
    expect(bookPrices(emptyBook(["YES", "NO"], B))).toEqual([0.5, 0.5]);
    expect(bookPrices(emptyBook(["YES", "NO"], 17))).toEqual([0.5, 0.5]);
    const three = bookPrices(emptyBook(["A", "B", "C"], B));
    three.forEach((p) => expect(p).toBeCloseTo(1 / 3, 12));
  });

  it("always sums to 1 — a book that does not is arbitrage, not a market", () => {
    const sum = bookPrices(book({ q: [4200, -900] })).reduce((a, p) => a + p, 0);
    expect(sum).toBeCloseTo(1, 12);
  });
});

describe("quote", () => {
  it("returns shares that cost EXACTLY the net spend — this is the whole point", () => {
    // The inverse must round-trip through the forward cost function, or the
    // book charges a different amount than it quoted. swap-interface's old
    // `netIn / (price * b)` approximation does not satisfy this.
    const b0 = book({ q: [120, 340], cumVolume: 50_000 });
    const q = quote(b0, 0, 500);
    expect(q).not.toBeNull();
    if (!q) return;

    const costPaid =
      calculateDLLMSRCost(q.qAfter, b0.b, b0.cumVolume) -
      calculateDLLMSRCost(b0.q, b0.b, b0.cumVolume);

    expect(costPaid).toBeCloseTo(q.netIn, 8);
  });

  it("charges the canonical 1.88% and sends the rest to the book", () => {
    const q = quote(book(), 0, 1000);
    expect(q).not.toBeNull();
    if (!q) return;
    expect(q.fee).toBeCloseTo(18.8, 10);
    expect(q.netIn).toBeCloseTo(981.2, 10);
    expect(q.fee + q.netIn).toBeCloseTo(q.spend, 10);
  });

  it("moves the price it bought UP and the other side DOWN, still summing to 1", () => {
    const q = quote(book(), 0, 5000);
    expect(q).not.toBeNull();
    if (!q) return;
    expect(q.priceAfter).toBeGreaterThan(q.priceBefore);
    expect(q.pricesAfter[1]).toBeLessThan(0.5);
    expect(q.pricesAfter.reduce((a, p) => a + p, 0)).toBeCloseTo(1, 12);
  });

  it("holds alpha at the PRE-trade volume", () => {
    const b0 = book({ cumVolume: 250_000 });
    const q = quote(b0, 0, 400);
    expect(q?.alpha).toBeCloseTo(calculateVolumeScalingAlpha(250_000), 12);
  });

  it("is monotonic — more spend buys more shares and moves the price further", () => {
    const small = quote(book(), 0, 100);
    const large = quote(book(), 0, 10_000);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    if (!small || !large) return;
    expect(large.shares).toBeGreaterThan(small.shares);
    expect(large.impact).toBeGreaterThan(small.impact);
  });

  it("survives a share vector that would overflow an unshifted exp()", () => {
    // q/b past ~709 makes e^(q/b) Infinity. The shifted solve must still
    // return a finite, positive answer rather than NaN.
    const huge = book({ q: [B * 900, B * 900 - 1200] });
    const q = quote(huge, 0, 1000);
    expect(q).not.toBeNull();
    if (!q) return;
    expect(Number.isFinite(q.shares)).toBe(true);
    expect(q.shares).toBeGreaterThan(0);
  });

  it("refuses input it cannot price instead of throwing", () => {
    expect(quote(book(), 2, 100)).toBeNull();          // index out of range
    expect(quote(book(), -1, 100)).toBeNull();
    expect(quote(book(), 0.5, 100)).toBeNull();        // non-integer index
    expect(quote(book(), 0, 0)).toBeNull();            // zero spend
    expect(quote(book(), 0, -50)).toBeNull();          // negative spend
    expect(quote(book(), 0, Number.NaN)).toBeNull();
    expect(quote(book({ b: 0 }), 0, 100)).toBeNull();  // no liquidity
    expect(quote(book({ q: [0, 0, 0] }), 0, 100)).toBeNull(); // q/outcomes mismatch
  });

  it("does not let the creator rung change what the buyer pays", () => {
    // creatorShareBps only splits the fee downstream. If it altered `spend`
    // or `shares`, a CR8TR's market would quietly cost more than a user's.
    const plain = quote(book(), 0, 1000, 0);
    const cr8tr = quote(book(), 0, 1000, 6000);
    expect(plain?.fee).toBeCloseTo(cr8tr?.fee ?? -1, 12);
    expect(plain?.shares).toBeCloseTo(cr8tr?.shares ?? -1, 12);
  });
});

describe("markOf", () => {
  it("reports outcome 0, so a stored tape and a live book mean the same thing", () => {
    expect(markOf([0.62, 0.38])).toBeCloseTo(0.62, 12);
    expect(markOf([])).toBe(0);
  });
});

describe("oddsFromPrice", () => {
  it("turns an even book back into the 2.0 default the schema ships", () => {
    expect(oddsFromPrice(0.5)).toBeCloseTo(2, 12);
    expect(oddsFromPrice(0.25)).toBeCloseTo(4, 12);
  });

  it("returns 0 rather than Infinity for an impossible price", () => {
    expect(oddsFromPrice(0)).toBe(0);
    expect(oddsFromPrice(-1)).toBe(0);
    expect(oddsFromPrice(Number.NaN)).toBe(0);
  });
});

describe("isUsableBook", () => {
  it("rejects the shapes that would produce NaN prices", () => {
    expect(isUsableBook(book())).toBe(true);
    expect(isUsableBook(book({ q: [] }))).toBe(false);
    expect(isUsableBook(book({ b: -1 }))).toBe(false);
    expect(isUsableBook(book({ q: [Number.NaN, 0] }))).toBe(false);
    expect(isUsableBook(book({ outcomes: ["YES"] }))).toBe(false);
  });
});
