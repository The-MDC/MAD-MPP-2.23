import { NextResponse } from "next/server";
import { breakerLevel, LEVELS, type Level } from "@/lib/agent-defense";
import { agentLevel, setStoredMode, storedMode } from "@/lib/agent-gate";
import { isDenied, requireAdmin } from "@/lib/admin-guard";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sharedThreatStatus } from "@/lib/threat-persist";

const noStore = { "cache-control": "no-store" };

/** GET /api/admin/agent — the live agents' defense state (master only). */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "audit:read");
  if (isDenied(s)) return s;
  const env = process.env.AGENT_MODE?.trim().toLowerCase() || null;
  return NextResponse.json({ success: true, effective: await agentLevel(), stored: await storedMode(), breaker: breakerLevel(), env, threat: await sharedThreatStatus() }, { headers: noStore });
}

/** POST /api/admin/agent — { mode: "normal" | "defended" | "lockdown", reason } (master only). The shutdown switch. */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "admins:manage");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-agent-mode", 20, 60_000);
  if (limited) return limited;
  let body: { mode?: unknown; reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 }); }
  if (!(LEVELS as readonly unknown[]).includes(body.mode)) return NextResponse.json({ success: false, error: "Mode must be normal, defended or lockdown." }, { status: 400 });
  const ok = await setStoredMode(body.mode as Level, s.sub, typeof body.reason === "string" ? body.reason : "");
  if (!ok) return NextResponse.json({ success: false, error: "Could not save (has sql/0020 been applied?)." }, { status: 503 });
  return NextResponse.json({ success: true, effective: await agentLevel() }, { headers: noStore });
}
