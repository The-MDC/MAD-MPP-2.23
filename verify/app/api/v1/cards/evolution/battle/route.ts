import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { withRouteGuard } from "@/lib/with-route-guard";
import { recordBattleResult, applyEvolution, getCardStats } from "@/lib/card-evolution";
import { hasDatabaseUrl } from "@/lib/database-url";

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
 *
 * ── Authenticated, and ownership-checked, which are two separate things ──
 * This route addresses a card by `id`. Adding a session alone would not have
 * fixed it: recordBattleResult() and applyEvolution() both take a bare id and
 * filter by nothing, so ANY signed-in user could still have battled and evolved
 * ANY card in the table by guessing or reading an id. That is the classic
 * insecure-direct-object-reference, and authentication does not close it —
 * an explicit `card.owner === session address` check does.
 *
 * The 404-not-403 on a foreign card is deliberate: distinguishing "exists but
 * is not yours" from "does not exist" hands an unauthenticated-ish caller a
 * card-id oracle for free.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "card-evo-battle", limit: 60, windowMs: 60_000 },
  async (req, { owner }) => {
  const body = (await req.json().catch(() => null)) as BattleBody | null;
  if (!body || typeof body.id !== "string" || body.id.trim() === "") {
    return NextResponse.json({ success: false, error: "card id required" }, { status: 400 });
  }
  if (typeof body.win !== "boolean") {
    return NextResponse.json({ success: false, error: "win (boolean) required" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "card evolution needs DATABASE_URL" }, { status: 503 });
  }

  const scandalDelta = Number.isFinite(Number(body.scandalDelta)) ? Number(body.scandalDelta) : 0;
  const buzzDelta = Number.isFinite(Number(body.buzzDelta)) ? Number(body.buzzDelta) : 0;
  const ownerMadconv = Math.max(0, Number(body.ownerMadconv) || 0);

  try {
    const pool = getDbPool();
    const cardId = body.id.trim();

    // Ownership gate, before any mutation.
    const existing = await getCardStats(pool, cardId);
    if (!existing || String(existing.owner).toLowerCase() !== owner) {
      return NextResponse.json({ success: false, error: "card not found" }, { status: 404 });
    }

    const afterBattle = await recordBattleResult(pool, cardId, body.win, scandalDelta, buzzDelta);
    if (!afterBattle) {
      return NextResponse.json({ success: false, error: "card not found" }, { status: 404 });
    }
    const evolved = await applyEvolution(pool, cardId, ownerMadconv);
    return NextResponse.json({
      success: true,
      card: evolved?.stats ?? afterBattle,
      result: evolved?.result ?? null,
    });
  } catch (e) {
    console.error("card-evolution/battle error:", e);
    return NextResponse.json({ success: false, error: "battle failed" }, { status: 500 });
  }
  },
);
