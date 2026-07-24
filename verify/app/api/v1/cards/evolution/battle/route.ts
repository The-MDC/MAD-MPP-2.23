import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { recordBattleResult, applyEvolution } from "@/lib/card-evolution";

interface BattleBody {
  id?: unknown;
  win?: unknown;
  scandalDelta?: unknown;
  buzzDelta?: unknown;
  ownerMadconv?: unknown;
}

/**
 * POST /api/v1/cards/evolution/battle — record a battle result, then re-score +
 * apply evolution (level, abilities, clown state) in one call (Part V). Returns
 * the updated card + the evolution result (incl. mintGateOpen at L3+). 503
 * without DATABASE_URL — this path is genuinely DB-backed.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "card-evo-battle", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as BattleBody | null;
  if (!body || typeof body.id !== "string" || body.id.trim() === "") {
    return NextResponse.json({ success: false, error: "card id required" }, { status: 400 });
  }
  if (typeof body.win !== "boolean") {
    return NextResponse.json({ success: false, error: "win (boolean) required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "card evolution needs DATABASE_URL" }, { status: 503 });
  }

  const scandalDelta = Number.isFinite(Number(body.scandalDelta)) ? Number(body.scandalDelta) : 0;
  const buzzDelta = Number.isFinite(Number(body.buzzDelta)) ? Number(body.buzzDelta) : 0;
  const ownerMadconv = Math.max(0, Number(body.ownerMadconv) || 0);

  try {
    const pool = getDbPool();
    const afterBattle = await recordBattleResult(pool, body.id.trim(), body.win, scandalDelta, buzzDelta);
    if (!afterBattle) {
      return NextResponse.json({ success: false, error: "card not found" }, { status: 404 });
    }
    const evolved = await applyEvolution(pool, body.id.trim(), ownerMadconv);
    return NextResponse.json({
      success: true,
      card: evolved?.stats ?? afterBattle,
      result: evolved?.result ?? null,
    });
  } catch (e) {
    console.error("card-evolution/battle error:", e);
    return NextResponse.json({ success: false, error: "battle failed" }, { status: 500 });
  }
}
