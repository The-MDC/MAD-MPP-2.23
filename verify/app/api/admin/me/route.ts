import { NextResponse } from "next/server";
import { can } from "@/lib/admin-auth";
import { isDenied, requireAdmin } from "@/lib/admin-guard";

/** GET /api/admin/me — who am I, and what may I do. */
export async function GET(req: Request) {
  const s = await requireAdmin(req);
  if (isDenied(s)) return s;
  return NextResponse.json({
    success: true,
    email: s.sub,
    role: s.role,
    can: {
      export: can(s.role, "reports:export"),
      assistant: can(s.role, "assistant:use"),
      audit: can(s.role, "audit:read"),
      admins: can(s.role, "admins:manage"),
    },
    expiresAt: new Date(s.exp * 1000).toISOString(),
  }, { headers: { "cache-control": "no-store" } });
}
