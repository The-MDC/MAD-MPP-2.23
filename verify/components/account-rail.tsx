"use client";

/**
 * MAD Gambit — right account rail (mockup's right sidebar).
 * ────────────────────────────────────────────────────────────────
 * The account/utility nav from the mockup (Login · Sign Up · Settings · … · Live).
 * Every item is a real clickable link. Login/Sign Up route into the app; the rest
 * are placeholder anchors for beta. Skin-aware; desktop chrome.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

// [icon, label, href]
const LINKS: [string, string, string][] = [
  ["🔑", "Login", "/gambit"],
  ["✨", "Sign Up", "/gambit"],
  ["⚙️", "Settings", "#settings"],
  ["❓", "Help", "#help"],
  ["✉️", "Contact", "#contact"],
  ["📄", "Terms", "#terms"],
  ["🔒", "Privacy", "#privacy"],
  ["💼", "Careers", "#careers"],
  ["📣", "Advertise", "#advertise"],
  ["📅", "Events", "#events"],
  ["🎙️", "Podcasts", "#podcasts"],
  ["🎞️", "Videos", "#videos"],
  ["🖼️", "Photos", "#photos"],
  ["🔴", "Live", "#live"],
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
        {LINKS.map(([icon, label, href], i) => {
          const primary = i < 2;
          return (
            <a
              key={label}
              href={href}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 9, textDecoration: "none", background: primary ? `${skin.gold}18` : "transparent", border: `1px solid ${primary ? `${skin.gold}55` : "transparent"}`, color: primary ? skin.text : skin.muted, fontSize: 10, fontWeight: primary ? 900 : 700, letterSpacing: 0.3, fontFamily: INSTRUMENT_FONT }}
            >
              <span style={{ fontSize: 12 }} aria-hidden="true">{icon}</span>
              {label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
