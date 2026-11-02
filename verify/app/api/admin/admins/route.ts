import { NextResponse } from "next/server";
import {
  generatePassword, hashPassword, isStaffEmail, isSubordinateRole, masterConfig, normaliseEmail, passwordProblem,
} from "@/lib/admin-auth";
import { isDenied, requireAdmin } from "@/lib/admin-guard";
import { audit, createAdmin, listAdmins, setAdminDisabled, setAdminPassword } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";

const noStore = { "cache-control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });

/** GET /api/admin/admins — the subordinate admins (master only). */
export async function GET(req: Request) {
  const s = await requireAdmin(req, "admins:manage");
  if (isDenied(s)) return s;
  if (!hasDatabaseUrl()) return json({ success: true, master: masterConfig()?.email ?? null, admins: [], source: "demo" });
  try {
    return json({ success: true, master: masterConfig()?.email ?? null, admins: await listAdmins(getDbPool()), source: "live" });
  } catch {
    return json({ success: false, error: "Could not read admins. Has sql/0018 been applied?" }, 503);
  }
}

/**
 * POST /api/admin/admins — create a subordinate admin (master only).
 * Body: { email, role: "admin" | "viewer", password? }. With no password one is generated. The plaintext is returned
 * ONCE in this response for the master to hand over; only its scrypt hash is stored.
 */
export async function POST(req: Request) {
  const s = await requireAdmin(req, "admins:manage");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-create", 20, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return json({ success: false, error: "No database is configured." }, 503);

  let body: { email?: unknown; role?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid request." }, 400); }
  const email = normaliseEmail(body.email);
  if (!email) return json({ success: false, error: "A valid email is required." }, 400);
  if (!isStaffEmail(email)) return json({ success: false, error: "Staff accounts must use a madgambit.fun or madgambit.io email." }, 400);
  if (email === masterConfig()?.email) return json({ success: false, error: "That is the master account." }, 409);
  if (!isSubordinateRole(body.role)) return json({ success: false, error: "Role must be admin, support, dev or viewer." }, 400);

  const generated = body.password === undefined || body.password === "";
  const password = generated ? generatePassword() : String(body.password);
  const problem = passwordProblem(password);
  if (problem) return json({ success: false, error: problem }, 400);

  try {
    const pool = getDbPool();
    const created = await createAdmin(pool, { email, role: body.role, passwordHash: await hashPassword(password), createdBy: s.sub });
    if (!created) return json({ success: false, error: "An admin with that email already exists." }, 409);
    await audit(pool, s.sub, "admin-created", `${email} as ${body.role}`);
    return json({ success: true, admin: created, password, generated }, 201);
  } catch {
    return json({ success: false, error: "Could not create the admin." }, 503);
  }
}

/** PATCH /api/admin/admins — { id, action: "disable" | "enable" | "reset" } (master only). "reset" returns a fresh one-time password. */
export async function PATCH(req: Request) {
  const s = await requireAdmin(req, "admins:manage");
  if (isDenied(s)) return s;
  const limited = enforceRateLimit(req, "admin-update", 30, 60_000);
  if (limited) return limited;
  if (!hasDatabaseUrl()) return json({ success: false, error: "No database is configured." }, 503);

  let body: { id?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return json({ success: false, error: "Invalid request." }, 400); }
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return json({ success: false, error: "A valid id is required." }, 400);

  try {
    const pool = getDbPool();
    if (body.action === "disable" || body.action === "enable") {
      const ok = await setAdminDisabled(pool, id, body.action === "disable");
      if (!ok) return json({ success: false, error: "No such admin." }, 404);
      await audit(pool, s.sub, `admin-${body.action}d`, `id ${id}`);
      return json({ success: true });
    }
    if (body.action === "reset") {
      const password = generatePassword();
      const ok = await setAdminPassword(pool, id, await hashPassword(password));
      if (!ok) return json({ success: false, error: "No such admin." }, 404);
      await audit(pool, s.sub, "admin-password-reset", `id ${id}`);
      return json({ success: true, password });
    }
    return json({ success: false, error: "Unknown action." }, 400);
  } catch {
    return json({ success: false, error: "Could not update the admin." }, 503);
  }
}
