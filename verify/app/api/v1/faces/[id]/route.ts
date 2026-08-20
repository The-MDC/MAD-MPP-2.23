import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import {
  getPerpMarket,
  latestSimplex,
  simplexHistory,
  marketConviction,
  convictionByFace,
} from "@/lib/perp-store";
import { findDemoFaces, demoMarket, demoDecomposition } from "@/lib/perp-demo";
import { FACE_ORDER, stakeableLabel, type PersonaDisplayMode } from "@/lib/persona-codex";
import { legCountdown } from "@/lib/lunar-legs";

/**
 * GET /api/v1/faces/<id>?mode= — one FIVE FACES market with its leg history.
 *
 * The history is what THE WATERLINE draws: permanent vs transitory entropy over
 * legs, with the Divergence between them shaded. A single leg tells you nothing
 * — the whole product is the gap between the two lines over time.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mode: PersonaDisplayMode =
    new URL(req.url).searchParams.get("mode") === "broadcast" ? "broadcast" : "codex";
  const now = Date.now();

  const demo = () => {
    const d = findDemoFaces(id);
    if (!d) return NextResponse.json({ success: false, error: "market not found" }, { status: 404 });
    const { result, slip } = demoDecomposition(d);
    const market = demoMarket(d, "faces", now);
    return NextResponse.json({
      success: true,
      source: "demo",
      market,
      countdown: legCountdown(new Date(market.legClosesAt).getTime(), now),
      crowned: result.crowned,
      reading: result.reading,
      tau: { permanent: result.tauPerm, transitory: result.tauTrans },
      slip,
      labels: {
        permanent: FACE_ORDER.map((f) => stakeableLabel(f, result.permanentByFace[f], mode)),
        transitory: FACE_ORDER.map((f) => stakeableLabel(f, result.transitoryByFace[f], mode)),
      },
      history: [
        {
          legIndex: 0,
          hPerm: result.reading.hPerm,
          hTrans: result.reading.hTrans,
          divergence: result.reading.divergence,
          isSlip: slip.isSlip,
        },
      ],
      book: { conviction: 0, byFacePermanent: {}, byFaceTransitory: {} },
    });
  };

  if (!hasDatabaseUrl()) return demo();

  try {
    const pool = getDbPool();
    const market = await getPerpMarket(pool, id);
    if (!market) return demo();

    const [simplex, history, conviction, permBook, transBook] = await Promise.all([
      latestSimplex(pool, id),
      simplexHistory(pool, id, 24),
      marketConviction(pool, id),
      convictionByFace(pool, id, "permanent"),
      convictionByFace(pool, id, "transitory"),
    ]);

    return NextResponse.json({
      success: true,
      source: "live",
      market,
      countdown: legCountdown(new Date(market.legClosesAt).getTime(), now),
      crowned: simplex?.crownedFace ?? null,
      reading: simplex
        ? { hPerm: simplex.hPerm, hTrans: simplex.hTrans, divergence: simplex.divergence }
        : null,
      tau: { permanent: simplex?.tauPerm ?? null, transitory: simplex?.tauTrans ?? null },
      slip: { isSlip: simplex?.isSlip ?? false },
      labels: simplex
        ? {
            permanent: FACE_ORDER.map((f) => stakeableLabel(f, simplex.permanent[f] ?? 0, mode)),
            transitory: FACE_ORDER.map((f) => stakeableLabel(f, simplex.transitory[f] ?? 0, mode)),
          }
        : null,
      history: history.map((h) => ({
        legIndex: h.legIndex,
        hPerm: h.hPerm,
        hTrans: h.hTrans,
        divergence: h.divergence,
        isSlip: h.isSlip,
      })),
      book: { conviction, byFacePermanent: permBook, byFaceTransitory: transBook },
    });
  } catch (e) {
    console.error("faces detail error:", e);
    return demo();
  }
}
