/**
 * POST /api/v1/madhatr/zliar
 * Z-Liar / Sentinel audit. Math is real (zLiarMeter). The persona copy
 * is a PLACEHOLDER local generator — wire to Gemini Tri-Agent (Agent A:
 * Sentinel) with the AGENTS.md MADHAT'r system instruction in prod.
 * docs/BACKEND_PLACEHOLDERS.md → TRI_AGENT_LLM
 */
import { NextRequest, NextResponse } from "next/server";
import { zLiarMeter } from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";

// PUBLIC-ROUTE: pure maths + a canned placeholder string today (see below),
// no DB. Rate-limited now on purpose — this becomes a real Gemini call in
// prod, so the cost ceiling should already be in place before that lands.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "madhatr-zliar", 60, 60_000);
  if (limited) return limited;

  try {
    const { statement, narrativeVariance = 0.5, sourceCredibility = 0.5, corroboration = 0.3 } = await req.json();
    const reading = zLiarMeter({ narrativeVariance, sourceCredibility, corroboration });
    // PLACEHOLDER persona — replace with Gemini call:
    //   model: gemini-1.5-flash, systemInstruction: <AGENTS.md MADHAT'r>
    const quip = `Ayo — Sentinel scored that a ${Math.round(reading.score)} on the Z-Liar. Verdict: ${reading.verdict}. [LLM persona pending]`;
    return NextResponse.json({ success: true, statement, reading, quip, _llm: "PLACEHOLDER" });
  } catch (e: any) {
    console.error("madhatr/zliar error:", e);
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 400 });
  }
}
