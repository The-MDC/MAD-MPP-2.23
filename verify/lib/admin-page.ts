import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, can, sessionSecret, verifySession, type AdminSession, type Perm } from "@/lib/admin-auth";
import { sessionStillValid } from "@/lib/admin-guard";

/** Server-component gate: the signed-in admin, or a redirect to the admin sign-in that returns here. */
export async function requireAdminPage(next: string, perm?: Perm): Promise<AdminSession> {
  const jar = await cookies();
  const s = verifySession(jar.get(ADMIN_COOKIE)?.value, sessionSecret());
  if (!s || !(await sessionStillValid(s))) redirect(`/admin/sign-in?next=${encodeURIComponent(next)}`);
  if (perm && !can(s.role, perm)) redirect("/admin");
  return s;
}
