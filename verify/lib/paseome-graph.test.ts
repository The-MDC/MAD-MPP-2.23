import { describe, expect, it } from "vitest";
import {
  EM_DASH, ROOT_OFFSET,
  branchPosition, branchRadius, buildPaseomeGraph, fitDistance,
  fmtCount, fmtFixed, fmtPct, parseFrontier,
  type FrontierSnapshot, type GraphNode,
} from "./paseome-graph";
import { FRONTIER_MAX } from "./paseome";

/** A well-formed route response, built by hand so the parser is tested on its own. */
function wire(over: Record<string, unknown> = {}, branches?: Record<string, unknown>[]) {
  return {
    success: true,
    source: "demo",
    side: "foresight",
    root: "The merger vote lands this leg",
    structure: { rollsIn: "12d 4h", legSlot: "3 / 6", settles: "optimistic oracle at the leg boundary", untakenBranches: "refunded" },
    frontier: {
      sum: 1,
      branches: branches ?? [
        { id: "a", claim: "What if A?", price: 0.5, shares: 100, knifeEdge: 0, pathPriceAtDepth2: 0.25, mciFitness: 0.35, mciViolations: 0, irrealis: true },
        { id: "b", claim: "What if B?", price: 0.3, shares: 60, knifeEdge: 0.2, pathPriceAtDepth2: 0.09, mciFitness: 1, mciViolations: 1, irrealis: true },
        { id: "c", claim: "What if C?", price: 0.2, shares: 40, knifeEdge: 0.3, pathPriceAtDepth2: 0.04, mciFitness: 0.35, mciViolations: 0, irrealis: true },
      ],
    },
    knifeEdgeOrder: ["a", "b", "c"],
    ...over,
  };
}

function snap(over: Record<string, unknown> = {}, branches?: Record<string, unknown>[]): FrontierSnapshot {
  const s = parseFrontier(wire(over, branches));
  if (!s) throw new Error("fixture did not parse");
  return s;
}

describe("formatting — a figure that is not there is an em dash, never a zero", () => {
  it("prints null, undefined, NaN and Infinity as an em dash", () => {
    for (const bad of [null, undefined, Number.NaN, Infinity, -Infinity]) {
      expect(fmtPct(bad)).toBe(EM_DASH);
      expect(fmtFixed(bad)).toBe(EM_DASH);
      expect(fmtCount(bad)).toBe(EM_DASH);
    }
  });

  it("keeps a REAL zero as a zero — only absence is a dash", () => {
    expect(fmtPct(0)).toBe("0.0%");
    expect(fmtFixed(0, 3)).toBe("0.000");
    expect(fmtCount(0)).toBe("0");
  });

  it("formats ordinary values", () => {
    expect(fmtPct(0.4123, 1)).toBe("41.2%");
    expect(fmtPct(0.4123, 0)).toBe("41%");
    expect(fmtCount(4200)).toBe("4,200");
  });
});

describe("parseFrontier — validate the wire", () => {
  it("accepts a well-formed response", () => {
    const s = snap();
    expect(s.side).toBe("foresight");
    expect(s.branches).toHaveLength(3);
    expect(s.rollsIn).toBe("12d 4h");
    expect(s.untaken).toBe("refunded");
    expect(s.knifeEdgeOrder).toEqual(["a", "b", "c"]);
  });

  it("rejects anything that is not a successful, well-formed frontier", () => {
    expect(parseFrontier(null)).toBeNull();
    expect(parseFrontier("nope")).toBeNull();
    expect(parseFrontier([])).toBeNull();
    expect(parseFrontier({})).toBeNull();
    expect(parseFrontier(wire({ success: false }))).toBeNull();
    expect(parseFrontier(wire({ side: "sideways" }))).toBeNull();
    expect(parseFrontier(wire({ root: "  " }))).toBeNull();
    expect(parseFrontier(wire({ frontier: { branches: "x" } }))).toBeNull();
    expect(parseFrontier(wire({ frontier: { sum: 1, branches: [] } }))).toBeNull();
  });

  it("source is live ONLY when the API says live — unknown or absent is demo", () => {
    expect(snap({ source: "live" }).source).toBe("live");
    expect(snap({ source: "demo" }).source).toBe("demo");
    expect(snap({ source: "LIVE" }).source).toBe("demo");
    expect(snap({ source: undefined }).source).toBe("demo");
    expect(snap({ source: true }).source).toBe("demo");
  });

  it("nulls a figure that is non-finite or out of range instead of coercing it to a number", () => {
    const s = snap({}, [
      { id: "a", claim: "What if A?", price: 1.4, shares: "lots", knifeEdge: Number.NaN, pathPriceAtDepth2: -0.1, irrealis: "yes" },
      { id: "b", claim: "What if B?", price: 0.5 },
      { id: "c", claim: "What if C?", price: 0.5 },
    ]);
    const a = s.branches[0];
    expect(a.price).toBeNull();
    expect(a.shares).toBeNull();
    expect(a.knifeEdge).toBeNull();
    expect(a.pathPriceAtDepth2).toBeNull();
    expect(a.irrealis).toBeNull();
  });

  it("drops malformed and duplicate branches, and never reads past the frontier maximum", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}`, claim: `What if ${i}?`, price: 0.1 }));
    expect(snap({}, many).branches).toHaveLength(FRONTIER_MAX);
    const dirty = snap({}, [
      { id: "a", claim: "What if A?", price: 0.5 },
      { id: "a", claim: "What if A again?", price: 0.5 },
      { id: "", claim: "no id", price: 0.5 },
      { id: "z", claim: "", price: 0.5 },
      null as unknown as Record<string, unknown>,
      { id: "b", claim: "What if B?", price: 0.5 },
    ]);
    expect(dirty.branches.map((b) => b.id)).toEqual(["a", "b"]);
  });
});

describe("buildPaseomeGraph", () => {
  const foresight = snap();
  const hindsight = snap({ side: "hindsight", root: "If the deal had collapsed" });

  it("is a hub, one root per side, and one node per branch", () => {
    const g = buildPaseomeGraph([foresight, hindsight]);
    expect(g.nodes.map((n) => n.kind).sort()).toEqual(["branch", "branch", "branch", "branch", "branch", "branch", "hub", "root", "root"]);
    expect(g.sides).toEqual(["foresight", "hindsight"]);
    expect(new Set(g.nodes.map((n) => n.id)).size).toBe(g.nodes.length);
  });

  it("every edge joins two nodes that exist, and only hub-root edges are structural", () => {
    const g = buildPaseomeGraph([foresight, hindsight]);
    const ids = new Set(g.nodes.map((n) => n.id));
    for (const e of g.edges) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
      expect(e.structural).toBe(e.from === "hub");
    }
  });

  it("is deterministic — the same input lays out identically", () => {
    expect(buildPaseomeGraph([foresight, hindsight])).toEqual(buildPaseomeGraph([foresight, hindsight]));
  });

  it("works with a single side, and is empty with none — no invented hub", () => {
    const one = buildPaseomeGraph([foresight]);
    expect(one.sides).toEqual(["foresight"]);
    expect(one.nodes.some((n) => n.side === "hindsight")).toBe(false);
    expect(one.nodes.find((n) => n.kind === "hub")?.facts[0]).toEqual({ k: "Frontiers loaded", v: "1 of 2" });

    const none = buildPaseomeGraph([]);
    expect(none.nodes).toEqual([]);
    expect(none.edges).toEqual([]);
    expect(none.sides).toEqual([]);
    expect(none.source).toBe("demo");
  });

  it("only calls the graph live when every loaded side is live", () => {
    const live = (side: string) => snap({ side, source: "live", root: "r" });
    expect(buildPaseomeGraph([live("foresight"), live("hindsight")]).source).toBe("live");
    expect(buildPaseomeGraph([live("foresight"), snap({ side: "hindsight" })]).source).toBe("demo");
  });

  it("withholds a counterfactual branch that lacks irrealis mood, and counts it", () => {
    const h = snap({ side: "hindsight" }, [
      { id: "a", claim: "What if A had happened?", price: 0.4, irrealis: true },
      { id: "b", claim: "A asserts as fact.", price: 0.3, irrealis: false },
      { id: "c", claim: "Flag missing.", price: 0.3 },
      { id: "d", claim: "What if D?", price: 0.2, irrealis: true },
    ]);
    const g = buildPaseomeGraph([h]);
    expect(g.withheld).toBe(2);
    expect(g.nodes.filter((n) => n.kind === "branch").map((n) => n.title)).toEqual(["What if A had happened?", "What if D?"]);
  });

  it("does not apply the irrealis rule to the forward side", () => {
    const f = snap({}, [
      { id: "a", claim: "It passes.", price: 0.5, irrealis: false },
      { id: "b", claim: "It fails.", price: 0.5 },
    ]);
    const g = buildPaseomeGraph([f]);
    expect(g.withheld).toBe(0);
    expect(g.nodes.filter((n) => n.kind === "branch")).toHaveLength(2);
  });

  it("a side with every branch withheld contributes no root", () => {
    const h = snap({ side: "hindsight" }, [{ id: "a", claim: "Asserts.", price: 1, irrealis: false }]);
    const g = buildPaseomeGraph([h]);
    expect(g.nodes).toEqual([]);
    expect(g.withheld).toBe(1);
  });

  it("prints an unpriced branch as an em dash, at the minimum radius", () => {
    const f = snap({}, [
      { id: "a", claim: "What if A?", price: 2 },
      { id: "b", claim: "What if B?", price: 0.5 },
    ]);
    const a = buildPaseomeGraph([f]).nodes.find((n) => n.title === "What if A?") as GraphNode;
    expect(a.label).toBe(EM_DASH);
    expect(a.price).toBeNull();
    expect(a.radius).toBe(branchRadius(null));
    expect(a.facts[0]).toEqual({ k: "Price", v: EM_DASH });
  });

  it("ranks by the API's knife-edge order and leaves an unlisted branch unranked", () => {
    const f = snap({ knifeEdgeOrder: ["c", "a"] });
    const nodes = buildPaseomeGraph([f]).nodes.filter((n) => n.kind === "branch");
    expect(nodes.map((n) => n.rank)).toEqual([2, null, 1]);
    expect(nodes[1].facts.find((x) => x.k === "Knife-edge rank")?.v).toBe(EM_DASH);
  });

  it("roots sit on opposite sides of the hub, and bounds cover every node", () => {
    const g = buildPaseomeGraph([foresight, hindsight]);
    const root = (s: string) => g.nodes.find((n) => n.id === `root:${s}`) as GraphNode;
    expect(root("foresight").position[0]).toBe(ROOT_OFFSET);
    expect(root("hindsight").position[0]).toBe(-ROOT_OFFSET);
    for (const n of g.nodes) {
      for (let a = 0; a < 3; a++) {
        expect(Number.isFinite(n.position[a])).toBe(true);
        expect(g.extent[a]).toBeGreaterThanOrEqual(Math.abs(n.position[a]) + n.radius - 1e-9);
      }
    }
  });
});

describe("layout — branches never collide", () => {
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  it("no two nodes touch at any width or price split, on either side", () => {
    // Real frontiers sum to 1, so test price VECTORS, not n equal big prices.
    const splits: Record<number, number[][]> = {
      3: [[0.34, 0.33, 0.33], [0.9, 0.05, 0.05], [0.98, 0.01, 0.01], [0.5, 0.49, 0.01]],
      4: [[0.25, 0.25, 0.25, 0.25], [0.85, 0.05, 0.05, 0.05], [0.97, 0.01, 0.01, 0.01], [0.01, 0.01, 0.01, 0.97]],
      5: [[0.2, 0.2, 0.2, 0.2, 0.2], [0.6, 0.2, 0.1, 0.05, 0.05], [0.96, 0.01, 0.01, 0.01, 0.01], [0.01, 0.01, 0.01, 0.01, 0.96]],
    };
    for (const n of [3, 4, 5]) {
      for (const prices of splits[n]) {
        const branches = prices.map((price, i) => ({ id: `b${i}`, claim: `What if ${i} had happened?`, price, irrealis: true }));
        const g = buildPaseomeGraph([snap({}, branches), snap({ side: "hindsight", root: "r" }, branches)]);
        for (let i = 0; i < g.nodes.length; i++) {
          for (let j = i + 1; j < g.nodes.length; j++) {
            const a = g.nodes[i], b = g.nodes[j];
            expect(dist(a.position, b.position)).toBeGreaterThan(a.radius + b.radius + 0.05);
          }
        }
      }
    }
  });

  it("branches open away from the hub, never back across it", () => {
    for (let i = 0; i < 5; i++) {
      expect(branchPosition("foresight", i, 5, 0.3)[0]).toBeGreaterThan(ROOT_OFFSET);
      expect(branchPosition("hindsight", i, 5, 0.3)[0]).toBeLessThan(-ROOT_OFFSET);
    }
  });

  it("a pricier branch is bigger and sits nearer its root", () => {
    expect(branchRadius(0.6)).toBeGreaterThan(branchRadius(0.1));
    expect(branchRadius(0.1)).toBeGreaterThan(branchRadius(null));
    const near = branchPosition("foresight", 0, 3, 0.9);
    const far = branchPosition("foresight", 0, 3, 0.1);
    expect(Math.hypot(near[0] - ROOT_OFFSET, near[1], near[2])).toBeLessThan(Math.hypot(far[0] - ROOT_OFFSET, far[1], far[2]));
  });
});

describe("fitDistance", () => {
  it("backs the camera off for a narrower viewport", () => {
    const e: [number, number, number] = [8, 3, 3];
    expect(fitDistance(e, 50, 0.8)).toBeGreaterThan(fitDistance(e, 50, 1.6));
  });

  it("is positive and finite even for a degenerate aspect or empty extent", () => {
    for (const aspect of [0, -1, Number.NaN]) {
      const d = fitDistance([8, 3, 3], 50, aspect);
      expect(d).toBeGreaterThan(0);
    }
    expect(fitDistance([0, 0, 0], 50, 1)).toBe(0);
  });
});

describe("contract with GET /api/v1/paseome/frontier", () => {
  it("both sides of the real route parse, build a full graph and price to 1", async () => {
    const { GET } = await import("@/app/api/v1/paseome/frontier/route");
    const snaps: FrontierSnapshot[] = [];
    for (const side of ["foresight", "hindsight"]) {
      const res = await GET(new Request(`http://localhost/api/v1/paseome/frontier?side=${side}`, { headers: { "x-forwarded-for": `contract-${side}` } }));
      expect(res.status).toBe(200);
      const parsed = parseFrontier(await res.json());
      expect(parsed).not.toBeNull();
      snaps.push(parsed as FrontierSnapshot);
    }

    for (const s of snaps) {
      // The API says what it is: seeded branches, real maths.
      expect(s.source).toBe("demo");
      expect(s.branches.every((b) => b.price !== null)).toBe(true);
      expect(s.branches.reduce((a, b) => a + (b.price as number), 0)).toBeCloseTo(1, 9);
      expect(s.sum).toBeCloseTo(1, 9);
    }

    const g = buildPaseomeGraph(snaps);
    expect(g.source).toBe("demo");
    expect(g.sides).toEqual(["foresight", "hindsight"]);
    expect(g.withheld).toBe(0);
    expect(g.nodes.filter((n) => n.kind === "branch")).toHaveLength(snaps[0].branches.length + snaps[1].branches.length);
  });
});
