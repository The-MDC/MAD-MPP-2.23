import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { signupStatus } from "@/lib/support/eligibility";
import { loadKnowledge, rankSections } from "@/lib/madhatr-knowledge";
import { cleanInput } from "@/lib/agent-defense";

/** Sections that steer the concierge rather than inform the reader. */
const INTERNAL = new Set(["greetings", "pay-grade ladder", "house rules", "sources", "welcome"]);

/**
 * GET /api/v1/support/kb[?q=…] — the public knowledge base as browsable topics, for signed-up members only (the same
 * check that shows the concierge's Knowledge base button). Only the public "Say" lines are returned.
 */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "support-kb", 30, 60_000);
  if (limited) return limited;
  if (!(await signupStatus(req)).complete) return NextResponse.json({ success: false, error: "Finish signing up to open the knowledge base." }, { status: 403 });

  const kb = loadKnowledge();
  const q = cleanInput(new URL(req.url).searchParams.get("q"), 120);
  const visible = kb.sections.filter((s) => !INTERNAL.has(s.title.toLowerCase()) && s.say.length > 0);
  const ordered = q ? rankSections(q, kb).map((r) => r.sec).filter((s) => visible.includes(s)).slice(0, 8) : visible;
  return NextResponse.json(
    { success: true, topics: ordered.map((s) => ({ title: s.title, answers: s.say.slice(0, 6) })) },
    { headers: { "cache-control": "private, max-age=300" } },
  );
}
