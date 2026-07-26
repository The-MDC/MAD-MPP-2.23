"use client";

/**
 * MAD Gambit — /preview : the PREMIERE theme (flagship front door). Faithful,
 * scroll-parallax assembly of the dopamine-landing mockup:
 *   perpetual clickable dual ticker → nav + theme switch → News Flow → gold
 *   split-flap clock → Customizable Dopamine Carousel (arrow-scrollable) →
 *   Featured Market Cards → bottom nav, over drifting parallax glow layers.
 *
 * Route map (both themes retained, no duplication):
 *   /         → redirect → /preview   (premiere theme, this file)
 *   /preview  → premiere theme
 *   /mpp2.23  → alternative earlier hub theme (the 7-tab platform)
 *   /gambit   → redirect → /mpp2.23   (retired route, query preserved)
 *
 * The two skins ARE the mockup's two looks (Gilded Pop-Baroque ⇄ Neon Noir
 * Tabloid) — toggle top-right. Imagery/ticker/odds are branded beta
 * placeholders; flip-clock, carousel, parallax and themes are live.
 */
import React, { useEffect, useState } from "react";
import { Home, TrendingUp, Wallet, User, PlusSquare, PanelLeft, PanelRight, X, type LucideIcon } from "lucide-react";
import ModuleShelf from "@/components/module-shelf";
import { SkinProvider, useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import CryptoTickerDual from "@/components/crypto-ticker-dual";
import NewsTwoRow from "@/components/news-two-row";
import FeaturedMarketCards from "@/components/featured-market-cards";
import DopamineCarouselStrip from "@/components/dopamine-carousel-strip";
import PerpDials from "@/components/perp-dials";
import MarketTypeCarousels from "@/components/market-type-carousels";
import CategoryRail from "@/components/category-rail";
import AccountRail from "@/components/account-rail";
import PlatformExplorer from "@/components/platform-explorer";
import DottedGlowBackground from "@/components/dotted-glow-background";
import { BrandMark } from "@/components/brand-lockup";
// /gambit floor components, ported natively (GameProvider below powers them —
// and fixes the latent useGame() crash in ZLiarMeter inside PerpDials).
import { GameProvider } from "@/context/game-context";
import SeikoDopamineHub from "@/components/seiko-dopamine-hub";
import TopMarketsRail from "@/components/top-markets-rail";
import MarketRails from "@/components/market-rails";
import ZLiarSection from "@/components/zliar-section";
import DopamineEngine from "@/components/dopamine-engine";
import PositionsDashboard from "@/components/positions-dashboard";
import { EigenTrustWidget } from "@/components/virality-eigen";

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
  // 5 buttons per spec. Placeholder anchors (no navigation to the /mpp2.23 hub)
  // until each destination page/dashboard has content; Home + Profile are real.
  const items: [LucideIcon, string, string][] = [[Home, "Home", "/"], [TrendingUp, "All Markets", "#markets"], [Wallet, "Wallet", "#wallet"], [PlusSquare, "Market++", "#market-plus"], [User, "Profile", "/profile"]];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0", background: skin.panel, borderTop: `1px solid ${skin.border}`, backdropFilter: "blur(6px)", zIndex: 30 }}>
      {items.map(([Icon, label, href], i) => (
        <a key={label} href={href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: i === 0 ? skin.accent : skin.muted, fontSize: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          <Icon size={16} strokeWidth={2.25} />
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
  // Tray/console state — rails retract and fold out. Desktop: pinned when open,
  // collapses fully on retract. Mobile: slide-in console overlays with backdrop.
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(rm.matches);
    const wq = window.matchMedia("(min-width: 1024px)");
    const applyWide = () => {
      setWide(wq.matches);
      setLeftOpen(wq.matches);
      setRightOpen(wq.matches);
    };
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
      {/* ── /gambit's real backdrop, merged in: WebGL dotted-glow particle field
             (exact props the platform passes at chaos≈67) + its ambient radial glows,
             with the hub's scroll-parallax drift layered on top. */}
      <DottedGlowBackground
        gap={14}
        radius={1.5}
        color="rgba(255,255,255,0.05)"
        glowColor={`${skin.accent}cc`}
        speedMin={0.77}
        speedMax={1.67}
        speedScale={0.84}
      />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
        {/* /gambit ambient glows (verbatim geometry) */}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle 900px at 85% -100px, ${skin.accent}18, transparent)` }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle 900px at 10% 700px, ${skin.accent2}12, transparent)` }} />
        {/* hub parallax drift layers */}
        <div style={{ position: "absolute", top: -90, left: -70, width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${skin.accent}22, transparent 70%)`, transform: par(0.25) }} />
        <div style={{ position: "absolute", top: 440, right: -90, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${skin.accent2}22, transparent 70%)`, transform: par(-0.18) }} />
        <div style={{ position: "absolute", top: 980, left: -50, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${skin.gold}18, transparent 70%)`, transform: par(0.3) }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <CryptoTickerDual />

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "11px 14px", maxWidth: 1040, margin: "0 auto", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button type="button" onClick={() => setLeftOpen((o) => !o)} aria-label="Toggle categories tray" title="Categories tray"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, flex: "none", borderRadius: 8, cursor: "pointer", color: leftOpen ? skin.accent : skin.muted, background: skin.card, border: `1px solid ${leftOpen ? `${skin.accent}66` : skin.border}` }}>
              <PanelLeft size={15} strokeWidth={2.25} />
            </button>
            {/* Worksheet C: official logo + MAD Gambit wordmark + tagline, top-left. */}
            <BrandMark accent={skin.accent2} gold={skin.gold} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
            <button type="button" onClick={() => setRightOpen((o) => !o)} aria-label="Toggle account console" title="Account console"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, flex: "none", borderRadius: 8, cursor: "pointer", color: rightOpen ? skin.gold : skin.muted, background: skin.card, border: `1px solid ${rightOpen ? `${skin.gold}66` : skin.border}` }}>
              <PanelRight size={15} strokeWidth={2.25} />
            </button>
            <button type="button" onClick={toggle} style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "6px 11px", borderRadius: 8, cursor: "pointer", color: skin.text, background: skin.card, border: `1px solid ${skin.accent}66`, whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT }} title="Toggle Gilded Pop-Baroque ⇄ Neon Noir Tabloid">
              {name === "gilded" ? "◑ Gilded" : "◐ Neon Noir"}
            </button>
            <Chip label="Login" />
            <Chip label="Sign Up" filled />
          </div>
        </header>

        {/* Responsive shell: left + right rails on desktop (mockup sidebars), stacked on mobile */}
        <div style={{ maxWidth: wide ? 1300 : 1040, margin: "0 auto", padding: "8px 12px 96px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          {wide && leftOpen ? <CategoryRail /> : null}

          <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Worksheet C: the MAD Gambit hero lockup + tagline moved to the
               top-left header (see BrandMark). Worksheet E: the redundant
               "MARKETS · NYSE" panel was removed — the top CryptoTickerDual
               carries the perpetual market ticker. The column now leads with the
               News Flow. */}
            <div id="mg-news">
              <NewsTwoRow />
            </div>

            <div>
              <SectionHeading>Customizable Dopamine Carousel</SectionHeading>
              <DopamineCarouselStrip />
            </div>

            {/* Tickers & Dials — meters row + cluster with the split-flap chrono */}
            <PerpDials />

            {/* ── /gambit FLOOR, ported native (GameProvider-powered) ── */}
            <SeikoDopamineHub />
            <TopMarketsRail />
            <MarketRails />
            <ZLiarSection />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
              <PositionsDashboard />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <EigenTrustWidget />
                <DopamineEngine />
              </div>
            </div>

            {/* One carousel per market class (Progression · Saga · Z-Liar · Perp · GossipCop) */}
            <MarketTypeCarousels />

            <div id="mg-featured">
              <FeaturedMarketCards />
            </div>

            {/* The precision merge: every /gambit module inline, lazy-mounted */}
            <ModuleShelf />

            {/* Every /gambit tab/feature, deep-linked into the new theme */}
            <PlatformExplorer />

            <div style={{ textAlign: "center", lineHeight: 1.7 }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: skin.muted, textTransform: "uppercase" }}>
                Platform Fee 1.88% · Creator Share 40% · Community 28.8% · $MADx 888,888,888 fixed
              </div>
              <div style={{ fontSize: 8, color: skin.muted, marginTop: 4 }}>
                Faithful assembly of the mockup · clickable tickers, rails, nav, cards + platform links · live news /
                dials / market carousels · imagery & odds are beta placeholders.
              </div>
            </div>
          </main>

          {wide && rightOpen ? <AccountRail /> : null}
        </div>

        {/* Mobile fold-out console trays (overlay + backdrop; desktop uses pinned rails) */}
        {!wide && (leftOpen || rightOpen) ? (
          <div onClick={() => { setLeftOpen(false); setRightOpen(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
            <div onClick={(e) => e.stopPropagation()} className={reduce ? undefined : "mg-tray-in-" + (leftOpen ? "l" : "r")}
              style={{ position: "absolute", top: 0, bottom: 0, ...(leftOpen ? { left: 0 } : { right: 0 }), width: 216, background: skin.bg, borderRight: leftOpen ? `1px solid ${skin.border}` : undefined, borderLeft: leftOpen ? undefined : `1px solid ${skin.border}`, padding: 10, overflowY: "auto" }}>
              <button type="button" onClick={() => { setLeftOpen(false); setRightOpen(false); }} aria-label="Close tray"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, marginBottom: 8, borderRadius: 7, cursor: "pointer", color: skin.muted, background: skin.card, border: `1px solid ${skin.border}` }}>
                <X size={13} />
              </button>
              {leftOpen ? <CategoryRail /> : <AccountRail />}
            </div>
          </div>
        ) : null}
        <style>{`
          @keyframes mgTrayL { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          @keyframes mgTrayR { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .mg-tray-in-l { animation: mgTrayL .22s ease-out; }
          .mg-tray-in-r { animation: mgTrayR .22s ease-out; }
          @media (prefers-reduced-motion: reduce) { .mg-tray-in-l, .mg-tray-in-r { animation: none; } }
        `}</style>
      </div>

      <BottomNav />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <SkinProvider>
      <GameProvider>
        <PreviewInner />
      </GameProvider>
    </SkinProvider>
  );
}
