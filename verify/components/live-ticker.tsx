"use client";

/**
 * MAD Gambit — Live Dual Ticker
 * ------------------------------------------------------------------
 * Consumes /api/v1/feeds (real RSS). Top marquee = market/crypto/macro
 * headlines; bottom = a satirical "Z-Liar wire" derived from the same
 * live items (MADHAT'r tone). Continuous scroll, deck aesthetic.
 */

import React, { useEffect, useRef, useState } from "react";
import { Radio, Newspaper } from "lucide-react";

interface FeedItem { source: string; category: string; title: string; link: string; published: string; }

const CAT_COLOR: Record<string, string> = {
  crypto: "#7cffc7", macro: "#58a6ff", news: "#fbbf24", thesis: "#c98aff",
};

// PLACEHOLDER satirical transform — prod runs each headline through the
// Gemini Tri-Agent (MADHAT'r) for real cynical rewrites.
function satirize(title: string): string {
  const tags = ["allegedly", "totally not a rug", "trust me bro", "sources say", "cap detected?", "fuhgeddaboudit"];
  return `${title} — ${tags[title.length % tags.length]}`;
}

export default function LiveTicker() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/feeds");
        const json = await res.json();
        if (alive && json.success && json.items?.length) {
          setItems(json.items.slice(0, 30));
          setStatus("live");
        } else if (alive) setStatus("offline");
      } catch {
        if (alive) setStatus("offline");
      }
    })();
    return () => { alive = false; };
  }, []);

  const fallback: FeedItem[] = [
    { source: "MAD-NET", category: "crypto", title: "Live wire warming up — Scandal Scraper online", link: "#", published: "" },
  ];
  const feed = items.length ? items : fallback;

  return (
    <div className="w-full space-y-px rounded-2xl overflow-hidden border border-neutral-850 bg-[#030508]">
      {/* status strip */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#05070c] border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Live Wire</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`relative flex h-1.5 w-1.5`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "live" ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
          </span>
          <span className="font-mono text-[8px] uppercase tracking-widest text-neutral-500">{status === "live" ? "LIVE · RSS" : status === "loading" ? "SYNCING" : "CACHED"}</span>
        </div>
      </div>

      {/* top marquee — real headlines */}
      <Marquee speed={42} icon={<Newspaper className="w-3 h-3" />}>
        {feed.map((it, i) => (
          <a key={i} href={it.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 hover:opacity-80">
            <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: CAT_COLOR[it.category] || "#94a3b8" }}>{it.source}</span>
            <span className="font-sans text-[11px] text-neutral-300">{it.title}</span>
            <span className="text-neutral-700">·</span>
          </a>
        ))}
      </Marquee>

      {/* bottom marquee — satirical Z-Liar wire */}
      <Marquee speed={56} reverse icon={<Radio className="w-3 h-3" />}>
        {feed.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-pink-400">🎩 Z-WIRE</span>
            <span className="font-sans text-[11px] text-neutral-400 italic">{satirize(it.title)}</span>
            <span className="text-neutral-800">·</span>
          </span>
        ))}
      </Marquee>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marquee-rev { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

function Marquee({ children, speed, reverse = false, icon }: { children: React.ReactNode; speed: number; reverse?: boolean; icon: React.ReactNode }) {
  return (
    <div className="relative flex items-center bg-[#030508] py-2 overflow-hidden">
      <div className="shrink-0 px-3 text-neutral-600 z-10 bg-[#030508]">{icon}</div>
      <div className="overflow-hidden flex-1">
        <div className="inline-flex whitespace-nowrap" style={{ animation: `${reverse ? "marquee-rev" : "marquee"} ${speed}s linear infinite` }}>
          <div className="inline-flex">{children}</div>
          <div className="inline-flex" aria-hidden>{children}</div>
        </div>
      </div>
    </div>
  );
}
