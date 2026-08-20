import { describe, it, expect } from "vitest";
import {
  LEG_DAYS,
  LEGS_PER_TURNING,
  TURNING_DAYS,
  LEG_MS,
  currentLeg,
  globalLegIndex,
  isLegClosed,
  legWindowFor,
  legsToTurning,
  nextLegClose,
  vintageAt,
} from "@/lib/lunar-legs";
import {
  dominanceMultiplier,
  exitCountdown,
  isRedeemable,
  redemptionValue,
  requestExit,
} from "@/lib/position-exit";
import {
  CODEX_PARAM_VERSION,
  canRecommit,
  canonicalise,
  codexParams,
  commitParams,
  verifyCommitment,
} from "@/lib/param-commit";
import { backlashStep, retirementScore, trendLife } from "@/lib/trend-lifecycle";
import { SEED_SLATE, corporaOf, slotCountForVintage, slotFaceVector } from "@/lib/trend-slate";
import { FACE_FLOOR, FACE_CEILING, FACE_ORDER } from "@/lib/persona-codex";
import { assertOpaqueSubjectRef } from "@/lib/perp-store";

describe("lunar legs — the cadence every perp rolls on", () => {
  it("is two synodic months, and six legs are one lunar year", () => {
    expect(LEG_DAYS).toBeCloseTo(59.061177, 5);
    expect(LEGS_PER_TURNING).toBe(6);
    expect(TURNING_DAYS).toBeCloseTo(354.367066, 4);
    // The whole point of the cadence: a Turning is SHORTER than a Gregorian
    // year, so it walks ~11 days earlier annually. If this ever equals 365 the
    // lunar anchor has been quietly replaced with a calendar one.
    expect(365.2425 - TURNING_DAYS).toBeGreaterThan(10);
  });

  it("puts every timestamp inside exactly one leg on the shared grid", () => {
    const now = Date.UTC(2026, 7, 5, 12, 0, 0);
    const leg = currentLeg(now);
    expect(leg.openedAt).toBeLessThanOrEqual(now);
    expect(leg.closesAt).toBeGreaterThan(now);
    expect(leg.closesAt - leg.openedAt).toBe(LEG_MS);
    expect(leg.progress).toBeGreaterThanOrEqual(0);
    expect(leg.progress).toBeLessThanOrEqual(1);
  });

  it("never returns a zero-length or backwards next close", () => {
    // Includes the exact-boundary case, which is the one that would otherwise
    // produce a leg that closes the instant it opens.
    const boundary = legWindowFor(globalLegIndex(Date.UTC(2026, 0, 1))).openedAt;
    for (const t of [boundary, boundary + 1, boundary + LEG_MS - 1, Date.UTC(2027, 5, 30)]) {
      const close = nextLegClose(t);
      expect(close).toBeGreaterThan(t);
      expect(close - t).toBeLessThanOrEqual(LEG_MS);
    }
  });

  it("counts down to the Turning within 1..6 legs and flags the last one", () => {
    for (let i = 0; i < 24; i++) {
      const at = Date.UTC(2026, 0, 1) + i * LEG_MS;
      const left = legsToTurning(at);
      expect(left).toBeGreaterThanOrEqual(1);
      expect(left).toBeLessThanOrEqual(LEGS_PER_TURNING);
      expect(currentLeg(at).isTurningLeg).toBe(left === 1);
    }
  });

  it("numbers vintages by turning, so a vintage spans one lunar year", () => {
    // Anchored to a turning boundary — mid-turning arithmetic would only pass
    // for one in six start dates and would look flaky rather than wrong.
    const g = globalLegIndex(Date.UTC(2026, 0, 1));
    const start = legWindowFor(g - (g % LEGS_PER_TURNING)).openedAt;
    expect(vintageAt(start + (LEGS_PER_TURNING - 1) * LEG_MS)).toBe(vintageAt(start));
    expect(vintageAt(start + LEGS_PER_TURNING * LEG_MS)).toBe(vintageAt(start) + 1);
  });

  it("only reports a leg closed at or after its close", () => {
    const leg = currentLeg(Date.UTC(2026, 3, 1));
    expect(isLegClosed(leg.closesAt, leg.closesAt - 1)).toBe(false);
    expect(isLegClosed(leg.closesAt, leg.closesAt)).toBe(true);
  });
});

describe("exit valve — §5.1", () => {
  it("leaves small holders on the base cooldown", () => {
    expect(dominanceMultiplier(10, 10_000)).toBe(1);
    expect(dominanceMultiplier(500, 10_000)).toBe(1); // exactly at the 5% knee
  });

  it("scales the cooldown with dominance, capped at 3x", () => {
    const mid = dominanceMultiplier(4_000, 10_000);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(3);
    expect(dominanceMultiplier(10_000, 10_000)).toBeCloseTo(3, 10);
    // Monotone in share — a bigger position never waits less.
    let prev = 0;
    for (const c of [100, 1_000, 3_000, 6_000, 9_000, 10_000]) {
      const m = dominanceMultiplier(c, 10_000);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it("degrades safely when the market has no conviction on it", () => {
    expect(dominanceMultiplier(100, 0)).toBe(1);
    expect(dominanceMultiplier(0, 100)).toBe(1);
  });

  it("locks the price at request, not at redemption", () => {
    const t0 = Date.UTC(2026, 5, 1);
    const ticket = requestExit({ conviction: 1_000, marketConviction: 100_000, price: 0.62, nowMs: t0 });
    expect(ticket.lockedPrice).toBe(0.62);
    expect(ticket.status).toBe("cooling");
    expect(ticket.readyAt).toBeGreaterThan(t0);
    // The payout is a function of the locked price alone. If this ever depends
    // on later state, the cooldown becomes a free option written by the house.
    expect(redemptionValue(ticket, 1_000)).toBeCloseTo(620, 6);
  });

  it("refuses redemption before the cooldown matures", () => {
    const t0 = Date.UTC(2026, 5, 1);
    const ticket = requestExit({ conviction: 100, marketConviction: 100_000, price: 0.5, nowMs: t0 });
    expect(isRedeemable(ticket, ticket.readyAt - 1)).toBe(false);
    expect(isRedeemable(ticket, ticket.readyAt)).toBe(true);
    expect(exitCountdown(ticket, ticket.readyAt - 1)).toMatch(/redemption/);
    expect(exitCountdown(ticket, ticket.readyAt)).toBe("Redeemable now");
  });
});

describe("commit-and-freeze — §4.5", () => {
  const params = codexParams("market-nonce-1");

  it("produces a reproducible, order-stable canonical form", () => {
    expect(canonicalise(params)).toBe(canonicalise(codexParams("market-nonce-1")));
    expect(canonicalise(params)).toContain(`v=${CODEX_PARAM_VERSION}`);
    expect(canonicalise(params)).toContain(FACE_ORDER.join(","));
  });

  it("gives two markets on identical parameters distinct commitments", () => {
    // Without the nonce, revealing one market's parameters reveals every other
    // market's — and "frozen" would stop meaning anything per-market.
    const a = commitParams(codexParams("market-a"));
    const b = commitParams(codexParams("market-b"));
    expect(a.commit).not.toBe(b.commit);
    expect(a.commit).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("verifies a correct reveal and rejects a tampered one", () => {
    const { commit } = commitParams(params);
    expect(verifyCommitment(params, commit)).toBe(true);
    const tampered = { ...params, rho: params.rho.map((r) => r + 0.01) };
    expect(verifyCommitment(tampered, commit)).toBe(false);
    expect(verifyCommitment(params, "")).toBe(false);
  });

  it("refuses to recommit mid-leg and allows it at the boundary", () => {
    const closes = Date.UTC(2026, 6, 1);
    expect(canRecommit({ legClosesAtMs: closes, currentEpoch: 3, nowMs: closes - 1 }).allowed).toBe(false);
    const ok = canRecommit({ legClosesAtMs: closes, currentEpoch: 3, nowMs: closes });
    expect(ok.allowed).toBe(true);
    if (ok.allowed) expect(ok.nextEpoch).toBe(4);
  });
});

describe("trend lifecycle — adoption against burnout", () => {
  it("rises, peaks, then decays — nothing burns out before it is adopted", () => {
    const series = Array.from({ length: 30 }, (_, leg) => trendLife({ leg }).salience);
    const peak = series.indexOf(Math.max(...series));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(series.length - 1);
    expect(series[0]).toBeLessThan(series[peak]);
    expect(series[series.length - 1]).toBeLessThan(series[peak]);
    for (const s of series) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it("walks the phases forward without skipping back to emerging", () => {
    const phases = Array.from({ length: 30 }, (_, leg) => trendLife({ leg }).phase);
    expect(phases[0]).toBe("emerging");
    expect(phases[phases.length - 1]).toBe("residual");
    expect(phases.lastIndexOf("emerging")).toBeLessThan(phases.indexOf("residual"));
  });

  it("prices a stall harder than an equal-sized beat — the asymmetry is the point", () => {
    const prevLogVar = Math.log(0.04);
    const down = backlashStep({ prevLogVar, observed: 0.4, expected: 0.5, sigma: 0.2 });
    const up = backlashStep({ prevLogVar, observed: 0.6, expected: 0.5, sigma: 0.2 });
    expect(down.z).toBeCloseTo(-0.5, 10);
    expect(up.z).toBeCloseTo(0.5, 10);
    // γ < 0: the same magnitude of surprise costs more on the downside.
    expect(down.logVar).toBeGreaterThan(up.logVar);
    expect(down.isBacklash).toBe(true);
    expect(up.isBacklash).toBe(false);
  });

  it("keeps retirement pressure inside [0,1] and rising with decay", () => {
    const young = retirementScore(trendLife({ leg: 1 }), 0.1, 1);
    const old = retirementScore(trendLife({ leg: 20 }), 0.6, 20);
    expect(young).toBeGreaterThanOrEqual(0);
    expect(old).toBeLessThanOrEqual(1);
    expect(old).toBeGreaterThan(young);
  });
});

describe("ZEITGEIST seed slate", () => {
  it("ships three slots, each with a corpus and sources", () => {
    expect(SEED_SLATE.length).toBe(3);
    for (const slot of SEED_SLATE) {
      expect(slot.corpus.length).toBeGreaterThan(2);
      expect(slot.sources.length).toBeGreaterThan(0);
      expect(slot.question.length).toBeGreaterThan(0);
    }
    expect(corporaOf(SEED_SLATE).length).toBe(3);
  });

  it("reads every slot onto the capped simplex", () => {
    for (const slot of SEED_SLATE) {
      const v = slotFaceVector(slot);
      const total = FACE_ORDER.reduce((a, f) => a + v[f], 0);
      expect(total).toBeCloseTo(1, 10);
      for (const f of FACE_ORDER) {
        expect(v[f]).toBeGreaterThanOrEqual(FACE_FLOOR - 1e-12);
        expect(v[f]).toBeLessThanOrEqual(FACE_CEILING + 1e-12);
      }
    }
  });

  it("runs a third slot only when it earns its listing", () => {
    expect(slotCountForVintage(0.02)).toBe(2);
    expect(slotCountForVintage(0.4)).toBe(3);
    expect(slotCountForVintage(Number.NaN)).toBe(2);
  });
});

describe("subject refs stay opaque", () => {
  it("accepts a slug and rejects anything that looks like a person", () => {
    expect(() => assertOpaqueSubjectRef("subj_demo_legacy_bank")).not.toThrow();
    for (const bad of ["Jane Doe", "jane@x.com", "jd", "SUBJ_UPPER", "subj demo"]) {
      expect(() => assertOpaqueSubjectRef(bad)).toThrow();
    }
  });
});
