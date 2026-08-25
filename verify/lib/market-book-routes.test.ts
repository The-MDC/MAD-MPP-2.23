import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Auth boundary for the two routes that can move a price or a balance.
 *
 * Both assertions check the 401 lands BEFORE `DATABASE_URL` is consulted — the
 * same ordering `lib/madx-routes.test.ts` locks for the transfer route. An
 * unauthenticated caller must never reach the pool, because a route that checks
 * the database first leaks whether a market exists and burns a connection on
 * traffic it was always going to reject.
 */
describe("market book route auth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
    delete process.env.DATABASE_URL;
  });

  it("refuses an unauthenticated swap — it debits $MADx, so the wallet cannot come from the body", async () => {
    const { POST } = await import("@/app/api/v1/markets/[id]/swap/route");

    const res = await POST(
      new Request("http://localhost/api/v1/markets/mkt_1/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: "YES", amount: 100, walletAddress: "0xvictim" }),
      }),
      { params: Promise.resolve({ id: "mkt_1" }) },
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: "unauthorized" });
  });

  it("refuses an unauthenticated bet — it now moves a real price via the book", async () => {
    // This is the regression guard for the actual hole: POST /api/v1/bets used
    // to read `walletAddress` straight out of the request body behind nothing
    // but a rate limit, and scripts/check-route-guards.mjs accepted that as
    // "guarded" because a rate limit counts as a guard call.
    const { POST } = await import("@/app/api/v1/bets/route");

    const res = await POST(
      new Request("http://localhost/api/v1/bets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marketId: "mkt_1",
          walletAddress: "0x000000000000000000000000000000000000dead",
          side: "YES",
          amount: 100,
        }),
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: "unauthorized" });
  });
});
