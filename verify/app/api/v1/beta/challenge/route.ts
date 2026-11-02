import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { issueChallenge } from "@/lib/signup-shield";

export const dynamic = "force-dynamic";

/** GET /api/v1/beta/challenge — a signed proof-of-work challenge for the public forms (lib/signup-shield.ts). */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "beta-challenge", 30, 60_000);
  if (limited) return limited;
  return NextResponse.json(issueChallenge(), { headers: { "cache-control": "no-store" } });
}
