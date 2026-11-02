import AdminAdmins from "@/components/admin-admins";
import { requireAdminPage } from "@/lib/admin-page";

export const metadata = { title: "MAD Gambit — Admins", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  await requireAdminPage("/admin/admins", "admins:manage");
  return <AdminAdmins />;
}
