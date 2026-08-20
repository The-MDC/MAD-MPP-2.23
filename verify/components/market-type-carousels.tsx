"use client";

/**
 * MAD Gambit — per-class market carousels.
 * ────────────────────────────────────────────────────────────────
 * One arrow-scrollable carousel per market class — Progression · Saga · Z-Liar ·
 * Perp · GossipCop Perp — populated from the real classifier via
 * /api/v1/markets/proposals (demo DATA, real math when no DB). GossipCop is the
 * celebrity long-arc perp family, surfaced next to the Z-Liar class.
 */
import React, { useEffect, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { AutoShowcaseBadge, useAutoShowcase } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

// Imported, never redeclared. A local copy of this union silently drops any new
// market type the classifier starts emitting — the API keeps returning them and
// the carousel just never renders them, with no compile error to catch it.
import { MARKET_TYPES, type MarketType } from "@/lib/market-classifier";

interface Proposal {
  type: MarketType;
  title: string;
  horizonDays: number;
  zliarScore: number;
  perpProbability: number;
  convictionPrior: number;
  score: number;
}
interface Resp {
  success: boolean;
  source?: string;
  proposals: Proposal[];
  byType: Record<MarketType, number>;
}

// Order follows the classifier's cascade, so a new type appears automatically.
const ORDER: readonly MarketType[] = MARKET_TYPES;
// Typed Record — a new market type becomes a COMPILE ERROR here rather than a
// blank label at runtime.
const LABEL: Record<MarketType, string> = {
  progression: "Progression",
  saga: "Saga",
  zliar: "Z-Liar Meter",
  perp: "Perp",
  gossipcop: "GossipCop Perp",
  faces: "Five Faces",
  zeitgeist: "Zeitgeist",
  epiphany: "Perpetual Epiphanies",
};
const BLURB: Record<MarketType, string> = {
  progression: "Short A→B→C arcs (≤ ~45d)",
  saga: "Weeks-to-years evolving narratives",
  zliar: "Satire-quality-filtered specialty markets",
  perp: "Continuous · no terminal date",
  gossipcop: "Celebrity long-arc · historical-pattern (GossipCop) tracked",
  faces: "Persona decomposition · permanent face vs the one worn today",
  zeitgeist: "Trend succession · the slate reseeds, conviction transmigrates",
  epiphany: "Mental models · conviction on cultural persistence",
};

function Carousel({ type, items, live }: { type: MarketType; items: Proposal[]; live: boolean }) {
  const { skin } = useSkin();
  const ref = useRef<HTMLDivElement>(null);
  // Same pause rules as the shared rail primitive — see components/carousel.tsx.
  const showcase = useAutoShowcase(ref, { gap: 10 });
  const color =
    type === "perp" || type === "gossipcop" ? skin.accent2 : type === "zliar" ? skin.gold : type === "saga" ? skin.accent : skin.positive;
  const nudge = (d: number) => {
    if (ref.current) ref.current.scrollBy({ left: d * 230, behavior: "smooth" });
  };
  const arrow: React.CSSProperties = { width: 24, height: 24, borderRadius: "50%", background: "transparent", border: `1px solid ${color}`, color, cursor: "pointer", fontSize: 13, fontWeight: 900, lineHeight: "22px", padding: 0, fontFamily: INSTRUMENT_FONT };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 4px 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color, textTransform: "uppercase" }}>
          {LABEL[type]} <span style={{ color: skin.muted, fontSize: 9 }}>{items.length}</span>
          <AutoShowcaseBadge />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" aria-label="Scroll left" onClick={() => nudge(-1)} style={arrow}>‹</button>
          <button type="button" aria-label="Scroll right" onClick={() => nudge(1)} style={arrow}>›</button>
        </div>
      </div>
      <div style={{ fontSize: 8, color: skin.muted, margin: "0 0 8px 2px" }}>{BLURB[type]}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 9, color: skin.muted, padding: "8px 2px" }}>No {live ? "live" : "demo"} signals in this class yet.</div>
      ) : (
        <div ref={ref} {...showcase} style={{ display: "flex", gap: 10, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 4 }}>
          {items.map((p, i) => (
            <div key={i} style={{ minWidth: 232, flex: "0 0 auto", background: skin.card, border: `1px solid ${color}66`, borderRadius: 12, padding: 12, fontFamily: INSTRUMENT_FONT }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: skin.text, lineHeight: 1.35, minHeight: 54 }}>{p.title}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 7, color: skin.muted }}>
                <span>Z-Liar <b style={{ color: skin.gold }}>{Math.round(p.zliarScore)}</b></span>
                <span>Perp <b style={{ color: skin.accent2 }}>{Math.round(p.perpProbability * 100)}%</b></span>
                <span>~{p.horizonDays}d</span>
                <span style={{ marginLeft: "auto" }}>score <b style={{ color: skin.accent }}>{p.score.toFixed(2)}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketTypeCarousels() {
  const { skin } = useSkin();
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    fetch("/api/v1/markets/proposals?limit=40")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setData(d);
      })
      .catch(() => {});
  }, []);

  const live = data?.source === "live";
  const group = (t: MarketType): Proposal[] => (data?.proposals ?? []).filter((p) => p.type === t);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", fontFamily: INSTRUMENT_FONT }}>
          Markets by Class
        </div>
        {data && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40`, fontFamily: INSTRUMENT_FONT }}>
            {live ? "live" : "demo"}
          </span>
        )}
      </div>
      {data === null ? (
        <div style={{ fontSize: 9, color: skin.muted, fontFamily: INSTRUMENT_FONT }}>Loading classified markets…</div>
      ) : (
        ORDER.map((t) => <Carousel key={t} type={t} items={group(t)} live={live} />)
      )}
    </div>
  );
}
