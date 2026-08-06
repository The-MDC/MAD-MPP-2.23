import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { listSuccession, recordSuccession, type SuccessionEdge } from "@/lib/perp-store";
import {
  buildSuccessionMatrix,
  conservationError,
  transmigrate,
  W_MEASURED,
  W_VOTED,
  type SuccessionVote,
} from "@/lib/succession";
import { SEED_SLATE, corporaOf } from "@/lib/trend-slate";
import { vintageAt } from "@/lib/lunar-legs";

/**
 * GET  /api/v1/zeitgeist/succession?from=&to= — the stored matrix for a Turning.
 * POST /api/v1/zeitgeist/succession — build S and (optionally) persist it.
 *
 * S is row-normalised, so conviction entering a Turning equals conviction
 * leaving it. The response always reports `conservationError`, and the write
 * path REFUSES a matrix that fails conservation — a leaky Turning silently
 * destroys holder value, and the only safe time to catch it is before the write.
 */
interface Body {
  fromVintage?: number;
  toVintage?: number;
  retiringCorpora?: string[][];
  candidateCorpora?: string[][];
  votes?: SuccessionVote[][];
  holdings?: number[];
  persist?: boolean;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return NextResponse.json({ success: false, error: "from and to vintages required" }, { status: 400 });
  }
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, source: "demo", edges: [] });
  }
  try {
    const edges = await listSuccession(getDbPool(), from, to);
    return NextResponse.json({ success: true, source: "live", edges });
  } catch (e) {
    console.error("zeitgeist/succession GET error:", e);
    return NextResponse.json({ success: true, source: "demo", edges: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const fromVintage = Number.isFinite(body.fromVintage as number)
      ? (body.fromVintage as number)
      : vintageAt() - 1;
    const toVintage = Number.isFinite(body.toVintage as number) ? (body.toVintage as number) : vintageAt();

    // Default to the seed slate on both sides so the endpoint is explorable
    // without a database — the maths is identical either way.
    const retiringCorpora = body.retiringCorpora ?? corporaOf(SEED_SLATE);
    const candidateCorpora = body.candidateCorpora ?? corporaOf(SEED_SLATE);

    const s = buildSuccessionMatrix({
      retiringCorpora,
      candidateCorpora,
      votes: body.votes,
    });

    const holdings = body.holdings ?? retiringCorpora.map(() => 1);
    const landed = transmigrate(holdings, s);
    const error = conservationError(holdings, landed);

    const edges: SuccessionEdge[] = [];
    s.matrix.forEach((row, i) => {
      row.forEach((share, j) => {
        edges.push({
          fromVintage,
          toVintage,
          fromSlot: i,
          toSlot: j,
          measured: s.measured[i][j],
          voted: s.voted[i][j],
          share,
        });
      });
    });

    let persisted = 0;
    if (body.persist && hasDatabaseUrl()) {
      if (!s.conserved || error > 1e-9) {
        return NextResponse.json(
          { success: false, error: "matrix fails conservation — refusing to persist", conservationError: error },
          { status: 422 },
        );
      }
      persisted = await recordSuccession(getDbPool(), fromVintage, toVintage, edges);
    }

    return NextResponse.json({
      success: true,
      fromVintage,
      toVintage,
      weights: { measured: W_MEASURED, voted: W_VOTED },
      matrix: s.matrix,
      measured: s.measured,
      voted: s.voted,
      conserved: s.conserved,
      conservationError: error,
      holdings,
      landed,
      edges,
      persisted,
    });
  } catch (e) {
    console.error("zeitgeist/succession POST error:", e);
    return NextResponse.json({ success: false, error: "succession failed" }, { status: 500 });
  }
}
