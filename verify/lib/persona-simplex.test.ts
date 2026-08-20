import { describe, it, expect } from "vitest";
import {
  projectCappedSimplex,
  entropy,
  divergence,
  impliedTau,
  crownedFace,
  toFaceRecord,
  fromFaceRecord,
  MAX_ENTROPY,
} from "@/lib/persona-simplex";
import {
  FACE_ORDER,
  FACE_FLOOR,
  FACE_CEILING,
  faceHalfLifeLegs,
  stakeableLabel,
  displayName,
  toFaceId,
} from "@/lib/persona-codex";

const inBand = (p: number[]) => p.every((x) => x >= FACE_FLOOR - 1e-9 && x <= FACE_CEILING + 1e-9);
const sum = (p: number[]) => p.reduce((a, b) => a + b, 0);

describe("projectCappedSimplex", () => {
  it("returns a distribution that sums to 1 and stays inside the band", () => {
    const p = projectCappedSimplex([0.9, 0.4, -0.2, 0.1, 3.0]);
    expect(sum(p)).toBeCloseTo(1, 12);
    expect(inBand(p)).toBe(true);
  });

  it("holds both invariants across randomised input", () => {
    let worstSum = 0;
    let allInBand = true;
    for (let i = 0; i < 2000; i++) {
      const v = Array.from({ length: 5 }, () => Math.random() * 7 - 3);
      const p = projectCappedSimplex(v);
      worstSum = Math.max(worstSum, Math.abs(sum(p) - 1));
      if (!inBand(p)) allInBand = false;
    }
    expect(worstSum).toBeLessThan(1e-9);
    expect(allInBand).toBe(true);
  });

  it("satisfies the water-filling (KKT) form: interior coords are v_i - nu", () => {
    // Any two interior coordinates must preserve their pairwise difference.
    const v = [1.2, 0.9, 0.5, 0.3, 0.1];
    const p = projectCappedSimplex(v);
    const interior = p
      .map((x, i) => ({ x, i }))
      .filter((o) => o.x > FACE_FLOOR + 1e-7 && o.x < FACE_CEILING - 1e-7);
    for (let a = 0; a < interior.length - 1; a++) {
      const lhs = interior[a].x - interior[a + 1].x;
      const rhs = v[interior[a].i] - v[interior[a + 1].i];
      expect(lhs).toBeCloseTo(rhs, 9);
    }
  });

  it("clamps a near-certain reading to the ceiling — the documented arbitrage", () => {
    const p = projectCappedSimplex([10, 0, 0, 0, 0]);
    expect(Math.max(...p)).toBeCloseTo(FACE_CEILING, 12);
    expect(sum(p)).toBeCloseTo(1, 12);
    // the residual lands above the floor, not dumped onto it
    expect(Math.min(...p)).toBeGreaterThan(FACE_FLOOR);
  });

  it("is idempotent — projecting an already-valid simplex is a no-op", () => {
    const once = projectCappedSimplex([2, 1, 0.5, 0.2, 0.1]);
    const twice = projectCappedSimplex(once);
    once.forEach((x, i) => expect(twice[i]).toBeCloseTo(x, 12));
  });

  it("maps a uniform input to the uniform distribution", () => {
    const p = projectCappedSimplex([1, 1, 1, 1, 1]);
    p.forEach((x) => expect(x).toBeCloseTo(0.2, 12));
  });

  it("throws when the band cannot contain the required total", () => {
    expect(() => projectCappedSimplex([1, 1, 1], 0.5, 0.6, 1)).toThrow(RangeError);
  });
});

describe("entropy", () => {
  it("is ln(5) for the uniform five-face distribution", () => {
    expect(entropy([0.2, 0.2, 0.2, 0.2, 0.2])).toBeCloseTo(MAX_ENTROPY, 12);
    expect(MAX_ENTROPY).toBeCloseTo(Math.log(5), 12);
  });

  it("is 0 for a point mass and never negative", () => {
    expect(entropy([1, 0, 0, 0, 0])).toBeCloseTo(0, 12);
    expect(entropy([0.88, 0.03, 0.03, 0.03, 0.03])).toBeGreaterThan(0);
  });
});

describe("divergence", () => {
  it("is positive when the transitory shell is noisier than the core", () => {
    const perm = projectCappedSimplex([10, 0, 0, 0, 0]); // coherent core
    const trans = projectCappedSimplex([1, 1, 1, 1, 1]); // confused shell
    const r = divergence(perm, trans);
    expect(r.divergence).toBeGreaterThan(0);
    expect(r.normalised).toBeGreaterThan(0);
    expect(r.normalised).toBeLessThanOrEqual(1);
  });

  it("is negative when the core is less settled than the shell", () => {
    const perm = projectCappedSimplex([1, 1, 1, 1, 1]);
    const trans = projectCappedSimplex([10, 0, 0, 0, 0]);
    expect(divergence(perm, trans).divergence).toBeLessThan(0);
  });

  it("is zero for identical layers", () => {
    const p = projectCappedSimplex([3, 1, 1, 1, 1]);
    expect(divergence(p, p).divergence).toBeCloseTo(0, 12);
  });

  it("stays within [-1, 1] normalised", () => {
    const a = projectCappedSimplex([50, -9, -9, -9, -9]);
    const b = projectCappedSimplex([1, 1, 1, 1, 1]);
    expect(Math.abs(divergence(a, b).normalised)).toBeLessThanOrEqual(1);
    expect(Math.abs(divergence(b, a).normalised)).toBeLessThanOrEqual(1);
  });
});

describe("impliedTau", () => {
  it("recovers a lower tau for a sharper observed distribution", () => {
    const scores = [3, 1, 0.5, 0.2, 0];
    const sharp = projectCappedSimplex([10, 0, 0, 0, 0]);
    const flat = projectCappedSimplex([1, 1, 1, 1, 1]);
    expect(impliedTau(sharp, scores)).toBeLessThan(impliedTau(flat, scores));
  });

  it("returns a finite positive temperature", () => {
    const t = impliedTau([0.4, 0.25, 0.2, 0.1, 0.05], [3, 2, 1, 0.5, 0]);
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThan(0);
  });
});

describe("face helpers", () => {
  it("crowns the heaviest face in the permanent layer", () => {
    expect(crownedFace([0.1, 0.1, 0.6, 0.1, 0.1])).toBe("megalomaniac");
    expect(crownedFace([0.7, 0.1, 0.1, 0.05, 0.05])).toBe("saint");
  });

  it("round-trips a face record", () => {
    const v = [0.3, 0.25, 0.2, 0.15, 0.1];
    const back = fromFaceRecord(toFaceRecord(v));
    v.forEach((x, i) => expect(back[i]).toBeCloseTo(x, 12));
  });

  it("orders half-lives so virtue is forgotten fastest and a sell-out never is", () => {
    const saint = faceHalfLifeLegs("saint");
    const prostitute = faceHalfLifeLegs("prostitute");
    expect(saint).toBeLessThan(prostitute);
    expect(saint).toBeCloseTo(Math.log(0.5) / Math.log(0.94), 6);
    expect(prostitute).toBeGreaterThan(100);
  });
});

describe("codex binding — the compliance mechanism", () => {
  it("never yields a price without its definition attached", () => {
    const label = stakeableLabel("prostitute", 0.68);
    expect(label.price).toBe("68%");
    expect(label.definition).toContain("Sell-Out archetype");
    expect(label.definition).toContain("Never a claim about anyone's sexual conduct");
  });

  it("omits the catchphrase from every stakeable label", () => {
    for (const face of FACE_ORDER) {
      const label = stakeableLabel(face, 0.5) as Record<string, unknown>;
      expect(label.catchphrase).toBeUndefined();
      expect(Object.keys(label).sort()).toEqual(["definition", "face", "name", "price"]);
    }
  });

  it("swaps only display names in broadcast mode, never the codex definition", () => {
    expect(displayName("megalomaniac", "codex")).toBe("THE MEGALOMANIAC");
    expect(displayName("megalomaniac", "broadcast")).toBe("TOO BIG TO FAIL");
    expect(displayName("white_rice", "broadcast")).toBe("THE THERMOSTAT");
    expect(displayName("prostitute", "broadcast")).toBe("THE SELLOUT");
    // faces with no alias keep the codex name in both modes
    expect(displayName("saint", "broadcast")).toBe("THE SAINT");
    expect(stakeableLabel("megalomaniac", 0.5, "broadcast").definition).toBe(
      stakeableLabel("megalomaniac", 0.5, "codex").definition,
    );
  });

  it("resolves a face from id, codex name or broadcast alias", () => {
    expect(toFaceId("saint")).toBe("saint");
    expect(toFaceId("THE MEGALOMANIAC")).toBe("megalomaniac");
    expect(toFaceId("too big to fail")).toBe("megalomaniac");
    expect(toFaceId("THE THERMOSTAT")).toBe("white_rice");
    expect(toFaceId("nonsense")).toBeNull();
  });
});
