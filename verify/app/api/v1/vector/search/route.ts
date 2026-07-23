import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { searchIntel, vectorSearchAvailable, type IntelDoc } from "@/lib/vector-store";

interface SearchBody {
  query?: unknown;
  k?: unknown;
}

/**
 * POST /api/v1/vector/search — semantic nearest-neighbour search over
 * market_intelligence (Part R build). Real pgvector HNSW cosine recall via
 * Gemini embeddings. Degrades to an empty "demo" result when DB or
 * GOOGLE_API_KEY is absent, so the surface never hard-fails.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "vector-search", 30, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as SearchBody | null;
  if (!body || typeof body.query !== "string" || body.query.trim() === "") {
    return NextResponse.json({ success: false, error: "query required" }, { status: 400 });
  }
  const k = Math.max(1, Math.min(20, Math.floor(Number(body.k) || 5)));

  const empty: IntelDoc[] = [];
  if (!vectorSearchAvailable()) {
    return NextResponse.json({ success: true, results: empty, source: "demo" });
  }

  try {
    const pool = getDbPool();
    const results = await searchIntel(pool, body.query, k);
    return NextResponse.json({ success: true, results, source: "live" });
  } catch (e) {
    console.error("vector/search error:", e);
    return NextResponse.json({ success: true, results: empty, source: "demo" });
  }
}
