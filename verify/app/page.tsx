import { redirect } from "next/navigation";

/**
 * Root landing — sends visitors straight into the unified MAD Gambit hub
 * (/gambit: 7-tab device frame, hamburger MainNav, Market Factory, global
 * SKIN theme). The legacy developer telemetry portal lives on at /workbench
 * and stays reachable from the hamburger menu.
 */
export default function Home() {
  redirect("/gambit");
}
