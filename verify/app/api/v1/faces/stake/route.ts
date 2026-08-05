import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import {
  getPerpMarket,
  stakeConviction,
  isSubjectPortraitEligible,
  type PositionLayer,
} from "@/lib/perp-store";
import { toFaceId } from "@/lib/persona-codex";

/**
 * POST /api/v1/faces/stake { marketId, face, layer, conviction }
 *
 * THE INTERLOCK (§6.2.4) is enforced here and not in the client: a market whose
 * subject is a named individual will not accept conviction unless that subject
 * has a registered, unexpired portrait key. The check is a live query rather
 * than a cached flag, because the failure mode it guards against — the registry
 * quietly lapsing while markets keep trading — is precisely the one a cached
 * flag would hide.
 */
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "faces-stake", 30, 60_000);
  if (isAuthResponse(auth)) return auth;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "staking needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const marketId = String(body.marketId ?? "");
    const conviction = Number(body.conviction);
    const layerRaw = String(body.layer ?? "permanent");
    const layer: PositionLayer =
      layerRaw === "transitory" ? "transitory" : layerRaw === "single" ? "single" : "permanent";
    const face = body.face ? toFaceId(String(body.face)) : null;

    if (!marketId) {
      return NextResponse.json({ success: false, error: "marketId required" }, { status: 400 });
    }
    if (!Number.isFinite(conviction) || conviction <= 0) {
      return NextResponse.json({ success: false, error: "positive conviction required" }, { status: 400 });
    }
    if (!face) {
      return NextResponse.json({ success: false, error: "a valid face is required" }, { status: 400 });
    }

    const pool = getDbPool();
    const market = await getPerpMarket(pool, marketId);
    if (!market) return NextResponse.json({ success: false, error: "market not found" }, { status: 404 });
    if (market.status !== "open") {
      return NextResponse.json({ success: false, error: `market is ${market.status}` }, { status: 409 });
    }

    if (market.subjectClass === "named_individual") {
      const eligible = await isSubjectPortraitEligible(pool, market.subjectRef);
      if (!eligible) {
        return NextResponse.json(
          { success: false, error: "portrait key not registered — market is interlocked" },
          { status: 409 },
        );
      }
    }

    const position = await stakeConviction(pool, {
      marketId,
      walletAddress: auth.owner,
      conviction,
      face,
      layer,
      entryLeg: market.legIndex,
    });
    if (!position) {
      return NextResponse.json({ success: false, error: "stake rejected" }, { status: 400 });
    }
    return NextResponse.json({ success: true, position });
  } catch (e) {
    console.error("faces/stake error:", e);
    return NextResponse.json({ success: false, error: "stake failed" }, { status: 500 });
  }
}
