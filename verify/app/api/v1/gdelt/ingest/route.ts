import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { requireBearerSecret } from "@/lib/bearer-secret";
import { parseGdeltField, scoreGdeltRecord, type EmotionScores, type Emotion } from "@/lib/gdelt";
import { getWhitelist } from "@/lib/whitelist";
import { hasDatabaseUrl } from "@/lib/database-url";

interface IngestBody {
  headline?: unknown;
  url?: unknown;
  persons?: unknown;
  personsField?: unknown;
  themes?: unknown;
  themesField?: unknown;
  emotions?: unknown;
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
 * POST /api/v1/gdelt/ingest — ingest one GDELT record: parse → filter by the
 * Neon celebrity whitelist → score → persist to gdelt_signals (Part S). No file
 * watcher / eBPF anywhere; the whitelist is read from Neon. Degrades to a
 * non-persisted score when DATABASE_URL is absent.
 */
/**
 * OPERATOR ONLY (CRON_SECRET). This accepts a PUSHED GDELT record — parse,
 * whitelist-filter, score, persist — and `gdelt_signals` is read by seven
 * routes including /api/v1/markets/proposals, /api/v1/scandal/graph and the
 * platform chaos index in /api/v1/dopamine/metrics. An anonymous push
 * therefore did not just add a row: it fed fabricated scandal velocity into
 * market proposals and into a number the UI presents as measured. The
 * whitelist filter narrowed which subjects could be pushed; it never
 * established who was pushing.
 *
 * Note this is the PUSH counterpart to /api/v1/ingest/gdelt, which PULLS from
 * GDELT DOC 2.0 and has been bearer-guarded all along. Same table, same
 * downstream consumers, opposite direction — and only one of the two was
 * closed.
 */
export async function POST(req: Request) {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as IngestBody | null;
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
  const headline = typeof body.headline === "string" ? body.headline : null;
  const url = typeof body.url === "string" ? body.url : null;

  if (!hasDatabaseUrl()) {
    const score = scoreGdeltRecord({ persons, themes, emotions, whitelist: new Set() });
    return NextResponse.json({ success: true, persisted: false, score });
  }

  try {
    const pool = getDbPool();
    const whitelist = await getWhitelist(pool);
    const score = scoreGdeltRecord({ persons, themes, emotions, whitelist });

    const res = await pool.query(
      `INSERT INTO gdelt_signals
         (headline, url, persons, themes, person_matches, theme_scandal_weight, scandal_velocity, perp_probability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        headline,
        url,
        JSON.stringify(score.matchedPersons),
        JSON.stringify(score.themes),
        score.personMatches,
        score.themeScandalWeight,
        score.scandalVelocity,
        score.perpProbability,
      ],
    );
    const id = Number((res.rows[0] as { id: string | number }).id);
    return NextResponse.json({ success: true, persisted: true, id, score });
  } catch (e) {
    console.error("gdelt/ingest error:", e);
    const score = scoreGdeltRecord({ persons, themes, emotions, whitelist: new Set() });
    return NextResponse.json({ success: true, persisted: false, score });
  }
}
