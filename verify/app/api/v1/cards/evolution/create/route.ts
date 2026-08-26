import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { withRouteGuard } from "@/lib/with-route-guard";
import { createCardStats } from "@/lib/card-evolution";
import { hasDatabaseUrl } from "@/lib/database-url";

interface CreateBody {
  id?: unknown;
  name?: unknown;
  faction?: unknown;
  virtualSeed?: unknown;
}

/**
 * POST /api/v1/cards/evolution/create — mint a fresh VIRTUAL (off-chain,
 * Level-1, unminted) living card (Part V). No gas, no token — cards stay virtual
 * until they evolve to L3+. 503 without DATABASE_URL.
 *
 * `owner` is the session address. It used to be a free-text body field behind
 * a rate limit, so a card could be created under any owner string at all —
 * including one that is not an address and one belonging to someone else.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "card-evo-create", limit: 30, windowMs: 60_000 },
  async (req, { owner }) => {
  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) {
    return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      { success: false, error: "card evolution needs DATABASE_URL" },
      { status: 503 },
    );
  }

  const id =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : `card_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

  try {
    const pool = getDbPool();
    const card = await createCardStats(pool, {
      id,
      owner,
      name: typeof body.name === "string" ? body.name : null,
      faction: typeof body.faction === "string" ? body.faction : null,
      virtualSeed: typeof body.virtualSeed === "string" ? body.virtualSeed : null,
    });
    return NextResponse.json({ success: true, card });
  } catch (e) {
    console.error("card-evolution/create error:", e);
    return NextResponse.json({ success: false, error: "create failed" }, { status: 500 });
  }
  },
);
