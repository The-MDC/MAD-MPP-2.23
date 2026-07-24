"use client";

/**
 * MAD Gambit — /preview : faithful assembly of the attached dopamine-landing
 * mockup (dual crypto ticker → nav + theme switch → News Flow → gold flip-clock
 * → Customizable Dopamine Carousel → Featured Market Cards → bottom nav).
 *
 * ADDITIVE by design — a dedicated review route that does NOT touch the locked
 * home/gambit layout. Review it live on the Vercel preview and promote to `/`
 * when the fidelity is signed off. The two skins ARE the mockup's two themes
 * (Gilded Pop-Baroque ⇄ Neon Noir Tabloid) — toggle top-right.
 *
 * Imagery uses branded gradient placeholders (no third-party photos); the
 * ticker/odds are beta placeholders. Everything else is wired to real components.
 */
import React from "react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import CryptoTickerDual from "@/components/crypto-ticker-dual";
import NewsFlowSection from "@/components/news-flow-section";
import FeaturedMarketCards from "@/components/featured-market-cards";
import DopamineMetricsCarousel from "@/components/dopamine-metrics-carousel";
import SeikoFlipClock from "@/components/seiko-flip-clock";

function Chip({ label, filled }: { label: string; filled?: boolean }) {
  const { skin } = useSkin();
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: 1,
        textTransform: "uppercase",
        padding: "6px 12px",
        borderRadius: 9,
        color: filled ? skin.bg : skin.text,
        background: filled ? skin.gold : "transparent",
        border: `1px solid ${filled ? skin.gold : skin.border}`,
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      {label}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  const { skin } = useSkin();
  return (
    <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", margin: "0 0 12px 2px" }}>
      {children}
    </div>
  );
}

function BottomNav() {
  const { skin } = useSkin();
  const items: [string, string][] = [
    ["🏠", "Home"],
    ["📈", "Markets"],
    ["👛", "Wallet"],
    ["👤", "Profile"],
  ];
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0",
        background: skin.panel,
        borderTop: `1px solid ${skin.border}`,
        backdropFilter: "blur(6px)",
        zIndex: 20,
      }}
    >
      {items.map(([icon, label]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: skin.muted, fontSize: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          <span style={{ fontSize: 18 }} aria-hidden="true">{icon}</span>
          {label}
        </div>
      ))}
    </nav>
  );
}

function PreviewInner() {
  const { skin, name, toggle } = useSkin();
  return (
    <div style={{ minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT }}>
      <CryptoTickerDual />

      {/* Top bar: logo · theme switch · auth */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          maxWidth: 1040,
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${skin.gold}, ${skin.accent2})`,
              boxShadow: `0 0 10px ${skin.gold}66`,
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 1, color: skin.gold, textTransform: "uppercase" }}>
            MADHAT&rsquo;s Gambit
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={toggle}
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "6px 12px",
              borderRadius: 9,
              cursor: "pointer",
              color: skin.text,
              background: skin.card,
              border: `1px solid ${skin.accent}66`,
              fontFamily: INSTRUMENT_FONT,
            }}
            title="Toggle Gilded Pop-Baroque ⇄ Neon Noir Tabloid"
          >
            {name === "gilded" ? "◑ Gilded" : "◐ Neon Noir"}
          </button>
          <Chip label="Login" />
          <Chip label="Sign Up" filled />
        </div>
      </header>

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "8px 16px 96px", display: "flex", flexDirection: "column", gap: 28 }}>
        <NewsFlowSection />

        {/* Gold split-flap clock, centered as in the mockup */}
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
          <SeikoFlipClock label="MAD·TIME UTC" />
        </div>

        <div>
          <SectionHeading>Customizable Dopamine Carousel</SectionHeading>
          <DopamineMetricsCarousel />
        </div>

        <FeaturedMarketCards />

        <div style={{ fontSize: 8, color: skin.muted, textAlign: "center", lineHeight: 1.6 }}>
          Faithful assembly of the dopamine-landing mockup · imagery + ticker/odds are beta placeholders ·
          flip-clock, dopamine pulse and themes are live components · toggle the theme top-right.
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <SkinProvider>
      <PreviewInner />
    </SkinProvider>
  );
}
