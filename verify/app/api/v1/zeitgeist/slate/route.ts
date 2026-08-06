import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { listSlate } from "@/lib/perp-store";
import { SEED_SLATE, slotFaceVector, corporaOf } from "@/lib/trend-slate";
import { trendLife } from "@/lib/trend-lifecycle";
import { FACE_ORDER, stakeableLabel, type PersonaDisplayMode } from "@/lib/persona-codex";
import { currentLeg, vintageAt } from "@/lib/lunar-legs";

/**
 * GET /api/v1/zeitgeist/slate?vintage=&mode= — the live slate.
 *
 * Falls back to the seed slate (ZEITGEIST §2) when there is no database, which
 * is the correct fallback rather than an empty list: the seed slate is real,
 * sourced and auditable, and the lifecycle maths runs on it identically.
 *
 * Every slot ships with its corpus and sources. That is not garnish — it is the
 * input `corpusLineage` scores the next slate against, so a slot whose corpus
 * is hidden is a slot whose succession cannot be checked.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode: PersonaDisplayMode = url.searchParams.get("mode") === "broadcast" ? "broadcast" : "codex";
  const now = Date.now();
  const leg = currentLeg(now);
  const requested = Number(url.searchParams.get("vintage"));
  const vintage = Number.isFinite(requested) && requested > 0 ? requested : vintageAt(now);

  const seed = () => {
    const slots = SEED_SLATE.map((s, i) => {
      const faces = slotFaceVector(s);
      return {
        slotIndex: i,
        trendKey: s.key,
        trendName: s.name,
        question: s.question,
        corpus: s.corpus,
        sources: s.sources,
        labels: FACE_ORDER.map((f) => stakeableLabel(f, faces[f], mode)),
        life: trendLife({ leg: leg.slotInTurning }),
        status: "active" as const,
      };
    });
    return NextResponse.json({
      success: true,
      source: "seed",
      mode,
      vintage,
      slotInTurning: leg.slotInTurning,
      slots,
      corpora: corporaOf(SEED_SLATE),
    });
  };

  if (!hasDatabaseUrl()) return seed();

  try {
    const rows = await listSlate(getDbPool(), vintage);
    if (rows.length === 0) return seed();
    const slots = rows.map((r) => ({
      slotIndex: r.slotIndex,
      trendKey: r.trendKey,
      trendName: r.trendName,
      question: "",
      corpus: r.corpus,
      sources: r.sources,
      labels: FACE_ORDER.map((f) => stakeableLabel(f, Number(r.faceScores[f]) || 0, mode)),
      life: trendLife({ leg: leg.slotInTurning }),
      status: r.status,
    }));
    return NextResponse.json({
      success: true,
      source: "live",
      mode,
      vintage,
      slotInTurning: leg.slotInTurning,
      slots,
      corpora: rows.map((r) => r.corpus),
    });
  } catch (e) {
    console.error("zeitgeist/slate error:", e);
    return seed();
  }
}
