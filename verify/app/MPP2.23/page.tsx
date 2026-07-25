import { redirect } from "next/navigation";

/**
 * Legacy uppercase route. The canonical path for the new premiere 2.23 theme is
 * the lowercase /mpp2.23 (App Router paths are case-sensitive, so a visitor
 * typing madgambit.io/mpp2.23 must resolve). This preserves any existing
 * madgambit.io/MPP2.23 bookmark by redirecting it to the canonical URL.
 */
export default function LegacyMPP() {
  redirect("/mpp2.23");
}
