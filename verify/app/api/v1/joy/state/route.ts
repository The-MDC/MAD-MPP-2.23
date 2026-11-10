import { NextResponse } from "next/server";
import { computeJoyState, type JoyInput, type TimedSignal } from "@/lib/joy-engineering";
import { enforceRateLimit } from "@/lib/rate-limit";

// PUBLIC-ROUTE: pure calculator, no DB, no side effects (see below).
// Rate-limited as a cost ceiling only.
// LEDGER-FREE: `contributions[].amount` is an input to the engagement maths, not a $MADx amount —
// nothing is debited, credited or recorded here.
/**
 * POST /api/v1/joy/state — pure engagement-mechanics calculator. Surfaces the
 * composed joy-engineering math (virality index · attention momentum · Fibonacci
 * loyalty reward · retention) as a reachable, testable endpoint. No DB, no side
 * effects — deterministic function of the posted inputs.
 *
 * Body (all optional, sane defaults so it always returns):
 *   { virality?: { baseScore, convictionAvg, cardMultiplier, eta?, rho? },
 *     contentAgeHours?, contributions?: [{ amount, ageHours }],
 *     tenure?: { evolutionStage, xp, socialStanding }, decayRate? }
 */
const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);

function parseContributions(raw: unknown): TimedSignal[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({ amount: num((c as TimedSignal)?.amount, 0), ageHours: num((c as TimedSignal)?.ageHours, 0) }))
    .filter((c) => Number.isFinite(c.amount) && Number.isFinite(c.ageHours));
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "joy-state", 60, 60_000);
  if (limited) return limited;

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const v = (body.virality ?? {}) as Record<string, unknown>;
    const t = (body.tenure ?? {}) as Record<string, unknown>;

    const input: JoyInput = {
      virality: {
        baseScore: num(v.baseScore, 0.5),
        convictionAvg: num(v.convictionAvg, 1),
        cardMultiplier: num(v.cardMultiplier, 1),
        eta: v.eta === undefined ? undefined : num(v.eta, 0.3),
        rho: v.rho === undefined ? undefined : num(v.rho, 0.2),
      },
      contentAgeHours: num(body.contentAgeHours, 0),
      contributions: parseContributions(body.contributions),
      tenure: {
        evolutionStage: num(t.evolutionStage, 1),
        xp: num(t.xp, 0),
        socialStanding: num(t.socialStanding, 1000),
      },
      decayRate: body.decayRate === undefined ? undefined : num(body.decayRate, 0.08),
    };

    return NextResponse.json({ success: true, state: computeJoyState(input) });
  } catch (e) {
    console.error("joy/state error:", e);
    return NextResponse.json({ success: false, error: "bad request" }, { status: 400 });
  }
}
