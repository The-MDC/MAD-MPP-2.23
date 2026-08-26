import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { withRouteGuard } from "@/lib/with-route-guard";
import { upsertIntel, vectorSearchAvailable } from "@/lib/vector-store";

interface EmbedBody {
  title?: unknown;
  content?: unknown;
  url?: unknown;
  metadata?: unknown;
}

/**
 * POST /api/v1/vector/embed — embed + store one intelligence document into the
 * pgvector store (Part R build). Requires DB + GOOGLE_API_KEY; returns 503 when
 * unavailable so callers can degrade. Rate-limited (embedding calls cost).
 */
/**
 * Signed-in only. Each call is a paid embedding request to a third-party
 * model AND a write, so an anonymous caller could spend the project's budget
 * and fill the table at the rate limiter's ceiling. No client caller.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "vector-embed", limit: 20, windowMs: 60_000 },
  async (req) => {

  const body = (await req.json().catch(() => null)) as EmbedBody | null;
  if (!body || typeof body.title !== "string" || typeof body.content !== "string") {
    return NextResponse.json({ success: false, error: "title and content required" }, { status: 400 });
  }

  if (!vectorSearchAvailable()) {
    return NextResponse.json(
      { success: false, error: "vector store unavailable (needs DATABASE_URL + GOOGLE_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const pool = getDbPool();
    const id = await upsertIntel(pool, {
      title: body.title,
      content: body.content,
      url: typeof body.url === "string" ? body.url : null,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : {},
    });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("vector/embed error:", e);
    return NextResponse.json({ success: false, error: "embed failed" }, { status: 500 });
  }
  },
);
