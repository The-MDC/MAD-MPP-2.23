import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { listPerpMarkets, latestSimplex } from "@/lib/perp-store";
import { DEMO_FACES, demoMarket, demoDecomposition } from "@/lib/perp-demo";
import { FACE_ORDER, stakeableLabel, type PersonaDisplayMode } from "@/lib/persona-codex";
import { legCountdown } from "@/lib/lunar-legs";

/**
 * GET /api/v1/faces?limit=&mode= — the FIVE FACES book.
 *
 * Live from Neon when configured; otherwise demo subjects through the real
 * decomposition (demo DATA, real math). Both paths return the same shape,
 * including the Codex definition bound to every price.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const mode: PersonaDisplayMode = url.searchParams.get("mode") === "broadcast" ? "broadcast" : "codex";
  const now = Date.now();

  const demo = () => {
    const markets = DEMO_FACES.slice(0, limit).map((d) => {
      const { result, slip } = demoDecomposition(d);
      const market = demoMarket(d, "faces", now);
      return {
        market,
        countdown: legCountdown(new Date(market.legClosesAt).getTime(), now),
        crowned: result.crowned,
        reading: result.reading,
        slip,
        labels: {
          permanent: FACE_ORDER.map((f) => stakeableLabel(f, result.permanentByFace[f], mode)),
          transitory: FACE_ORDER.map((f) => stakeableLabel(f, result.transitoryByFace[f], mode)),
        },
      };
    });
    return NextResponse.json({ success: true, source: "demo", mode, markets });
  };

  if (!hasDatabaseUrl()) return demo();

  try {
    const pool = getDbPool();
    const rows = await listPerpMarkets(pool, "faces", "open", limit);
    if (rows.length === 0) return demo();

    const markets = await Promise.all(
      rows.map(async (market) => {
        const simplex = await latestSimplex(pool, market.id);
        return {
          market,
          countdown: legCountdown(new Date(market.legClosesAt).getTime(), now),
          crowned: simplex?.crownedFace ?? null,
          reading: simplex
            ? { hPerm: simplex.hPerm, hTrans: simplex.hTrans, divergence: simplex.divergence }
            : null,
          slip: { isSlip: simplex?.isSlip ?? false },
          labels: simplex
            ? {
                permanent: FACE_ORDER.map((f) => stakeableLabel(f, simplex.permanent[f] ?? 0, mode)),
                transitory: FACE_ORDER.map((f) => stakeableLabel(f, simplex.transitory[f] ?? 0, mode)),
              }
            : null,
        };
      }),
    );
    return NextResponse.json({ success: true, source: "live", mode, markets });
  } catch (e) {
    console.error("faces list error:", e);
    return demo();
  }
}
