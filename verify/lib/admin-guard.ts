/**
 * Admin suite — request guard. `await requireAdmin(req, perm)` returns the verified session, or a ready 401/403/503
 * Response. The route-guard CI check recognises `requireAdmin(` as an authorization call.
 *
 * A subordinate admin is re-checked against the database on every call, so disabling one takes effect at once rather
 * than when their 8-hour cookie runs out. If that lookup cannot be made the request is refused (fail closed).
 * The master lives in the environment and needs no lookup.
 */
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, can, isStaffEmail, sessionSecret, verifySession, type AdminSession, type Perm } from "@/lib/admin-auth";
import { findAdminByEmail } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { sameOrigin } from "@/lib/agent-defense";

export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

export const adminSessionFrom = (req: Request): AdminSession | null => verifySession(readCookie(req, ADMIN_COOKIE), sessionSecret());

const deny = (status: number, error: string) =>
  NextResponse.json({ success: false, error }, { status, headers: { "cache-control": "no-store" } });

/** True when this session may still act: the master always; a subordinate only while their row exists and is enabled. */
export async function sessionStillValid(s: AdminSession): Promise<boolean> {
  if (!isStaffEmail(s.sub)) return false; // company email only, on every request
  if (s.role === "master") return true;
  if (!hasDatabaseUrl()) return false;
  try {
    const row = await findAdminByEmail(getDbPool(), s.sub);
    return !!row && !row.disabled && row.role === s.role;
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request, perm?: Perm): Promise<AdminSession | Response> {
  if (!sessionSecret()) return deny(503, "Admin suite is not configured.");
  const s = adminSessionFrom(req);
  if (!s) return deny(401, "Admin sign-in required.");
  // CSRF: the cookie is SameSite=Strict, and a state-changing call must also be same-origin (belt and braces).
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) return deny(403, "Cross-origin request refused.");
  if (!(await sessionStillValid(s))) return deny(401, "Admin sign-in required.");
  if (perm && !can(s.role, perm)) return deny(403, "Your role cannot do that.");
  return s;
}

export const isDenied = (x: AdminSession | Response): x is Response => x instanceof Response;

/** Query runner for admin and ticker routes: the pool when a database is configured, otherwise one that fails so report sections degrade to empty. */
export function dbQuery() {
  return async (sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> => {
    if (!hasDatabaseUrl()) throw new Error("no database");
    return (await getDbPool().query(sql, params)).rows;
  };
}
