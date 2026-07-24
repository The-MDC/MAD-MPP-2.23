"use client";

/**
 * MAD Gambit — Platform Module Shelf (the precision merge).
 * ────────────────────────────────────────────────────────────────
 * Every remaining /gambit module mounted INLINE in the hub, grouped into
 * collapsible skin-aware sections. Children are lazy-mounted (render only when
 * a section opens) so the hub's first paint stays fast while each module keeps
 * its full /gambit fidelity. Requires GameProvider (the hub provides it);
 * Theme/Workspace/Mpp providers come from the root layout.
 */
import React, { useState } from "react";
import { ChevronDown, ChevronRight, type LucideIcon, Package, Layers, Trophy, Crown, Ticket, Cpu, ShieldAlert } from "lucide-react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { OV_DECKS } from "@/lib/gambit-game-math";

import PackShop from "@/components/pack-shop";
import PackOpening from "@/components/pack-opening";
import DutchAuctionPanel from "@/components/dutch-auction-panel";
import NftSaga from "@/components/nft-saga";
import TournamentArena from "@/components/tournament-arena";
import CasinoPanel from "@/components/casino-panel";
import StakingTiersPanel from "@/components/staking-tiers-panel";
import PortalTab from "@/components/portal-tab";
import { PredictionCircus } from "@/components/kaito-and-circus";
import SwapInterface from "@/components/swap-interface";
import MarketFactory from "@/components/market-factory";
import GameLobby from "@/components/game-lobby";
import StateMachineView from "@/components/state-machine-view";
import FutarchyBoard from "@/components/futarchy-board";
import BayesianDecisionTree from "@/components/decision-tree";
import LogicLab from "@/components/logic-lab";

// Same demo Bayesian chain the /gambit Logic tab ships with.
const DECISION_NODES = [
  { evidence: "Scandal velocity σ² spike (GARCH)", oldPrior: 0.42, newPosterior: 0.61, shift: 0.19, action: "WEAK_BUY" as const },
  { evidence: "Z-Liar sentiment flips truth→liar", oldPrior: 0.61, newPosterior: 0.38, shift: -0.23, action: "WEAK_SELL" as const },
  { evidence: "Whale conviction stake detected", oldPrior: 0.38, newPosterior: 0.72, shift: 0.34, action: "STRONG_BUY" as const },
  { evidence: "RSS wire corroboration (7 feeds)", oldPrior: 0.72, newPosterior: 0.78, shift: 0.06, action: "HOLD" as const },
  { evidence: "Oracle cascade divergence", oldPrior: 0.78, newPosterior: 0.55, shift: -0.23, action: "STRONG_SELL" as const },
];

function Section({ Icon, title, blurb, defaultOpen = false, children }: {
  Icon: LucideIcon; title: string; blurb: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const { skin } = useSkin();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
      >
        {open ? <ChevronDown size={13} style={{ color: skin.accent, flex: "none" }} /> : <ChevronRight size={13} style={{ color: skin.muted, flex: "none" }} />}
        <Icon size={14} strokeWidth={2.25} style={{ color: open ? skin.gold : skin.muted, flex: "none" }} />
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: open ? skin.gold : skin.text, textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: 7.5, color: skin.muted, marginLeft: "auto", textAlign: "right" }}>{blurb}</span>
      </button>
      {open ? <div style={{ padding: "4px 12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div> : null}
    </div>
  );
}

export default function ModuleShelf() {
  const { skin } = useSkin();
  const deck = OV_DECKS[0];
  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", margin: "0 0 4px 2px" }}>
        Platform Modules
      </div>
      <div style={{ fontSize: 8, color: skin.muted, margin: "0 0 12px 2px" }}>
        The full /gambit module set, merged inline — open a bay to mount it live.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Section Icon={Package} title="Packs & Dutch Auction" blurb="Pack shop · Golden Ticket opening · descending-price auction">
          <PackShop />
          <PackOpening />
          <DutchAuctionPanel />
        </Section>
        <Section Icon={Layers} title="NFT Saga" blurb="Collection · evolution · saga episodes">
          <NftSaga />
        </Section>
        <Section Icon={Trophy} title="Arena" blurb="Named tournaments · Cull PvP">
          <TournamentArena />
        </Section>
        <Section Icon={Crown} title="Golden Hand Casino" blurb="Golden-Hand-gated provably-fair flip">
          <CasinoPanel />
        </Section>
        <Section Icon={Ticket} title="Staking & Portal" blurb="Staking tiers · thesis carousel · contribution connectors">
          <StakingTiersPanel />
          <PortalTab />
        </Section>
        <Section Icon={ShieldAlert} title="Trading Floor Extras" blurb="Prediction Circus · Swap · Market Factory · Lobby">
          <PredictionCircus activeDeck={deck} />
          <SwapInterface activeDeck={deck} />
          <MarketFactory />
          <GameLobby />
        </Section>
        <Section Icon={Cpu} title="Logic Lab" blurb="State machine · Futarchy · Bayesian tree · δ-limit / φ-shield">
          <StateMachineView />
          <FutarchyBoard />
          <BayesianDecisionTree nodes={DECISION_NODES} />
          <LogicLab activeDeck={deck} />
        </Section>
      </div>
    </div>
  );
}
