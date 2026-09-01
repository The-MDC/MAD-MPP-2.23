import { NextResponse } from "next/server";
import { scandalPackPrice, getAuctionPrice, SCANDAL_PACK_TIERS } from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface Body {
  serial?: unknown;
  auction?: {
    nowMs?: unknown;
    startMs?: unknown;
    endMs?: unknown;
    startPrice?: unknown;
    floorPrice?: unknown;
  };
}

/**
 * POST /api/v1/packs/price — scandal-pack bonding-curve price + optional
 * Dutch-auction price (Part X — surfaces scandalPackPrice + getAuctionPrice +
 * SCANDAL_PACK_TIERS). Pure, no DB.
 */
// PUBLIC-ROUTE: Pack price quote — pure maths, no DB, no charge.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "packs-price", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const serial = Number(body.serial);
  const packPrice = Number.isFinite(serial) && serial > 0 ? scandalPackPrice(serial) : null;

  let auctionPrice: number | null = null;
  if (body.auction && typeof body.auction === "object") {
    const a = body.auction;
    auctionPrice = getAuctionPrice(
      Number(a.nowMs) || Date.now(),
      Number(a.startMs) || 0,
      Number(a.endMs) || 0,
      Number(a.startPrice) || 0,
      Number(a.floorPrice) || 0,
    );
  }

  return NextResponse.json({
    success: true,
    pricing: { serial: Number.isFinite(serial) ? serial : null, scandalPackPrice: packPrice, auctionPrice, tiers: SCANDAL_PACK_TIERS },
  });
}
