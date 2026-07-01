"use client";

/**
 * MAD Gambit — Live Dual Ticker (Ultra Max Fidelity)
 * ------------------------------------------------------------------
 * Powered by Framer Motion. Smooth infinite scroll, gradient masks,
 * and high-contrast glowing text.
 */

import React, { useEffect, useState, useRef } from "react";
import { Radio, Newspaper } from "lucide-react";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";

interface FeedItem { source: string; category: string; title: string; link: string; published: string; }

const CAT_COLOR: Record<string, string> = {
  crypto: "#7cffc7", macro: "#58a6ff", news: "#fbbf24", thesis: "#c98aff",
};

// satirical transform — prod runs each headline through the Gemini Tri-Agent (MADHAT'r)
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
    <div className="w-full space-y-px rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.8)] relative before:absolute before:inset-0 before:rounded-2xl before:border before:border-white/5 before:pointer-events-none">
      {/* status strip */}
      <div className="relative flex items-center justify-between px-4 py-2 bg-gradient-to-r from-black/80 via-[#0a0f18] to-black/80 border-b border-white/5 z-10">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Radio className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </motion.div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-neutral-300 to-neutral-500">
            Live Wire
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "live" ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status === "live" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-amber-500"}`} />
          </span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            {status === "live" ? "LIVE · RSS" : status === "loading" ? "SYNCING" : "CACHED"}
          </span>
        </div>
      </div>

      {/* top marquee — real headlines */}
      <SmoothMarquee speed={30} direction={-1} icon={<Newspaper className="w-4 h-4 text-neutral-400" />}>
        {feed.map((it, i) => (
          <a key={i} href={it.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 group">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: CAT_COLOR[it.category] || "#94a3b8", textShadow: `0 0 10px ${CAT_COLOR[it.category]}66` }}>
              {it.source}
            </span>
            <span className="font-sans text-[13px] font-medium text-neutral-300 group-hover:text-white transition-colors duration-300">
              {it.title}
            </span>
            <span className="text-neutral-700 mx-2">·</span>
          </a>
        ))}
      </SmoothMarquee>

      {/* bottom marquee — satirical Z-Liar wire */}
      <SmoothMarquee speed={40} direction={1} icon={<Radio className="w-4 h-4 text-pink-400 drop-shadow-[0_0_5px_rgba(244,114,182,0.5)]" />}>
        {feed.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 group">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]">
              🎩 Z-WIRE
            </span>
            <span className="font-sans text-[13px] text-neutral-400 italic group-hover:text-neutral-200 transition-colors duration-300">
              {satirize(it.title)}
            </span>
            <span className="text-neutral-800 mx-2">·</span>
          </span>
        ))}
      </SmoothMarquee>
    </div>
  );
}

function SmoothMarquee({ children, speed, direction, icon }: { children: React.ReactNode; speed: number; direction: 1 | -1; icon: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth / 2);
    }
  }, [children]);

  useAnimationFrame((t, delta) => {
    let moveBy = direction * (speed * (delta / 1000));
    let newX = x.get() + moveBy;

    if (direction === -1 && newX <= -contentWidth) {
      newX += contentWidth;
    } else if (direction === 1 && newX >= 0) {
      newX -= contentWidth;
    }

    x.set(newX);
  });

  return (
    <div className="relative flex items-center bg-[#030508]/80 py-3 overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)" }}>
      <div className="shrink-0 px-4 z-20 bg-[#030508] border-r border-white/5 relative shadow-[10px_0_15px_-3px_rgba(0,0,0,0.8)]">
        {icon}
      </div>
      <div className="overflow-hidden flex-1 relative flex items-center">
        <motion.div ref={containerRef} className="flex whitespace-nowrap" style={{ x }}>
          <div className="flex items-center shrink-0">{children}</div>
          <div className="flex items-center shrink-0">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
