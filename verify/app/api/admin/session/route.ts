import { NextResponse } from "next/server";
import {
  type AdminRole, ADMIN_COOKIE, DUMMY_HASH, isStaffEmail, SESSION_TTL_S, masterConfig, newSession, normaliseEmail, safeAdminNext,
  sessionSecret, signSession, verifyPassword,
} from "@/lib/admin-auth";
import { audit, findAdminByEmail, touchSignIn } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit, rateLimit } from "@/lib/rate-limit";
import { noteThreat } from "@/lib/threat-status";
import "@/lib/threat-persist";

const noStore = { "cache-control": "no-store" };
const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status, headers: noStore });
const pool = () => (hasDatabaseUrl() ? getDbPool() : null);

/**
 * POST /api/admin/session — admin sign-in. Body: { email, password, next? }.
 *
 * PUBLIC-ROUTE: this IS the sign-in endpoint, so it cannot require a session; it verifies the credential itself
 * (scrypt, constant-cost for unknown accounts) and is rate-limited per IP and per email. Failures give one message.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "admin-signin", 10, 15 * 60_000);
  if (limited) return limited;
  const secret = sessionSecret();
  const master = masterConfig();
  if (!secret || !master) return fail(503, "Admin suite is not configured.");

  let body: { email?: unknown; password?: unknown; next?: unknown };
  try { body = await req.json(); } catch { return fail(400, "Invalid request."); }
  const email = normaliseEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 200) return fail(401, "Email or password is incorrect.");
  // Staff sign-in is for madgambit.fun and madgambit.io addresses only. Same answer as a wrong password.
  if (!isStaffEmail(email)) { noteThreat("scan", "admin-signin-domain"); return fail(401, "Email or password is incorrect."); }

  // A per-account ceiling as well, so a distributed guess at one account is slowed too.
  if (!rateLimit(`admin-email:${email}`, 8, 15 * 60_000).ok) { noteThreat("attack", "admin-bruteforce"); return fail(429, "Too many attempts. Try again later."); }

  const db = pool();
  let role: AdminRole | null = null;
  let adminId: number | null = null;

  if (email === master.email) {
    if (await verifyPassword(password, master.hash)) role = "master";
  } else {
    let row = null;
    try { row = db ? await findAdminByEmail(db, email) : null; } catch { row = null; }
    const ok = await verifyPassword(password, row?.passwordHash ?? DUMMY_HASH); // same cost whether or not the account exists
    if (row && ok && !row.disabled) { role = row.role; adminId = row.id; }
  }

  if (!role) {
    noteThreat("scan", "admin-signin-fail");
    await audit(db, email, "sign-in-failed");
    return fail(401, "Email or password is incorrect.");
  }

  if (db && adminId !== null) { try { await touchSignIn(db, adminId); } catch { /* cosmetic */ } }
  await audit(db, email, "sign-in", role);
  const token = signSession(newSession(email, role), secret);
  const res = NextResponse.json({ success: true, role, next: safeAdminNext(body.next) }, { headers: noStore });
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_TTL_S });
  return res;
}

/** DELETE /api/admin/session — sign out. PUBLIC-ROUTE: only clears the caller's own cookie. */
export async function DELETE(req: Request) {
  const limited = enforceRateLimit(req, "admin-signout", 30, 60_000);
  if (limited) return limited;
  const res = NextResponse.json({ success: true }, { headers: noStore });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
