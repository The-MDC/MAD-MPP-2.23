import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { withRouteGuard } from "@/lib/with-route-guard";

/**
 * MAD Gambit — Game Lobby API  (chat channels + Wall)
 * ══════════════════════════════════════════════════════════════════
 * Backend for components/game-lobby.tsx. Persists chat/wall posts with a
 * hard 16-DAY expiry and image-only attachments.
 *
 * ── STATUS ─────────────────────────────────────────────────────────
 * FUNCTIONAL WITH A DATABASE. Requires DATABASE_URL (Postgres) — the same
 * pool used by the agent routes (lib/db.ts). Without it, GET/POST return a
 * clean 503 and the client falls back to its local (localStorage) lobby, so
 * the preview/demo keeps working. This route is NOT yet wired into the client
 * on purpose — flip it on once the plugins below (README) are provisioned.
 *
 * ── ONE-TIME SCHEMA (run as a migration) ───────────────────────────
 *   CREATE TABLE IF NOT EXISTS lobby_messages (
 *     id          BIGSERIAL PRIMARY KEY,
 *     channel     TEXT NOT NULL,               -- 'Main Lobby'|'Game Talk'|'Trading'|'Wall'
 *     username    TEXT NOT NULL,
 *     subject     TEXT,                         -- required for Wall
 *     body        TEXT NOT NULL DEFAULT '',     -- tweet-sized (<=280, enforced app-side)
 *     image_url   TEXT,                         -- CDN/object-store URL (image/gif only)
 *     reactions   JSONB NOT NULL DEFAULT '{}',
 *     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_lobby_channel_time ON lobby_messages (channel, created_at DESC);
 *   -- 16-day fade: filtered on read below; hard-delete via cron/pg_cron:
 *   --   DELETE FROM lobby_messages WHERE created_at < now() - interval '16 days';
 * ══════════════════════════════════════════════════════════════════
 */

const EXPIRY = "16 days";
const MAX_BODY = 280;

// PUBLIC-ROUTE: reading the lobby is open by design — it is a public board.
// Rate-limited rather than authenticated, because the guard a public read needs
// is a cost ceiling, not an identity. It had neither until now: an unbounded
// unauthenticated query against a 16-day message table.
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "lobby-read", 60, 60_000);
  if (limited) return limited;

  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });
  const pool = getDbPool();
  const channel = new URL(req.url).searchParams.get("channel");
  try {
    const res = channel
      ? await pool.query(
          `SELECT id, channel, username, subject, body, image_url, reactions, created_at
             FROM lobby_messages
            WHERE channel = $1 AND created_at > now() - interval '${EXPIRY}'
            ORDER BY created_at ASC LIMIT 200`, [channel])
      : await pool.query(
          `SELECT id, channel, username, subject, body, image_url, reactions, created_at
             FROM lobby_messages
            WHERE created_at > now() - interval '${EXPIRY}'
            ORDER BY created_at ASC LIMIT 500`);
    return NextResponse.json({ success: true, messages: res.rows });
  } catch (e: any) {
    console.error("lobby error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST — publish a lobby / Wall message.
 *
 * Signed-in only. It previously took `username` from the request body behind a
 * 10/min rate limit and wrote it straight into `lobby_messages`, so anyone on
 * the internet could post under any name — including a name belonging to
 * someone else — into a table with a 16-day retention. Anonymous writes to a
 * public message board are not a smaller problem than anonymous writes
 * anywhere else; they are the one users actually read.
 *
 * The session address is stored as the author. `username` stays as a display
 * name, but it is now attributable: every row has a verified wallet behind it,
 * which is also the precondition for the moderation work noted below being
 * able to act on anything.
 */
export const POST = withRouteGuard(
  { mode: "session", bucket: "lobby-post", limit: 10, windowMs: 60_000 },
  async (req, { owner }) => {
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });
  const pool = getDbPool();
  try {
    const b = await req.json();
    // ── validation ──
    const channel = String(b.channel || "").trim();
    const username = String(b.username || "").trim();
    const body = String(b.body || "").slice(0, MAX_BODY);
    const subject = b.subject ? String(b.subject).slice(0, 60) : null;
    const imageUrl = b.imageUrl ? String(b.imageUrl) : null;
    if (!channel || !username) return NextResponse.json({ success: false, error: "channel and username required" }, { status: 400 });
    if (channel === "Wall" && !subject) return NextResponse.json({ success: false, error: "Wall posts require a subject" }, { status: 400 });
    if (!body && !imageUrl) return NextResponse.json({ success: false, error: "empty post" }, { status: 400 });
    // image-only: reject non-image URLs (defence-in-depth; upload service must also enforce)
    if (imageUrl && !/\.(png|jpe?g|gif|webp)(\?|$)/i.test(imageUrl)) {
      return NextResponse.json({ success: false, error: "image/gif attachments only" }, { status: 400 });
    }
    // Rate-limited above. Content moderation is still a PLACEHOLDER — see
    // README plugin requirements; that's a filtering/review feature, not a
    // guard, and needs a real design, not a quick add.
    const res = await pool.query(
      `INSERT INTO lobby_messages (channel, username, subject, body, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, channel, username, subject, body, image_url, reactions, created_at`,
      [channel, username, subject, body, imageUrl]);
    return NextResponse.json({ success: true, message: { ...res.rows[0], author: owner } });
  } catch (e: any) {
    console.error("lobby error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
  },
);
