/**
 * POST /api/v1/tournament/match
 * AGENT-BETA Stage 10: Upgraded to calculateTournamentScores (Gen 2).
 * Now returns ratingDelta + madxPayout + structuralStrain separately.
 * Structural strain feeds back into card durability on the frontend.
 * Prize table uses canonical TOURNAMENT_PRIZES_BPS.
 * Source: CullTournamentEngine.kt + Card Game Logic Code Reference §5.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  calculateVictoryProbability,
  calculateTournamentScores,
  tournamentPrizeForRank,
  Combatant,
  PLATFORM,
} from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

// PUBLIC-ROUTE: resolves in-memory with server-side RNG, no DB write — the
// outcome isn't client-controlled even though the route is open. Rate-limited
// as a cost ceiling only.

const TOURNAMENT_TIERS = [
  { tier: 1, name: "Baby Yoda",   entryFee: 0.88,  maxPlayers: 10  },
  { tier: 2, name: "Quickie",     entryFee: 1.88,  maxPlayers: 20  },
  { tier: 3, name: "Degen",       entryFee: 2.88,  maxPlayers: 50  },
  { tier: 4, name: "Daily Grind", entryFee: 4.88,  maxPlayers: 100 },
  { tier: 5, name: "Grinder",     entryFee: 8.88,  maxPlayers: 200 },
  { tier: 6, name: "Whale Hunt",  entryFee: 18.88, maxPlayers: 500 },
  { tier: 7, name: "Degen Lord",  entryFee: 48.88, maxPlayers: 1000 },
  { tier: 8, name: "Mega Balls",  entryFee: 88.88, maxPlayers: 2000 },
] as const;

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "tournament-match", 60, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json() as {
      user: Combatant;
      opponent?: Combatant;
      tier?: number;
      rank?: number;
    };
    if (!body.user) {
      return NextResponse.json({ success: false, error: "user combatant required" }, { status: 400 });
    }

    const opp: Combatant = body.opponent ?? {
      powerLevel: 500 + Math.random() * 8_000,
      stage: 1 + Math.floor(Math.random() * 3),
      durability: 0.6 + Math.random() * 0.4,
      cloutMultiplier: 1 + Math.random() * 4,
    };

    const pWin = calculateVictoryProbability(body.user, opp);
    const won = Math.random() < pWin;

    // Gen 2: separate rating / currency / structural damage
    const scores = calculateTournamentScores(body.user, won, pWin);

    // Tournament tier context
    const tier = TOURNAMENT_TIERS.find(t => t.tier === (body.tier ?? 1)) ?? TOURNAMENT_TIERS[0];
    const poolSize = tier.entryFee * tier.maxPlayers * (1 - PLATFORM.FEE_BPS / 10_000);
    const rank = body.rank ?? (won ? 1 : Math.floor(Math.random() * tier.maxPlayers) + 2);
    const prizeShare = tournamentPrizeForRank(rank, poolSize);

    return NextResponse.json({
      success: true,
      won,
      pWin: parseFloat(pWin.toFixed(4)),
      // Gen 2 separated fields (not a single delta)
      ratingDelta: scores.ratingDelta,
      madxPayout: parseFloat(scores.madxPayout.toFixed(2)),
      structuralStrain: parseFloat(scores.structuralStrain.toFixed(4)),
      summary: scores.summary,
      // Tournament context
      tournament: { tier: tier.tier, name: tier.name, entryFee: tier.entryFee },
      prizeShare: parseFloat(prizeShare.toFixed(2)),
      rank,
      opponent: opp,
    });
  } catch (e: any) {
    console.error("tournament/match error:", e);
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 400 });
  }
}
