import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ROLES = ["trader", "creator", "collector"] as const;
type Role = (typeof ROLES)[number];

/** Same DDL as sql/0017_beta_signups.sql — run once if the migration has not reached this database yet. */
const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS beta_signups (
    id          BIGSERIAL PRIMARY KEY,
    email       TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'trader' CHECK (role IN ('trader','creator','collector')),
    handle      TEXT,
    source      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS beta_signups_email_lower ON beta_signups (lower(email));
`;

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

// PUBLIC-ROUTE: the private-beta waitlist must accept people who do not have
// access yet. Cost-guarded (5 / 10 min per IP), writes one row per email
// (unique on lower(email), so repeats are a no-op), stores no IP and no
// user agent — the email is the only personal data, given to be contacted.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "beta-signup", 5, 10 * 60_000);
  if (limited) return limited;

  let email = "";
  let role: Role = "trader";
  let handle: string | null = null;
  try {
    const body = (await req.json()) as { email?: unknown; role?: unknown; handle?: unknown };
    email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    if (typeof body.role === "string" && (ROLES as readonly string[]).includes(body.role)) role = body.role as Role;
    if (typeof body.handle === "string" && body.handle.trim()) handle = body.handle.trim().slice(0, 64);
  } catch {
    return NextResponse.json({ success: false, error: "Send your email to join." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ success: false, error: "That email doesn't look right." }, { status: 400 });
  }
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ success: false, error: "Signups are paused for a moment — try again shortly." }, { status: 503 });
  }

  const pool = getDbPool();
  const insert = () =>
    pool.query(
      `INSERT INTO beta_signups (email, role, handle, source) VALUES ($1, $2, $3, $4)
       ON CONFLICT ((lower(email))) DO NOTHING`,
      [email, role, handle, "beta-gate"],
    );
  try {
    await insert();
  } catch (err) {
    // 42P01 = undefined_table: the migration has not run here yet.
    if ((err as { code?: string }).code === "42P01") {
      try {
        await pool.query(ENSURE_TABLE);
        await insert();
      } catch {
        return NextResponse.json({ success: false, error: "Signups are paused for a moment — try again shortly." }, { status: 503 });
      }
    } else {
      return NextResponse.json({ success: false, error: "Signups are paused for a moment — try again shortly." }, { status: 503 });
    }
  }
  return NextResponse.json({ success: true });
}
