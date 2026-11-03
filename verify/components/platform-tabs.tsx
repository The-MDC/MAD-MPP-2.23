"use client";

/**
 * MAD Gambit — the platform tabs on the premiere hub.
 *
 * /mpp2.23 organises the platform as seven tabs: The Floor · NFT Saga · Arena ·
 * Packs · Portal · Casino · Logic. The premiere hub had the same features but
 * only as a long scroll, reachable by deep links that left the page. This is
 * the seven tabs on the hub itself: pick one and its page of features opens
 * right under the strip, the way a tabbed app does; pick The Floor and you go
 * to the market floor further down this page.
 *
 * Driven by PLATFORM_FEATURES, the same registry /mpp2.23's tab bar and the
 * PlatformExplorer read, so the three can never disagree about what the seven
 * tabs are. Deep links honour ?tab= (and #hash) exactly as /mpp2.23 does.
 *
 * The panels are loaded on demand: they are heavy, and a visitor who never
 * opens the Casino should not download it.
 */
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import TabStrip from "@/components/tab-strip";
import { useGame } from "@/context/game-context";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { PLATFORM_FEATURES, PLATFORM_TAB_KEYS, type PlatformTabKey } from "@/lib/platform-features";
import BrandSymbol from "@/components/brand-symbol";
import { SECTION_SYMBOL } from "@/lib/brand-symbols";
import { DECISION_NODES } from "@/lib/decision-demo-nodes";
import type { OVDeck } from "@/lib/gambit-game-math";

const Loading = () => (
  <div style={{ padding: "28px 4px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#8a8a95", fontFamily: INSTRUMENT_FONT }}>
    Loading…
  </div>
);
const lazy = <P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>) =>
  dynamic(load, { ssr: false, loading: Loading });

const NftSaga = lazy(() => import("@/components/nft-saga"));
const TournamentArena = lazy(() => import("@/components/tournament-arena"));
const PackShop = lazy(() => import("@/components/pack-shop"));
const PackOpening = lazy(() => import("@/components/pack-opening"));
const DutchAuctionPanel = lazy(() => import("@/components/dutch-auction-panel"));
const StakingTiersPanel = lazy(() => import("@/components/staking-tiers-panel"));
const PortalTab = lazy(() => import("@/components/portal-tab"));
const CasinoPanel = lazy(() => import("@/components/casino-panel"));
const StateMachineView = lazy(() => import("@/components/state-machine-view"));
const FutarchyBoard = lazy(() => import("@/components/futarchy-board"));
const BayesianDecisionTree = lazy(() => import("@/components/decision-tree"));
const LogicLab = lazy(() => import("@/components/logic-lab"));

type Tab = PlatformTabKey;

export default function PlatformTabs({
  activeDeck, floorId = "mg-markets",
}: {
  activeDeck: OVDeck;
  /** The element The Floor tab scrolls to — the market floor on this page. */
  floorId?: string;
}) {
  const { skin } = useSkin();
  const { cards } = useGame();
  const hasGoldenHand = cards.some((c) => ["Golden Hand", "Mythic"].includes(c.rarity));
  const [tab, setTab] = useState<Tab>("floor");

  // Deep-link: ?tab=saga (or #saga) opens that tab on load, as /mpp2.23 does.
  useEffect(() => {
    const raw = (new URLSearchParams(window.location.search).get("tab") || window.location.hash.replace("#", "")).toLowerCase();
    if ((PLATFORM_TAB_KEYS as readonly string[]).indexOf(raw) > 0) {
      setTab(raw as Tab);
      requestAnimationFrame(() => document.getElementById("mg-platform-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  const choose = (id: Tab) => {
    setTab(id);
    if (id === "floor") document.getElementById(floorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="mg-platform-tabs" aria-label="Platform tabs" style={{ scrollMarginTop: 72, fontFamily: INSTRUMENT_FONT }}>
      <TabStrip<Tab>
        label="Platform"
        panelId={tab !== "floor" ? "mg-platform-panel" : undefined}
        value={tab}
        onChange={choose}
        items={PLATFORM_FEATURES.map((f) => {
          const locked = !!f.gated && !hasGoldenHand;
          return {
            id: f.key,
            label: locked ? `${f.name} 🔒` : f.name,
            icon: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, opacity: locked ? 0.4 : 1 }}>
                <f.Icon size={13} strokeWidth={2.25} />
                <BrandSymbol id={SECTION_SYMBOL[f.key]} size={18} />
              </span>
            ),
          };
        })}
      />

      {tab !== "floor" ? (
        <div
          id="mg-platform-panel"
          role="tabpanel"
          aria-label={PLATFORM_FEATURES.find((f) => f.key === tab)?.name}
          style={{ marginTop: 12, border: `1px solid ${skin.border}`, borderRadius: 14, background: skin.panel, padding: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: skin.gold }}>
              {PLATFORM_FEATURES.find((f) => f.key === tab)?.name}
              <span style={{ marginLeft: 8, fontWeight: 700, letterSpacing: 0.4, textTransform: "none", color: skin.muted, fontSize: 9 }}>
                {PLATFORM_FEATURES.find((f) => f.key === tab)?.blurb}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setTab("floor")}
              aria-label="Close this tab"
              title="Back to The Floor"
              className="mg-tap mg-glass"
              style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, cursor: "pointer", color: skin.text, background: skin.card, border: `1px solid ${skin.border}` }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {tab === "saga" && <NftSaga />}
            {tab === "arena" && <TournamentArena />}
            {tab === "packs" && (<><PackShop /><PackOpening /><DutchAuctionPanel /></>)}
            {tab === "portal" && (<><StakingTiersPanel /><PortalTab /></>)}
            {tab === "casino" && <CasinoPanel />}
            {tab === "logic" && (
              <>
                <StateMachineView />
                <FutarchyBoard />
                <BayesianDecisionTree nodes={DECISION_NODES} />
                <LogicLab activeDeck={activeDeck} />
                {/* The almanac, epiphany catalogue, explorer and registrar panel
                    that /mpp2.23 appends here are already sections of this page. */}
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
