"use client";

/**
 * MAD Gambit — Tickers & Dials (single instrument container).
 * ────────────────────────────────────────────────────────────────
 * Screenshot-mapped landing hub block:
 *   Row 1 — Scandal Velocity · Z-Liar · GossipCop, equalized card shells.
 *   Row 2 — Perpetual Epiphanies · Five Faces · Zeitgeist, each with its own
 *           dopamine ticker and arrowed carousel of sample/live feature atoms.
 *   Row 3 — the Gambit Instrument Cluster with the split-flap chrono between
 *           two analog dials.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import ScandalVelocityMeter from "@/components/scandal-velocity-meter";
import ZLiarMeter from "@/components/zliar-meter";
import SeikoFlipClock from "@/components/seiko-flip-clock";
import { type MarketType } from "@/lib/market-classifier";

interface Proposal { type: MarketType; title: string; score: number; perpProbability: number; zliarScore?: number }
interface Resp { success: boolean; source?: string; proposals: Proposal[] }

type FeatureTone = "cyan" | "pink" | "gold" | "green";

const TICKERS: Record<string, string[]> = {
  zliar: ["ZL +44.9", "BSIDX 0.71", "VOL +8.8", "MOON +3", "CORR 42%", "SENTINEL HOT"],
  scandal: ["GCAM 88.5", "HEAT +17", "VIRAL 0.72", "RISK 34", "DRIFT +4", "CHAOS LIVE"],
  gossip: ["GC 61%", "TABLOID +9", "SOURCE 4", "CLAIM HOT", "ARC 365D", "GOSSIP PERP"],
  epiphany: ["MODEL 77", "PERSIST +11", "MENA 34%", "CROSS 62", "DOMAIN 5", "EPIΦ LIVE"],
  faces: ["DIVERGE .34", "SLIP WATCH", "SAINT 18", "SELL OUT 61", "CORE DRIFT", "FACE PERP"],
  zeitgeist: ["TURNING T-4", "SLATE 03", "BURNOUT 21", "MOM +8", "RIBBON 12", "ZEIT LIVE"],
};

const SAMPLE: Record<string, string[]> = {
  zliar: [
    "Audit a founder claim", "Rumor credibility ladder", "Narrative variance", "Source confidence", "Corroboration pulse", "Moon tilt", "GARCH shock", "Verdict band", "Audit log", "Sentinel quip", "BS-index", "Brand-safe roast",
  ],
  scandal: [
    "Scandal velocity", "Cross-source pickup", "GCAM pressure", "Chaos fusion", "Crossover watch", "Heat score", "Freshness half-life", "Authority score", "Engagement proxy", "Faction split", "Graph rivalry", "Risk temperature",
  ],
  gossip: [
    "GossipCop long arc", "Celebrity pattern", "Historical similarity", "Claim contest", "Tabloid drag", "Perp probability", "Source lineage", "Narrative half-life", "Yes/no hook", "Reputation drift", "Cycle tracker", "Dopamine wire",
  ],
  epiphany: [
    "Chesterton fence", "Goodhart watch", "Moloch loop", "Ibn Khaldun cycle", "Skin in the game", "Lindy pulse", "Hanlon filter", "Jevons snap", "Girard mirror", "Sorites drift", "Region filter", "Persistence book",
  ],
  faces: [
    "Permanent Saint", "White Rice shell", "Megalomaniac core", "Narcissist mirror", "Sellout vector", "Transitory mask", "Slip detector", "Crowned face", "Tau permanent", "Tau transitory", "Entropy gap", "Waterline trade",
  ],
  zeitgeist: [
    "Creator fatigue", "AI companion culture", "Recession nostalgia", "Succession matrix", "Turning ribbon", "Slate reseed", "Burnout race", "Adoption curve", "Corpus lineage", "Vintage leg", "Moon cadence", "Conviction transmigration",
  ],
};

function FeatureTicker({ id, color }: { id: keyof typeof TICKERS; color: string }) {
  const row = TICKERS[id];
  const loop = [...row, ...row];
  return (
    <div style={{ overflow: "hidden", borderTop: `1px solid ${color}33`, borderBottom: `1px solid ${color}22`, background: `${color}08`, marginTop: 8 }}>
      <div className="mg-mini-ticker" style={{ display: "inline-flex", gap: 16, whiteSpace: "nowrap", padding: "4px 0" }}>
        {loop.map((item, i) => (
          <span key={`${item}-${i}`} style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, color, textTransform: "uppercase", textShadow: `0 0 8px ${color}77` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniCarousel({ id, color, items }: { id: string; color: string; items: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const nudge = () => ref.current?.scrollBy({ left: 150, behavior: "smooth" });
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <div ref={ref} style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingRight: 26 }} aria-label={`${id} feature carousel`}>
        {items.slice(0, 12).map((item) => (
          <span key={item} style={{ flex: "0 0 auto", maxWidth: 132, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 7, fontWeight: 800, letterSpacing: 0.5, color, border: `1px solid ${color}44`, background: `${color}10`, borderRadius: 999, padding: "3px 7px", textTransform: "uppercase" }}>
            {item}
          </span>
        ))}
      </div>
      <button type="button" aria-label={`Next ${id} carousel item`} onClick={nudge}
        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", color, background: "#05070c", border: `1px solid ${color}`, boxShadow: `0 0 14px ${color}66`, cursor: "pointer", fontWeight: 900, lineHeight: "18px" }}>
        ›
      </button>
    </div>
  );
}

function FeatureShell({ id, title, kicker, tone, children, items }: { id: keyof typeof TICKERS; title: string; kicker: string; tone: FeatureTone; children: React.ReactNode; items: string[] }) {
  const { skin } = useSkin();
  const color = tone === "gold" ? skin.gold : tone === "pink" ? skin.accent2 : tone === "green" ? skin.positive : skin.accent;
  return (
    <section style={{ minHeight: 286, display: "flex", flexDirection: "column", justifyContent: "space-between", background: `linear-gradient(145deg, ${skin.panel}, ${skin.card})`, border: `1px solid ${color}66`, borderRadius: 18, padding: 12, boxShadow: `0 0 0 1px ${skin.border}, 0 0 26px ${color}18`, overflow: "hidden" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color, letterSpacing: 1.4, textTransform: "uppercase", textShadow: `0 0 10px ${color}66` }}>{title}</div>
            <div style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 }}>{kicker}</div>
          </div>
          <span style={{ fontSize: 7, color: skin.gold, border: `1px solid ${skin.gold}55`, background: `${skin.gold}12`, borderRadius: 6, padding: "2px 5px", fontWeight: 900 }}>LIVE</span>
        </div>
        <div style={{ minHeight: 132, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      </div>
      <div>
        <MiniCarousel id={id} color={color} items={items} />
        <FeatureTicker id={id} color={color} />
      </div>
    </section>
  );
}

function GossipCopMeter({ proposals }: { proposals: Proposal[] }) {
  const { skin } = useSkin();
  const items = proposals.filter((p) => p.type === "gossipcop");
  const count = items.length;
  const pct = count ? Math.round(Math.max(...items.map((p) => p.perpProbability)) * 100) : 61;
  const color = skin.accent2;
  return (
    <div style={{ width: "100%", textAlign: "center", fontFamily: INSTRUMENT_FONT }}>
      <div style={{ position: "relative", width: 112, height: 112, margin: "0 auto" }}>
        <svg width="112" height="112" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
          <circle cx="50" cy="50" r="40" fill="none" stroke={skin.card} strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 252} 252`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24, color, fontWeight: 900 }}>{pct}</span>
          <span style={{ fontSize: 7, color: skin.muted, letterSpacing: 1 }}>PERP %</span>
        </div>
      </div>
      <div style={{ fontSize: 8, color: skin.text, marginTop: 3 }}>{count ? `${count} live gossip arcs` : "sample Gossip-Cop perp"}</div>
    </div>
  );
}

function CompactDial({ value, label, color }: { value: number; label: string; color: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div style={{ height: 78, position: "relative", margin: "0 auto", maxWidth: 180 }}>
        <div style={{ position: "absolute", left: "50%", bottom: 0, width: 148, height: 74, transform: "translateX(-50%)", borderTopLeftRadius: 148, borderTopRightRadius: 148, border: `8px solid ${color}55`, borderBottom: 0, boxShadow: `0 0 22px ${color}44 inset, 0 0 18px ${color}33` }} />
        <div style={{ position: "absolute", left: "50%", bottom: 0, width: 3, height: 68, background: color, transformOrigin: "bottom", transform: `translateX(-50%) rotate(${-82 + clamped * 1.64}deg)`, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <div style={{ fontSize: 22, color, fontWeight: 900, lineHeight: 1 }}>{clamped}</div>
      <div style={{ fontSize: 7, letterSpacing: 1, color, textTransform: "uppercase", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function CustomPerpPreview({ proposals }: { proposals: Proposal[] }) {
  const { skin } = useSkin();
  const byType = useMemo(() => new Map(proposals.map((p) => [p.type, p])), [proposals]);
  const epiphany = byType.get("epiphany");
  const faces = byType.get("faces");
  const zeitgeist = byType.get("zeitgeist");
  return (
    <>
      <FeatureShell id="epiphany" title="Epiphanies" kicker="Perpetual mental-model book" tone="cyan" items={SAMPLE.epiphany}>
        <CompactDial value={Math.round((epiphany?.perpProbability ?? 0.77) * 100)} label="persistence" color={skin.accent} />
      </FeatureShell>
      <FeatureShell id="faces" title="Five Faces" kicker="Permanent vs transitory mask" tone="gold" items={SAMPLE.faces}>
        <CompactDial value={Math.round((faces?.score ?? 0.88) * 100)} label="divergence" color={skin.gold} />
      </FeatureShell>
      <FeatureShell id="zeitgeist" title="Zeitgeist" kicker="Succession slate and turning" tone="green" items={SAMPLE.zeitgeist}>
        <CompactDial value={Math.round((zeitgeist?.perpProbability ?? 0.69) * 100)} label="turning" color={skin.positive} />
      </FeatureShell>
    </>
  );
}

export default function PerpDials() {
  const { skin } = useSkin();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    fetch("/api/v1/markets/proposals?limit=60")
      .then((r) => r.json())
      .then((d: Resp) => { if (d?.success) setProposals(d.proposals ?? []); })
      .catch(() => setProposals([]));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", fontFamily: INSTRUMENT_FONT, margin: "0 0 2px 2px" }}>
        Tickers &amp; Dials
      </div>

      <div style={{ background: `linear-gradient(180deg, ${skin.panel}, ${skin.bg})`, border: `1px solid ${skin.border}`, borderRadius: 24, padding: 16, display: "flex", flexDirection: "column", gap: 16, boxShadow: `0 0 0 1px ${skin.gold}22, 0 0 44px ${skin.accent}12` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 14 }}>
          <FeatureShell id="scandal" title="Scandal Velocity" kicker="stays compact, now carousel-aware" tone="cyan" items={SAMPLE.scandal}>
            <ScandalVelocityMeter />
          </FeatureShell>
          <FeatureShell id="zliar" title="Z-Liar Meter" kicker="unchanged primary audit dial" tone="pink" items={SAMPLE.zliar}>
            <ZLiarMeter />
          </FeatureShell>
          <FeatureShell id="gossip" title="Gossip-Cop Perp" kicker="properly rendered long-arc perp" tone="pink" items={SAMPLE.gossip}>
            <GossipCopMeter proposals={proposals} />
          </FeatureShell>
          <CustomPerpPreview proposals={proposals} />
        </div>

        <div style={{ overflowX: "auto" }}>
          <GambitInstrumentCluster centerSlot={<SeikoFlipClock label="MAD·TIME UTC" scale={1.2} />} />
        </div>
      </div>
      <style>{`
        .mg-mini-ticker { animation: mgMiniTicker 32s linear infinite; }
        @keyframes mgMiniTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .mg-mini-ticker { animation: none; } }
      `}</style>
    </div>
  );
}
