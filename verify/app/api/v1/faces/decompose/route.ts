import { NextResponse } from "next/server";
import { FACE_ORDER, type FaceId, stakeableLabel, type PersonaDisplayMode } from "@/lib/persona-codex";
import { fromFaceRecord } from "@/lib/persona-simplex";
import { decompose, detectSlip, type SimplexState } from "@/lib/persona-decompose";

/**
 * POST /api/v1/faces/decompose — run one decomposition step.
 *
 * { observed: {saint: n, ...} | number[], shocks?, state?, mode? }
 *
 * Pure maths, no database. It exists as an endpoint so the Waterline can
 * preview a decomposition before anything is staked, and so the same code path
 * that settles a leg is the one a trader can poke at. Every returned price
 * carries its Codex definition — there is no shape of this response that hands
 * a client a number without the sentence that qualifies it.
 */
interface Body {
  observed?: Record<string, number> | number[];
  shocks?: Record<string, number> | number[];
  state?: SimplexState;
  mode?: string;
}

function toVector(v: Record<string, number> | number[] | undefined): number[] {
  if (Array.isArray(v)) return FACE_ORDER.map((_, i) => Number(v[i]) || 0);
  if (v && typeof v === "object") return fromFaceRecord(v as Partial<Record<FaceId, number>>);
  return FACE_ORDER.map(() => 1 / FACE_ORDER.length);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const mode: PersonaDisplayMode = body.mode === "broadcast" ? "broadcast" : "codex";

    const observed = toVector(body.observed);
    if (observed.every((x) => x === 0)) {
      return NextResponse.json({ success: false, error: "observed vector required" }, { status: 400 });
    }

    const result = decompose({
      observed,
      shocks: body.shocks ? toVector(body.shocks) : undefined,
      state: body.state,
    });
    const slip = detectSlip(result.reading);

    return NextResponse.json({
      success: true,
      crowned: result.crowned,
      permanent: result.permanentByFace,
      transitory: result.transitoryByFace,
      // The stakeable surface: price and definition as one unit, both layers.
      labels: {
        permanent: FACE_ORDER.map((f) => stakeableLabel(f, result.permanentByFace[f], mode)),
        transitory: FACE_ORDER.map((f) => stakeableLabel(f, result.transitoryByFace[f], mode)),
      },
      reading: result.reading,
      tau: { permanent: result.tauPerm, transitory: result.tauTrans },
      slip,
      nextState: result.nextState,
    });
  } catch (e) {
    console.error("faces/decompose error:", e);
    return NextResponse.json({ success: false, error: "decomposition failed" }, { status: 500 });
  }
}
