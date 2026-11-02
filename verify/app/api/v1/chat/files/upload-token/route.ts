import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionFromRequest } from "@/lib/session";
import { sameOrigin } from "@/lib/agent-defense";
import { enforceRateLimit } from "@/lib/rate-limit";
import { memorySubject } from "@/lib/concierge-memory";
import { profileStatus } from "@/lib/support/eligibility";
import { MAX_FILE_BYTES } from "@/lib/file-shield/gate";

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Secure storage isn't switched on." }, { status: 503 });
  const st = await profileStatus(req);
  if (!st.uploadAllowed) return NextResponse.json({ error: "Uploads open once your profile is at least 90% complete." }, { status: 403 });

  const prefix = `chat-quarantine/${memorySubject(session.address).slice(0, 16)}/`;
  let body: HandleUploadBody;
  try { body = (await req.json()) as HandleUploadBody; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  try {
    const out = await handleUpload({
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
