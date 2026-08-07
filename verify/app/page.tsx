import { redirect } from "next/navigation";

/**
 * Root landing — sends visitors to the premiere theme at /preview (the flagship
 * MAD Gambit front door). The alternative earlier hub theme (7-tab device frame,
 * Market Factory, global SKIN theme) lives at /mpp2.23. The legacy developer
 * telemetry portal remains at /workbench.
 */
export default function Home() {
  redirect("/preview");
}
