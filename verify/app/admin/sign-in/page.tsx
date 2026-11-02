import AdminSignIn from "@/components/admin-sign-in";

export const metadata = { title: "MAD Gambit — Admin sign-in", robots: { index: false, follow: false } };

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AdminSignIn next={typeof next === "string" ? next : "/admin"} />;
}
