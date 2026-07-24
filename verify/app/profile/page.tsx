"use client";

/**
 * MAD Gambit — /profile : degen identity + $MADx wallet, in the hub theme.
 */
import React from "react";
import { ArrowLeft, UserCircle } from "lucide-react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import MadxWalletPanel from "@/components/madx-wallet-panel";
import DopamineMetricsCarousel from "@/components/dopamine-metrics-carousel";

function ProfileInner() {
  const { skin } = useSkin();
  return (
    <main style={{ minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT, padding: "18px 16px 60px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <a href="/MPP2.23" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.accent, textDecoration: "none" }}>
          <ArrowLeft size={12} /> Back to the Hub
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 16 }}>
          <UserCircle size={38} strokeWidth={1.5} style={{ color: skin.gold }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, color: skin.gold, textTransform: "uppercase" }}>Degen Profile</div>
            <div style={{ fontSize: 8.5, color: skin.muted, marginTop: 3 }}>
              Identity, $MADx (Beta) wallet and live pulse. Wallet linking + SIWE arrive with the on-chain flip.
            </div>
          </div>
        </div>
        <MadxWalletPanel />
        <DopamineMetricsCarousel />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <SkinProvider>
      <ProfileInner />
    </SkinProvider>
  );
}
