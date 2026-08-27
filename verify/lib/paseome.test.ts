import { describe, it, expect } from "vitest";
import {
  FRONTIER_MIN, FRONTIER_MAX, FrontierError,
  frontierPrices, frontierSum, pathPrice,
  knifeEdgeDistance, rankByKnifeEdge,
  mciScore, memeMultiplier, MEME_MULT_MIN, MEME_MULT_MAX, MCI_OPTIMUM,
  hasIrrealisMood, benignityAtDepth,
  settleFrontier, canAuthorBranch,
  type Branch,
} from "./paseome";
import { treeConservationError, type TreeNode } from "./bayesian-conviction";
import { VIP_STATUS_MIN_MADX } from "./gambit-game-math";

const mk = (n: number): Branch[] =>
  Array.from({ length: n }, (_, i) => ({ id: `b${i}`, claim: `what if ${i}`, shares: 100 + i * 40 }));

describe("frontier", () => {
  it("rejects a frontier narrower than 3 or wider than 5 — the founder bound", () => {
    expect(() => frontierPrices(mk(FRONTIER_MIN - 1))).toThrow(FrontierError);
    expect(() => frontierPrices(mk(FRONTIER_MAX + 1))).toThrow(FrontierError);
    expect(() => frontierPrices(mk(FRONTIER_MIN))).not.toThrow();
    expect(() => frontierPrices(mk(FRONTIER_MAX))).not.toThrow();
  });

  it("prices sum to exactly 1 — the tree cannot leak value at a fork", () => {
    for (let n = FRONTIER_MIN; n <= FRONTIER_MAX; n++) {
      expect(frontierSum(frontierPrices(mk(n)))).toBeCloseTo(1, 12);
    }
  });

  it("more shares on a branch means a higher price", () => {
    const p = frontierPrices([
      { id: "a", claim: "x", shares: 10 },
      { id: "b", claim: "y", shares: 500 },
      { id: "c", claim: "z", shares: 10 },
    ]);
    const b = p.find((x) => x.id === "b")!;
    const a = p.find((x) => x.id === "a")!;
    expect(b.price).toBeGreaterThan(a.price);
  });

  it("DL-LMSR prices feed straight into a tree that conserves", () => {
    const priced = frontierPrices(mk(4));
    const tree: TreeNode = {
      name: "root",
      children: priced.map((b) => ({
        child: { name: b.id, isLeaf: true, probability: 0.5 },
        conditionalProb: b.price,
      })),
    };
    expect(treeConservationError(tree)).toBeNull();
  });
});

describe("pathPrice", () => {
  it("is the product along the path, so depth discounts multiplicatively", () => {
    expect(pathPrice([0.5, 0.5, 0.5])).toBeCloseTo(0.125, 12);
    expect(pathPrice([0.5, 0.5])).toBeGreaterThan(pathPrice([0.5, 0.5, 0.5]));
  });
  it("an empty or impossible path is worthless, never NaN", () => {
    expect(pathPrice([])).toBe(0);
    expect(pathPrice([0.5, 0])).toBe(0);
    expect(pathPrice([0.5, Number.NaN])).toBe(0);
  });
});

describe("knife edge", () => {
  it("peaks at p = 0.5 — maximum uncertainty, where the market needs a trader", () => {
    expect(knifeEdgeDistance(0.5)).toBe(0);
    expect(knifeEdgeDistance(0.01)).toBeGreaterThan(knifeEdgeDistance(0.4));
    expect(knifeEdgeDistance(0.99)).toBeGreaterThan(knifeEdgeDistance(0.6));
  });
  it("ranks the sharpest edge first, not the biggest number", () => {
    const ranked = rankByKnifeEdge([{ price: 0.95 }, { price: 0.52 }, { price: 0.2 }]);
    expect(ranked[0].price).toBe(0.52);
    expect(ranked[2].price).toBe(0.95);
  });
});

describe("minimal counterintuitiveness", () => {
  it("fitness peaks at exactly one violation", () => {
    const none = mciScore("The mayor gave a speech about drainage");
    const one = mciScore("What if the paperwork resigns in protest");
    expect(none.violations).toBe(0);
    expect(one.violations).toBe(MCI_OPTIMUM);
    expect(one.fitness).toBeGreaterThan(none.fitness);
    expect(one.fitness).toBe(1);
  });

  it("two violations score below one — noise, not news", () => {
    const two = mciScore("What if the paperwork resigns and every single person teleports");
    expect(two.violations).toBeGreaterThanOrEqual(2);
    expect(two.fitness).toBeLessThan(1);
  });

  it("the meme multiplier stays bounded so memetics never dominate time held", () => {
    const lines = ["", "a routine council meeting", "what if the paperwork resigns"];
    for (const l of lines) {
      const m = memeMultiplier(l);
      expect(m).toBeGreaterThanOrEqual(MEME_MULT_MIN);
      expect(m).toBeLessThanOrEqual(MEME_MULT_MAX);
    }
  });
});

describe("the irrealis constraint", () => {
  it("accepts counterfactual mood and rejects a bare assertion", () => {
    expect(hasIrrealisMood("What if the merger had collapsed")).toBe(true);
    expect(hasIrrealisMood("Suppose the vote were held today")).toBe(true);
    expect(hasIrrealisMood("The merger collapsed")).toBe(false);
  });
  it("benignity rises with depth — branch 4 is absurd and therefore safe", () => {
    expect(benignityAtDepth(4)).toBeGreaterThan(benignityAtDepth(1));
    expect(benignityAtDepth(99)).toBeLessThanOrEqual(1);
  });
});

describe("settlement", () => {
  const priced = frontierPrices(mk(3));

  it("Foresight refunds every untaken sibling — a refund cannot be a near-miss", () => {
    const s = settleFrontier("foresight", priced, "b1");
    expect(s.takenId).toBe("b1");
    expect(s.outcomes.filter((o) => o.outcome === "refunded")).toHaveLength(2);
    expect(s.outcomes.find((o) => o.id === "b1")!.outcome).toBe("taken");
    expect(s.outcomes.some((o) => o.outcome === "carried")).toBe(false);
  });

  it("Hindsight settles nothing — every branch carries, nothing is written off", () => {
    const s = settleFrontier("hindsight", priced, "b1");
    expect(s.takenId).toBeNull();
    expect(s.outcomes.every((o) => o.outcome === "carried")).toBe(true);
  });

  it("an unknown taken id refunds everything rather than inventing a winner", () => {
    const s = settleFrontier("foresight", priced, "does-not-exist");
    expect(s.takenId).toBeNull();
    expect(s.outcomes.every((o) => o.outcome === "refunded")).toBe(true);
  });
});

describe("authorship", () => {
  it("VIP capital alone unlocks it, and is reported as the capital axis", () => {
    const a = canAuthorBranch({ madxBalance: VIP_STATUS_MIN_MADX, tractionedMarkets: 0, followers: 0 });
    expect(a.eligible).toBe(true);
    expect(a.viaCapital).toBe(true);
    expect(a.viaCreator).toBe(false);
  });

  it("the creator ladder alone unlocks it, without any VIP balance", () => {
    const a = canAuthorBranch({ madxBalance: 0, tractionedMarkets: 12, followers: 0 });
    expect(a.eligible).toBe(true);
    expect(a.viaCreator).toBe(true);
    expect(a.viaCapital).toBe(false);
    expect(a.status).toBe("MinorCreator");
  });

  it("neither axis means no authorship", () => {
    const a = canAuthorBranch({ madxBalance: 100, tractionedMarkets: 3, followers: 10 });
    expect(a.eligible).toBe(false);
    expect(a.status).toBe("User");
  });
});

describe("tree conservation", () => {
  it("catches a node whose edges do not sum to 1", () => {
    const bad: TreeNode = {
      name: "root",
      children: [
        { child: { name: "l", isLeaf: true, probability: 1 }, conditionalProb: 0.4 },
        { child: { name: "r", isLeaf: true, probability: 1 }, conditionalProb: 0.4 },
      ],
    };
    const err = treeConservationError(bad);
    expect(err).not.toBeNull();
    expect(err).toContain("root");
  });

  it("passes a conserving tree", () => {
    const good: TreeNode = {
      name: "root",
      children: [
        { child: { name: "l", isLeaf: true, probability: 1 }, conditionalProb: 0.4 },
        { child: { name: "r", isLeaf: true, probability: 1 }, conditionalProb: 0.6 },
      ],
    };
    expect(treeConservationError(good)).toBeNull();
  });
});
