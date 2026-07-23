import { NextResponse } from "next/server";
import { parseGdeltField, scoreGdeltRecord, type EmotionScores, type Emotion } from "@/lib/gdelt";
import { enforceRateLimit } from "@/lib/rate-limit";

interface ScoreBody {
  persons?: unknown;
  personsField?: unknown;
  themes?: unknown;
  themesField?: unknown;
  emotions?: unknown;
  whitelist?: unknown;
}

const EMO_KEYS: Emotion[] = ["shame", "anger", "disgust", "fear", "sadness", "joy"];

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function asEmotions(v: unknown): EmotionScores {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const out: EmotionScores = {};
  for (const k of EMO_KEYS) {
    const n = Number(o[k]);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

/**
 * POST /api/v1/gdelt/score — pure GDELT scandal scorer (Part S, no DB). Parses
 * V2Persons/V2Themes (raw delimited fields or arrays) + emotions, filters by an
 * optional whitelist, and returns the Perp-market trigger probability. Always
 * available — the calculator behind the Z-Liar / scandal-velocity surfaces.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "gdelt-score", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as ScoreBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const persons =
    typeof body.personsField === "string"
      ? parseGdeltField(body.personsField)
      : asStringArray(body.persons).map((s) => s.toLowerCase());
  const themes =
    typeof body.themesField === "string"
      ? parseGdeltField(body.themesField)
      : asStringArray(body.themes);
  const emotions = asEmotions(body.emotions);
  const whitelist = new Set(asStringArray(body.whitelist).map((s) => s.toLowerCase()));

  const score = scoreGdeltRecord({ persons, themes, emotions, whitelist });
  return NextResponse.json({ success: true, score });
}
