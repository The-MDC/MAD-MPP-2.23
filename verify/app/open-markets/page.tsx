"use client";

/**
 * MAD Gambit — /open-markets : the lobby.
 * Prediction, Conviction (The Paseome), Certain-UnCertainty and the perpetual
 * families on one floor. ?tab=prediction|conviction|certain|perps and
 * ?perp=<family> deep-link straight into a filtered view.
 */
import React, { useEffect, useMemo, useState } from "react";
import { OMShell, Headline, MarketTile, SectionTitle, Stat, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";
import OMCarousel from "@/components/om-carousel";
import { useOpenMarkets } from "@/lib/open-markets-store";
import { compact, isPerp, PERP_LABEL, PERPS, prices, type OMMarket, type OMPerp } from "@/lib/open-markets";

type Tab = "all" | "prediction" | "conviction" | "certain" | "perps";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "prediction", label: "Prediction" },
  { id: "conviction", label: "Conviction" },
  { id: "certain", label: "Certain-UnCertainty" },
  { id: "perps", label: "Perps" },
];

function filterFor(tab: Tab, perp: OMPerp | null) {
  return (m: OMMarket) => {
    if (perp) return m.perp === perp;
    if (tab === "prediction") return m.cls === "prediction";
    if (tab === "conviction") return m.cls === "conviction" && !m.perp && m.origin === "open";
    if (tab === "certain") return m.origin === "platform" && !m.perp;
    if (tab === "perps") return !!m.perp;
    return true;
  };
}

type Sort = "knife" | "volume" | "closing" | "newest";
const SORTS: { id: Sort; label: string }[] = [
  { id: "knife", label: "⚖ Knife edge" },
  { id: "volume", label: "Volume" },
  { id: "closing", label: "Closing soon" },
  { id: "newest", label: "Newest" },
];
/**
 * Knife Edge (Paseome spec M1): the most contested book first. For a binary,
 * |p − 0.5|; for n branches, how far the leader sits above uniform 1/n.
 * Volume sorts point away from the information frontier; this points at it.
 */
function knife(m: OMMarket): number {
  const p = prices(m.outcomes, m.b);
  return Math.max.apply(null, p) - 1 / p.length;
}
function sortFor(sort: Sort): (a: OMMarket, b: OMMarket) => number {
  if (sort === "volume") return (a, b) => b.volume - a.volume;
  if (sort === "newest") return (a, b) => b.createdAt - a.createdAt;
  if (sort === "closing") return (a, b) => (a.closesAt === b.closesAt ? 0 : a.closesAt === null ? 1 : b.closesAt === null ? -1 : a.closesAt - b.closesAt);
  return (a, b) => knife(a) - knife(b);
}

export default function OpenMarketsLobby() {
  const s = useOpenMarkets();
  const [tab, setTab] = useState<Tab>("all");
  const [perp, setPerp] = useState<OMPerp | null>(null);
  const [sort, setSort] = useState<Sort>("knife");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab");
    const p = q.get("perp");
    if (isPerp(p)) { setPerp(p); setTab("perps"); }
    else if (t && TABS.some((x) => x.id === t)) setTab(t as Tab);
  }, []);

  const choose = (t: Tab, p: OMPerp | null = null) => {
    setTab(t);
    setPerp(p);
    const q = new URLSearchParams();
    if (p) q.set("perp", p); else if (t !== "all") q.set("tab", t);
    window.history.replaceState(null, "", `/open-markets${q.toString() ? `?${q}` : ""}`);
  };

  const sorter = useMemo(() => sortFor(sort), [sort]);
  const list = useMemo(() => s.markets.filter(filterFor(tab, perp)).sort(sorter), [s.markets, tab, perp, sorter]);
  const q = query.trim().toLowerCase();
  const hits = useMemo(() => (q ? s.markets.filter((m) => (m.title + " " + m.category + " " + m.outcomes.map((o) => o.label).join(" ")).toLowerCase().indexOf(q) !== -1).sort(sorter) : []), [s.markets, q, sorter]);
  const mine = s.markets.filter((m) => s.createdIds.indexOf(m.id) !== -1);
  const volume = s.markets.reduce((a, m) => a + m.volume, 0);

  return (
    <OMShell title="Open Markets · Prediction · Conviction">
      <section className="mg-seam" data-explain="om-lobby" style={{ padding: "6px 2px 2px" }}>
        <Headline lead="Call it." punch="Mint" tail="it." size={48}
          sub="Open markets for Prediction and Conviction. Every price is a live book — take a side in two taps." />
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <a href="/open-markets/create" className="mg-btn-gold" style={{ flex: "1 1 160px", fontSize: 14 }}>+ Create a market</a>
          <a href="/profile" className="mg-btn-ghost" style={{ flex: "1 1 120px", fontSize: 13 }}>My bets</a>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8 }}>
        <Stat k="Live markets" v={String(s.markets.length || "—")} />
        <Stat k="Volume" v={s.markets.length ? compact(volume) : "—"} accent={GOLD} />
        <Stat k="Fee" v="1.88%" accent={ROSSA} />
      </div>

      <div role="tablist" aria-label="Market class" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "2px 16px 4px", scrollbarWidth: "none" }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => choose(t.id)}
              className="mg-chip" style={{ flex: "none", height: 34, padding: "0 14px", cursor: "pointer", fontSize: 11, color: on ? "#1a1205" : "#d7d2c4", background: on ? "var(--mg-gold-fill)" : "rgba(255,255,255,.04)", borderColor: on ? "transparent" : LINE }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ position: "relative", display: "block" }}>
          <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Search markets</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search markets, branches, categories…"
            style={{ width: "100%", height: 42, borderRadius: 999, border: `1px solid ${LINE}`, background: "rgba(255,255,255,.04)", color: "#f6f1e3", padding: "0 16px 0 38px", fontSize: 13, outline: "none" }} />
          <span aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 14 }}>⌕</span>
        </label>
        <div role="radiogroup" aria-label="Sort markets" data-explain="om-knife" style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -16px", padding: "0 16px 2px", scrollbarWidth: "none" }}>
          {SORTS.map((o) => {
            const on = sort === o.id;
            return (
              <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => setSort(o.id)} className="mg-chip"
                style={{ flex: "none", height: 30, cursor: "pointer", color: on ? "#00e5ff" : "#c9ccd6", background: on ? "rgba(0,229,255,.1)" : "transparent", borderColor: on ? "#00e5ff66" : LINE }}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {q ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionTitle right={<span style={{ fontSize: 11, color: MUTED }}>{hits.length} found</span>}>Results</SectionTitle>
          {hits.length ? <div className="mg-om-grid">{hits.map((m) => <MarketTile key={m.id} m={m} />)}</div> : (
            <div className="mg-tile" style={{ padding: 18, textAlign: "center", fontSize: 13, color: MUTED }}>
              Nothing on that yet. <a href={`/open-markets/create?title=${encodeURIComponent(query.trim())}`} style={{ color: GOLD, fontWeight: 900 }}>Mint it ›</a>
            </div>
          )}
        </section>
      ) : null}

      {tab === "perps" ? (
        <div data-explain="om-perps" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => choose("perps", null)} className="mg-chip" style={{ cursor: "pointer", color: perp ? MUTED : "#00e5ff", borderColor: perp ? LINE : "#00e5ff66" }}>All six</button>
          {PERPS.map((p) => (
            <button key={p} type="button" onClick={() => choose("perps", p)} className="mg-chip"
              style={{ cursor: "pointer", color: perp === p ? "#00e5ff" : "#c9ccd6", borderColor: perp === p ? "#00e5ff66" : LINE }}>
              {PERP_LABEL[p]}
            </button>
          ))}
        </div>
      ) : null}

      {!q && tab === "all" && mine.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionTitle explain="om-create" right={<span style={{ fontSize: 11, color: ROSSA, fontWeight: 900 }}>{mine.length} live</span>}>Your markets</SectionTitle>
          <div className="mg-om-grid">{mine.map((m) => <MarketTile key={m.id} m={m} />)}</div>
        </section>
      ) : null}

      {q ? null : tab === "all" ? (
        <>
          <Band title="Prediction" note="Dated · settles on a named source" explain="om-prediction" items={s.markets.filter(filterFor("prediction", null)).filter((m) => mine.indexOf(m) === -1).sort(sorter)} more={() => choose("prediction")} />
          <Band title="Conviction · The Paseome" note="Bet the branch · 3–5 what-ifs" explain="om-conviction" items={s.markets.filter(filterFor("conviction", null)).filter((m) => mine.indexOf(m) === -1).sort(sorter)} more={() => choose("conviction")} />
          <CertainBand items={s.markets.filter(filterFor("certain", null)).sort(sorter)} />
          <Band title="Perpetuals" note="Legs, not expiries" explain="om-perps" items={s.markets.filter(filterFor("perps", null)).sort(sorter)} more={() => choose("perps")} />
        </>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionTitle explain={perp ? `perp-${perp}` : tab === "certain" ? "om-certain" : tab === "perps" ? "om-perps" : `om-${tab}`}
            right={<span style={{ fontSize: 11, color: MUTED }}>{list.length} markets</span>}>
            {perp ? PERP_LABEL[perp] : TABS.find((t) => t.id === tab)?.label}
          </SectionTitle>
          {list.length ? <div className="mg-om-grid">{list.map((m) => <MarketTile key={m.id} m={m} />)}</div> : <Empty />}
        </section>
      )}
    </OMShell>
  );
}

function Band({ title, note, items, more, explain }: { title: string; note: string; items: OMMarket[]; more: () => void; explain: string }) {
  if (!items.length) return null;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle explain={explain} right={<button type="button" onClick={more} style={{ background: "none", border: "none", color: GOLD, fontWeight: 900, fontSize: 12, cursor: "pointer", minHeight: 32 }}>See all ›</button>}>{title}</SectionTitle>
      <div style={{ marginTop: -8, fontSize: 11, color: MUTED }}>{note}</div>
      <OMCarousel label={title} cardWidth={270}>{items.map((m) => <MarketTile key={m.id} m={m} />)}</OMCarousel>
    </section>
  );
}

function CertainBand({ items }: { items: OMMarket[] }) {
  if (!items.length) return null;
  return (
    <section data-explain="om-certain" style={{ position: "relative", borderRadius: 24, padding: "20px 16px 16px", overflow: "hidden", border: "1px solid rgba(245,36,42,.35)", background: "radial-gradient(120% 80% at 100% 0%, rgba(245,36,42,.28) 0%, rgba(122,17,15,.18) 40%, #0b0907 75%)" }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: "#ffd3c4" }}>Platform-offered · no creator cut</div>
      <h2 style={{ margin: "6px 0 0", lineHeight: .95 }}>
        <span className="mg-display" style={{ fontSize: 34, color: "#fff4e8" }}>Certain-</span>
        <span className="mg-punch mg-gold-text" style={{ fontSize: 36 }}>UnCertainty</span>
      </h2>
      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "#ffb39f", textTransform: "uppercase" }}>The Paseome · Foresight ↔ Hindsight</div>
      <p style={{ margin: "10px 0 14px", fontSize: 12.5, lineHeight: 1.5, color: "#e6d9cc" }}>Bet the branch. The story keeps forking. The maker&apos;s worst loss, the refund and the 1.88% fee are certain — only the branch is not.</p>
      <OMCarousel label="Certain-UnCertainty" cardWidth={270}>{items.map((m) => <MarketTile key={m.id} m={m} />)}</OMCarousel>
    </section>
  );
}

function Empty() {
  return (
    <div className="mg-tile" style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 13 }}>
      Nothing here yet. <a href="/open-markets/create" style={{ color: GOLD, fontWeight: 900 }}>Create the first one ›</a>
    </div>
  );
}
