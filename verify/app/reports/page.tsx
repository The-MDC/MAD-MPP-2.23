"use client";

/**
 * MAD Gambit — /reports : platform analytics, plus a per-perp report when
 * opened from a dial (?perp=scandal|zliar|gossip|epiphany|faces|zeitgeist).
 * The perp report is read from that perp's own market data (PERP_REPORTS).
 */
import React, { useEffect, useState } from "react";
import { OMShell, Headline, SectionTitle, GOLD, MUTED, LINE } from "@/components/om-ui";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import DopamineMetricsCarousel from "@/components/dopamine-metrics-carousel";
import { PERP_REPORTS } from "@/lib/perp-reports";
import { explainerFor } from "@/lib/explainers";
import { isPerp, PERP_LABEL, PERPS, type OMPerp } from "@/lib/open-markets";

/** Report keys are deck ids; two differ from the family keys. */
const DECK_ID: Record<OMPerp, string> = { scandal: "scandal", zliar: "zliar", gossip: "gossip", epiphany: "epi", faces: "faces", zeitgeist: "zeit" };
const MONO = "ui-monospace, 'JetBrains Mono', monospace";

export default function ReportsPage() {
  const [perp, setPerp] = useState<OMPerp | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("perp");
    if (isPerp(p)) setPerp(p);
  }, []);
  const pick = (p: OMPerp | null) => {
    setPerp(p);
    window.history.replaceState(null, "", p ? `/reports?perp=${p}` : "/reports");
  };
  const report = perp ? PERP_REPORTS[DECK_ID[perp]] : null;
  const ex = perp ? explainerFor(`perp-${perp}`) : null;

  return (
    <OMShell title={perp ? `Report · ${PERP_LABEL[perp]}` : "Reports"} back={{ href: "/preview", label: "Back to the hub" }}>
      <section className="mg-seam">
        <Headline lead="The" punch="Reports" size={44} sub="Every reading is drawn from the market's own book — the information market, not commentary." />
      </section>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "2px 16px 4px", scrollbarWidth: "none" }}>
        <button type="button" onClick={() => pick(null)} className="mg-chip" style={{ flex: "none", height: 34, cursor: "pointer", color: perp ? "#d7d2c4" : "#1a1205", background: perp ? "rgba(255,255,255,.04)" : "var(--mg-gold-fill)" }}>Platform</button>
        {PERPS.map((p) => (
          <button key={p} type="button" onClick={() => pick(p)} className="mg-chip"
            style={{ flex: "none", height: 34, cursor: "pointer", color: perp === p ? "#1a1205" : "#d7d2c4", background: perp === p ? "var(--mg-gold-fill)" : "rgba(255,255,255,.04)", borderColor: LINE }}>
            {PERP_LABEL[p]}
          </button>
        ))}
      </div>

      {perp && report ? (
        <>
          <section className="mg-tile" data-explain={`perp-${perp}`} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div className="mg-display" style={{ fontSize: 30 }}>{report.title}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{report.kicker}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {report.stats.map((st) => (
                <div key={st.k} style={{ padding: "10px 12px", borderRadius: 14, background: "#101118", border: `1px solid ${LINE}` }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED }}>{st.k}</div>
                  <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: st.c, marginTop: 3 }}>{st.v}</div>
                </div>
              ))}
            </div>
            {ex ? (
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "#050505", border: "1px solid rgba(214,157,65,.16)", fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: GOLD }}>
                {ex.formula.map((f) => <div key={f}>{f}</div>)}
              </div>
            ) : null}
            {report.sections.map((sec) => (
              <div key={sec.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" }}>
                  <span style={{ color: "#f6f1e3" }}>{sec.label}</span>
                  <span style={{ color: MUTED }}>{sec.src}</span>
                </div>
                {sec.lines.map((l) => <p key={l} style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "#d6cfbf" }}>{l}</p>)}
              </div>
            ))}
            <a href={`/open-markets?perp=${perp}`} className="mg-btn-gold" style={{ width: "100%", fontSize: 14 }}>Trade {PERP_LABEL[perp]} markets ›</a>
          </section>
        </>
      ) : null}

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionTitle>Platform pulse</SectionTitle>
        <DopamineMetricsCarousel />
        <AnalyticsDashboard />
      </section>
    </OMShell>
  );
}
