"use client";

/**
 * MAD Gambit — /profile : positions, created markets, demo balance, beta wallet.
 * Positions are marked to each market's live book (shares × current price).
 */
import React from "react";
import { OMShell, Headline, SectionTitle, Stat, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";
import MadxWalletPanel from "@/components/madx-wallet-panel";
import { resetDemo, sellPosition, topUp, useOpenMarkets } from "@/lib/open-markets-store";
import { convictionHeld, madx, pct, prices, sellQuote } from "@/lib/open-markets";

const MONO = "ui-monospace, 'JetBrains Mono', monospace";

export default function ProfilePage() {
  return (
    <OMShell title="Profile · positions · wallet">
      <ProfileInner />
    </OMShell>
  );
}

function ProfileInner() {
  const s = useOpenMarkets();
  const rows = s.positions.map((x) => {
    const m = s.markets.find((mk) => mk.id === x.marketId);
    const i = m ? m.outcomes.findIndex((o) => o.id === x.outcomeId) : -1;
    const p = m && i >= 0 ? prices(m.outcomes, m.b)[i] : 0;
    const mark = x.shares * p;
    const cashOut = m && i >= 0 ? sellQuote(m, i, x.shares).net : 0;
    return { x, m, label: m && i >= 0 ? m.outcomes[i].label : "—", p, mark, cashOut, pnl: mark - x.stake };
  });
  const staked = rows.reduce((a, r) => a + r.x.stake, 0);
  const mark = rows.reduce((a, r) => a + r.mark, 0);
  const realised = s.closed.reduce((a, c) => a + (c.proceeds - c.stake), 0);
  const pnl = mark - staked + realised;
  const mine = s.markets.filter((m) => s.createdIds.indexOf(m.id) !== -1);

  return (
    <>
      <section className="mg-tile mg-seam" data-explain="om-profile" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/madhatr-logo.png" alt="" width={64} height={64} style={{ borderRadius: 18, border: "1px solid rgba(214,157,65,.35)", background: "#0b0b0e", objectFit: "cover" }} />
          <div style={{ minWidth: 0 }}>
            <Headline lead="Degen" punch="Profile" size={34} />
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Demo floor · free-play $MADx held in this browser</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase", color: MUTED }}>Balance</div>
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 800, lineHeight: 1.1 }} className="mg-gold-text">{madx(s.credits)}</div>
            <div style={{ fontSize: 10.5, color: MUTED }}>$MADx · demo</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="mg-btn-gold" onClick={() => topUp(500)} style={{ minHeight: 40, padding: "0 14px", fontSize: 12 }}>+500</button>
            <button type="button" className="mg-btn-ghost" onClick={() => { if (window.confirm("Reset the demo floor? Positions and created markets are cleared.")) resetDemo(); }} style={{ fontSize: 12 }}>Reset</button>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", gap: 8 }}>
        <Stat k="Positions" v={String(rows.length)} />
        <Stat k="Staked" v={madx(staked)} />
        <Stat k="P&L" v={`${pnl >= 0 ? "+" : ""}${madx(pnl)}`} accent={pnl >= 0 ? "#7cffc7" : "#f85b5f"} />
      </div>

      <section id="positions" style={{ display: "flex", flexDirection: "column", gap: 10, scrollMarginTop: 80 }}>
        <SectionTitle explain="om-profile" right={<a href="/open-markets" style={{ color: GOLD, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>Find markets ›</a>}>My bets</SectionTitle>
        {rows.length ? rows.map((r) => {
          const held = convictionHeld(r.x.at);
          const href = r.m ? `/open-markets/${encodeURIComponent(r.m.id)}` : "/open-markets";
          return (
          <div key={r.x.id} className="mg-tile" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            <a href={href} style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35, color: "#f6f1e3", textDecoration: "none" }}>{r.m?.title ?? "Market"} <span style={{ color: GOLD }}>›</span></a>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
              <span style={{ color: GOLD, fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              <span style={{ fontFamily: MONO, color: MUTED, flex: "none" }}>now {pct(r.p, 1)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, fontFamily: MONO, fontSize: 12 }}>
              <span><span style={{ color: MUTED }}>Stake </span>{madx(r.x.stake)}</span>
              <span><span style={{ color: MUTED }}>Mark </span>{madx(r.mark)}</span>
              <span style={{ textAlign: "right", color: r.pnl >= 0 ? "#7cffc7" : "#f85b5f" }}>{r.pnl >= 0 ? "+" : ""}{madx(r.pnl)}</span>
            </div>
            <div data-explain="om-profile" title="Conviction = 1 − e^(−t/30d): 63% at a month held, 95% at three" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: MUTED }}>
              <span style={{ flex: "none", fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>Conviction</span>
              <span style={{ flex: 1, height: 4, borderRadius: 999, background: "#1d1f27", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${Math.max(2, held * 100)}%`, background: "var(--mg-gold-fill)" }} />
              </span>
              <span style={{ flex: "none", fontFamily: MONO }}>{pct(held, 1)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={href} className="mg-btn-ghost" style={{ flex: 1, minHeight: 38, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Add to it</a>
              <button type="button" className="mg-btn-gold" onClick={() => sellPosition(r.x.id)} style={{ flex: 1, minHeight: 38, fontSize: 12 }} aria-label={`Cash out ${r.label} for ${madx(r.cashOut)} $MADx`}>
                Cash out {madx(r.cashOut)}
              </button>
            </div>
          </div>
          );
        }) : (
          <div className="mg-tile" style={{ padding: 18, textAlign: "center", fontSize: 13, color: MUTED }}>
            No bets yet. <a href="/open-markets" style={{ color: GOLD, fontWeight: 900 }}>Take a side ›</a>
          </div>
        )}
      </section>

      {s.closed.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionTitle>Cashed out</SectionTitle>
          {s.closed.slice(0, 8).map((c) => {
            const m = s.markets.find((mk) => mk.id === c.marketId);
            const label = m?.outcomes.find((o) => o.id === c.outcomeId)?.label ?? "—";
            const r = c.proceeds - c.stake;
            return (
              <div key={c.id} className="mg-tile" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{ color: GOLD }}>{label}</b> · {m?.title ?? "Market"}</span>
                <span style={{ flex: "none", fontFamily: MONO, color: r >= 0 ? "#7cffc7" : "#f85b5f" }}>{r >= 0 ? "+" : ""}{madx(r)}</span>
              </div>
            );
          })}
        </section>
      ) : null}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionTitle explain="om-create" right={<a href="/open-markets/create" style={{ color: ROSSA, fontSize: 12, fontWeight: 900, textDecoration: "none" }}>+ Create ›</a>}>My markets</SectionTitle>
        {mine.length ? mine.map((m) => (
          <a key={m.id} href={`/open-markets/${encodeURIComponent(m.id)}`} className="mg-tile mg-tile-hover" style={{ padding: 14, textDecoration: "none", color: "inherit", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{m.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>{m.title}</span>
              <span style={{ display: "block", fontSize: 11, color: MUTED, marginTop: 3 }}>{m.cls === "prediction" ? "Prediction" : "Paseome"} · {m.traders} traders · your share 28.8% → 40%</span>
            </span>
          </a>
        )) : (
          <div className="mg-tile" style={{ padding: 18, textAlign: "center", fontSize: 13, color: MUTED }}>
            You haven&apos;t minted a market yet. <a href="/open-markets/create" style={{ color: GOLD, fontWeight: 900 }}>Call it ›</a>
          </div>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionTitle>Beta wallet</SectionTitle>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: -4 }}>Signed-in wallets hold beta $MADx on the server ledger. Separate from the demo balance above.</div>
        <MadxWalletPanel />
      </section>

      <nav aria-label="Account" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["Swap", "/swap"], ["Reports", "/reports"], ["Settings", "/settings"], ["Classic hub", "/mpp2.23"]].map(([l, h]) => (
          <a key={h} href={h} className="mg-btn-ghost" style={{ fontSize: 13, border: `1px solid ${LINE}` }}>{l} ›</a>
        ))}
      </nav>
    </>
  );
}
