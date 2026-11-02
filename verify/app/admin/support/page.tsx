import AdminSupport from "@/components/admin-support";
import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-auth";

export const metadata = { title: "MAD Gambit — Support and beta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const s = await requireAdminPage("/admin/support");
  return (
    <AdminSupport
      email={s.sub}
      canUserLane={can(s.role, "support:user")}
      canDevLane={can(s.role, "support:dev")}
      canBeta={can(s.role, "beta:manage")}
    />
  );
}
