import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionFromRequest } from "@/lib/session";
import { sameOrigin } from "@/lib/agent-defense";
import { enforceRateLimit } from "@/lib/rate-limit";
import { memorySubject } from "@/lib/concierge-memory";
import { profileStatus } from "@/lib/support/eligibility";
import { MAX_FILE_BYTES } from "@/lib/file-shield/gate";
import { blobDailyUploadCap, privateBlobToken } from "@/lib/private-blob";
import { dbQuery } from "@/lib/admin-guard";

export const runtime = "nodejs";

/**
 * POST /api/v1/chat/files/upload-token — a short-lived client token for one upload into the PRIVATE quarantine.
 * Members only (signup complete, profile ≥ 90%). The token is pinned to: this person's quarantine folder, the three
 * allowed content types, 25 MB, ten minutes. Nothing uploaded there is ever served or opened until the scanner reads
 * it, and the scanner deletes it.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "chat-files-token", 10, 60 * 60_000);
  if (limited) return limited;
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Sign in with your wallet first." }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const token = privateBlobToken();
  if (!token) return NextResponse.json({ error: "Secure storage isn't switched on." }, { status: 503 });
  // Free-tier guard: a daily ceiling on large uploads keeps Blob operations inside the monthly allowance.
  try {
    const today = await dbQuery()(`SELECT count(*)::int AS n FROM chat_file_scans WHERE created_at > date_trunc('day', now()) AND bytes > 4194304`);
    if (Number(today[0]?.n ?? 0) >= blobDailyUploadCap()) return NextResponse.json({ error: "Large-file uploads are at today's limit. Try again tomorrow, or attach a file under 4 MB." }, { status: 429 });
  } catch { /* no table yet: the per-IP limit still applies */ }
  const st = await profileStatus(req);
  if (!st.uploadAllowed) return NextResponse.json({ error: "Uploads open once your profile is at least 90% complete." }, { status: 403 });

  const prefix = `chat-quarantine/${memorySubject(session.address).slice(0, 16)}/`;
  let body: HandleUploadBody;
  try { body = (await req.json()) as HandleUploadBody; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  try {
    const out = await handleUpload({
      token,
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(prefix) || pathname.includes("..") || !/\.(md|markdown|txt|pdf)$/i.test(pathname)) throw new Error("bad path");
        return {
          allowedContentTypes: ["application/pdf", "text/plain", "text/markdown", "text/x-markdown"],
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60_000,
        };
      },
    });
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: "That upload isn't allowed." }, { status: 400 });
  }
}
