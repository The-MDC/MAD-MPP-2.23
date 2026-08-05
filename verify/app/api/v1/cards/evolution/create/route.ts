import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createCardStats } from "@/lib/card-evolution";
import { hasDatabaseUrl } from "@/lib/database-url";

interface CreateBody {
  id?: unknown;
  owner?: unknown;
  name?: unknown;
  faction?: unknown;
  virtualSeed?: unknown;
}

/**
 * POST /api/v1/cards/evolution/create — mint a fresh VIRTUAL (off-chain,
 * Level-1, unminted) living card (Part V). No gas, no token — cards stay virtual
 * until they evolve to L3+. 503 without DATABASE_URL.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "card-evo-create", 30, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body || typeof body.owner !== "string" || body.owner.trim() === "") {
    return NextResponse.json({ success: false, error: "owner required" }, { status: 400 });
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
      owner: body.owner.trim(),
      name: typeof body.name === "string" ? body.name : null,
      faction: typeof body.faction === "string" ? body.faction : null,
      virtualSeed: typeof body.virtualSeed === "string" ? body.virtualSeed : null,
    });
    return NextResponse.json({ success: true, card });
  } catch (e) {
    console.error("card-evolution/create error:", e);
    return NextResponse.json({ success: false, error: "create failed" }, { status: 500 });
  }
}
