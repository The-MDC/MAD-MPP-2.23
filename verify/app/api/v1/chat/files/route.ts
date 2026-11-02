import { NextResponse } from "next/server";
import { del, get } from "@vercel/blob";
import { dbQuery } from "@/lib/admin-guard";
import { adminSessionFrom } from "@/lib/admin-guard";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/session";
import { sameOrigin } from "@/lib/agent-defense";
import { noteThreat } from "@/lib/threat-status";
import { flagAccount } from "@/lib/account-flags";
import { memorySubject, memoryTier } from "@/lib/concierge-memory";
import { profileStatus } from "@/lib/support/eligibility";
import { MAX_FILE_BYTES } from "@/lib/file-shield/gate";
import { externalScannerFromEnv, scanUpload } from "@/lib/file-shield/scan";
import { deleteFile, getFile, listFiles, loadBlocklist, recordScan, saveFile } from "@/lib/file-shield/store";
import { privateBlobConfigured, privateBlobToken } from "@/lib/private-blob";

export const runtime = "nodejs";
export const maxDuration = 60;

const noStore = { "cache-control": "no-store" };
/** Vercel caps a request body near 4.5 MB, so larger files go browser → private Blob quarantine → here by reference. */
const DIRECT_MAX_BYTES = 4 * 1024 * 1024;
const blobConfigured = () => privateBlobConfigured();
const BLOB_HOST = /^[a-z0-9]+\.private\.blob\.vercel-storage\.com$/;

async function owner(req: Request) {
  const st = await profileStatus(req);
  const wallet = st.signup.wallet_address;
  return { st, wallet, subject: wallet ? memorySubject(wallet) : null };
}

/**
 * GET /api/v1/chat/files               your files, the limits, and whether you may upload
 * GET /api/v1/chat/files?id=f_…        download a file's SANITISED text (never the original), as an inert attachment
 */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "chat-files-read", 60, 60_000);
  if (limited) return limited;
  const { st, subject } = await owner(req);
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    if (!subject || !hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    const f = await getFile(dbQuery(), subject, id);
    if (!f) return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    return new Response(f.text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="${f.name.replace(/["\\]/g, "_")}.sanitised.txt"`,
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
        ...noStore,
      },
    });
  }
  return NextResponse.json({
    success: true,
    uploadAllowed: st.uploadAllowed, completion: st.percent, missing: st.missing,
    maxBytes: MAX_FILE_BYTES, directMaxBytes: DIRECT_MAX_BYTES, blob: blobConfigured(),
    accept: [".md", ".markdown", ".txt", ".pdf"],
    // the only folder this member's upload token can write to
    prefix: subject ? `chat-quarantine/${subject.slice(0, 16)}/` : "",
    files: subject && hasDatabaseUrl() ? await listFiles(dbQuery(), subject) : [],
  }, { headers: noStore });
}

/**
 * POST /api/v1/chat/files — scan and keep a file for the concierge to read.
 *   multipart/form-data  { file }                     up to 4 MB (Vercel's body limit)
 *   application/json     { blobUrl, pathname, name }  up to 25 MB, uploaded to the private quarantine first
 * Members only: signup complete and a profile at least 90% complete. Two layers of scanning (lib/file-shield); the
 * original bytes are deleted from quarantine whatever the verdict.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "chat-files-upload", 10, 60 * 60_000);
  if (limited) return limited;
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, error: "Sign in with your wallet first." }, { status: 401 });
  if (!sameOrigin(req)) { noteThreat("scan", "upload-cross-origin"); return NextResponse.json({ success: false, error: "forbidden" }, { status: 403 }); }
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Uploads are offline for a moment." }, { status: 503 });

  const { st, wallet, subject } = await owner(req);
  if (!st.uploadAllowed || !subject || !wallet) {
    return NextResponse.json({ success: false, error: `Uploads open once signup is complete and your profile is at least 90% done (you're at ${st.percent}%).`, missing: st.missing }, { status: 403 });
  }

  let name = "", declaredType: string | null = null, bytes: Uint8Array | null = null, blobPathname: string | null = null;
  try {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ success: false, error: "Attach a file." }, { status: 400 });
      if (file.size > DIRECT_MAX_BYTES) return NextResponse.json({ success: false, error: "Files over 4 MB go through secure storage, which isn't switched on yet." }, { status: 413 });
      name = file.name; declaredType = file.type || null;
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      const body = (await req.json()) as { blobUrl?: unknown; pathname?: unknown; name?: unknown; type?: unknown };
      if (!blobConfigured()) return NextResponse.json({ success: false, error: "Secure storage isn't switched on." }, { status: 503 });
      const url = typeof body.blobUrl === "string" ? new URL(body.blobUrl) : null;
      const prefix = `chat-quarantine/${subject.slice(0, 16)}/`;
      blobPathname = typeof body.pathname === "string" ? body.pathname : null;
      if (!url || url.protocol !== "https:" || !BLOB_HOST.test(url.hostname) || !blobPathname?.startsWith(prefix) || decodeURIComponent(url.pathname.slice(1)) !== blobPathname) {
        noteThreat("scan", "upload-forged-reference");
        await flagAccount(dbQuery(), { wallet }, "forged upload reference", "medium", "file-upload");
        return NextResponse.json({ success: false, error: "That upload reference isn't valid." }, { status: 400 });
      }
      name = typeof body.name === "string" ? body.name : blobPathname.split("/").pop() ?? "file";
      declaredType = typeof body.type === "string" ? body.type : null;
      const got = await get(url.toString(), { access: "private", token: privateBlobToken()! });
      if (!got) return NextResponse.json({ success: false, error: "The upload wasn't found. Try again." }, { status: 404 });
      const buf = new Uint8Array(await new Response(got.stream).arrayBuffer());
      if (buf.length > MAX_FILE_BYTES) bytes = buf.subarray(0, MAX_FILE_BYTES + 1); else bytes = buf;
    }
  } catch {
    return NextResponse.json({ success: false, error: "That upload couldn't be read." }, { status: 400 });
  } finally {
    // the original never stays in storage, whatever happens next
    if (blobPathname && blobConfigured()) { try { await del(blobPathname, { token: privateBlobToken()! }); } catch { /* the daily sweep removes stragglers */ } }
  }

  const q = dbQuery();
  const outcome = await scanUpload({ name, declaredType, bytes: bytes! }, { blocklist: await loadBlocklist(q), external: externalScannerFromEnv() });
  await recordScan(q, subject, outcome);
  if (outcome.verdict !== "accepted") {
    noteThreat(outcome.verdict === "quarantined" ? "attack" : "scan", `upload-${outcome.verdict}`);
    await flagAccount(q, { wallet }, `upload ${outcome.verdict}: ${outcome.reasons[0] ?? "refused"}`.slice(0, 80), outcome.verdict === "quarantined" ? "high" : "medium", "file-upload");
    return NextResponse.json({ success: false, verdict: outcome.verdict, error: outcome.reasons.join(" "), notes: outcome.notes }, { status: 422, headers: noStore });
  }
  if (outcome.risk !== "low") await flagAccount(q, { wallet }, `upload needed cleaning (${outcome.risk})`, outcome.risk === "high" ? "medium" : "low", "file-upload");

  const tier = await memoryTier(q, { isStaff: adminSessionFrom(req) !== null, wallet });
  try {
    const id = await saveFile(q, subject, tier, outcome);
    return NextResponse.json({ success: true, file: { id, name: outcome.name, kind: outcome.kind, bytes: outcome.size, chars: outcome.text.length, risk: outcome.risk, notes: outcome.notes } }, { status: 201, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not keep the file (has sql/0025 been applied?)." }, { status: 503 });
  }
}

/** DELETE /api/v1/chat/files?id=f_… — remove one of your files now. */
export async function DELETE(req: Request) {
  const limited = enforceRateLimit(req, "chat-files-delete", 30, 60_000);
  if (limited) return limited;
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, error: "Sign in first." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Offline." }, { status: 503 });
  const ok = await deleteFile(dbQuery(), memorySubject(session.address), id);
  return NextResponse.json({ success: ok }, { status: ok ? 200 : 404, headers: noStore });
}
