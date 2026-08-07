import { describe, it, expect } from "vitest";
import { buildScandalGraph, type GraphSignal } from "./scandal-graph";

describe("buildScandalGraph", () => {
  const signals: GraphSignal[] = [
    { persons: ["elon musk", "taylor swift"], scandalVelocity: 2.0 },
    { persons: ["elon musk", "taylor swift"], scandalVelocity: 3.0 },
    { persons: ["elon musk", "lebron james"], scandalVelocity: 1.0 },
  ];

  it("accumulates node mentions + heat and sorts hottest first", () => {
    const g = buildScandalGraph(signals);
    expect(g.nodes).toHaveLength(3);
    expect(g.nodes[0].characterId).toBe("char:elon-musk");
    expect(g.nodes[0].mentions).toBe(3);
    expect(g.nodes[0].heat).toBe(6); // 2 + 3 + 1
  });

  it("weights co-occurrence edges and surfaces the top rivalry", () => {
    const g = buildScandalGraph(signals);
    expect(g.edges).toHaveLength(2);
    expect(g.topRivalry?.weight).toBe(2); // elon+taylor co-occur twice
    expect([g.topRivalry?.a, g.topRivalry?.b]).toEqual(["char:elon-musk", "char:taylor-swift"]);
    expect(g.topRivalry?.crossFaction).toBe(true); // disruptors vs popIcons
    expect(g.topRivalry?.heat).toBe(3); // max velocity across the two shared signals
  });

  it("ignores unknown names and makes no edges for a lone character", () => {
    const g = buildScandalGraph([{ persons: ["elon musk", "some nobody"], scandalVelocity: 1.5 }]);
    expect(g.nodes).toHaveLength(1);
    expect(g.edges).toHaveLength(0);
    expect(g.topRivalry).toBeNull();
  });

  it("returns an empty graph for empty input", () => {
    const g = buildScandalGraph([]);
    expect(g.nodes).toHaveLength(0);
    expect(g.edges).toHaveLength(0);
    expect(g.topRivalry).toBeNull();
  });
});
