"use client";

/**
 * MAD Gambit — Conviction & Prediction market rails
 * ------------------------------------------------------------------
 * Two labelled carousels on the shared Carousel primitive: Conviction
 * markets (with a mini dopamine dial) and Prediction markets. INK tokens.
 */

import React from "react";
import { Brain, Target, Gavel } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import { DEMO_PREDICTION_MARKETS, odds } from "@/lib/demo-markets";

interface Mkt { id: string; q: string; a: number; b: number; conviction: number; }
const CONVICTION: Mkt[] = [
  { id: "c1", q: "MADx sustains > $1 for 30 days", a: 1.8, b: 2.1, conviction: 72 },
  { id: "c2", q: "Community pool crosses $20M", a: 1.5, b: 2.6, conviction: 64 },
  { id: "c3", q: "Golden Hand floor doubles", a: 2.2, b: 1.6, conviction: 58 },
  { id: "c4", q: "Staking APY holds above 24%", a: 1.9, b: 1.9, conviction: 49 },
  { id: "c5", q: "Chaos index stays sub-70 this week", a: 1.7, b: 2.2, conviction: 41 },
];
// Prediction copy comes from lib/demo-markets so this rail and the featured
// cards cannot disagree about the same book again.
const PREDICTION: Mkt[] = DEMO_PREDICTION_MARKETS.map((m) => ({
  id: m.id, q: m.question, a: m.yes, b: m.no, conviction: 0,
}));

function Dial({ v, color }: { v: number; color: string }) {
  const cx = 22, cy = 22, r = 17;
  const ang = Math.PI - (Math.max(0, Math.min(100, v)) / 100) * Math.PI;
  const nx = cx + Math.cos(ang) * r, ny = cy - Math.sin(ang) * r;
  return (
    <svg width={44} height={28} viewBox="0 0 44 26" aria-hidden="true">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={INK.border} strokeWidth="3" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}

function Card({ m, kind }: { m: Mkt; kind: "conviction" | "prediction" }) {
  const isC = kind === "conviction";
  const col = isC ? INK.cyan : INK.gold;
  return (
    <div className="w-[180px] rounded-xl border p-3" style={{ borderColor: INK.border, background: INK.bgCard }}>
      <p className="font-sans text-[11px] font-semibold leading-tight mb-2" style={{ color: INK.white, minHeight: 30 }}>{m.q}</p>
      {isC && (
        <div className="flex items-center gap-2 mb-2">
          <Dial v={m.conviction} color={col} />
          <span className="font-mono text-[10px] font-black" style={{ color: col }}>{m.conviction}% conviction</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <a href="/open-markets?tab=prediction" className="flex-1 text-center rounded-md py-2 font-mono text-[9px] font-bold" style={{ background: `${INK.green}18`, color: INK.green, textDecoration: "none" }}>YES {odds(m.a)}</a>
        <a href="/open-markets?tab=prediction" className="flex-1 text-center rounded-md py-2 font-mono text-[9px] font-bold" style={{ background: `${INK.pink}18`, color: INK.pink, textDecoration: "none" }}>NO {odds(m.b)}</a>
      </div>
    </div>
  );
}

function Rail({ title, icon, color, data, kind }: { title: string; icon: React.ReactNode; color: string; data: Mkt[]; kind: "conviction" | "prediction" }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: INK.border, background: "rgba(8,10,18,0.55)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color }}>{icon}</span>
        <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest" style={{ color: INK.white }}>{title}</h3>
        <AutoShowcaseBadge />
      </div>
      <Carousel ariaLabel={title} auto>
        {data.map((m) => <Card key={m.id} m={m} kind={kind} />)}
      </Carousel>
    </div>
  );
}

const DUTCH = [
  { id: "d1", name: "Scandal Pack Drop", price: 42, floor: 10 },
  { id: "d2", name: "Golden Genesis NFT", price: 88, floor: 25 },
  { id: "d3", name: "Founder's Golden Ticket", price: 128, floor: 40 },
  { id: "d4", name: "Mythic Vault Key", price: 64, floor: 15 },
];

function DutchCard({ d }: { d: (typeof DUTCH)[number] }) {
  return (
    <div className="w-[180px] rounded-xl border p-3" style={{ borderColor: INK.borderGold, background: INK.bgCard }}>
      <p className="font-sans text-[11px] font-semibold mb-2" style={{ color: INK.white, minHeight: 30 }}>{d.name}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[18px] font-black" style={{ color: INK.gold }}>{d.price}</span>
        <span className="font-mono text-[9px]" style={{ color: INK.muted }}>$MADx ↓</span>
      </div>
      <p className="font-mono text-[8px] uppercase mb-2" style={{ color: INK.muted }}>floor {d.floor} · −5 / 5s</p>
      <a href="#affliction" className="block text-center w-full py-2 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider active:scale-95 transition-transform" style={{ background: INK.gold, color: "#05070c", textDecoration: "none" }}>Claim</a>
    </div>
  );
}

export default function MarketRails() {
  return (
    <div className="space-y-4">
      <Rail title="Conviction Markets" icon={<Brain className="w-4 h-4" />} color={INK.cyan} data={CONVICTION} kind="conviction" />
      <Rail title="Prediction Markets" icon={<Target className="w-4 h-4" />} color={INK.gold} data={PREDICTION} kind="prediction" />
      <div className="rounded-2xl border p-4" style={{ borderColor: INK.border, background: "rgba(8,10,18,0.55)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4" style={{ color: INK.gold }} />
          <h3 className="font-mono text-[12px] font-bold uppercase tracking-widest" style={{ color: INK.white }}>Dutch Auctions</h3>
          <AutoShowcaseBadge />
        </div>
        <Carousel ariaLabel="Dutch auctions" auto>
          {DUTCH.map((d) => <DutchCard key={d.id} d={d} />)}
        </Carousel>
      </div>
    </div>
  );
}
