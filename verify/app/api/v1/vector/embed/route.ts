import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
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
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "vector-embed", 20, 60_000);
  if (limited) return limited;

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
}
