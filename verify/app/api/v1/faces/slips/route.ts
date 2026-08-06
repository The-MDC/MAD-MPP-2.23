import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { listSlips } from "@/lib/perp-store";
import { DEMO_FACES, demoDecomposition } from "@/lib/perp-demo";
import { SLIP_THRESHOLD } from "@/lib/persona-decompose";
import { MAX_ENTROPY } from "@/lib/persona-simplex";

/**
 * GET /api/v1/faces/slips — live Slips across the FIVE FACES book.
 *
 * A Slip is |D| past 34% of ln 5 — the mask visibly detached from the face
 * underneath, in either direction. It is the only FIVE FACES event that fires
 * without a verdict oracle: the maths alone decides, which is what makes it
 * safe to surface on the front page.
 */
export async function GET() {
  const demo = () => {
    const slips = DEMO_FACES.map((d) => {
      const { result, slip } = demoDecomposition(d);
      return {
        marketId: d.id,
        title: d.title,
        divergence: result.reading.divergence,
        normalised: result.reading.normalised,
        crowned: result.crowned,
        ...slip,
      };
    }).filter((s) => s.isSlip);
    return NextResponse.json({
      success: true,
      source: "demo",
      threshold: SLIP_THRESHOLD,
      maxEntropy: MAX_ENTROPY,
      slips,
    });
  };

  if (!hasDatabaseUrl()) return demo();

  try {
    const rows = await listSlips(getDbPool(), 20);
    return NextResponse.json({
      success: true,
      source: "live",
      threshold: SLIP_THRESHOLD,
      maxEntropy: MAX_ENTROPY,
      slips: rows.map((r) => ({
        marketId: r.marketId,
        legIndex: r.legIndex,
        divergence: r.divergence,
        normalised: MAX_ENTROPY > 0 ? r.divergence / MAX_ENTROPY : 0,
        crowned: r.crownedFace,
        isSlip: r.isSlip,
        direction: r.divergence > 0 ? "mask-detached" : "core-unstable",
      })),
    });
  } catch (e) {
    console.error("faces/slips error:", e);
    return demo();
  }
}
