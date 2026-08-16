import { describe, expect, it } from "vitest";
import { derivePackNonce } from "@/lib/pack-nonce";

const OWNER = "0x1234567890123456789012345678901234567890";

describe("derivePackNonce", () => {
  it("is deterministic for the same wallet + counter value", () => {
    expect(derivePackNonce(OWNER, 1)).toBe(derivePackNonce(OWNER, 1));
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
