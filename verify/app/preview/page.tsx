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
// Ported from the /mpp2.23 device theme.
import OVDeckSelector from "@/components/ov-deck-selector";
import MadhatrConcierge from "@/components/madhatr-concierge";
import { OV_DECKS, type OVDeck } from "@/lib/gambit-game-math";
import { useContainerWide } from "@/hooks/use-container-wide";
// Dual feature section: Conviction/Prediction beside the deck + Dutch auction.
// KaitoPriceTicker joins PredictionCircus here: the KAITO live feed was on
// /mpp2.23 but never ported, so /preview had no token strip at all.
import { KaitoPriceTicker, PredictionCircus } from "@/components/kaito-and-circus";
// The two carousels that were collateral damage when SeikoDopamineHub was
// removed from this page (it was a duplicate Seiko clock — see the note at its
// old mount point). Both live INSIDE that hub, so pulling the hub silently
// took the platform pillars and the unpacked-cards row with it. Mounted
// directly here instead, which restores them without resurrecting the
// second clock the founder rejected.
import PlatformCarousel from "@/components/platform-carousel";
import UnpackedCardsCarousel from "@/components/unpacked-cards-carousel";
import HoldHint from "@/components/hold-hint";
import type { HoldHintSpec } from "@/lib/hold-hint-context";
import GambitCardsAuctionSection from "@/components/gambit-cards-auction-section";
import InstrumentDeckSection from "@/components/instrument-deck-section";
import OctavianCreature from "@/components/octavian-creature";
import { AutoShowcaseBadge } from "@/components/carousel";
import MarketTypeCarousels from "@/components/market-type-carousels";
import FacesWaterline from "@/components/faces-waterline";
import ZeitgeistAlmanac from "@/components/zeitgeist-almanac";
import EpiphanyCatalog from "@/components/epiphany-catalog";
import { RegistrarStatusPanel } from "@/components/registrar-panel";
import CategoryRail from "@/components/category-rail";
import AccountRail from "@/components/account-rail";
import PlatformExplorer from "@/components/platform-explorer";
import DottedGlowBackground from "@/components/dotted-glow-background";
import { BrandMark } from "@/components/brand-lockup";
// /gambit floor components, ported natively (GameProvider below powers them —
// and fixes the latent useGame() crash in ZLiarMeter inside PerpDials).
import { GameProvider, useGame } from "@/context/game-context";
import TopMarketsRail from "@/components/top-markets-rail";
import MarketRails from "@/components/market-rails";
import ZLiarSection from "@/components/zliar-section";
import DopamineEngine from "@/components/dopamine-engine";
import PositionsDashboard from "@/components/positions-dashboard";
import { EigenTrustWidget } from "@/components/virality-eigen";
import JoyLayer, { celebrate } from "@/components/joy-layer";
import AuthModal from "@/components/auth-modal";
import { GambitNodeProvider, useGambitNode } from "@/components/gambit-node";

/**
 * The four desks in the header rail. Each carries the surface it opens, so the
 * row reads as destinations rather than four bare nouns.
 *
 * These now NAVIGATE rather than scroll. Previously all four smooth-scrolled
 * to a block on this same page, so "All markets" showed the visitor a strip of
 * this page instead of the market list. Prediction / Conviction / Affliction
 * deep-link into /markets at their own class anchor (see market-deck.tsx's
 * `anchorId`), and Octavian opens its dedicated /octavian instrument.
 *
 * AFFLICTION — corrected. This previously pointed at /markets#perps on the
 * reasoning that Affliction's markets were the perpetual families. That was an
 * inference, and the codebase already disagreed with it in four places:
 *
 *   perp-dials.tsx:439   Affliction → "MADHATs game", href /preview#affliction
 *   pack-opening.tsx     "the Affliction Step 1: Rip Scandal Pack"
 *   dopamine-engine.tsx  "Variable Reward · Affliction Layer"
 *   roast-share.tsx      "Step 6 of The Affliction"
 *   (and PredictionCircusScreen.kt: "AFFLICTION (The Hook)")
 *
 * Affliction is the dopamine loop — the card game, the pack rip, the hook —
 * not the perps deck. Perps are their own class and already have their own
 * button-free anchor at /markets#perps. So Affliction now lands on the game
 * block on this page, at the #affliction anchor, which is the href perp-dials
 * has been pointing at all along — an anchor that did not exist until now, so
 * that link silently dumped visitors at the top of /preview.
 *
 * "All markets" is likewise wrong for it: the card game has no market list.
 * Its "everything of this kind" is the deck — all 992 cards.
 */
const DESKS: { label: string; sub: string; href: string }[] = [
  { label: "Prediction", sub: "All markets", href: "/markets#prediction" },
  { label: "Conviction", sub: "All markets", href: "/markets#conviction" },
  { label: "Affliction", sub: "All cards", href: "#affliction" },
  { label: "Octavian", sub: "Node mesh", href: "/octavian" },
];

/** What each desk button explains on hover / press-and-hold. */
const DESK_HINTS: Record<string, HoldHintSpec> = {
  Prediction: {
    title: "Prediction",
    body: "Dated markets that resolve against a stated criterion, priced de-vigged. You take a side, it settles on a date. Opens the full prediction deck.",
  },
  Conviction: {
    title: "Conviction",
    body: "Graded belief with no settle leg — you stake how strongly you hold a view, and creators ladder off it. Opens the full conviction deck.",
  },
  Affliction: {
    title: "Affliction",
    body: "The hook: scandal packs, the rip, and the MADHATs Gambit deck. Rarity comes from openCardPack() in the maths engine, so what drops is the real distribution. Jumps to the game block below.",
  },
  Octavian: {
    title: "Octavian",
    body: "The node mesh — every platform subsystem as a light on one sphere, brightening with what the platform is actually doing. Drag to orbit, tap a node to read it.",
  },
};

/** Dopamine tap — a small celebration burst at the click point. */
function tap(e: React.MouseEvent, intensity = 0.5) {
  celebrate({ x: e.clientX, y: e.clientY, intensity });
}
// scrollToId() removed: every remaining caller (the four desk buttons and the
// bottom-nav "All Markets") now navigates to a real route instead of scrolling
// to a strip of this page. The in-page section ids it targeted are retained —
// /markets#prediction and friends still rely on anchor scrolling, just the
// browser's own rather than a hand-rolled helper.

function Chip({ label, filled, onClick }: { label: string; filled?: boolean; onClick?: (e: React.MouseEvent) => void }) {
  const { skin } = useSkin();
  return (
    <button type="button" onClick={onClick} className="mg-tap" style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "6px 11px", borderRadius: 8, color: filled ? skin.bg : skin.text, background: filled ? skin.gold : "transparent", border: `1px solid ${filled ? skin.gold : skin.border}`, whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT, cursor: "pointer" }}>
      {label}
    </button>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color?: string }) {
  const { skin } = useSkin();
  return (
    // flex so a heading can carry a trailing mark (the auto-showcase badge)
    // on the same baseline instead of it wrapping beneath the text.
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, letterSpacing: 2, color: color ?? skin.gold, textTransform: "uppercase", margin: "0 0 12px 2px" }}>
      {children}
    </div>
  );
}

function BottomNav({ onProfile }: { onProfile: () => void }) {
  const { skin } = useSkin();
  const { openNode } = useGambitNode();
  const [active, setActive] = useState(0);
  // 5 buttons per spec, resolved per the D14 §5 matrix: Home scroll-top ·
  // All Markets opens the market list · Wallet / Market++ summon their
  // Gambit Nodes · Profile opens the console when signed in, else its node.
  //
  // "All Markets" now navigates to /markets rather than scrolling to a strip
  // of this page — same defect as the four desk buttons above, and the same
  // fix. A control named "All Markets" that shows a slice of the current page
  // is misnamed, not merely inconvenient.
  const items: [LucideIcon, string, () => void][] = [
    [Home, "Home", () => window.scrollTo({ top: 0, behavior: "smooth" })],
    [TrendingUp, "All Markets", () => { window.location.href = "/markets"; }],
    [Wallet, "Wallet", () => openNode("wallet")],
    [PlusSquare, "Market++", () => openNode("market-plus")],
    [User, "Profile", onProfile],
  ];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0", background: skin.panel, borderTop: `1px solid ${skin.border}`, backdropFilter: "blur(6px)", zIndex: 30 }}>
      {items.map(([Icon, label, fn], i) => (
        <button key={label} type="button" className="mg-tap" onClick={(e) => { setActive(i); tap(e, 0.45); fn(); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", color: i === active ? skin.accent : skin.muted, fontSize: 8, letterSpacing: 1, textTransform: "uppercase" }}>
          <Icon size={16} strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function PreviewInner() {
  const { skin, name, toggle } = useSkin();
  const { socialAuth } = useGame();
  const { openNode } = useGambitNode();
  const [sy, setSy] = useState(0);
  const [reduce, setReduce] = useState(false);
  // Tray/console state — rails retract and fold out. Desktop: pinned when open,
  // collapses fully on retract. Mobile: slide-in console overlays with backdrop.
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  // Ported from /mpp2.23: the active O-V deck drives the live conviction math
  // (multiplier → δ-limit, threshold, APY), so it is page state, not card state.
  const [activeDeck, setActiveDeck] = useState<OVDeck>(OV_DECKS[0]);
  const shellRef = React.useRef<HTMLDivElement>(null);

  // Dopamine payoff: full-screen celebration the moment social auth lands.
  useEffect(() => {
    if (socialAuth.isAuthenticated) celebrate({ intensity: 1 });
  }, [socialAuth.isAuthenticated]);

  // Desktop-width test, measured on THIS page's own box rather than on the
  // window. The app now renders inside DeviceFrame, whose desktop .mg-device is
  // a 440px phone, so window.matchMedia("(min-width: 1024px)") would answer for
  // a 1920px monitor and lay out side rails and a 1300px column inside 440px.
  // The container is the only honest measure once the frame is global.
  const wide = useContainerWide(shellRef, 1024);

  // The rails follow the container: pinned open when there is room, closed when
  // there is not. Kept as an effect on `wide` so a resize across the threshold
  // re-applies it, exactly as the media-query listener used to.
  useEffect(() => {
    setLeftOpen(wide);
    setRightOpen(wide);
  }, [wide]);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(rm.matches);
    const onScroll = () => setSy(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const par = (factor: number): string => (reduce ? "none" : `translateY(${sy * factor}px)`);

  return (
    // shellRef measures the page root, deliberately, not the inner shell whose
    // max-width is itself derived from `wide` — observing that would feed the
    // result back into its own input.
    <div ref={shellRef} style={{ position: "relative", minHeight: "100vh", background: skin.bg, color: skin.text, fontFamily: INSTRUMENT_FONT, overflowX: "hidden" }}>
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
          {/* The two tray toggles now flank the wordmark, so the controls that
              open the left and right rails sit on the side they open — the
              button's position states what it does. */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <button type="button" onClick={() => setLeftOpen((o) => !o)} aria-label="Toggle categories tray" title="Categories tray"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, flex: "none", borderRadius: 8, cursor: "pointer", color: leftOpen ? skin.accent : skin.muted, background: skin.card, border: `1px solid ${leftOpen ? `${skin.accent}66` : skin.border}` }}>
              <PanelLeft size={15} strokeWidth={2.25} />
            </button>

            {/* The lockup is the way home, as a logo is everywhere else on the
                web. A real <button> rather than a click handler on the mark, so
                it is keyboard reachable and announces itself. */}
            <button
              type="button"
              onClick={(e) => { tap(e, 0.5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              aria-label="MAD Gambit — back to top"
              title="MAD Gambit — back to top"
              style={{ display: "flex", alignItems: "center", minWidth: 0, padding: 0, background: "transparent", border: "none", cursor: "pointer" }}
            >
              <BrandMark accent={skin.accent2} gold={skin.gold} />
            </button>

            <button type="button" onClick={() => setRightOpen((o) => !o)} aria-label="Toggle account console" title="Account console"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, flex: "none", borderRadius: 8, cursor: "pointer", color: rightOpen ? skin.gold : skin.muted, background: skin.card, border: `1px solid ${rightOpen ? `${skin.gold}66` : skin.border}` }}>
              <PanelRight size={15} strokeWidth={2.25} />
            </button>
          </div>

          {/* Theme + auth, moved off the logo row. At 393px the old single row
              had six controls fighting for space and wrapped mid-word. */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
            <button type="button" onClick={toggle} style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "6px 11px", borderRadius: 8, cursor: "pointer", color: skin.text, background: skin.card, border: `1px solid ${skin.accent}66`, whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT }} title="Toggle Gilded Pop-Baroque ⇄ Neon Noir Tabloid">
              {name === "gilded" ? "◑ Gilded" : "◐ Neon Noir"}
            </button>
            <Chip label="Login" onClick={() => setAuthOpen(true)} />
            {/* §5 matrix: Sign Up summons the beta-gate node (Login stays real). */}
            <Chip label="Sign Up" filled onClick={(e) => { tap(e, 0.7); openNode("beta-gate"); }} />
          </div>
        </header>

        {/* The four desks, as a scrollable rail under the header. Each names
            the surface it opens rather than being a bare label, so the row
            reads as a destination list instead of four nouns. */}
        {/* CENTRED, EQUAL-WIDTH. Previously `flex: 0 0 auto` inside an
            overflow-x rail, so each button sized to its own label — four
            different widths, left-packed against the edge. Now the row is
            centred and each desk takes `flex: 1 1 0` off a shared basis, so
            all four are identical in width regardless of label length and the
            group sits centred under the header. maxWidth keeps them from
            stretching absurdly wide on desktop. */}
        <nav
          aria-label="Platform desks"
          style={{
            display: "flex", gap: 8, padding: "0 14px 10px",
            maxWidth: 720, margin: "0 auto", justifyContent: "center",
          }}
        >
          {DESKS.map((d) => (
            <HoldHint key={d.label} hint={DESK_HINTS[d.label]}>
            <a
              href={d.href}
              onClick={(e) => tap(e, 0.5)}
              style={{
                flex: "1 1 0", minWidth: 0, textAlign: "center", cursor: "pointer",
                padding: "7px 11px", borderRadius: 10, textDecoration: "none",
                background: skin.card, border: `1px solid ${skin.border}`,
                fontFamily: INSTRUMENT_FONT,
              }}
            >
              <span style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.gold }}>
                {d.label}
              </span>
              <span style={{ display: "block", marginTop: 2, fontSize: 8, color: skin.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d.sub} ›
              </span>
            </a>
            </HoldHint>
          ))}
        </nav>

        {/* Responsive shell: left + right rails on desktop (mockup sidebars), stacked on mobile */}
        <div style={{ maxWidth: wide ? 1300 : 1040, margin: "0 auto", padding: "8px 12px 96px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          {wide && leftOpen ? <CategoryRail /> : null}

          <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Worksheet C: the MAD Gambit hero lockup + tagline moved to the
               top-left header (see BrandMark). Worksheet E: the redundant
               "MARKETS · NYSE" panel was removed — the top CryptoTickerDual
               carries the perpetual market ticker. The column now leads with the
               News Flow. */}
            {/* KAITO live feed — the token strip from /mpp2.23. It leads
                because it is the fastest-moving thing on the page and reads as
                the room's pulse; below the News Flow it would be buried. */}
            <KaitoPriceTicker />

            {/* The four platform pillars — CONVICTIONS · PREDICTIONS · Z-LIAR
                · CARD GAME. Restored from SeikoDopamineHub (see the import
                note). They sit above the wire because they are the standing
                state of the platform, whereas the wire is what just happened. */}
            <PlatformCarousel />

            <div id="mg-news">
              <NewsTwoRow />
            </div>

            {/* The dials + chrono, lifted out of the foot of the perps deck
                into a container of their own, directly above the carousel.
                Below six market cards they read as a footnote to those cards;
                they are in fact a platform-state instrument, so they lead. */}
            <InstrumentDeckSection uid="preview-instrument" />

            <div>
              <SectionHeading>
                Customizable Dopamine Carousel
                {/* The strip has always auto-advanced — useAutoShowcase defaults
                    to enabled and its handlers are wired to the scroller. What
                    was missing is this badge, the platform's mark that the
                    motion is the rail showcasing itself rather than the user's
                    input. Motion without the mark just reads as drift. */}
                <AutoShowcaseBadge />
              </SectionHeading>
              <DopamineCarouselStrip />
            </div>

            {/* Octavian live mesh — the target of the Octavian desk button,
                sized like the Z-Liar meter so the two read as instruments of
                the same class rather than one dwarfing the other. */}
            <div id="mg-octavian" style={{ scrollMarginTop: 72 }}>
              <SectionHeading>Octavian · Live Mesh</SectionHeading>
              <div style={{ border: `1px solid ${skin.border}`, borderRadius: 14, overflow: "hidden", background: skin.panel }}>
                <OctavianCreature variant="full" />
              </div>
            </div>

            {/* O-V deck — ported from /mpp2.23. It is the control that retunes
                the instrument deck above: changing deck moves the multiplier,
                and the δ-limit, threshold and APY the instruments read all
                follow from it. */}
            <div>
              <SectionHeading>O-V Deck</SectionHeading>
              <OVDeckSelector selectedDeck={activeDeck} onSelect={setActiveDeck} convictionStake={500} />
            </div>

            {/* showInstrument={false}: the deck's cluster+chrono now lives in
                InstrumentDeckSection above. The deck keeps its six market
                cards. */}
            <PerpDials showInstrument={false} />

            {/* ── /gambit FLOOR, ported native (GameProvider-powered) ──
                SeikoDopamineHub removed here: it was the SECOND of two stacked
                Seiko clocks. The first — the split-flap chrono in
                GambitInstrumentCluster — lives on at the foot of PerpDials
                above, per founder direction. */}
            <div id="mg-markets" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 72 }}>
              <TopMarketsRail />
              <MarketRails />
            </div>
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

            {/* The three custom perpetual families, each with its own instrument. */}
            <div id="mg-faces" style={{ scrollMarginTop: 72 }}>
              <FacesWaterline />
            </div>
            {/* The Phase-4 gate and the transparency report, in public (§9.1). */}
            <div id="mg-registrar" style={{ scrollMarginTop: 72 }}>
              <RegistrarStatusPanel />
            </div>
            <div id="mg-zeitgeist" style={{ scrollMarginTop: 72 }}>
              <ZeitgeistAlmanac />
            </div>
            <div id="mg-epiphanies" style={{ scrollMarginTop: 72 }}>
              <EpiphanyCatalog />
            </div>

            {/* DUAL FEATURE SECTION — the two halves of the game economy, side
                by side on desktop and stacked on mobile.

                Left: Conviction + Prediction, where a position is taken.
                Right: the MADHATs Gambit deck on an auto-advancing carousel
                with the Dutch auction directly beneath it in the same shell —
                what you can own, and what it costs right now.

                They are paired rather than scattered because they are one loop:
                you form a conviction, you buy the cards that back it, the
                auction sets the price. Apart, they read as three unrelated
                features. */}
            {/* id="affliction", not the orphaned "mg-game" it replaced: nothing
                linked to mg-game, while perp-dials.tsx has always linked to
                /preview#affliction — an anchor that did not exist, so that tile
                dropped visitors at the top of the page. Same block, the name the
                rest of the app was already using. */}
            <div
              id="affliction"
              style={{
                display: "grid",
                gridTemplateColumns: wide ? "1fr 1fr" : "1fr",
                gap: 16,
                alignItems: "start",
                scrollMarginTop: 72,
              }}
            >
              <PredictionCircus activeDeck={activeDeck} />
              <GambitCardsAuctionSection />
            </div>

            {/* RECENTLY UNPACKED — the MADHATs Gambit deck as actually rolled.
                Restored from SeikoDopamineHub alongside the pillars above.

                It sits directly under the game block on purpose: the block
                above is what you can buy and what it costs, this is what came
                out. Cards are generated by openCardPack() from
                lib/gambit-game-math — the SAME deterministic weighted-rarity
                function the real pack-open route runs, not a decorative
                sample — so the rarity mix on display is the true drop
                distribution rather than a designer's guess at one. */}
            <div id="mg-unpacked" style={{ scrollMarginTop: 72 }}>
              <UnpackedCardsCarousel />
            </div>

            <div id="mg-featured">
              <FeaturedMarketCards />
            </div>

            {/* The precision merge: every /gambit module inline, lazy-mounted */}
            <ModuleShelf />

            {/* Every /gambit tab/feature, deep-linked into the new theme */}
            <div id="mg-market-plus" style={{ scrollMarginTop: 72 }}>
              <PlatformExplorer />
            </div>

            <div style={{ textAlign: "center", lineHeight: 1.7 }}>
              <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: skin.muted, textTransform: "uppercase" }}>
                {/* §5 matrix / Principle 9: every 1.88% is tappable → the fee-waterfall node. */}
                Platform Fee{" "}
                <button type="button" onClick={() => openNode("fee-waterfall")} className="mg-tap"
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: skin.gold, fontSize: "inherit", fontWeight: 900, letterSpacing: "inherit", textDecoration: "underline dotted", fontFamily: INSTRUMENT_FONT }}>
                  1.88%
                </button>
                {" "}· Creator Ladder 28.8–60% · Community 28.8% · $MADx 888,888,888 fixed
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
          /* item F: universal tactile press feedback — spring-scale + brighten */
          .mg-tap { transition: transform .12s cubic-bezier(.34,1.56,.64,1), filter .12s ease; }
          .mg-tap:hover { filter: brightness(1.08); }
          .mg-tap:active { transform: scale(.94); }
          @media (prefers-reduced-motion: reduce) {
            .mg-tray-in-l, .mg-tray-in-r { animation: none; }
            .mg-tap { transition: none; }
            .mg-tap:active { transform: none; }
          }
        `}</style>
      </div>

      <BottomNav
        onProfile={() => (socialAuth.isAuthenticated ? setRightOpen(true) : openNode("profile"))}
      />
      <JoyLayer />
      {/* MADHAT'r floating concierge — ported from /mpp2.23, where it is
          page-level and persists across every tab. Fixed bottom-right, so it
          costs the hub no layout. */}
      <MadhatrConcierge />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <SkinProvider>
      <GameProvider>
        {/* GambitNodeProvider rides the existing GameProvider tree (S0.6) —
            any descendant converts a dead link with openNode('id'). */}
        <GambitNodeProvider>
          <PreviewInner />
        </GambitNodeProvider>
      </GameProvider>
    </SkinProvider>
  );
}
