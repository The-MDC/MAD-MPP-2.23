import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MADX } from "./contracts";
import { PLATFORM, calculateConviction as gambitConviction } from "./gambit-game-math";
import { MADX_BETA } from "./madx-web2";
import { calculateConviction as mppConviction } from "./mpp-math";

/**
 * CF2 — two supply numbers, deliberately different, each guarded.
 *
 * `PLATFORM.MADX_FIXED_SUPPLY` (888,888,888) is the TOTAL supply. `MADX_BETA.cap`
 * (224,573,096) is the number the beta ledger actually ENFORCES, mirroring the deployed
 * contract's mint cap. The founder answered the total on 2026-11-09 and said 270 or 280
 * million is purchasable in the sale — above the enforced cap, which is unresolved
 * (MASTER PART 0 §3). The founder chose "just document" for CF2, so this does not decide
 * which number is current; it makes sure neither can MOVE unnoticed. `gambit-game-math.test.ts`
 * locks every canon constant by value, but the enforced cap lived outside `PLATFORM` and was
 * asserted nowhere — a mint-cap change in `madx-web2.ts` would have passed every test.
 *
 * If you are here because this failed after raising the cap: pin the new number below, and
 * update the comments at all three sites (`gambit-game-math.ts`, `madx-web2.ts`, `contracts.ts`).
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
describe("the two $MADx supply numbers", () => {
  it("the total supply is 888,888,888 (written as a literal on purpose)", () => {
    expect(PLATFORM.MADX_FIXED_SUPPLY).toBe(888_888_888);
  });

  it("the beta ledger's enforced mint cap is 224,573,096", () => {
    expect(MADX_BETA.cap).toBe(224_573_096);
  });

  it("the contract record agrees with the ledger's cap — one number, mirrored", () => {
    expect(MADX.maxSupplyCap).toBe("224573096");
    expect(Number(MADX.maxSupplyCap)).toBe(MADX_BETA.cap);
  });

  it("the cap is a mint cap BELOW the total, not a rival total", () => {
    expect(MADX_BETA.cap).toBeLessThan(PLATFORM.MADX_FIXED_SUPPLY);
  });
});

describe("each site names the other number (the CF2 decision to just document, made checkable)", () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

  it("gambit-game-math.ts says the enforced cap is 224,573,096", () => {
    expect(read("./gambit-game-math.ts")).toContain("224,573,096");
  });

  it("madx-web2.ts says the total supply is 888,888,888", () => {
    expect(read("./madx-web2.ts")).toContain("888,888,888");
  });

  it("contracts.ts says the total supply is 888,888,888", () => {
    expect(read("./contracts.ts")).toContain("888,888,888");
  });
});

describe("two functions called calculateConviction", () => {
  it("are different functions with different arities and different maths", () => {
    expect(mppConviction).not.toBe(gambitConviction);
    expect(mppConviction.length).toBe(4);
    expect(gambitConviction.length).toBe(5); // the sixth parameter has a default, so .length stops at five
  });

  it("mpp-math: C_max · (1 − e^(−αt))", () => {
    // 100 stake × 2 multiplier = 200 capacity; at α·t = 1 the curve is 1 − e⁻¹ ≈ 0.63212.
    expect(mppConviction(100, 2, 0.5, 2)).toBeCloseTo(200 * (1 - Math.exp(-1)), 10);
    expect(mppConviction(1, 1, 5, 0)).toBe(0);
  });

  it("gambit-game-math: the Cobb-Douglas product, exponents and all", () => {
    // 2^1.35 · 2^0.75 · 2^1.45 · 2^1.15 = 2^4.7
    expect(gambitConviction(2, 2, 2, 2, 1)).toBeCloseTo(Math.pow(2, 4.7), 10);
    expect(gambitConviction(1, 1, 1, 1, 1)).toBe(1);
  });
});
