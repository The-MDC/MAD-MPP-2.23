"use client";

/**
 * MAD Gambit — /preview : faithful, scroll-parallax assembly of the attached
 * dopamine-landing mockup:
 *   perpetual clickable dual ticker → nav + theme switch → News Flow → gold
 *   split-flap clock → Customizable Dopamine Carousel (arrow-scrollable) →
 *   Featured Market Cards → bottom nav, over drifting parallax glow layers.
 *
 * ADDITIVE by design — a dedicated review route that does NOT touch the locked
 * home/gambit layout. Review it live on the Vercel preview and promote to `/`
 * when signed off. The two skins ARE the mockup's two themes (Gilded Pop-Baroque
 * ⇄ Neon Noir Tabloid) — toggle top-right. Imagery/ticker/odds are branded beta
 * placeholders; flip-clock, carousel, parallax and themes are live.
 */
import React, { useEffect, useState } from "react";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import CryptoTickerDual from "@/components/crypto-ticker-dual";
import NewsCarousel from "@/components/news-carousel";
import FeaturedMarketCards from "@/components/featured-market-cards";
import DopamineCarouselStrip from "@/components/dopamine-carousel-strip";
import SeikoFlipClock from "@/components/seiko-flip-clock";
import PerpDials from "@/components/perp-dials";
import MarketTypeCarousels from "@/components/market-type-carousels";
import CategoryRail from "@/components/category-rail";
import AccountRail from "@/components/account-rail";

function Chip({ label, filled }: { label: string; filled?: boolean }) {
  const { skin } = useSkin();
  return (
    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "6px 11px", borderRadius: 8, color: filled ? skin.bg : skin.text, background: filled ? skin.gold : "transparent", border: `1px solid ${filled ? skin.gold : skin.border}`, whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT }}>
      {label}
    </span>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  const { skin } = useSkin();
  return (
    <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: color ?? skin.gold, textTransform: "uppercase", margin: "0 0 12px 2px" }}>
      {children}
    </div>
  );
}

function BottomNav() {
  const { skin } = useSkin();
  const items: [string, string, string][] = [["🏠", "Home", "/"], ["📈", "Markets", "/gambit"], ["👛", "Wallet", "/gambit"], ["👤", "Profile", "/gambit"]];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0", background: skin.panel, borderTop: `1px solid ${skin.border}`, backdropFilter: "blur(6px)", zIndex: 30 }}>
      {items.map(([icon, label, href], i) => (
        <a key={label} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none", color: i === 0 ? skin.accent : skin.muted, fontSize: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          <span style={{ fontSize: 18 }} aria-hidden="true">{icon}</span>
          {label}
        </a>
      ))}
    </nav>
  );
}

function PreviewInner() {
  const { skin, name, toggle } = useSkin();
  const [sy, setSy] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(rm.matches);
    const wq = window.matchMedia("(min-width: 1024px)");
    const applyWide = () => setWide(wq.matches);
    applyWide();
    wq.addEventListener("change", applyWide);
    const onScroll = () => setSy(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      wq.removeEventListener("change", applyWide);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const par = (factor: number): string => (reduce ? "none" : `translateY(${sy * factor}px)`);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT, overflowX: "hidden" }}>
      {/* Parallax glow layers — drift at different rates behind the content */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
        <div style={{ position: "absolute", top: -90, left: -70, width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${skin.accent}22, transparent 70%)`, transform: par(0.25) }} />
        <div style={{ position: "absolute", top: 440, right: -90, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${skin.accent2}22, transparent 70%)`, transform: par(-0.18) }} />
        <div style={{ position: "absolute", top: 980, left: -50, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${skin.gold}18, transparent 70%)`, transform: par(0.3) }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <CryptoTickerDual />

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "11px 14px", maxWidth: 1040, margin: "0 auto", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 28, height: 28, flex: "none", borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${skin.gold}, ${skin.accent2})`, boxShadow: `0 0 10px ${skin.gold}66`, display: "inline-block" }} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.5, color: skin.gold, textTransform: "uppercase", whiteSpace: "nowrap" }}>MADHAT&rsquo;s Gambit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
            <button type="button" onClick={toggle} style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "6px 11px", borderRadius: 8, cursor: "pointer", color: skin.text, background: skin.card, border: `1px solid ${skin.accent}66`, whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT }} title="Toggle Gilded Pop-Baroque ⇄ Neon Noir Tabloid">
              {name === "gilded" ? "◑ Gilded" : "◐ Neon Noir"}
            </button>
            <Chip label="Login" />
            <Chip label="Sign Up" filled />
          </div>
        </header>

        {/* Responsive shell: left + right rails on desktop (mockup sidebars), stacked on mobile */}
        <div style={{ maxWidth: wide ? 1300 : 1040, margin: "0 auto", padding: "8px 12px 96px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          {wide ? <CategoryRail /> : null}

          <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 26 }}>
            <div id="mg-news">
              <NewsCarousel />
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
              <SeikoFlipClock label="MAD·TIME UTC" />
            </div>

            <div>
              <SectionHeading>Customizable Dopamine Carousel</SectionHeading>
              <DopamineCarouselStrip />
            </div>

            {/* Restored analog dials + GossipCop × Z-Liar dashboard */}
            <PerpDials />

            {/* One carousel per market class (Progression · Saga · Z-Liar · Perp · GossipCop) */}
            <MarketTypeCarousels />

            <div id="mg-featured">
              <FeaturedMarketCards />
            </div>

            <div style={{ fontSize: 8, color: skin.muted, textAlign: "center", lineHeight: 1.6 }}>
              Faithful assembly of the dopamine-landing mockup · clickable tickers, rails, nav + cards · scroll-parallax
              hub · live news / dials / market carousels · imagery & odds are beta placeholders.
            </div>
          </main>

          {wide ? <AccountRail /> : null}
        </div>
      </div>

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
