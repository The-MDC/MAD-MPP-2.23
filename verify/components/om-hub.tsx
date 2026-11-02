"use client";

/**
 * MAD Gambit — Open Markets hub + Top Markets strip for the landing page.
 *
 * Order follows what prediction-market users look for first: trending markets
 * with a visible probability and one-tap Yes/No, then category filters, then
 * volume/participant proof, with how each market settles one tap away.
 *   TopMarketsStrip  — above the fold: the five busiest books, numbered.
 *   OpenMarketsHub   — below the dials: Open markets → Platform Prediction →
 *                      Platform Conviction → Affliction, each filterable.
 */
import React, { useState } from "react";
import dynamic from "next/dynamic";
import OMCarousel from "@/components/om-carousel";
import TabStrip from "@/components/tab-strip";
import { Headline, MarketTile, SectionTitle, Stat, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";
import { useInView } from "@/hooks/use-in-view";
import { useOpenMarkets } from "@/lib/open-markets-store";
import { compact, decimalOdds, pct, prices, PERP_LABEL, type OMMarket, type OMPerp } from "@/lib/open-markets";

const MONO = "ui-monospace, 'JetBrains Mono', monospace";

/* The Paseome in 3D. WebGL, so it is code-split and client-only — and its chunk is
   not even requested until the section is near the viewport (see PaseomeGraphSlot). */
const GraphLoading = () => (
  <div style={{ padding: "28px 4px", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: MUTED, fontFamily: MONO }}>
    Loading the Paseome graph…
  </div>
);
const PaseomeGraph = dynamic(() => import("@/components/paseome-graph"), { ssr: false, loading: GraphLoading });

/** A lazy chunk that fails to load (a dropped mobile connection) throws to the nearest
    error boundary — which, left alone, is the whole hub segment. Contain it to this slot. */
class GraphBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="status" style={{ padding: "16px 4px", fontSize: 11, lineHeight: 1.5, color: MUTED, fontFamily: MONO }}>
        The 3D Paseome graph could not load.{" "}
        <button type="button" onClick={() => window.location.reload()} style={{ color: GOLD, fontWeight: 900, background: "none", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}>
          Reload ›
        </button>
      </div>
    );
  }
}

function PaseomeGraphSlot() {
  const { ref, seen } = useInView<HTMLDivElement>("320px");
  return (
    <div ref={ref} style={{ minHeight: 380 }}>
      <GraphBoundary>{seen ? <PaseomeGraph /> : <GraphLoading />}</GraphBoundary>
    </div>
  );
}

/* ── Filter chips ────────────────────────────────────────────────────────── */

function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <TabStrip<T> label={label} value={value} items={options} onChange={onChange} />
  );
}

/* ── Top markets strip (above the fold) ──────────────────────────────────── */

export function TopMarketsStrip() {
  const s = useOpenMarkets();
  if (!s.markets.length) return <div style={{ minHeight: 168 }} aria-hidden="true" />;
  const top = s.markets.filter((m) => m.outcomes.length === 2).sort((a, b) => b.volume - a.volume).slice(0, 5);
  return (
    <section data-explain="om-lobby" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionTitle right={<a href="/open-markets" style={{ color: GOLD, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>All markets ›</a>}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          Top markets <span className="mg-chip" style={{ height: 20, fontSize: 9, color: "#7cffc7", borderColor: "rgba(124,255,199,.4)" }}>● Live</span>
        </span>
      </SectionTitle>
      <OMCarousel label="Top markets" cardWidth={290} gap={10}>
        {top.map((m, i) => <TopCard key={m.id} m={m} rank={i + 1} />)}
      </OMCarousel>
    </section>
  );
}

function TopCard({ m, rank }: { m: OMMarket; rank: number }) {
  const p = prices(m.outcomes, m.b);
  const href = `/open-markets/${encodeURIComponent(m.id)}`;
  return (
    <article className="mg-tile mg-tile-hover" data-explain={m.perp ? `perp-${m.perp}` : "om-prediction"} style={{ padding: "12px 12px 12px 0", display: "flex", gap: 6, overflow: "hidden" }}>
      <span aria-hidden="true" className="mg-display mg-gold-text" style={{ flex: "none", width: 46, fontSize: 64, lineHeight: .85, textAlign: "center", alignSelf: "center" }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <a href={href} style={{ textDecoration: "none", color: "#f6f1e3", fontSize: 13, fontWeight: 800, lineHeight: "17px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", height: 34, flex: "none" }}>{m.title}</a>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {m.outcomes.map((o, i) => (
            <a key={o.id} href={`${href}?o=${encodeURIComponent(o.id)}`} className="mg-odds" style={{ minHeight: 40, textDecoration: "none", flexDirection: "row", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: i === 0 ? "#7cffc7" : "#f85b5f" }}>{o.label.toUpperCase()}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800 }}>{pct(p[i])}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>{decimalOdds(p[i]).toFixed(2)}</span>
            </a>
          ))}
        </div>
        <div style={{ fontSize: 10, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Vol {compact(m.volume)} · {m.traders} traders · {m.resolution}</div>
      </div>
    </article>
  );
}

/* ── Hub (below the dials) ───────────────────────────────────────────────── */

type OpenFilter = "all" | "prediction" | "forward" | "counterfactual" | "mine";
type Group = "open" | "prediction" | "conviction" | "affliction";

/** Canon classes for the perp families (lib/perp-reports.ts PERP_LIBRARY). */
const PLATFORM_PREDICTION: OMPerp[] = ["faces", "zeitgeist"];
const PLATFORM_CONVICTION: OMPerp[] = ["epiphany", "zliar"];
const PLATFORM_AFFLICTION: OMPerp[] = ["gossip", "scandal"];

export default function OpenMarketsHub() {
  const s = useOpenMarkets();
  const [openF, setOpenF] = useState<OpenFilter>("all");
  const [statsF, setStatsF] = useState<Group>("open");
  const [predF, setPredF] = useState<"all" | OMPerp>("all");
  const [convF, setConvF] = useState<"all" | "certain" | OMPerp>("all");
  const [affF, setAffF] = useState<"all" | OMPerp>("all");
  if (!s.markets.length) return <div style={{ minHeight: 420 }} aria-hidden="true" />;

  const created = s.markets.filter((m) => s.createdIds.indexOf(m.id) !== -1);
  const openAll = created.concat(s.markets.filter((m) => m.origin === "open" && !m.perp && created.indexOf(m) === -1));
  const open = openAll.filter((m) =>
    openF === "all" ? true
      : openF === "mine" ? created.indexOf(m) !== -1
      : openF === "prediction" ? m.cls === "prediction"
      : m.side === openF);
  const certain = s.markets.filter((m) => m.origin === "platform" && !m.perp);
  const byPerp = (p: OMPerp) => s.markets.filter((m) => m.perp === p);
  const groupMarkets = (g: Group): OMMarket[] =>
    g === "open" ? openAll
      : g === "prediction" ? s.markets.filter((m) => m.perp && PLATFORM_PREDICTION.indexOf(m.perp) !== -1)
      : g === "conviction" ? certain.concat(s.markets.filter((m) => m.perp && PLATFORM_CONVICTION.indexOf(m.perp) !== -1))
      : s.markets.filter((m) => m.perp && PLATFORM_AFFLICTION.indexOf(m.perp) !== -1);
  const gm = groupMarkets(statsF);
  const vol = gm.reduce((a, m) => a + m.volume, 0);
  const traders = gm.reduce((a, m) => a + m.traders, 0);

  return (
    <div id="open-markets" style={{ display: "flex", flexDirection: "column", gap: 22, scrollMarginTop: 72 }}>
      {/* 1 · Open markets — creators' Prediction + Conviction, one large carousel */}
      <section className="mg-seam" data-explain="om-lobby" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Headline lead="Call it." punch="Mint" tail="it." size={42}
          sub="Open markets — Prediction and Conviction on one floor. Every price is a live book." />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/open-markets/create" className="mg-btn-gold" style={{ flex: "1 1 150px", fontSize: 14 }}>+ Create a market</a>
          <a href="/open-markets" className="mg-btn-ghost" style={{ flex: "1 1 130px", fontSize: 13 }}>All open markets ›</a>
        </div>
        <Chips label="Filter open markets" value={openF} onChange={setOpenF} options={[
          { id: "all", label: "All" }, { id: "prediction", label: "Prediction" }, { id: "forward", label: "Conviction · Forward" },
          { id: "counterfactual", label: "Conviction · Counterfactual" }, ...(created.length ? [{ id: "mine" as OpenFilter, label: `Mine · ${created.length}` }] : []),
        ]} />
      </section>
      {open.length ? (
        <OMCarousel label="Open markets" cardWidth={300}>{open.map((m) => <MarketTile key={m.id} m={m} />)}</OMCarousel>
      ) : <div className="mg-tile" style={{ padding: 16, fontSize: 13, color: MUTED }}>None here yet — <a href="/open-markets/create" style={{ color: GOLD, fontWeight: 900 }}>create one ›</a></div>}

      {/* 2 · Stats, filterable by group */}
      <section data-explain="fee" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Chips label="Stats scope" value={statsF} onChange={setStatsF} options={[
          { id: "open", label: "Open" }, { id: "prediction", label: "Platform Prediction" }, { id: "conviction", label: "Platform Conviction" }, { id: "affliction", label: "Affliction" },
        ]} />
        <div style={{ display: "flex", gap: 8 }}>
          <Stat k="Markets" v={String(gm.length)} />
          <Stat k="Volume" v={compact(vol)} accent={GOLD} />
          <Stat k="Traders" v={compact(traders)} accent={ROSSA} />
        </div>
      </section>

      {/* 3 · Platform Prediction — Five Faces, Zeitgeist */}
      <Group title="Platform" punch="Prediction" note="Perpetual · no creator cut · class PREDICTION"
        chips={<Chips label="Filter platform prediction" value={predF} onChange={setPredF} options={[{ id: "all", label: "All" }, ...PLATFORM_PREDICTION.map((p) => ({ id: p, label: PERP_LABEL[p] }))]} />}>
        {PLATFORM_PREDICTION.filter((p) => predF === "all" || predF === p).map((p) => <PerpRow key={p} p={p} items={byPerp(p)} />)}
      </Group>

      {/* 4 · Platform Conviction — Certain-UnCertainty, Epiphanies, Z-Liar */}
      <Group title="Platform" punch="Conviction" note="Certain-UnCertainty · Perpetual Epiphanies · Z-Liar"
        chips={<Chips label="Filter platform conviction" value={convF} onChange={setConvF} options={[{ id: "all", label: "All" }, { id: "certain", label: "Certain-UnCertainty" }, ...PLATFORM_CONVICTION.map((p) => ({ id: p, label: PERP_LABEL[p] }))]} />}>
        {convF === "all" || convF === "certain" ? (
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SectionTitle explain="om-certain" right={<a href="/open-markets?tab=certain" style={{ color: GOLD, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>See all ›</a>}>
              <span>Certain-</span><span className="mg-punch mg-gold-text">UnCertainty</span>
            </SectionTitle>
            <div style={{ marginTop: -6, fontSize: 11, color: "#ffb39f", fontWeight: 800, letterSpacing: .6, textTransform: "uppercase" }}>The Paseome · Foresight ↔ Hindsight</div>
            <OMCarousel label="Certain-UnCertainty markets" cardWidth={260}>{certain.map((m) => <MarketTile key={m.id} m={m} />)}</OMCarousel>
            <PaseomeGraphSlot />
          </section>
        ) : null}
        {PLATFORM_CONVICTION.filter((p) => convF === "all" || convF === p).map((p) => <PerpRow key={p} p={p} items={byPerp(p)} />)}
      </Group>

      {/* 5 · Affliction — Gossip-Cop, Scandal Velocity */}
      <Group title="The" punch="Affliction" note="Gossip-Cop · Scandal Velocity · class AFFLICTION"
        chips={<Chips label="Filter affliction" value={affF} onChange={setAffF} options={[{ id: "all", label: "All" }, ...PLATFORM_AFFLICTION.map((p) => ({ id: p, label: PERP_LABEL[p] }))]} />}>
        {PLATFORM_AFFLICTION.filter((p) => affF === "all" || affF === p).map((p) => <PerpRow key={p} p={p} items={byPerp(p)} />)}
      </Group>
    </div>
  );
}

function Group({ title, punch, note, chips, children }: { title: string; punch: string; note: string; chips: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 18, borderTop: `1px solid ${LINE}` }}>
      <div>
        <h2 style={{ margin: 0, lineHeight: .95 }}>
          <span className="mg-display" style={{ fontSize: 32, color: "#f6f1e3" }}>{title} </span>
          <span className="mg-punch mg-gold-text" style={{ fontSize: 34 }}>{punch}</span>
        </h2>
        <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>{note}</div>
      </div>
      {chips}
      {children}
    </section>
  );
}

function PerpRow({ p, items }: { p: OMPerp; items: OMMarket[] }) {
  if (!items.length) return null;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SectionTitle explain={`perp-${p}`} right={<a href={`/open-markets?perp=${p}`} style={{ color: GOLD, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>See all ›</a>}>
        {PERP_LABEL[p]}
      </SectionTitle>
      <OMCarousel label={`${PERP_LABEL[p]} markets`} cardWidth={250}>{items.map((m) => <MarketTile key={m.id} m={m} />)}</OMCarousel>
    </section>
  );
}
