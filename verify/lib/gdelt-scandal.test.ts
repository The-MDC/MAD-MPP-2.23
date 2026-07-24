import { describe, it, expect } from "vitest";
import {
  rowToScandalEvent,
  decideForRows,
  summarizeDecisions,
  type SignalRow,
} from "./gdelt-scandal";

describe("rowToScandalEvent", () => {
  it("resolves people to faction entities and proxies virality from velocity", () => {
    const ev = rowToScandalEvent({
      headline: "Feud",
      persons: ["elon musk", "taylor swift"],
      themes: ["feud"],
      scandalVelocity: 3.0,
    });
    expect(ev.entities).toHaveLength(2);
    expect(ev.viralityScore).toBe(100);
    expect(ev.entities[0].role).toBe("primary");
  });
});

describe("decideForRows", () => {
  it("fires a Chaos Fusion (with CF metadata) for 4 distinct factions at high velocity", () => {
    const rows: SignalRow[] = [
      {
        headline: "Feud erupts everywhere",
        persons: ["elon musk", "taylor swift", "lebron james", "donald trump"],
        themes: ["feud"],
        scandalVelocity: 3.0,
      },
    ];
    const [d] = decideForRows(rows);
    expect(d.decision.type).toBe("chaos_fusion");
    expect(d.distinctFactions).toBe(4);
    expect(d.chaos).toBeDefined();
    expect(d.chaos?.type).toBe("chaos_fusion");
    expect(d.chaos?.factions).toHaveLength(4);
  });

  it("fires a Crossover for exactly two distinct factions", () => {
    const [d] = decideForRows([
      {
        headline: "Lawsuit rumors",
        persons: ["kim kardashian", "lebron james"],
        themes: ["lawsuit"],
        scandalVelocity: 2.2,
      },
    ]);
    expect(d.decision.type).toBe("crossover");
    expect(d.chaos).toBeUndefined();
  });

  it("ignores a quiet, person-less signal via the Z-Liar floor", () => {
    const [d] = decideForRows([
      { headline: "Quiet day", persons: [], themes: [], scandalVelocity: 0.2 },
    ]);
    expect(d.decision.type).toBe("ignore");
  });
});

describe("summarizeDecisions", () => {
  it("counts decisions by kind", () => {
    const summary = summarizeDecisions(
      decideForRows([
        {
          headline: "Feud",
          persons: ["elon musk", "taylor swift", "lebron james", "donald trump"],
          themes: ["feud"],
          scandalVelocity: 3.0,
        },
        { headline: "Quiet", persons: [], themes: [], scandalVelocity: 0.1 },
      ]),
    );
    expect(summary.chaos_fusion).toBe(1);
    expect(summary.ignore).toBe(1);
  });
});
