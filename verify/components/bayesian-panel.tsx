"use client";

/**
 * MAD Gambit — Bayesian Conviction Lab (Part T)
 * Surfaces the bayesian-conviction engine: sequential belief update (prior +
 * evidence likelihood ratio → posterior) and the edge / act-signal / Kelly
 * calculator. Read-only preview — no value moves. Hits /api/v1/bayesian/{update,voi}.
 */
import React, { useEffect, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Slider(props: { label: string; value: number; min: number; max: number; step: number; color: string; onChange: (n: number) => void; fmt?: (n: number) => string }) {
  const fmt = props.fmt ?? ((n: number) => String(n));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: INK.muted, letterSpacing: 1, textTransform: "uppercase" }}>
        <span>{props.label}</span>
        <span style={{ color: props.color }}>{fmt(props.value)}</span>
      </div>
      <input type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} style={{ width: "100%", accentColor: props.color }} />
    </div>
  );
}

export default function BayesianPanel() {
  const [prior, setPrior] = useState(0.5);
  const [lr, setLr] = useState(2);
  const [posterior, setPosterior] = useState<number | null>(null);

  const [personal, setPersonal] = useState(0.6);
  const [market, setMarket] = useState(0.5);
  const [conviction, setConviction] = useState(1.5);
  const [edge, setEdge] = useState<number | null>(null);
  const [act, setAct] = useState(false);
  const [kelly, setKelly] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetch("/api/v1/bayesian/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prior, likelihoodRatios: [lr] }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.success) setPosterior(d.result.posterior);
        })
        .catch(() => {});
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [prior, lr]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      const netOdds = market > 0 ? (1 - market) / market : 1;
      fetch("/api/v1/bayesian/voi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ personal, market, conviction, netOdds }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.success) {
            setEdge(d.result.edge);
            setAct(d.result.shouldAct);
            setKelly(d.result.kelly);
          }
        })
        .catch(() => {});
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [personal, market, conviction]);

  const priorShift = posterior !== null ? posterior - prior : 0;

  return (
    <div style={{ background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: INK.white }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: INK.gold, textTransform: "uppercase" }}>
          Bayesian Conviction Lab
        </div>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: INK.muted, background: `${INK.muted}18`, border: `1px solid ${INK.muted}40` }}>
          preview
        </span>
      </div>

      {/* Belief update */}
      <div style={{ fontSize: 8, color: INK.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Sequential belief update
      </div>
      <Slider label="Prior" value={prior} min={0.01} max={0.99} step={0.01} color={INK.cyan} onChange={setPrior} fmt={pct} />
      <Slider label="Evidence likelihood ratio" value={lr} min={0.1} max={10} step={0.1} color={INK.pink} onChange={setLr} fmt={(n) => `${n.toFixed(1)}×`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        <div style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: INK.green }}>{posterior !== null ? pct(posterior) : "—"}</div>
          <div style={{ fontSize: 8, color: INK.muted, textTransform: "uppercase", letterSpacing: 1 }}>Posterior</div>
        </div>
        <div style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: priorShift >= 0 ? INK.green : INK.pink }}>
            {posterior !== null ? `${priorShift >= 0 ? "+" : ""}${(priorShift * 100).toFixed(1)}pt` : "—"}
          </div>
          <div style={{ fontSize: 8, color: INK.muted, textTransform: "uppercase", letterSpacing: 1 }}>Bayesian surprise</div>
        </div>
      </div>

      {/* Edge / Kelly */}
      <div style={{ fontSize: 8, color: INK.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Edge &amp; position
      </div>
      <Slider label="Your posterior" value={personal} min={0.01} max={0.99} step={0.01} color={INK.green} onChange={setPersonal} fmt={pct} />
      <Slider label="Market price" value={market} min={0.01} max={0.99} step={0.01} color={INK.cyan} onChange={setMarket} fmt={pct} />
      <Slider label="Conviction" value={conviction} min={0.1} max={5} step={0.1} color={INK.gold} onChange={setConviction} fmt={(n) => `${n.toFixed(1)}×`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
        {([
          ["Edge", edge !== null ? edge.toFixed(3) : "—", INK.gold],
          ["Kelly", kelly !== null ? pct(kelly) : "—", INK.cyan],
          ["Signal", act ? "ACT" : "HOLD", act ? INK.green : INK.muted],
        ] as [string, string, string][]).map(([label, val, color]) => (
          <div key={label} style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 7, color: INK.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 7, color: INK.muted, marginTop: 12, lineHeight: 1.5 }}>
        Log-odds sequential update · conviction-modulated edge · fractional Kelly. Preview only — informational, not advice.
      </div>
    </div>
  );
}
