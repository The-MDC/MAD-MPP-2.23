import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createMarket, listMarkets, type Market, type MarketStatus } from "@/lib/markets";

const STATUSES: MarketStatus[] = ["open", "resolving", "resolved", "disputed"];

interface CreateBody {
  id?: unknown;
  title?: unknown;
  category?: unknown;
  description?: unknown;
  creatorWallet?: unknown;
  yesOdds?: unknown;
  noOdds?: unknown;
}

/** GET /api/v1/markets?status=&limit= — list prediction markets (Part W). */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const statusRaw = params.get("status");
  const status = statusRaw && (STATUSES as string[]).includes(statusRaw) ? (statusRaw as MarketStatus) : undefined;
  const limit = Math.max(1, Math.min(100, Math.floor(Number(params.get("limit")) || 50)));

  const empty: Market[] = [];
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, markets: empty, source: "demo" });
  }
  try {
    const pool = getDbPool();
    const markets = await listMarkets(pool, status, limit);
    return NextResponse.json({ success: true, markets, source: "live" });
  } catch (e) {
    console.error("markets GET error:", e);
    return NextResponse.json({ success: true, markets: empty, source: "demo" });
  }
}

/** POST /api/v1/markets — create a prediction market (Part W). 503 without DB. */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "markets-create", 20, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json({ success: false, error: "title required" }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: false, error: "markets need DATABASE_URL" }, { status: 503 });
  }

  const id =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : `mkt_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const clampOdds = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 1 ? Math.min(100, n) : d;
  };

  try {
    const pool = getDbPool();
    const market = await createMarket(pool, {
      id,
      title: body.title.trim(),
      category: typeof body.category === "string" ? body.category : "general",
      description: typeof body.description === "string" ? body.description : null,
      creatorWallet:
        typeof body.creatorWallet === "string" && /^0x[0-9a-fA-F]{40}$/.test(body.creatorWallet)
          ? body.creatorWallet
          : null,
      yesOdds: clampOdds(body.yesOdds, 2.0),
      noOdds: clampOdds(body.noOdds, 2.0),
    });
    return NextResponse.json({ success: true, market });
  } catch (e) {
    console.error("markets POST error:", e);
    return NextResponse.json({ success: false, error: "create failed" }, { status: 500 });
  }
}
