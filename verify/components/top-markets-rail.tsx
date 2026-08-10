"use client";

/**
 * MAD Gambit — Top 50 Markets Rail
 * ------------------------------------------------------------------
 * Auto-rotates through the day's top 50 markets at the top of the hub —
 * a continuous right-to-left marquee of compact market chips. Pauses on
 * hover; reduced-motion → static scroll. INK tokens, SSR-safe.
 */

import React, { useMemo } from "react";
import { Flame, TrendingUp } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import { AutoShowcaseBadge } from "@/components/carousel";

const SUBJECTS = ["ELON", "BTC", "AI", "FED", "SOL", "TAYLOR", "TRUMP", "ETH", "DOGE", "NVDA", "APPLE", "OPENAI", "MESSI", "KANYE", "PEPE"];
const TEMPLATES = ["{S} to moon this week?", "Is {S} lying?", "{S} rug incoming?", "{S} 10x by EOM?", "{S} scandal drops?", "{S} flips the market?"];

interface M { id: number; q: string; yes: number; no: number; vol: string; hot: boolean; }

export default function TopMarketsRail() {
  const markets = useMemo<M[]>(() =>
    Array.from({ length: 50 }, (_, i) => {
      const s = SUBJECTS[i % SUBJECTS.length];
      const t = TEMPLATES[i % TEMPLATES.length];
      return {
        id: i,
        q: t.replace("{S}", s),
        yes: +(1.1 + ((i * 7) % 25) / 10).toFixed(1),
        no: +(1.1 + ((i * 3) % 25) / 10).toFixed(1),
        vol: `${10 + ((i * 37) % 490)}K`,
        hot: i % 4 === 0,
      };
    }), []);
  const loop = [...markets, ...markets];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: INK.borderGold, background: "rgba(8,10,18,0.6)" }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: INK.border, background: INK.bgPanel }}>
        <TrendingUp className="w-4 h-4" style={{ color: INK.gold }} />
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: INK.gold }}>Top 50 Markets · Today</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[8px] uppercase tracking-wider" style={{ color: INK.muted }}>auto-rotating</span>
          <AutoShowcaseBadge label="Auto-rotating" />
        </span>
      </div>
      <div className="mg-marquee-mask py-2" style={{ overflow: "hidden" }}>
        <div className="mg-marquee-track flex" style={{ width: "max-content", gap: 8 }}>
          {loop.map((m, i) => (
            <div key={i} className="shrink-0 w-[190px] rounded-xl border p-2.5" style={{ borderColor: m.hot ? INK.borderGold : INK.border, background: INK.bgCard }}>
              <div className="flex items-start gap-1 mb-1.5">
                {m.hot && <Flame className="w-3 h-3 shrink-0 mt-0.5" style={{ color: INK.gold }} />}
                <p className="font-sans text-[11px] font-semibold leading-tight" style={{ color: INK.white }}>{m.q}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: `${INK.green}18`, color: INK.green }}>YES {m.yes}x</span>
                <span className="flex-1 text-center rounded-md py-1 font-mono text-[9px] font-bold" style={{ background: `${INK.pink}18`, color: INK.pink }}>NO {m.no}x</span>
              </div>
              <p className="mt-1 font-mono text-[8px] uppercase text-right" style={{ color: INK.muted }}>vol {m.vol}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .mg-marquee-mask { -webkit-mask-image: linear-gradient(to right, transparent, black 3%, black 97%, transparent); mask-image: linear-gradient(to right, transparent, black 3%, black 97%, transparent); }
        .mg-marquee-track { animation: mgMarquee 90s linear infinite; }
        .mg-marquee-mask:hover .mg-marquee-track { animation-play-state: paused; }
        @keyframes mgMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .mg-marquee-track { animation: none; }
          .mg-marquee-mask { overflow-x: auto !important; }
        }
      `}</style>
    </div>
  );
}
