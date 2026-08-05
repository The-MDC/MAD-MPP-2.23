import { describe, it, expect } from "vitest";
import {
  significantTokens,
  corpusLineage,
  buildSuccessionMatrix,
  transmigrate,
  conservationError,
  W_MEASURED,
  W_VOTED,
} from "@/lib/succession";

const rowSum = (r: number[]) => r.reduce((a, b) => a + b, 0);

describe("significantTokens", () => {
  it("drops stopwords and short words, and dedupes", () => {
    const t = significantTokens("The authenticity revolt and the authenticity backlash");
    expect(t).toContain("authenticity");
    expect(t).toContain("revolt");
    expect(t).toContain("backlash");
    expect(t).not.toContain("the");
    expect(t.filter((x) => x === "authenticity")).toHaveLength(1);
  });
});

describe("corpusLineage", () => {
  it("is 1 when every retiring doc has a same-story partner", () => {
    const retiring = ["authenticity revolt brands reject synthetic models"];
    const candidate = ["brands double down on authenticity revolt messaging"];
    expect(corpusLineage(retiring, candidate)).toBe(1);
  });

  it("is 0 for unrelated corpora", () => {
    expect(
      corpusLineage(["authenticity revolt consumer sentiment"], ["quarterly logistics warehouse throughput"]),
    ).toBe(0);
  });

  it("is 0 when either corpus is empty", () => {
    expect(corpusLineage([], ["anything at all here"])).toBe(0);
    expect(corpusLineage(["anything at all here"], [])).toBe(0);
  });

  it("requires two shared tokens, not one", () => {
    // one shared significant token ("authenticity") should not qualify
    const r = ["authenticity quarterly warehouse throughput"];
    const c = ["authenticity nothing else whatsoever matches"];
    expect(corpusLineage(r, c)).toBe(0);
  });

  it("is a share, so partial overlap lands between 0 and 1", () => {
    const retiring = [
      "authenticity revolt brands reject synthetic",
      "warehouse logistics throughput quarterly report",
    ];
    const candidate = ["authenticity revolt continues across brands"];
    expect(corpusLineage(retiring, candidate)).toBeCloseTo(0.5, 12);
  });
});

describe("buildSuccessionMatrix", () => {
  const retiring = [
    ["authenticity revolt brands reject synthetic models"],
    ["synthetic influence virtual creators scaling brands"],
  ];
  const candidates = [
    ["authenticity revolt deepens across consumer brands"],
    ["virtual creators synthetic influence keeps scaling"],
    ["entirely unrelated municipal drainage policy"],
  ];

  it("produces row-stochastic S — conviction is conserved", () => {
    const s = buildSuccessionMatrix({ retiringCorpora: retiring, candidateCorpora: candidates });
    expect(s.conserved).toBe(true);
    s.matrix.forEach((row) => expect(rowSum(row)).toBeCloseTo(1, 12));
  });

  it("routes each retiring slot mostly to its own lineage when unvoted", () => {
    const s = buildSuccessionMatrix({ retiringCorpora: retiring, candidateCorpora: candidates });
    // slot 0 -> candidate 0, slot 1 -> candidate 1
    expect(s.matrix[0][0]).toBeGreaterThan(s.matrix[0][2]);
    expect(s.matrix[1][1]).toBeGreaterThan(s.matrix[1][2]);
  });

  it("lets the crowd outweigh lineage, but not erase it", () => {
    const votes = [
      // slot 0's holders all vote for candidate 2, which has NO lineage
      [
        { stake: 10_000, candidateIndex: 2 },
        { stake: 10_000, candidateIndex: 2 },
      ],
      [],
    ];
    const s = buildSuccessionMatrix({
      retiringCorpora: retiring,
      candidateCorpora: candidates,
      votes,
    });
    // crowd-led: the voted candidate takes the majority share
    expect(s.matrix[0][2]).toBeGreaterThan(0.5);
    // but the measurement floor keeps the lineage candidate non-zero
    expect(s.matrix[0][0]).toBeGreaterThan(0);
    // and it cannot reach 1 — w_m holds a floor for plausible successors
    expect(s.matrix[0][2]).toBeLessThan(1);
  });

  it("uses the founder-locked crowd-led weights by default", () => {
    expect(W_MEASURED).toBeCloseTo(0.3, 12);
    expect(W_VOTED).toBeCloseTo(0.7, 12);
    expect(W_MEASURED + W_VOTED).toBeCloseTo(1, 12);
  });

  it("spreads evenly rather than stranding conviction with no lineage and no votes", () => {
    const s = buildSuccessionMatrix({
      retiringCorpora: [["completely orphaned subject matter here"]],
      candidateCorpora: [["alpha bravo charlie"], ["delta echo foxtrot"]],
    });
    expect(rowSum(s.matrix[0])).toBeCloseTo(1, 12);
    expect(s.matrix[0][0]).toBeCloseTo(0.5, 12);
  });
});

describe("transmigrate", () => {
  it("conserves total conviction across the Turning", () => {
    const s = buildSuccessionMatrix({
      retiringCorpora: [
        ["authenticity revolt brands reject synthetic"],
        ["synthetic influence virtual creators scaling"],
      ],
      candidateCorpora: [
        ["authenticity revolt deepens brands"],
        ["virtual creators synthetic scaling"],
      ],
    });
    const holdings = [1200, 800];
    const landed = transmigrate(holdings, s);
    expect(conservationError(holdings, landed)).toBeLessThan(1e-9);
    expect(landed.reduce((a, b) => a + b, 0)).toBeCloseTo(2000, 9);
  });

  it("never force-settles — no position vanishes", () => {
    const s = buildSuccessionMatrix({
      retiringCorpora: [["orphan subject with no successor anywhere"]],
      candidateCorpora: [["alpha bravo charlie"], ["delta echo foxtrot"]],
    });
    const landed = transmigrate([500], s);
    expect(landed.reduce((a, b) => a + b, 0)).toBeCloseTo(500, 9);
  });

  it("treats non-finite holdings as zero rather than propagating NaN", () => {
    const s = buildSuccessionMatrix({
      retiringCorpora: [["alpha bravo charlie delta"]],
      candidateCorpora: [["alpha bravo charlie delta"]],
    });
    const landed = transmigrate([Number.NaN], s);
    expect(landed.every((x) => Number.isFinite(x))).toBe(true);
    expect(landed[0]).toBe(0);
  });
});
