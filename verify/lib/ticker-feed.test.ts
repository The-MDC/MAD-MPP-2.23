import { describe, it, expect, vi } from "vitest";
import { captionFor } from "@/lib/ticker-feed";

const base = {
  analytics: { heat: 0.6 },
  perps: [],
  markets: [{ title: "Will the hat return?", category: "culture", yesPct: 64, volume: 1200, kind: "binary" }],
} as unknown as Parameters<typeof captionFor>[0];

describe("captionFor", () => {
  it("asks the model with thinking off (a one-line caption has nothing to reason about)", async () => {
    const ask = vi.fn().mockResolvedValue("Hat renewal odds at 64% across one open market.");
    const out = await captionFor(base, ask);
    expect(out.by).toBe("moe");
    expect(ask.mock.calls[0][0].thinking).toBe("off");
  });

  it("falls back to the rule caption when the model answers nothing", async () => {
    const out = await captionFor(base, vi.fn().mockResolvedValue(null));
    expect(out.by).toBe("rules");
    expect(out.caption.length).toBeGreaterThan(0);
  });
});
