import { describe, expect, it } from "vitest";
import { derivePackNonce } from "@/lib/pack-nonce";

const OWNER = "0x1234567890123456789012345678901234567890";

describe("derivePackNonce", () => {
  it("is pinned to known values — sha256(`<owner lower-cased>:<count>`), first four bytes, big-endian", () => {
    // Literals, computed once outside this repo. `expect(f(x)).toBe(f(x))` passes for ANY
    // deterministic function — including one that reads the clock on every call and
    // happens to be evaluated within the same millisecond — so it said nothing about
    // the value. This nonce decides which pack a wallet gets; it is the fairness
    // property open-pack leans on, so the value is pinned, not just its repeatability.
    expect(derivePackNonce(OWNER, 0)).toBe(1041793604);
    expect(derivePackNonce(OWNER, 1)).toBe(435005797);
    expect(derivePackNonce(OWNER, 2)).toBe(2977184083);
    expect(derivePackNonce("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", 1)).toBe(1761025761);
  });

  it("does not depend on the wallet's letter case — a checksummed and a lower-cased address are one wallet", () => {
    const mixed = "0xAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCdEfAbCd";
    expect(derivePackNonce(mixed, 1)).toBe(derivePackNonce(mixed.toLowerCase(), 1));
    expect(derivePackNonce(mixed, 1)).toBe(1761025761);
  });

  it("is a uint32 — it feeds a seeded generator, not a float", () => {
    for (let count = 0; count < 50; count++) {
      const n = derivePackNonce(OWNER, count);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("advances to a different nonce as the counter advances — no free reroll", () => {
    // This is the regression case: a client that could once send the same
    // userNonce twice to get the same pack now can't, because retrying
    // open-pack always consumes the next counter value, not the same one.
    const nonces = new Set([1, 2, 3, 4, 5].map((count) => derivePackNonce(OWNER, count)));
    expect(nonces.size).toBe(5);
  });

  it("does not collide across wallets at the same counter value", () => {
    const other = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    expect(derivePackNonce(OWNER, 1)).not.toBe(derivePackNonce(other, 1));
  });
});
