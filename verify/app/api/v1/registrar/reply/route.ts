import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { listReplies, postReply } from "@/lib/registrar-queue";

const VERIFICATION = ["domain", "press_office", "legal_rep", "platform_verified"] as const;
type Verification = (typeof VERIFICATION)[number];

/**
 * §9.1 RIGHT OF REPLY — standing and unmoderated.
 *
 * GET  /api/v1/registrar/reply?subjectRef=  → the subject's replies
 * POST /api/v1/registrar/reply              → post one
 *
 * There is no approval step, no moderation queue and no hide parameter. A
 * market that reads someone's character while filtering their answer is the
 * version of this product that gets sued — and the filtered version is also
 * strictly worse at the job the surface exists to do.
 *
 * The only gate is VERIFICATION: proving you are the subject or their
 * representative. That is an identity check, not a content check, and it is
 * there so the surface belongs to the subject rather than to whoever finds it
 * first.
 *
 * Replies render adjacent to the Waterline at equal prominence. That is a
 * front-end obligation this route cannot enforce, so it is stated here as well
 * as in the sheet.
 */
export async function GET(req: Request) {
  const subjectRef = new URL(req.url).searchParams.get("subjectRef") ?? "";
  if (!subjectRef) {
    return NextResponse.json({ success: false, error: "subjectRef required" }, { status: 400 });
  }
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: true, source: "demo", replies: [] });
  }
  try {
    const replies = await listReplies(getDbPool(), subjectRef, 50);
    return NextResponse.json({ success: true, source: "live", replies });
  } catch (e) {
    console.error("registrar/reply GET error:", e);
    return NextResponse.json({ success: true, source: "demo", replies: [] });
  }
}

export async function POST(req: Request) {
  // Rate-limited, not moderated. The limit is abuse control on the endpoint;
  // it never inspects, scores or rejects the content of a reply.
  const limited = enforceRateLimit(req, "registrar-reply", 10, 60_000);
  if (limited) return limited;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "reply needs DATABASE_URL" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const subjectRef = String(body.subjectRef ?? "");
    const text = String(body.body ?? "").trim();
    const verification = String(body.verification ?? "");

    if (!subjectRef || !text) {
      return NextResponse.json({ success: false, error: "subjectRef and body required" }, { status: 400 });
    }
    if (!VERIFICATION.includes(verification as Verification)) {
      return NextResponse.json(
        { success: false, error: `verification must be one of ${VERIFICATION.join(", ")}` },
        { status: 400 },
      );
    }

    const reply = await postReply(getDbPool(), {
      subjectRef,
      marketId: body.marketId ? String(body.marketId) : null,
      body: text,
      verification,
    });
    return NextResponse.json({ success: true, reply });
  } catch (e) {
    console.error("registrar/reply POST error:", e);
    return NextResponse.json({ success: false, error: "reply failed" }, { status: 500 });
  }
}
