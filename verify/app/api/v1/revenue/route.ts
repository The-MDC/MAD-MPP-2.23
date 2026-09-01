import { NextResponse } from "next/server";
import { PLATFORM } from "@/lib/gambit-game-math";
import {
  REVENUE_STREAMS,
  projectStream,
  projectAllStreams,
  type StreamId,
} from "@/lib/revenue-engine";

/**
 * GET /api/v1/revenue
 * The canonical 5-stream revenue model + a fee-split calculator.
 *
 * Query:
 *   (none)                  → the model (fee bps, splits, the 5 streams)
 *   ?volume=<n>             → roll-up across all streams at that volume
 *   ?volume=<n>&stream=<id> → one stream's projection
 *   &creator=true           → treat as a creator-made market (routes the 40% cut)
 *
 * Fee model is a TWO-STAGE WATERFALL, corrected 2026-08-27: the creator is
 * paid off the gross on their own markets, and the community's 28.8% comes
 * off the NET that remains — not off the gross.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const volumeRaw = url.searchParams.get("volume");
  const streamId = url.searchParams.get("stream") as StreamId | null;
  const isCreator = url.searchParams.get("creator") === "true";

  const model = {
    feeBps: PLATFORM.FEE_BPS,
    feePct: PLATFORM.FEE_BPS / 100,
    // Both percentages are meaningless without their base. The creator's is a
    // share of the GROSS fee; the community's is a share of the NET that
    // remains after the creator is paid. Reporting the bare numbers is how the
    // old flat-three-way reading survived as long as it did.
    creatorSharePct: PLATFORM.CREATOR_SHARE_BPS / 100,
    creatorShareBase: "gross",
    communitySharePct: PLATFORM.COMMUNITY_SHARE_BPS / 100,
    communityShareBase: "platformNet",
    streams: REVENUE_STREAMS,
  };

  if (volumeRaw == null) {
    return NextResponse.json({ success: true, model });
  }

  const volume = Number(volumeRaw);
  if (Number.isNaN(volume) || volume < 0) {
    return NextResponse.json({ success: false, error: "invalid volume" }, { status: 400 });
  }

  if (streamId && REVENUE_STREAMS.some((s) => s.id === streamId)) {
    return NextResponse.json({
      success: true,
      model,
      projection: projectStream(streamId, volume, isCreator),
    });
  }

  const volumes = Object.fromEntries(
    REVENUE_STREAMS.map((s) => [s.id, volume]),
  ) as Partial<Record<StreamId, number>>;
  return NextResponse.json({ success: true, model, rollup: projectAllStreams(volumes, isCreator) });
}
