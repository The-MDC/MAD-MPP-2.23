/**
 * GET /api/v1/mpp/profiles
 * Spec: docs/mpp-backend-architecture.md §2B
 * PLACEHOLDER store: in-memory baseline. Prod hydrates from Postgres /
 * Cloud SQL (docs/BACKEND_PLACEHOLDERS.md → PROFILE_DB).
 */
import { NextResponse } from "next/server";

const PROFILES = [
  { id: "hyperion", name: "Hyperion Speed Run", codename: "ALPHA-01", description: "Arbitrage front-running telemetry on sub-second liquid index loops.", alpha: 0.15, baseThreshold: 680, currentStake: 1500 },
  { id: "chronos",  name: "Chronos Yield Anchor", codename: "GOLD-02", description: "Temporal liquidity preservation algorithm leveraging custom epoch curve weights.", alpha: 0.08, baseThreshold: 820, currentStake: 3200 },
  { id: "nemesis",  name: "Nemesis Protocol", codename: "PINK-03", description: "High-exposure liquidity matrix balancing cross-chain flash hedges.", alpha: 0.22, baseThreshold: 510, currentStake: 850 },
];

export async function GET() {
  return NextResponse.json({ success: true, profiles: PROFILES });
}
