import { NextResponse } from "next/server";
import { quadraticMatch } from "@/lib/gambit-game-math";
import { calculateGovernanceThreshold } from "@/lib/mpp-math";
import { enforceRateLimit } from "@/lib/rate-limit";

interface Body {
  contributions?: unknown;
  baseThreshold?: unknown;
  governanceWeight?: unknown;
}

/**
 * POST /api/v1/governance — quadratic-funding match + governance threshold
 * (Part X — surfaces quadraticMatch + calculateGovernanceThreshold). Pure, no DB.
 * `contributions` → quadratic match; `baseThreshold`+`governanceWeight` → the
 * MADConv-weighted proposal threshold.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "governance", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ success: false, error: "invalid JSON" }, { status: 400 });

  const contributions = Array.isArray(body.contributions)
    ? body.contributions.map(Number).filter((n) => Number.isFinite(n) && n >= 0)
    : [];
  const match = quadraticMatch(contributions);

  const baseThreshold = Number(body.baseThreshold);
  const governanceWeight = Number(body.governanceWeight);
  const threshold =
    Number.isFinite(baseThreshold) && Number.isFinite(governanceWeight)
      ? calculateGovernanceThreshold(baseThreshold, governanceWeight)
      : null;

  return NextResponse.json({
    success: true,
    governance: {
      contributors: contributions.length,
      quadraticMatch: match,
      threshold,
    },
  });
}
