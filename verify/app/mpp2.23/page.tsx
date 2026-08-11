"use client";

/**
 * MΛĐ Gambit — /mpp2.23  v3.0  (the ALTERNATIVE earlier hub theme)
 * ─────────────────────────────────────────────────────────────────
 * Served at /mpp2.23; the retired /gambit route redirects here (query
 * preserved, so /gambit?tab=X → /mpp2.23?tab=X still deep-links a tab).
 * Full platform assembled. 7 tabs. All sprint deliverables wired.
 *
 * THE FLOOR     — Scandal Velocity + Prediction Circus + Positions
 *                 + Swap Interface + Z-Liar + Dopamine Engine
 * NFT SAGA      — Card collection + Evolution + Saga episodes
 * ARENA         — Named Tournaments + Cull PvP
 * PACKS         — Dutch Auction + Golden Ticket
 * PORTAL        — Thesis carousel + Contribution Connectors
 * CASINO        — Golden Hand gated provably fair flip
 * LOGIC         — δ-limit + φ-shield + Code Checker + DAO Sim
 *
 * Dopamine principles encoded throughout:
 *  - DottedGlowBackground driven by live chaosMeter
 *  - VRS flash covers viewport on Fibonacci node hit
 *  - ScandalVelocityMeter changes color temperature with GARCH σ²
 *  - All animations respect prefers-reduced-motion
 *  - Skin tokens from SKIN_TOKENS drive all accent colors
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameProvider } from "@/context/game-context";
import { useGame } from "@/context/game-context";

// Background
import DottedGlowBackground from "@/components/dotted-glow-background";

// Floor components
import ScandalVelocityMeter from "@/components/scandal-velocity-meter";
import { KaitoPriceTicker, PredictionCircus } from "@/components/kaito-and-circus";
import PositionsDashboard from "@/components/positions-dashboard";
import SwapInterface from "@/components/swap-interface";
import ZLiarSection from "@/components/zliar-section";
import GameLobby from "@/components/game-lobby";
import PackShop from "@/components/pack-shop";
import TopMarketsRail from "@/components/top-markets-rail";
import MarketRails from "@/components/market-rails";
import DopamineEngine from "@/components/dopamine-engine";
import LiveTicker from "@/components/live-ticker";
import OVDeckSelector from "@/components/ov-deck-selector";
// Ported from the /preview premiere theme — see docs/HANDOFF_2026-08-11_AUDIT.md §9.
import MarketTypeCarousels from "@/components/market-type-carousels";
import FeaturedMarketCards from "@/components/featured-market-cards";
import { SkinProvider } from "@/components/skin-provider";
import { THEME_SKIN_TO_SKIN_NAME } from "@/lib/skins";
import MadhatrConcierge from "@/components/madhatr-concierge";
import { EigenTrustWidget } from "@/components/virality-eigen";
import AuthModal from "@/components/auth-modal";

// Tab panels
import NftSaga from "@/components/nft-saga";
import TournamentArena from "@/components/tournament-arena";
import DutchAuctionPanel from "@/components/dutch-auction-panel";
import PortalTab from "@/components/portal-tab";
import CasinoPanel from "@/components/casino-panel";
import LogicLab from "@/components/logic-lab";
import PackOpening from "@/components/pack-opening";
import StakingTiersPanel from "@/components/staking-tiers-panel";
import SeikoDopamineHub from "@/components/seiko-dopamine-hub";
import BottomNav from "@/components/bottom-nav";
import DeviceFrame from "@/components/device-frame";
import MainNav from "@/components/main-nav";
import FutarchyBoard from "@/components/futarchy-board";
import MarketFactory from "@/components/market-factory";
import BayesianDecisionTree from "@/components/decision-tree";
import { useTheme } from "@/context/theme-context";
import StateMachineView from "@/components/state-machine-view";
import JoyLayer, { celebrate } from "@/components/joy-layer";

import {
  OVDeck, OV_DECKS, SKIN_TOKENS, SkinTokens,
} from "@/lib/gambit-game-math";
import { PLATFORM_FEATURES, PLATFORM_TAB_KEYS, type PlatformTabKey } from "@/lib/platform-features";
import {
  Palette, Sparkles, User, Wallet, LogOut
} from "lucide-react";

type Tab = PlatformTabKey;

// Demo Bayesian evidence chain for the Logic tab's decision tree (thematic).
const DECISION_NODES = [
  { evidence: "Scandal velocity σ² spike (GARCH)", oldPrior: 0.42, newPosterior: 0.61, shift: 0.19, action: "WEAK_BUY" as const },
  { evidence: "Z-Liar sentiment flips truth→liar",  oldPrior: 0.61, newPosterior: 0.38, shift: -0.23, action: "WEAK_SELL" as const },
  { evidence: "Whale conviction stake detected",     oldPrior: 0.38, newPosterior: 0.72, shift: 0.34, action: "STRONG_BUY" as const },
  { evidence: "RSS wire corroboration (7 feeds)",    oldPrior: 0.72, newPosterior: 0.78, shift: 0.06, action: "HOLD" as const },
  { evidence: "Oracle cascade divergence",           oldPrior: 0.78, newPosterior: 0.55, shift: -0.23, action: "STRONG_SELL" as const },
];

export default function GambitPage() {
  return (
    <GameProvider>
      <DeviceFrame>
        <GambitInner />
      </DeviceFrame>
    </GameProvider>
  );
}

function GambitInner() {
  const [tab, setTab]             = useState<Tab>("floor");
  const [activeDeck, setActiveDeck] = useState<OVDeck>(OV_DECKS[0]);
  const { skin, setSkin, tokens } = useTheme(); // global theme — shared app-wide
  const [skinMenuOpen, setSkinMenuOpen] = useState(false);

  const { chaosMeter, vrsFlash, cards, socialAuth, setSocialAuth, walletAuth, setWalletAuth } = useGame();
  const hasGoldenHand = cards.some(c => ["Golden Hand","Mythic"].includes(c.rarity));

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Deep-link: open the tab named in ?tab= (or #hash) on load, so the hub / any
  // link can route straight into a platform tab. Validated against the Tab union.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("tab") || window.location.hash.replace("#", "")).toLowerCase();
    if ((PLATFORM_TAB_KEYS as readonly string[]).indexOf(raw) !== -1) setTab(raw as Tab);
  }, []);

  // Reward-moment delight — a celebration burst when entering a high-point tab.
  useEffect(() => {
    if (tab === "packs" || tab === "casino" || tab === "arena") {
      celebrate({ intensity: tab === "casino" ? 1.1 : 0.7 });
    }
  }, [tab]);

  return (
    // Controlled SkinProvider — the theming bridge for this route.
    //
    // This page themes through ThemeProvider/useTheme (3 ThemeSkins, stored
    // under mad_theme_skin). Components ported from /preview theme through
    // useSkin() (2 SkinNames, stored under mg_skin). Projecting the active
    // ThemeSkin through THEME_SKIN_TO_SKIN_NAME and publishing it here is what
    // makes every ported surface follow THIS page's existing skin menu.
    // Controlled mode means the provider never writes mg_skin, so driving the
    // menu here cannot clobber the skin /preview has saved.
    <SkinProvider value={THEME_SKIN_TO_SKIN_NAME[skin]}>
    <main className="min-h-screen text-neutral-100 relative overflow-hidden pb-16"
      style={{ background: tokens.bg }}>

      {/* ── Canvas dot backdrop (intensity driven by chaosMeter) */}
      <DottedGlowBackground
        gap={14} radius={1.5}
        color="rgba(255,255,255,0.05)"
        glowColor={tokens.glow + "cc"}
        speedMin={0.3 + chaosMeter * 0.007}
        speedMax={1.0 + chaosMeter * 0.01}
        speedScale={0.5 + chaosMeter * 0.005}
      />

      {/* ── Ambient radial glows */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle 900px at 85% -100px, ${tokens.accent}18, transparent)` }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle 900px at 10% 700px, ${tokens.primary}12, transparent)` }} />
      <div className="absolute top-1/3 left-1/3 w-[520px] h-[520px] rounded-full pointer-events-none animate-chaos-pulse"
        style={{ background: `${tokens.secondary}06`, filter: "blur(170px)" }} />

      {/* ── VRS full-viewport flash on Fibonacci jackpot */}
      {vrsFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-scandal-flash"
          style={{ background: `${tokens.primary}20` }} />
      )}

      {/* ── TOP AUTH BAR ── */}
      <div className="relative z-20 flex items-center justify-end p-4 gap-3">
        {!socialAuth.isAuthenticated ? (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Login / Sign Up
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-[#05070c] border border-neutral-800 rounded-lg flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-mono text-[10px] text-neutral-300">{socialAuth.email}</span>
            </div>
            
            {!walletAuth.isConnected ? (
              <button 
                onClick={() => setWalletAuth({ isConnected: true, address: "0xMAD...8888" })}
                className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase font-bold tracking-widest rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" /> Connect Wallet
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[10px] text-cyan-400 font-bold">{walletAuth.address}</span>
              </div>
            )}
            
            <button 
              onClick={() => {
                setSocialAuth({ isAuthenticated: false, provider: null, email: null });
                setWalletAuth({ isConnected: false, address: null });
              }}
              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-24 lg:pb-2">

        {/* HERO HEADER */}
        <header className="text-center mb-4">
          <BrandLockup primary={tokens.primary} accent={tokens.accent} />
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-neutral-500 mt-3">
            Predict the Scandal · Own the Culture
          </p>
          <Trinity />
        </header>

        {/* HAMBURGER MENU — docked inside the phone; global theme button lives here */}
        <MainNav active={tab} onSelect={setTab} hasGoldenHand={hasGoldenHand} />

        {/* KAITO TICKER */}
        <div className="mb-2"><KaitoPriceTicker /></div>

        {/* RSS WIRE */}
        <div className="mb-4"><LiveTicker /></div>

        {/* O-V DECK + SKIN */}
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-5 items-start">
          <OVDeckSelector selectedDeck={activeDeck} onSelect={setActiveDeck} convictionStake={500} />
          <div className="relative">
            <button onClick={() => setSkinMenuOpen(p => !p)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-800 bg-[#030508] hover:border-neutral-700 transition-all font-mono text-[10px] uppercase tracking-wider whitespace-nowrap"
              style={{ color: tokens.primary }}>
              <Palette className="w-3.5 h-3.5" /> {tokens.label}
            </button>
            {skinMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 rounded-xl border border-neutral-800 bg-[#05070c] shadow-2xl overflow-hidden z-50 w-52">
                {(Object.values(SKIN_TOKENS) as SkinTokens[]).map(s => (
                  <button key={s.id} onClick={() => { setSkin(s.id); setSkinMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#0b0e14] transition-all flex items-center gap-2.5 ${s.id === skin ? "border-l-2" : ""}`}
                    style={s.id === skin ? { borderColor: s.primary } : {}}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.primary }} />
                    <span className="font-mono text-[10px] text-neutral-300">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7 TABS — driven by the shared PLATFORM_FEATURES registry so this bar and
            the premiere theme's PlatformExplorer can never drift out of parity. */}
        <nav className="flex items-center justify-center flex-wrap gap-2 mb-6">
          {PLATFORM_FEATURES.map((f) => {
            const locked = !!f.gated && !hasGoldenHand;
            return (
              <TabBtn
                key={f.key}
                active={tab === f.key}
                onClick={() => setTab(f.key)}
                icon={<f.Icon className={`w-3.5 h-3.5${locked ? " opacity-30" : ""}`} />}
                label={locked ? `${f.name} 🔒` : f.name}
                color={tokens.primary}
              />
            );
          })}
        </nav>

        {/* PANELS — crossfade between tabs for a polished transition */}
        <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >

        {/* ── THE FLOOR ── */}
        {tab === "floor" && (
          <div className="space-y-5">
            <SeikoDopamineHub />
            <TopMarketsRail />
            <ZLiarSection />
            <MarketRails />
            {/* Ported from /preview so both themes carry the same market
                surfaces. The dopamine strip is deliberately NOT ported here —
                SeikoDopamineHub above already renders its own tile carousel,
                and stacking a second one repeats the twin-Seiko mistake.

                These no longer need a local SkinProvider — the page-level
                controlled one now drives every useSkin() consumer from this
                route's own skin menu. */}
            <MarketTypeCarousels />
            <FeaturedMarketCards />
            <ScandalVelocityMeter />
            <MarketFactory />
            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
              <div className="space-y-5">
                <PredictionCircus activeDeck={activeDeck} />
                <SwapInterface activeDeck={activeDeck} />
              </div>
              <div className="space-y-5">
                <PositionsDashboard />
                <EigenTrustWidget />
                <DopamineEngine />
              </div>
            </div>
            <GameLobby />
          </div>
        )}

        {tab === "saga"   && <NftSaga />}
        {tab === "arena"  && <TournamentArena />}
        {tab === "packs"  && (
          <div className="space-y-4">
            <PackShop />
            <PackOpening />
            <DutchAuctionPanel />
          </div>
        )}
        {tab === "portal" && (
          <div className="space-y-4">
            <StakingTiersPanel />
            <PortalTab />
          </div>
        )}
        {tab === "casino" && <CasinoPanel />}
        {tab === "logic"  && (
          <div className="space-y-4">
            <StateMachineView />
            <FutarchyBoard />
            <BayesianDecisionTree nodes={DECISION_NODES} />
            <LogicLab activeDeck={activeDeck} />
          </div>
        )}

        </motion.div>
        </AnimatePresence>

        <footer className="mt-12 text-center space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            Platform Fee 1.88% · Creator Share 40% · Community 28.8% · $MADx 888,888,888 fixed
          </p>
          <p className="font-mono text-[9px] text-neutral-700">
            © 2026 MΛĐ GAMBIT LLC · Conviction · Prediction · Affliction
          </p>
        </footer>
      </div>

      {/* Reward-moment celebration layer — fires on high-point tabs / wins.
          Fixed canvas; inside the DeviceFrame transform it stays in the phone. */}
      <JoyLayer />

      {/* Fixed mobile bottom action bar — additive mobile UX, mirrors the 7 tabs.
          Desktop (lg+) keeps the shipped top tab bar; this is lg:hidden. */}
      <BottomNav active={tab} onSelect={setTab} color={tokens.primary} hasGoldenHand={hasGoldenHand} />

      {/* MADHAT'r floating concierge — page-level, persists across every tab.
          Fixed bottom-right, real top-hat logo, GEMINI.md persona. */}
      <MadhatrConcierge />
      
      {/* ── GLOBAL MODALS ── */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </main>
    </SkinProvider>
  );
}

function BrandLockup({ primary, accent }: { primary: string; accent: string }) {
  return (
    <svg viewBox="0 0 520 90" className="w-[300px] sm:w-[360px] mx-auto animate-dramatic">
      <defs>
        <linearGradient id="gold-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffcf0"/><stop offset="25%" stopColor="#efc76d"/>
          <stop offset="50%" stopColor="#ab7b29"/><stop offset="75%" stopColor="#f7d983"/>
          <stop offset="100%" stopColor="#5c3c04"/>
        </linearGradient>
        <filter id="g-glow"><feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <text x="6" y="68" fontFamily="Georgia,serif" fontSize="72" fontWeight="900" letterSpacing="3"
        fill="url(#gold-g)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.9))">MΛĐ</text>
      <g filter="url(#g-glow)">
        <polygon points="218,18 240,72 222,72 246,118 210,80 226,80"
          transform="translate(0,-14) scale(0.62) translate(150,10)" fill={primary}/>
      </g>
      <text x="232" y="68" fontFamily="Georgia,serif" fontSize="72" fontWeight="900" letterSpacing="1"
        fill="url(#gold-g)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.9))">Gambit</text>
    </svg>
  );
}

function Trinity() {
  const p = [["PREDICTION","#fbbf24"],["CONVICTION","#ec4899"],["AFFLICTION","#c084fc"]] as const;
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 mt-4">
      {p.map(([l,c],i) => (
        <React.Fragment key={l}>
          <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]"
            style={{color:c, textShadow:`0 0 12px ${c}55`}}>{l}</span>
          {i<2 && <span className="text-neutral-700">·</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, color }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all ${
        active ? "border" : "border border-neutral-850 text-neutral-500 hover:text-neutral-300"
      }`}
      style={active ? { background: color + "18", borderColor: color + "55", color } : {}}>
      {icon} {label}
    </button>
  );
}
