import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import { getPerpMarket, stakeConviction } from "@/lib/perp-store";
import { vintageAt } from "@/lib/lunar-legs";
import { getPauseState } from "@/lib/registrar-queue";

/**
 * POST /api/v1/perps/convict { marketId, conviction }
 *
 * Conviction on a ZEITGEIST slot or an EPIPHANY model — the faceless families.
 * FIVE FACES has its own endpoint because a position there is meaningless
 * without a face and a layer; here a position is just conviction on the subject,
 * so one route serves both rather than two routes serving one paragraph each.
 *
 * ZEITGEIST positions are stamped with the VINTAGE at entry. That stamp is what
 * survives THE TURNING: after transmigration the position is still traceable to
 * the slate it was originally taken on, which is the whole provenance story.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "perps-convict", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "conviction needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const marketId = String(body.marketId ?? "");
    const conviction = Number(body.conviction);
    if (!marketId) {
      return NextResponse.json({ success: false, error: "marketId required" }, { status: 400 });
    }
    if (!Number.isFinite(conviction) || conviction <= 0) {
      return NextResponse.json({ success: false, error: "positive conviction required" }, { status: 400 });
    }

    const pool = getDbPool();

    // PAUSE_GUARDIAN halts new conviction platform-wide — every family, not
    // just the one with named subjects on it.
    const pause = await getPauseState(pool);
    if (pause.paused) {
      return NextResponse.json(
        { success: false, error: "new conviction is halted", reason: pause.reason },
        { status: 503 },
      );
    }

    const market = await getPerpMarket(pool, marketId);
    if (!market) return NextResponse.json({ success: false, error: "market not found" }, { status: 404 });
    if (market.family === "faces") {
      return NextResponse.json(
        { success: false, error: "use /api/v1/faces/stake — a FIVE FACES position needs a face" },
        { status: 400 },
      );
    }
    if (market.status !== "open") {
      return NextResponse.json({ success: false, error: `market is ${market.status}` }, { status: 409 });
    }

    const staked = await stakeConviction(pool, {
      marketId,
      walletAddress: auth.owner,
      conviction,
      layer: "single",
      entryLeg: market.legIndex,
      vintage: market.family === "zeitgeist" ? vintageAt() : null,
    });

    // CONVICTION NOW COSTS $MADx. `stakeConviction` debits the ledger inside its
    // own transaction, so the two refusals have to be distinguishable: 402 means
    // the wallet is short, 400 means the request was malformed. Collapsing both
    // into 400 — which is what `if (!position)` did while the result was
    // `PerpPosition | null` — told a user with an empty balance that their
    // client had sent a bad request.
    if (typeof staked === "string") {
      const status = staked === "insufficient-balance" ? 402 : 400;
      const error =
        staked === "insufficient-balance"
          ? "insufficient $MADx balance"
          : "positive conviction required";
      return NextResponse.json({ success: false, error }, { status });
    }

    // The fee breakdown is returned, not just the position, so the panel can
    // show what was charged rather than implying the whole stake landed on the
    // subject. The split is the §6 computation, recorded not distributed.
    return NextResponse.json({
      success: true,
      position: staked.position,
      spend: staked.spend,
      fee: staked.fee,
      net: staked.net,
      split: staked.split,
    });
  } catch (e) {
    console.error("perps/convict error:", e);
    return NextResponse.json({ success: false, error: "conviction failed" }, { status: 500 });
  }
}
