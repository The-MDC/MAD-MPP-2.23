import { describe, it, expect } from "vitest";
import { satireMetrics, rankBySatire } from "./satire-metrics";

describe("satireMetrics", () => {
  it("returns scores in range and a verdict label", () => {
    const m = satireMetrics("Shocking scandal: bombshell feud erupts as star melts down");
    expect(m.satireScore).toBeGreaterThanOrEqual(0);
    expect(m.satireScore).toBeLessThanOrEqual(100);
    expect(m.zLiarScore).toBeGreaterThanOrEqual(0);
    expect(m.zLiarScore).toBeLessThanOrEqual(100);
    expect(["PRIME SATIRE", "BETTABLE", "WATCH", "SKIP"]).toContain(m.verdict);
  });

  it("a dramatic, energetic headline out-scores a flat one", () => {
    const hot = satireMetrics("Shocking bombshell scandal feud meltdown breaking exclusive");
    const flat = satireMetrics("Quarterly logistics report released on schedule");
    expect(hot.satireScore).toBeGreaterThan(flat.satireScore);
  });

  it("roast throttle scales severity — 0 mutes it entirely", () => {
    const full = satireMetrics("Scandal feud drama meltdown", { roastThrottle: 1 });
    const muted = satireMetrics("Scandal feud drama meltdown", { roastThrottle: 0 });
    expect(muted.roastSeverity).toBe(0);
    expect(full.roastSeverity).toBeGreaterThan(0);
  });

  it("empty input is flat and not brand-safe", () => {
    const m = satireMetrics("");
    expect(m.dopaminePotential).toBe(false);
    expect(m.brandSafe).toBe(false);
  });
});

describe("rankBySatire", () => {
  it("drops empties and sorts by satire score descending", () => {
    const out = rankBySatire(["", "   ", "Scandal feud meltdown bombshell", "Routine update"]);
    expect(out).toHaveLength(2);
    expect(out[0].satireScore).toBeGreaterThanOrEqual(out[1].satireScore);
  });
});
