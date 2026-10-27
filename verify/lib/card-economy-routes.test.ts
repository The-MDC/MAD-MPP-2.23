import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for the routes that used to accept a caller-supplied
 * identity.
 *
 * The worst offender, `cards/collect`, has since been DELETED rather than
 * guarded: it read `walletAddress` and `rarity` from the request body behind
 * nothing but a rate limit, and open-pack already generates, charges
 * (PLATFORM.CARD_PACK_COST from madx_accounts) and persists in one
 * authenticated transaction. Nothing in the client ever called collect. A
 * second write path into `cards` that accepts a client-declared rarity can
 * only ever record a card the engine did not roll, so guarding it would have
 * preserved a route whose entire purpose was to bypass openCardPack().
 *
 * These assert the 401 arrives BEFORE the handler reaches a database, which is
 * the property that actually matters: a guard that runs after the write, or
 * only when DATABASE_URL happens to be set, is not a guard. DATABASE_URL is
 * deliberately deleted in beforeEach — if any of these ever returns 503
 * ("needs DATABASE_URL") instead of 401, the guard has moved below the
 * environment check and the route is open again in exactly the deployments
 * that have a database.
 *
 * The CI check that was supposed to catch this class counted `enforceRateLimit`
 * as authorization and reported all-clear; scripts/check-route-guards.mjs now
 * separates the two. These tests are the second line: the script proves a guard
 * is present, this proves it actually rejects.
 */
describe("card-economy route authorization", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
    delete process.env.DATABASE_URL;
  });

  const post = (body: unknown) =>
    new Request("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("shield/opt-in rejects an unauthenticated position opened against another wallet", async () => {
    const { POST } = await import("@/app/api/v1/shield/opt-in/route");

    const res = await POST(post({ walletAddress: "0x" + "b".repeat(40), stake: 1000, tier: "whale" }));

    expect(res.status).toBe(401);
  });

  it("cards/evolution/create rejects an unauthenticated card creation", async () => {
    const { POST } = await import("@/app/api/v1/cards/evolution/create/route");

    const res = await POST(post({ id: "card_x", owner: "someone-elses-owner-string" }));

    expect(res.status).toBe(401);
  });

  it("cards/evolution/battle rejects an unauthenticated battle on someone else's card id", async () => {
    const { POST } = await import("@/app/api/v1/cards/evolution/battle/route");

    const res = await POST(post({ id: "card_belonging_to_someone_else", win: true }));

    expect(res.status).toBe(401);
  });

  it("lobby POST rejects an unauthenticated post under an arbitrary username", async () => {
    const { POST } = await import("@/app/api/v1/lobby/route");

    const res = await POST(post({ channel: "Wall", username: "founder", subject: "s", body: "b" }));

    expect(res.status).toBe(401);
  });
});

/**
 * Engine invariant, kept after the route that motivated it was deleted.
 *
 * `RARITY_ORDER` lists every rarity that exists; `RARITY_DROP_WEIGHTS` lists
 * what a pack can actually produce. They differ by exactly one entry — Mythic,
 * the 1-of-1 with stakingApy 88 — and the deleted cards/collect validated
 * against the wrong one of the two, so a body field could name it.
 *
 * The distinction is documented only in a comment inside gambit-game-math
 * ("Mythic (1-of-1) is never in packs"). This pins it, so any future code that
 * validates user-supplied rarity has an executable statement of which list is
 * the right one — and so the two tables converging becomes a visible decision
 * rather than a silent widening of what a pack can contain.
 */
describe("rarity validation matches the pack engine, not the full rarity list", () => {
  it("RARITY_ORDER contains Mythic but the drop table does not", async () => {
    const { RARITY_ORDER, RARITY_DROP_WEIGHTS } = await import("@/lib/gambit-game-math");

    expect(RARITY_ORDER).toContain("Mythic");
    expect(Object.keys(RARITY_DROP_WEIGHTS)).not.toContain("Mythic");
    // Mythic is the only difference. If that ever stops being true, the
    // change was either deliberate or a mistake — this makes it impossible
    // for it to be neither.
    expect(Object.keys(RARITY_DROP_WEIGHTS).length).toBe(RARITY_ORDER.length - 1);
  });
});
