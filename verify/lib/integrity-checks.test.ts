import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { PLATFORM, STAKING_TIERS, TOURNAMENT_PRIZES_BPS } from "./gambit-game-math";
import { runIntegrityChecks } from "./integrity-checks";

/**
 * CF5 — the Platform Integrity Checker runs real checks.
 *
 * It used to play fifteen hard-coded log lines and end on "ALL SYSTEMS GREEN. Platform integrity:
 * 100%" regardless of what the engine did, including a line claiming the $MADx supply was
 * "immutable". These tests pin the three things that make it a checker rather than a prop:
 * every check passes on the real engine; each one FAILS when the thing it checks is broken; and the
 * component cannot go back to printing results it did not compute.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const LOGIC_LAB = readFileSync(new URL("../components/logic-lab.tsx", import.meta.url), "utf8");

// The engine's constants are plain objects; each test that bends one restores it.
const platform = PLATFORM as unknown as Record<string, number>;
const tiers = STAKING_TIERS as unknown as Array<{ shieldRecoveryPct: number }>;
const prizes = TOURNAMENT_PRIZES_BPS as Record<number, number>;
const restore: Array<() => void> = [];
afterEach(() => {
  while (restore.length) (restore.pop() as () => void)();
});

const byId = (id: string) => {
  const c = runIntegrityChecks().find((x) => x.id === id);
  if (!c) throw new Error(`no check named ${id}`);
  return c;
};

describe("runIntegrityChecks on the real engine", () => {
  const all = runIntegrityChecks();

  it("passes every check", () => {
    const failed = all.filter((c) => !c.ok);
    expect(failed, JSON.stringify(failed)).toEqual([]);
  });

  it("has a unique id, a label and a specific detail for each — a detail is what makes a failure actionable", () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    for (const c of all) {
      expect(c.label.length).toBeGreaterThan(5);
      expect(c.detail.length).toBeGreaterThan(3);
    }
  });

  it("checks enough to mean something (a gate that checks two things is a prop)", () => {
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it("is deterministic (pure): two runs agree exactly", () => {
    expect(runIntegrityChecks()).toEqual(all);
  });
});

describe("each check FAILS when what it checks is broken", () => {
  function bend<T extends Record<string, number>>(obj: T, key: keyof T & string, value: number) {
    const before = obj[key];
    (obj as Record<string, number>)[key] = value;
    restore.push(() => {
      (obj as Record<string, number>)[key] = before;
    });
  }

  it("fee-rate: a changed platform fee", () => {
    bend(platform, "FEE_BPS", 200);
    expect(byId("fee-rate").ok).toBe(false);
    expect(byId("fee-rate").detail).toContain("200");
  });

  it("fee-waterfall: a fee that stops being a number breaks the conservation check", () => {
    bend(platform, "FEE_BPS", Number.NaN);
    expect(byId("fee-waterfall").ok).toBe(false);
  });

  it("pack: a changed pack price", () => {
    bend(platform, "CARD_PACK_COST", 888);
    expect(byId("pack").ok).toBe(false);
  });

  it("supply-total: a changed total supply", () => {
    bend(platform, "MADX_FIXED_SUPPLY", 224_573_096);
    expect(byId("supply-total").ok).toBe(false);
  });

  it("staking-ladder: a Shield recovery above 40%", () => {
    const top = tiers[tiers.length - 1];
    const before = top.shieldRecoveryPct;
    top.shieldRecoveryPct = 0.6;
    restore.push(() => {
      top.shieldRecoveryPct = before;
    });
    expect(byId("staking-ladder").ok).toBe(false);
  });

  it("tournament-pool: rank shares that exceed the pool", () => {
    const before = prizes[1];
    prizes[1] = 9000;
    restore.push(() => {
      prizes[1] = before;
    });
    expect(byId("tournament-pool").ok).toBe(false);
    expect(byId("tournament-pool").detail).toMatch(/\d+ bps of 10,000/);
  });

  it("shield-premium-band: a premium bound outside 2–4%", () => {
    bend(platform, "SHIELD_PREMIUM_MAX", 0.01);
    expect(byId("shield-premium-band").ok).toBe(false);
  });

  it("a check that THROWS is a failed check, not a crashed page", () => {
    bend(platform, "SHIELD_SAFETY_MARGIN", Number.NaN);
    const r = byId("shield-premium-band");
    expect(r.ok).toBe(false);
    expect(typeof r.detail).toBe("string");
  });

  it("everything passes again once the engine is restored", () => {
    expect(runIntegrityChecks().every((c) => c.ok)).toBe(true);
  });
});

describe("the component cannot go back to printing results it did not compute", () => {
  it("runs the real checks", () => {
    expect(LOGIC_LAB).toContain("runIntegrityChecks");
  });

  it("holds none of the old fabricated lines", () => {
    expect(LOGIC_LAB).not.toContain("CHECK_LOGS");
    expect(LOGIC_LAB).not.toMatch(/immutable/i);
    expect(LOGIC_LAB).not.toMatch(/ALL SYSTEMS GREEN/i);
    expect(LOGIC_LAB).not.toMatch(/Platform integrity: 100%/);
    expect(LOGIC_LAB).not.toMatch(/simulated audit/i);
  });

  it("derives the 'all clear' state from the results, not from the timer finishing", () => {
    expect(LOGIC_LAB).toMatch(/allClear/);
    expect(LOGIC_LAB).toMatch(/checks FAILED/);
  });
});
