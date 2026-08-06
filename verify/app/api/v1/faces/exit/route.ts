import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import {
  getPosition,
  latestSimplex,
  markPositionCooling,
  marketConviction,
  redeemPosition,
} from "@/lib/perp-store";
import { exitCountdown, redemptionValue, requestExit } from "@/lib/position-exit";

/**
 * POST /api/v1/faces/exit { positionId, action: "request" | "redeem" }
 *
 * The §5.1 valve. `request` opens the cooldown and LOCKS the price at that
 * instant; `redeem` pays the locked price once the cooldown matures.
 *
 * Ownership is checked against the session on both actions. Maturity is checked
 * in SQL, not here, so a client cannot rush redemption by lying about the time.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "faces-exit", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "exit needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const positionId = Number(body.positionId);
    const action = String(body.action ?? "request");
    if (!Number.isFinite(positionId)) {
      return NextResponse.json({ success: false, error: "positionId required" }, { status: 400 });
    }

    const pool = getDbPool();
    const position = await getPosition(pool, positionId);
    if (!position) return NextResponse.json({ success: false, error: "position not found" }, { status: 404 });
    if (position.walletAddress !== auth.owner) {
      return NextResponse.json({ success: false, error: "not your position" }, { status: 403 });
    }

    if (action === "redeem") {
      const redeemed = await redeemPosition(pool, positionId);
      if (!redeemed) {
        const readyAt = position.exitReadyAt ? Date.parse(position.exitReadyAt) : 0;
        return NextResponse.json(
          {
            success: false,
            error: "not redeemable yet",
            countdown: exitCountdown({ status: position.exitStatus, readyAt }),
          },
          { status: 409 },
        );
      }
      return NextResponse.json({
        success: true,
        position: redeemed,
        payout: redemptionValue({ lockedPrice: redeemed.exitPrice ?? 0 }, redeemed.conviction),
      });
    }

    if (position.exitStatus !== "active") {
      return NextResponse.json({ success: false, error: `position is ${position.exitStatus}` }, { status: 409 });
    }

    // The locked price is this face's weight in the layer the position sits on.
    const simplex = await latestSimplex(pool, position.marketId);
    const layerPrices =
      position.layer === "transitory" ? simplex?.transitory : simplex?.permanent;
    const price = position.face && layerPrices ? layerPrices[position.face] ?? 0 : 0;

    const total = await marketConviction(pool, position.marketId);
    const ticket = requestExit({
      conviction: position.conviction,
      marketConviction: total,
      price,
    });
    const cooling = await markPositionCooling(
      pool,
      positionId,
      ticket.requestedAt,
      ticket.readyAt,
      ticket.lockedPrice,
    );
    if (!cooling) {
      return NextResponse.json({ success: false, error: "exit request rejected" }, { status: 409 });
    }
    return NextResponse.json({
      success: true,
      position: cooling,
      ticket,
      countdown: exitCountdown(ticket),
    });
  } catch (e) {
    console.error("faces/exit error:", e);
    return NextResponse.json({ success: false, error: "exit failed" }, { status: 500 });
  }
}
