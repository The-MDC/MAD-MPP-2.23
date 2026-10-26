"use client";

/**
 * MAD Gambit — /open-markets/[id] : the trade desk.
 * One market, one ticket. Pick a side or a branch, set a stake, read the quote
 * (fee, shares, price after, payout) and lock it in. Every number comes from
 * quote() in lib/open-markets.ts — the same DL-LMSR the server book runs.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OMShell, ClassBadge, CrowdBar, Sparkline, Stat, SectionTitle, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";
import { celebrate } from "@/components/joy-layer";
import { getMarket, placeBet, useOpenMarkets } from "@/lib/open-markets-store";
import {
  closesLabel, compact, decimalOdds, madx, maxMakerLoss, pct, prices, quote, type OMPosition,
} from "@/lib/open-markets";

const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const STAKES = [10, 25, 50, 100];

export default function TradeDesk() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  const s = useOpenMarkets();
  const m = getMarket(s, id);
  const [sel, setSel] = useState<string | null>(null);
  const [stake, setStake] = useState(25);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<OMPosition | null>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("o")) setSel(q.get("o"));
    setCreated(q.get("created") === "1");
  }, []);

  const p = useMemo(() => (m ? prices(m.outcomes, m.b) : []), [m]);
  const idx = m ? Math.max(0, m.outcomes.findIndex((o) => o.id === sel)) : 0;
  const hasSel = !!m && m.outcomes.some((o) => o.id === sel);
  const qt = m && hasSel && stake > 0 ? quote(m, idx, stake) : null;

  if (!s.markets.length) return <OMShell back={{ href: "/open-markets", label: "Back" }}><div style={{ height: 320 }} /></OMShell>;
  if (!m) {
    return (
      <OMShell back={{ href: "/open-markets", label: "Back to markets" }}>
        <div className="mg-tile" style={{ padding: 24, textAlign: "center" }}>
          <div className="mg-display" style={{ fontSize: 28 }}>Market not found</div>
          <a href="/open-markets" className="mg-btn-gold" style={{ marginTop: 16 }}>Browse markets</a>
        </div>
      </OMShell>
    );
  }

  const binary = m.outcomes.length === 2;
  const mine = s.positions.filter((x) => x.marketId === m.id);

  const lock = () => {
    if (!sel) { setError("Pick a side first."); return; }
    const r = placeBet(m.id, sel, stake);
    if (!r.ok) { setError(r.error); return; }
    setError(null);
    setFilled(r.value);
    celebrate({ intensity: 0.9 });
  };

  return (
    <OMShell title={m.perp ? "Perpetual desk" : m.cls === "prediction" ? "Prediction desk" : "Paseome desk"} back={{ href: "/open-markets", label: "Back to markets" }}>
      {created ? (
        <div style={{ padding: "12px 14px", borderRadius: 16, background: "linear-gradient(90deg, rgba(255,215,0,.16), rgba(249,86,57,.12))", border: "1px solid rgba(255,215,0,.4)", fontSize: 13, fontWeight: 700 }}>
          ✨ Market minted. Take the first position — you earn your creator share on every trade.
        </div>
      ) : null}

      <section className="mg-tile" data-explain={m.perp ? `perp-${m.perp}` : m.cls === "prediction" ? "om-prediction" : "om-conviction"} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <ClassBadge m={m} />
          <span style={{ fontSize: 11, color: MUTED }}>{closesLabel(m)}</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span aria-hidden="true" style={{ flex: "none", display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 14, background: "#1a1c25", border: `1px solid ${LINE}`, fontSize: 24 }}>{m.emoji}</span>
          <h1 style={{ margin: 0, fontSize: 19, lineHeight: 1.3, fontWeight: 900, color: "#fbf6e8" }}>{m.title}</h1>
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5 }}>{m.category} · by {m.creator}{m.origin === "platform" ? " · no creator cut" : ""}</div>
        {binary ? (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase", color: MUTED }}>Yes probability</div>
              <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, lineHeight: 1.05 }} className="mg-gold-text">{pct(p[0], 1)}</div>
            </div>
            <Sparkline series={m.history} idx={0} w={150} h={48} />
          </div>
        ) : null}
        <CrowdBar m={m} height={8} />
      </section>

      <section data-explain={binary ? "om-prediction" : "om-conviction"} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionTitle right={<span style={{ fontSize: 11, color: MUTED }}>{binary ? "Tap a side" : `Σ = ${p.reduce((a, v) => a + v, 0).toFixed(3)}`}</span>}>
          {binary ? "Take a side" : "Bet the branch"}
        </SectionTitle>
        {binary ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {m.outcomes.map((o, i) => (
              <button key={o.id} type="button" className="mg-odds" aria-pressed={sel === o.id} onClick={() => { setSel(o.id); setFilled(null); setError(null); }} style={{ minHeight: 72 }}>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: sel === o.id ? "#1a1205" : i === 0 ? "#7cffc7" : "#ff8f7a" }}>{o.label} · {pct(p[i])}</span>
                <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800 }}>{decimalOdds(p[i]).toFixed(2)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {m.outcomes.map((o, i) => {
              const on = sel === o.id;
              return (
                <button key={o.id} type="button" onClick={() => { setSel(o.id); setFilled(null); setError(null); }} aria-pressed={on}
                  style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, minHeight: 60, padding: "10px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "#f6f1e3",
                    background: on ? "rgba(255,215,0,.1)" : "#12131a", border: `1px solid ${on ? "rgba(255,215,0,.7)" : LINE}` }}>
                  <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${p[i] * 100}%`, background: on ? "rgba(255,215,0,.10)" : "rgba(249,86,57,.08)" }} />
                  <span style={{ position: "relative", flex: "none", width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 9, background: on ? GOLD : "#1d1f28", color: on ? "#1a1205" : ROSSA, fontFamily: MONO, fontWeight: 900, fontSize: 12 }}>{i + 1}</span>
                  <span style={{ position: "relative", flex: 1, fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{o.label}</span>
                  <span style={{ position: "relative", flex: "none", textAlign: "right" }}>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 15, fontWeight: 800, color: GOLD }}>{pct(p[i], 1)}</span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: MUTED }}>{decimalOdds(p[i]).toFixed(2)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mg-tile" data-explain="om-ticket" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, borderColor: "rgba(255,215,0,.32)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="mg-display" style={{ fontSize: 24 }}>Bet slip</div>
          <div style={{ fontSize: 11, color: MUTED }}>Balance <span style={{ fontFamily: MONO, color: GOLD }}>{madx(s.credits)}</span> $MADx</div>
        </div>
        <div style={{ fontSize: 12.5, color: hasSel ? "#f6f1e3" : MUTED, fontWeight: 700, lineHeight: 1.4 }}>
          {hasSel ? <>Your pick: <span style={{ color: GOLD }}>{m.outcomes[idx].label}</span></> : "Pick a side above to build your slip."}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex", alignItems: "center", gap: 8, minHeight: 50, padding: "0 14px", borderRadius: 14, background: "#0b0c11", border: `1px solid ${LINE}` }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: MUTED }}>STAKE</span>
            <input type="number" inputMode="decimal" min={1} value={stake} aria-label="Stake in $MADx"
              onChange={(e) => { setStake(Math.max(0, Number(e.target.value) || 0)); setFilled(null); }}
              style={{ flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: MONO, fontSize: 20, fontWeight: 800, textAlign: "right" }} />
            <span style={{ fontSize: 11, color: MUTED }}>$MADx</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {STAKES.map((v) => (
            <button key={v} type="button" className="mg-chip" onClick={() => { setStake(v); setFilled(null); }} style={{ height: 36, justifyContent: "center", cursor: "pointer", color: stake === v ? "#1a1205" : "#d7d2c4", background: stake === v ? "var(--mg-gold-fill)" : "rgba(255,255,255,.04)" }}>{v}</button>
          ))}
          <button type="button" className="mg-chip" onClick={() => { setStake(Math.floor(s.credits)); setFilled(null); }} style={{ height: 36, justifyContent: "center", cursor: "pointer" }}>Max</button>
        </div>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 8, columnGap: 12, fontSize: 12.5 }}>
          <Row k="Fee · 1.88%" v={qt ? `${madx(qt.fee)}` : "—"} />
          <Row k="Shares" v={qt ? qt.shares.toFixed(2) : "—"} />
          <Row k="Avg price" v={qt ? pct(qt.avgPrice, 1) : "—"} />
          <Row k="Price after your fill" v={qt ? `${pct(qt.priceBefore, 1)} → ${pct(qt.priceAfter, 1)}` : "—"} />
        </dl>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 14, background: "rgba(255,215,0,.07)", border: "1px solid rgba(255,215,0,.25)" }}>
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#e9d9a6" }}>{m.side === "counterfactual" ? "Mark value if it holds" : "Potential payout"}</span>
          <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800 }} className="mg-gold-text">{qt ? madx(qt.payout) : "0.00"}</span>
        </div>
        {error ? <div role="alert" style={{ fontSize: 12.5, color: "#ffb4ab" }}>{error}</div> : null}
        <button type="button" className="mg-btn-gold" onClick={lock} disabled={!hasSel || !(stake >= 1)} style={{ width: "100%", minHeight: 54, fontSize: 16 }}>
          {hasSel ? `Lock it in · ${madx(stake)} $MADx` : "Pick a side"}
        </button>
        {filled ? (
          <div role="status" style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(124,255,199,.08)", border: "1px solid rgba(124,255,199,.35)", fontSize: 13, lineHeight: 1.5 }}>
            ✅ Locked: <b>{filled.shares.toFixed(2)} shares</b> of <b>{m.outcomes.find((o) => o.id === filled.outcomeId)?.label}</b> for {madx(filled.stake)} $MADx.{" "}
            <a href="/profile#positions" style={{ color: GOLD, fontWeight: 900 }}>View in Profile ›</a>
          </div>
        ) : null}
      </section>

      <div style={{ display: "flex", gap: 8 }}>
        <Stat k="Volume" v={compact(m.volume)} accent={GOLD} />
        <Stat k="Traders" v={String(m.traders)} />
        <Stat k="Max loss" v={`${maxMakerLoss(m.outcomes.length, m.b).toFixed(0)}`} accent={ROSSA} />
      </div>

      <section className="mg-tile" data-explain={m.cls === "prediction" ? "om-prediction" : m.closesAt === null ? "om-perps" : "om-certain"} style={{ padding: 16, fontSize: 12.5, lineHeight: 1.6, color: "#d6cfbf" }}>
        <div className="mg-display" style={{ fontSize: 20, color: "#f6f1e3", marginBottom: 6 }}>Rules</div>
        <div><b style={{ color: GOLD }}>Settles:</b> {m.resolution}</div>
        {m.side === "forward" ? <div><b style={{ color: GOLD }}>Untaken branches:</b> refunded in full at the leg roll.</div> : null}
        {m.closesAt === null ? <div><b style={{ color: GOLD }}>Expiry:</b> none — {m.perp ? "rolls every 59.061-day leg" : "marked to the live book"}.</div> : null}
        <div><b style={{ color: GOLD }}>Fee:</b> 1.88% flat, taken from the stake · liquidity b = {m.b.toLocaleString()}.</div>
      </section>

      {mine.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionTitle explain="om-profile">Your positions here</SectionTitle>
          {mine.map((x) => {
            const i = m.outcomes.findIndex((o) => o.id === x.outcomeId);
            const mark = x.shares * p[i];
            return (
              <div key={x.id} className="mg-tile" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
                <span style={{ fontWeight: 700 }}>{m.outcomes[i]?.label} · {x.shares.toFixed(2)} sh</span>
                <span style={{ fontFamily: MONO, color: mark >= x.stake ? "#7cffc7" : "#ff8f7a" }}>{madx(mark)}</span>
              </div>
            );
          })}
        </section>
      ) : null}
    </OMShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt style={{ color: MUTED }}>{k}</dt>
      <dd style={{ margin: 0, fontFamily: MONO, fontWeight: 700, textAlign: "right" }}>{v}</dd>
    </>
  );
}
