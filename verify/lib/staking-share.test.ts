import { describe, expect, it } from "vitest";
import {
  STAKE_TIERS, STAKING_BUDGET_SHARE, distribute, impliedRate, stakingBudget, weightedStake, type Staker,
} from "./staking-share";

/**
 * The invariant: total staking distributions in any period ≤ 8.88% of net protocol revenue for that period.
 * Never a fixed rate, never a floor, never paid from reserve. Tiers buy lock duration and governance, not a better rate.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
const randomStakers = (r: () => number, n: number): Staker[] =>
  Array.from({ length: n }, (_, i) => ({ id: `s${i}`, tier: (1 + Math.floor(r() * 4)) as 1 | 2 | 3 | 4, amount: r() * 1e6 }));

describe("staking tiers in 8s", () => {
  it("weights are 0.88, 1.88, 2.88, 3.88 and the budget is 8.88%", () => {
    expect(STAKE_TIERS.map((t) => t.weight)).toEqual([0.88, 1.88, 2.88, 3.88]);
    expect(STAKE_TIERS.map((t) => t.governance)).toEqual([1, 2, 3, 5]);
    expect(STAKING_BUDGET_SHARE).toBe(0.0888);
  });
});

describe("the budget is the ceiling", () => {
  it("never distributes more than 8.88% of net revenue, over 2,000 random periods", () => {
    const r = rng(8888);
    for (let i = 0; i < 2000; i++) {
      const net = (r() - 0.15) * 1e7; // includes losses
      const d = distribute(net, randomStakers(r, 1 + Math.floor(r() * 40)));
      expect(d.distributed).toBeLessThanOrEqual(stakingBudget(net) + 1e-9);
      expect(d.distributed).toBeLessThanOrEqual(Math.max(0, net) * 0.0888 + 1e-9);
      for (const p of Object.values(d.payouts)) expect(p).toBeGreaterThanOrEqual(0);
    }
  });

  it("a period with zero or negative net revenue distributes nothing", () => {
    const stakers: Staker[] = [{ id: "a", tier: 4, amount: 1e6 }];
    for (const net of [0, -1, -1e9, NaN]) expect(distribute(net, stakers).distributed).toBe(0);
  });

  it("with revenue and stake, the whole budget is paid out (no leak, no floor)", () => {
    const d = distribute(1_000_000, [{ id: "a", tier: 1, amount: 100 }, { id: "b", tier: 3, amount: 50 }]);
    expect(d.distributed).toBeCloseTo(88_800, 6);
  });

  it("no stakers: nothing is paid, and nothing is promised", () => {
    expect(distribute(1_000_000, []).distributed).toBe(0);
  });
});

describe("tiers buy lock and governance, not a better rate per weighted token", () => {
  it("reward per weighted token is identical across tiers", () => {
    const stakers: Staker[] = [1, 2, 3, 4].map((t) => ({ id: `t${t}`, tier: t as 1 | 2 | 3 | 4, amount: 1000 }));
    const d = distribute(500_000, stakers);
    const perWeighted = stakers.map((s) => d.payouts[s.id] / (STAKE_TIERS[s.tier - 1].weight * s.amount));
    for (const p of perWeighted) expect(p).toBeCloseTo(d.perWeightedToken, 9);
  });

  it("the rate falls as total weighted stake rises (it is a share of a fixed pool, not a rate)", () => {
    const few: Staker[] = [{ id: "a", tier: 2, amount: 1000 }];
    const many: Staker[] = [...few, { id: "b", tier: 2, amount: 9000 }];
    expect(impliedRate(1e6, many, 2).rate).toBeLessThan(impliedRate(1e6, few, 2).rate);
  });

  it("a rate is always returned with the stake base it was computed at", () => {
    const stakers: Staker[] = [{ id: "a", tier: 1, amount: 1000 }];
    const r = impliedRate(1e6, stakers, 1);
    expect(r.weightedStake).toBe(weightedStake(stakers));
    expect(r.rate).toBeCloseTo((88_800 / 880) * 0.88, 9);
  });

  it("realised payout / stake equals the published implied rate for the tier", () => {
    const stakers: Staker[] = [{ id: "a", tier: 3, amount: 2000 }, { id: "b", tier: 1, amount: 5000 }];
    const d = distribute(2e6, stakers);
    for (const s of stakers) {
      expect(d.payouts[s.id] / s.amount).toBeCloseTo(impliedRate(2e6, stakers, s.tier).rate, 9);
    }
  });
});

describe("bad input", () => {
  it("ignores negative, NaN and unknown-tier stakes instead of paying on them", () => {
    const d = distribute(1e6, [
      { id: "ok", tier: 1, amount: 100 },
      { id: "neg", tier: 2, amount: -50 },
      { id: "nan", tier: 3, amount: NaN },
      { id: "bad", tier: 9 as unknown as 1, amount: 100 },
    ]);
    expect(d.payouts.neg).toBe(0);
    expect(d.payouts.nan).toBe(0);
    expect(d.payouts.bad).toBe(0);
    expect(d.distributed).toBeCloseTo(88_800, 6);
  });
});
