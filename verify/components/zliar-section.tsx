"use client";

/**
 * MAD Gambit — Z-Liar Section
 * ------------------------------------------------------------------
 * Z-Liar meter/dial + "Liar of the Day" Yes/No vote (celebration on cast)
 * + carousel of ALL Z-Liar credibility markets (shared Carousel primitive).
 * INK tokens, reduced-motion friendly, SSR-safe.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, ThumbsUp, ThumbsDown, Flame } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import Carousel from "@/components/carousel";
import ZLiarMeter from "@/components/zliar-meter";
import { celebrate } from "@/components/joy-layer";

interface ZMarket { id: string; subject: string; claim: string; credibility: number; yes: number; no: number; }
const MARKETS: ZMarket[] = [
  { id: "z1", subject: "ANON CEO",     claim: "“Funds are SAFU, trust me.”",  credibility: 22, yes: 2.4, no: 1.5 },
  { id: "z2", subject: "MEME FOUNDER", claim: "“Not a rug — LP is locked.”",  credibility: 38, yes: 1.9, no: 1.8 },
  { id: "z3", subject: "CELEB SHILL",  claim: "“Definitely not a paid post.”", credibility: 15, yes: 3.1, no: 1.3 },
  { id: "z4", subject: "AI LAB",       claim: "“AGI ships next quarter.”",     credibility: 44, yes: 1.7, no: 2.0 },
  { id: "z5", subject: "EXCHANGE",     claim: "“Reserves are fully 1:1.”",     credibility: 57, yes: 1.5, no: 2.4 },
];
const LIAR_OF_DAY = MARKETS[0];

export default function ZLiarSection() {
  const [vote, setVote] = useState<null | "yes" | "no">(null);
  const [tally, setTally] = useState({ yes: 6120, no: 2380 });

  const cast = (v: "yes" | "no") => {
    if (vote) return;
    setVote(v);
    setTally((t) => ({ ...t, [v]: t[v] + 1 }));
    celebrate({ intensity: 0.8, colors: [INK.pink, INK.gold] });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(12); } catch {} }
  };
  const total = tally.yes + tally.no;
  const yesPct = Math.round((tally.yes / total) * 100);

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: INK.border, background: "rgba(8,10,18,0.55)" }}>
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4" style={{ color: INK.pink }} />
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: INK.white }}>Z-Liar Meter</h3>
        <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: INK.muted }}>credibility markets</span>
      </div>

      <ZLiarMeter />

      {/* Liar of the Day — Yes/No vote */}
      <div className="rounded-2xl border p-4" style={{ borderColor: INK.borderGold, background: "rgba(3,5,8,0.6)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4" style={{ color: INK.gold }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: INK.gold }}>Liar of the Day</span>
        </div>
        <p className="font-mono text-[13px] font-bold" style={{ color: INK.white }}>{LIAR_OF_DAY.subject}</p>
        <p className="font-sans text-[12px] italic mb-3" style={{ color: INK.muted }}>{LIAR_OF_DAY.claim}</p>
        <div className="flex gap-2">
          <VoteBtn active={vote === "yes"} disabled={!!vote} onClick={() => cast("yes")} color={INK.pink} icon={<ThumbsUp className="w-4 h-4" />} label="LIAR" />
          <VoteBtn active={vote === "no"} disabled={!!vote} onClick={() => cast("no")} color={INK.green} icon={<ThumbsDown className="w-4 h-4" />} label="TRUTH" />
        </div>
        {vote && (
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: INK.bgCard }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${yesPct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} style={{ height: "100%", background: INK.pink }} />
            </div>
            <div className="flex justify-between mt-1 font-mono text-[9px]">
              <span style={{ color: INK.pink }}>LIAR {yesPct}%</span>
              <span style={{ color: INK.green }}>TRUTH {100 - yesPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ALL Z-Liar markets — carousel */}
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: INK.muted }}>All Z-Liar Markets</p>
        <Carousel ariaLabel="Z-Liar markets">
          {MARKETS.map((m) => <MarketCard key={m.id} m={m} />)}
        </Carousel>
      </div>
    </div>
  );
}

function VoteBtn({ active, disabled, onClick, color, icon, label }: {
  active: boolean; disabled: boolean; onClick: () => void; color: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-70"
      style={{ background: active ? `${color}28` : `${color}12`, color, border: `1px solid ${color}${active ? "" : "55"}` }}>
      {icon}{label}
    </button>
  );
}

function MarketCard({ m }: { m: ZMarket }) {
  const col = m.credibility < 35 ? INK.pink : m.credibility < 60 ? INK.gold : INK.green;
  return (
    <div className="w-[168px] rounded-xl border p-3" style={{ borderColor: INK.border, background: INK.bgCard }}>
      <p className="font-mono text-[10px] font-bold uppercase tracking-wide" style={{ color: INK.white }}>{m.subject}</p>
      <p className="font-sans text-[10px] italic mb-2" style={{ color: INK.muted, minHeight: 26 }}>{m.claim}</p>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] uppercase" style={{ color: INK.muted }}>credibility</span>
        <span className="font-mono text-[13px] font-black" style={{ color: col }}>{m.credibility}%</span>
      </div>
      <div className="flex gap-1.5">
        <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: `${INK.pink}18`, color: INK.pink }}>LIAR {m.yes}x</span>
        <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: `${INK.green}18`, color: INK.green }}>TRUTH {m.no}x</span>
      </div>
    </div>
  );
}
