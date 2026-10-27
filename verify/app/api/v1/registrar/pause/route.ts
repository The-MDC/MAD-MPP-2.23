import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { getPauseState, setPaused } from "@/lib/registrar-queue";
import { enforceRateLimit } from "@/lib/rate-limit";
import { secretMatches } from "@/lib/bearer-secret";

/**
 * PAUSE_GUARDIAN (§9.1) — halt new conviction platform-wide.
 *
 * GET  /api/v1/registrar/pause  → current state (public; a halt should be visible)
 * POST /api/v1/registrar/pause  → { paused, reason } with the guardian credential
 *
 * NOT TIMELOCKED. Timelocks exist to delay parameter changes so the community
 * can react; an emergency stop must not be delayed for the same reason a fire
 * alarm is not on a timer.
 *
 * A SEPARATE KEY, NOT THE OWNER KEY. The precedent in
 * contracts/src/MADMarketFactory.sol gates pause() on onlyOwner, which couples
 * the emergency stop to the owner key — a single point of failure and the wrong
 * custody model. The guardian credential here is its own secret, and it can
 * halt but cannot change anything: this route has no parameter it can write
 * other than the halt itself.
 *
 * Absent the credential the route refuses rather than falling back to session
 * auth. A stop control that degrades to a weaker check under misconfiguration
 * is a stop control anyone can eventually reach.
 */
// The timing-safe compare moved to lib/bearer-secret.ts so the registrar's
// credential check is the SAME implementation rather than a second one written
// from memory. Two privileged routes side by side with two comparison styles is
// how the weaker one gets copied next.
function guardianAuthorised(req: Request): boolean {
  const expected = process.env.PAUSE_GUARDIAN_TOKEN;
  if (!expected) return false;
  return secretMatches(req.headers.get("x-pause-guardian") ?? "", expected);
}

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      success: true,
      source: "demo",
      pause: { paused: false, reason: null, actor: null, changedAt: "" },
      guardianConfigured: Boolean(process.env.PAUSE_GUARDIAN_TOKEN),
    });
  }
  try {
    const pause = await getPauseState(getDbPool());
    return NextResponse.json({
      success: true,
      source: "live",
      pause,
      guardianConfigured: Boolean(process.env.PAUSE_GUARDIAN_TOKEN),
    });
  } catch (e) {
    console.error("registrar/pause GET error:", e);
    return NextResponse.json({ success: false, error: "unavailable" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "registrar-pause", 10, 60_000);
  if (limited) return limited;

  if (!guardianAuthorised(req)) {
    return NextResponse.json({ success: false, error: "guardian credential required" }, { status: 401 });
  }
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "pause needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const paused = Boolean(body.paused);
    const reason = String(body.reason ?? "").trim();
    // A halt with no stated reason is a halt nobody can review afterwards.
    if (!reason) {
      return NextResponse.json({ success: false, error: "reason required" }, { status: 400 });
    }
    const state = await setPaused(getDbPool(), paused, reason, "PAUSE_GUARDIAN");
    return NextResponse.json({ success: true, pause: state });
  } catch (e) {
    console.error("registrar/pause POST error:", e);
    return NextResponse.json({ success: false, error: "pause failed" }, { status: 500 });
  }
}
