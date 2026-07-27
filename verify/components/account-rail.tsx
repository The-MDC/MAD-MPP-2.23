"use client";

/**
 * MAD Gambit — right account rail (mockup's right sidebar).
 * ────────────────────────────────────────────────────────────────
 * The account/utility nav from the mockup (Login · Sign Up · Settings · … · Live),
 * in lucide line icons (no emoji). Login/Sign Up are dead placeholders (#login /
 * #signup) until the auth flow exists — they must NOT navigate to the /mpp2.23
 * hub. Profile/Reports/Settings link to their real pages; the rest are beta
 * placeholder anchors. Skin-aware; desktop chrome.
 */
import React from "react";
import {
  KeyRound, Sparkles, UserCircle, BarChart3, Settings, LifeBuoy, Mail, FileText, Lock, Briefcase,
  Megaphone, Calendar, Mic, Film, Image as ImageIcon, Radio,
  type LucideIcon,
} from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

// [Icon, label, href]
const LINKS: [LucideIcon, string, string][] = [
  [KeyRound, "Login", "#login"],
  [Sparkles, "Sign Up", "#signup"],
  [UserCircle, "Profile", "/profile"],
  [BarChart3, "Reports", "/reports"],
  [Settings, "Settings", "/settings"],
  [LifeBuoy, "Help", "#help"],
  [Mail, "Contact", "#contact"],
  [FileText, "Terms", "#terms"],
  [Lock, "Privacy", "#privacy"],
  [Briefcase, "Careers", "#careers"],
  [Megaphone, "Advertise", "#advertise"],
  [Calendar, "Events", "#events"],
  [Mic, "Podcasts", "#podcasts"],
  [Film, "Videos", "#videos"],
  [ImageIcon, "Photos", "#photos"],
  [Radio, "Live", "#live"],
];

export default function AccountRail() {
  const { skin } = useSkin();
  return (
    <aside style={{ width: 168, flex: "none", alignSelf: "flex-start", position: "sticky", top: 12, background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 12, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 10px", borderBottom: `1px solid ${skin.border}`, marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: skin.muted, textTransform: "uppercase" }}>Account</span>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, color: skin.gold }}>MG</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {LINKS.map(([Icon, label, href], i) => {
          const primary = i < 2;
          return (
            <a
              key={label}
              href={href}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 9, textDecoration: "none", background: primary ? `${skin.gold}18` : "transparent", border: `1px solid ${primary ? `${skin.gold}55` : "transparent"}`, color: primary ? skin.text : skin.muted, fontSize: 10, fontWeight: primary ? 900 : 700, letterSpacing: 0.3, fontFamily: INSTRUMENT_FONT }}
            >
              <Icon size={12} strokeWidth={2.25} style={{ color: primary ? skin.gold : skin.muted, flex: "none" }} />
              {label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
