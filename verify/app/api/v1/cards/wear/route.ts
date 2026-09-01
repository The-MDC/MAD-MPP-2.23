import { NextResponse } from "next/server";
import {
  calculateUsageWear,
  applyUsageWear,
  RARITY_ORDER,
  type Rarity,
} from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface WearBody {
  rarity?: unknown;
  durability?: unknown;
  uses?: unknown;
}

function isRarity(v: unknown): v is Rarity {
  return typeof v === "string" && (RARITY_ORDER as string[]).includes(v);
}

/**
 * POST /api/v1/cards/wear — pure usage-wear calculator (Part Q). Wraps
 * calculateUsageWear + applyUsageWear (rarity-tiered durability loss, 2–16% per
 * use, floored at 0). No DB — always available.
 */
// PUBLIC-ROUTE: Durability preview — computes wear and persists nothing.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "cards-wear", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as WearBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });
  if (!isRarity(body.rarity)) {
    return NextResponse.json({ success: false, error: "invalid rarity" }, { status: 400 });
  }

  const durability =
    body.durability == null ? 1 : Math.min(1, Math.max(0, Number(body.durability) || 0));
  const uses = Math.max(1, Math.floor(Number(body.uses) || 1));

  const wearPerUse = calculateUsageWear(body.rarity);
  const newDurability = applyUsageWear(durability, body.rarity, uses);

  return NextResponse.json({
    success: true,
    wear: {
      rarity: body.rarity,
      wearPerUse,
      wearPct: `${(wearPerUse * 100).toFixed(1)}%`,
      startDurability: durability,
      uses,
      newDurability,
      worn: newDurability <= 0,
      usesUntilWorn: Math.ceil(durability / wearPerUse),
    },
  });
}
