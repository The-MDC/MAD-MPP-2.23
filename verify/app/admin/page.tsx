import AdminConsole from "@/components/admin-console";
import { redirect } from "next/navigation";
import { can } from "@/lib/admin-auth";
import { requireAdminPage } from "@/lib/admin-page";

export const metadata = { title: "MAD Gambit — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const s = await requireAdminPage("/admin");
  // Support staff have no reports: their console is the support queue.
  if (!can(s.role, "reports:read")) redirect("/admin/support");
  return <AdminConsole email={s.sub} role={s.role} />;
}
