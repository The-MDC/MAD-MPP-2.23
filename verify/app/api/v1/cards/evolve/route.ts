import { NextResponse } from "next/server";
import {
  nextEvolution,
  attemptEvolution,
  EVOLUTION_LADDER,
  RARITY_ORDER,
  type Rarity,
  type EvolvableCard,
} from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface EvolveBody {
  mode?: unknown; // 'ladder' | 'vrf'
  rarity?: unknown; // ladder lane
  card?: {
    powerLevel?: unknown;
    cloutMultiplier?: unknown;
    evolutionStage?: unknown;
    durability?: unknown;
    earnsCount?: unknown;
  };
  buzzScore?: unknown;
  volatilityIndex?: unknown;
}

function isRarity(v: unknown): v is Rarity {
  return typeof v === "string" && (RARITY_ORDER as string[]).includes(v);
}

/**
 * POST /api/v1/cards/evolve — evolution PREVIEW (Part Q). Two lanes:
 *  - mode='ladder': deterministic burn-ladder requirements (nextEvolution).
 *  - mode='vrf': chance-based simulate via attemptEvolution — NON-authoritative
 *    (uses Math.random; the real roll is on-chain VRF, Phase-3 gated).
 * Pure, no DB, no card destroyed — never mutates a real collection.
 */
// PUBLIC-ROUTE: Evolution preview — computes a projected result and persists nothing.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "cards-evolve", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as EvolveBody | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const mode = body.mode === "vrf" ? "vrf" : "ladder";

  if (mode === "ladder") {
    if (!isRarity(body.rarity)) {
      return NextResponse.json({ success: false, error: "invalid rarity" }, { status: 400 });
    }
    const step = nextEvolution(body.rarity);
    return NextResponse.json({
      success: true,
      mode,
      ladder: EVOLUTION_LADDER,
      next: step,
      atMax: step === null,
      note: step
        ? `Burn ${step.cardsRequired} ${body.rarity} + ${step.xpRequired} XP → ${step.to}`
        : `${body.rarity} is at the top of the burn ladder`,
    });
  }

  // VRF simulate lane
  const c = body.card ?? {};
  const card: EvolvableCard = {
    powerLevel: Math.max(0, Number(c.powerLevel) || 100),
    cloutMultiplier: Math.max(0, Number(c.cloutMultiplier) || 1),
    evolutionStage: Math.min(3, Math.max(1, Math.floor(Number(c.evolutionStage) || 1))),
    durability: Math.min(1, Math.max(0, Number(c.durability) || 1)),
    earnsCount: Math.max(0, Number(c.earnsCount) || 0),
  };
  const buzzScore = Math.min(100, Math.max(0, Number(body.buzzScore) || 50));
  const volatilityIndex = Math.min(100, Math.max(0, Number(body.volatilityIndex) || 50));

  const result = attemptEvolution(card, buzzScore, volatilityIndex);
  return NextResponse.json({
    success: true,
    mode,
    simulate: true,
    authoritative: false,
    result,
    note: result.success
      ? `Simulated success → stage ${result.card?.evolutionStage} (+${result.fibReward} fib reward)`
      : "Simulated failure → card would be burned",
  });
}
