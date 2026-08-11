/**
 * GET /api/v1/cards/showcase — a display set of MADHATs Gambit game cards.
 *
 * The landing hub's game-card carousel needs actual cards. The existing
 * /api/v1/cards returns deck METADATA (rarity tiers, factions, pack cost) and
 * /api/v1/cards/collection/[wallet] needs a wallet, so neither can feed a
 * showcase rail for a visitor who has not connected one. This endpoint fills
 * that gap and nothing else.
 *
 * Deterministic by construction: cards come from generateCard(index, seed),
 * the same generator the pack opener uses, seeded by CARD_GENERATION_SEED. The
 * same request returns the same cards, so the rail does not reshuffle under the
 * user between polls and server and client agree on first paint.
 *
 * Read-only. No wallet, no session, no database write, no user input beyond a
 * clamped count.
 */
import { NextResponse } from "next/server";
import { generateCard, PLATFORM } from "@/lib/gambit-game-math";

/** Hard ceiling — a showcase rail, not a bulk export. */
const MAX_COUNT = 24;
const DEFAULT_COUNT = 12;

export function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("count");
    // Parsed, floored and clamped: a caller asking for 10_000 gets MAX_COUNT,
    // and anything unparseable falls back to the default rather than NaN.
    const parsed = raw === null ? DEFAULT_COUNT : Number.parseInt(raw, 10);
    const count = Number.isFinite(parsed)
      ? Math.min(MAX_COUNT, Math.max(1, Math.floor(parsed)))
      : DEFAULT_COUNT;

    const seed = PLATFORM.CARD_GENERATION_SEED;
    // guaranteeUncommonPlus: a showcase should look like the deck at its best,
    // matching the pack guarantee rather than showing a rail of commons.
    const cards = Array.from({ length: count }, (_, i) => generateCard(i, seed, true));

    return NextResponse.json(
      { success: true, count: cards.length, seed, cards },
      // Deterministic output, so it is safely cacheable at the edge.
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Card showcase unavailable" },
      { status: 500 },
    );
  }
}
