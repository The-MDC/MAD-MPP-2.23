import { createHash } from "node:crypto";

/**
 * Derives the pack-generation nonce server-side from wallet identity plus a
 * persisted, monotonic per-wallet counter (customer_accounts.pack_open_count)
 * — never from client input. The counter only moves forward and each value
 * is consumed once, so retrying open-pack advances to a new nonce instead of
 * rerolling the same one for free — that's the actual fairness property this
 * closes, not general unpredictability of a single roll (that's the separate
 * VRF work).
 */
export function derivePackNonce(owner: string, packOpenCount: number): number {
  const hash = createHash("sha256").update(`${owner.toLowerCase()}:${packOpenCount}`).digest();
  return hash.readUInt32BE(0);
}
