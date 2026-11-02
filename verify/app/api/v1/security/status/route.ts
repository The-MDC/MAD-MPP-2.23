import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sharedThreatStatus } from "@/lib/threat-persist";

/** GET /api/v1/security/status — the concierge's colour: green, yellow (scanning) or red (under attack). Colour only. */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "security-status", 30, 60_000);
  if (limited) return limited;
  const s = await sharedThreatStatus();
  return NextResponse.json({ success: true, colour: s.colour }, { headers: { "cache-control": "public, max-age=15" } });
}
