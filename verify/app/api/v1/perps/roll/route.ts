import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import {
  convictionByFace,
  latestSimplex,
  listMaturedMarkets,
  recordSimplex,
  rollLeg,
} from "@/lib/perp-store";
import { FACE_ORDER, type FaceId } from "@/lib/persona-codex";
import { decompose, detectSlip, type SimplexState } from "@/lib/persona-decompose";
import { fromFaceRecord } from "@/lib/persona-simplex";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireBearerSecret } from "@/lib/bearer-secret";

/**
 * POST /api/v1/perps/roll — settle every matured leg and open the next one.
 *
 * The scheduler entry point. Three properties matter here:
 *
 *   IDEMPOTENT. `rollLeg` only advances a market whose leg has actually closed,
 *   so a cron that double-fires cannot skip a leg or double-crown a face.
 *
 *   SETTLE THEN ROLL. The closing leg's decomposition is written under the leg
 *   index it belongs to BEFORE the market advances. Rolling first would file the
 *   crowned face under the leg that hasn't traded yet.
 *
 *   FILTER STATE CARRIES. Each market's per-face CGARCH state is read from its
 *   last row and written forward. Losing it would silently reset every
 *   persistence reading to a cold start, which is indistinguishable from
 *   "everyone is suddenly forgiven".
 */
export async function POST(req: Request) {
  const auth = requireBearerSecret(req, "CRON_SECRET");
  if (auth) return auth;

  const limited = enforceRateLimit(req, "perps-roll", 6, 60_000);
  if (limited) return limited;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "roll needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const pool = getDbPool();
    const matured = await listMaturedMarkets(pool, 200);
    const rolled: { id: string; legIndex: number; crowned: FaceId | null; isSlip: boolean }[] = [];

    for (const market of matured) {
      let crowned: FaceId | null = null;
      let isSlip = false;

      if (market.family === "faces") {
        const prior = await latestSimplex(pool, market.id);
        const book = await convictionByFace(pool, market.id, "permanent");
        const observed = fromFaceRecord(book as Partial<Record<FaceId, number>>);
        // A market with no conviction on it still has to settle — an empty book
        // is a uniform prior, not an error.
        const anyStake = observed.some((x) => x > 0);
        const decomposition = decompose({
          observed: anyStake ? observed : FACE_ORDER.map(() => 1 / FACE_ORDER.length),
          state: (prior?.filterState as SimplexState | undefined) ?? undefined,
        });
        const slip = detectSlip(decomposition.reading);
        crowned = decomposition.crowned;
        isSlip = slip.isSlip;

        await recordSimplex(pool, {
          marketId: market.id,
          legIndex: market.legIndex,
          permanent: decomposition.permanentByFace,
          transitory: decomposition.transitoryByFace,
          hPerm: decomposition.reading.hPerm,
          hTrans: decomposition.reading.hTrans,
          divergence: decomposition.reading.divergence,
          tauPerm: decomposition.tauPerm,
          tauTrans: decomposition.tauTrans,
          crownedFace: decomposition.crowned,
          isSlip: slip.isSlip,
          filterState: decomposition.nextState as unknown as Record<string, unknown>,
        });
      }

      await rollLeg(pool, market.id);
      rolled.push({ id: market.id, legIndex: market.legIndex, crowned, isSlip });
    }

    return NextResponse.json({ success: true, matured: matured.length, rolled });
  } catch (e) {
    console.error("perps/roll error:", e);
    return NextResponse.json({ success: false, error: "roll failed" }, { status: 500 });
  }
}
