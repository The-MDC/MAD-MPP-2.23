import { NextResponse } from "next/server";
import {
  FACE_ORDER,
  FACES,
  FACE_FLOOR,
  FACE_CEILING,
  faceHalfLifeLegs,
  stakeableLabel,
  type PersonaDisplayMode,
} from "@/lib/persona-codex";
import { LEG_DAYS, LEGS_PER_TURNING, TURNING_DAYS } from "@/lib/lunar-legs";

/**
 * GET /api/v1/faces/codex?mode=codex|broadcast — the five-face axis.
 *
 * Pure: no database, no market state. This is the definitional surface every
 * FIVE FACES client reads before it renders a single price.
 *
 * WHAT IS DELIBERATELY ABSENT:
 *   · catchphrases — flavour never travels on a stakeable surface (§2)
 *   · ρ / γ / α — the tuning is proprietary and server-side. The DERIVED
 *     half-life ships instead, because a trader needs to know that a Saint
 *     reading decays in ~11 legs and a Sellout reading in ~138 without being
 *     handed the parameters that produce those numbers.
 */
export function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("mode");
  const mode: PersonaDisplayMode = raw === "broadcast" ? "broadcast" : "codex";

  const faces = FACE_ORDER.map((id) => {
    const def = FACES[id];
    // Price 0 here: the codex has no market state. Clients overwrite the price
    // from a live simplex — but the definition travels bound to it regardless.
    const label = stakeableLabel(id, 0, mode);
    return {
      id,
      codexName: def.codexName,
      broadcastName: def.broadcastName,
      name: label.name,
      definition: label.definition,
      halfLifeLegs: Number(faceHalfLifeLegs(id).toFixed(1)),
    };
  });

  return NextResponse.json({
    success: true,
    mode,
    faces,
    band: { floor: FACE_FLOOR, ceiling: FACE_CEILING },
    cadence: {
      legDays: Number(LEG_DAYS.toFixed(3)),
      legsPerTurning: LEGS_PER_TURNING,
      turningDays: Number(TURNING_DAYS.toFixed(3)),
    },
  });
}
