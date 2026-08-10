"use client";

/**
 * MAD Gambit — THE WATERLINE. The FIVE FACES hero instrument.
 * ────────────────────────────────────────────────────────────────
 * Two lines over legs: the entropy of the PERMANENT layer (who they are) and of
 * the TRANSITORY layer (who they are being this leg). The shaded band between
 * them is THE DIVERGENCE, and it is the only thing on the chart worth trading.
 *
 * A single leg tells you nothing — a wide transitory reading is just a loud
 * week. What is tradeable is the GAP persisting: a crowd loudly confused about
 * someone whose core has not moved in six legs is a mean-reversion trade, and a
 * crowd calmly agreed about someone whose core is drifting is the crash trade.
 * So the chart is drawn over legs by default and the single-leg view is not
 * offered — it would read as a signal when it is noise.
 *
 * Live from /api/v1/faces; falls back to the same shape from demo subjects run
 * through the real decomposition.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { PersonaPriceRow } from "@/components/persona-price";
import { SubjectReplyPanel } from "@/components/registrar-panel";
import type { StakeableLabel } from "@/lib/persona-codex";

interface Reading {
  hPerm: number;
  hTrans: number;
  divergence: number;
  normalised?: number;
}
interface Slip {
  isSlip: boolean;
  direction?: string | null;
  magnitude?: number;
}
interface Labels {
  permanent: StakeableLabel[];
  transitory: StakeableLabel[];
}
interface Entry {
  market: {
    id: string;
    title: string;
    legIndex: number;
    legClosesAt: string;
    status: string;
    subjectRef: string;
    subjectClass: string;
  };
  countdown: string;
  crowned: string | null;
  reading: Reading | null;
  slip: Slip;
  labels: Labels | null;
}
interface Resp {
  success: boolean;
  source?: string;
  markets: Entry[];
}

const MAX_ENTROPY = Math.log(5);

/** Divergence bar: permanent to the left of the waterline, transitory right. */
function DivergenceBar({ reading, slip }: { reading: Reading; slip: Slip }) {
  const { skin } = useSkin();
  const permPct = Math.min(100, Math.max(0, (reading.hPerm / MAX_ENTROPY) * 100));
  const transPct = Math.min(100, Math.max(0, (reading.hTrans / MAX_ENTROPY) * 100));
  const gapColor = slip.isSlip ? skin.gold : skin.accent2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Track label="Permanent" pct={permPct} color={skin.accent} />
      <Track label="Transitory" pct={transPct} color={gapColor} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: skin.muted }}>
        <span>
          D{" "}
          <b style={{ color: gapColor }}>
            {reading.divergence >= 0 ? "+" : ""}
            {reading.divergence.toFixed(3)}
          </b>
        </span>
        <span>{slip.isSlip ? `SLIP · ${slip.direction ?? ""}` : "within band"}</span>
      </div>
    </div>
  );
}

function Track({ label, pct, color }: { label: string; pct: number; color: string }) {
  const { skin } = useSkin();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 7, color: skin.muted, width: 62, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 7, background: skin.card, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .6s ease" }} />
      </div>
      <span style={{ fontSize: 7, color, fontWeight: 900, width: 30, textAlign: "right" }}>{Math.round(pct)}%</span>
    </div>
  );
}

export default function FacesWaterline() {
  const { skin } = useSkin();
  const [data, setData] = useState<Resp | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/faces?limit=6")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setData(d);
      })
      .catch(() => setData({ success: false, markets: [] }));
  }, []);

  const live = data?.source === "live";
  const markets = data?.markets ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          The Waterline <span style={{ color: skin.muted, fontSize: 8, letterSpacing: 1 }}>Five Faces</span>
          <AutoShowcaseBadge />
        </div>
        {data && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
            {live ? "live" : "demo"}
          </span>
        )}
      </div>
      <div style={{ fontSize: 7.5, color: skin.muted, marginTop: -6 }}>
        Permanent vs transitory entropy per leg. The gap is THE DIVERGENCE — past 34% of ln 5 it is a Slip.
      </div>

      {data === null && <div style={{ fontSize: 9, color: skin.muted }}>Reading the book…</div>}
      {data !== null && markets.length === 0 && (
        <div style={{ fontSize: 9, color: skin.muted }}>No persona markets live yet.</div>
      )}

      <Carousel auto gap={12} ariaLabel="Five Faces markets">
        {markets.map((m) => {
          const expanded = open === m.market.id;
          return (
            <div key={m.market.id} style={{ width: 320, maxWidth: "100%", height: "100%", background: skin.panel, border: `1px solid ${m.slip.isSlip ? `${skin.gold}66` : skin.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: skin.text, lineHeight: 1.35 }}>{m.market.title}</div>
                <div style={{ fontSize: 7, color: skin.muted, marginTop: 3 }}>
                  Leg {m.market.legIndex} · {m.countdown}
                  {m.crowned ? ` · crowned ${m.crowned.replace(/_/g, " ")}` : ""}
                </div>
              </div>

              {m.reading ? <DivergenceBar reading={m.reading} slip={m.slip} /> : (
                <div style={{ fontSize: 8, color: skin.muted }}>No decomposition on this leg yet.</div>
              )}

              {/* §9.1: adjacent to the Waterline at equal prominence. Deliberately
                  NOT behind the expand toggle — a reply you have to click to find
                  is not rendered at equal prominence to a price you cannot miss. */}
              {m.market.subjectClass === "named_individual" && (
                <SubjectReplyPanel subjectRef={m.market.subjectRef} />
              )}

              <button
                type="button"
                onClick={() => setOpen(expanded ? null : m.market.id)}
                style={{ alignSelf: "flex-start", fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, cursor: "pointer", color: skin.gold, background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, fontFamily: INSTRUMENT_FONT }}
              >
                {expanded ? "Hide the five faces" : "Show the five faces"}
              </button>

              {expanded && m.labels && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Layer title="Permanent — who they are" labels={m.labels.permanent} crowned={m.crowned} />
                  <Layer title="Transitory — who they are being" labels={m.labels.transitory} crowned={null} />
                </div>
              )}
            </div>
          );
        })}
      </Carousel>
    </div>
  );
}

function Layer({ title, labels, crowned }: { title: string; labels: StakeableLabel[]; crowned: string | null }) {
  const { skin } = useSkin();
  return (
    <div>
      <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.muted, marginBottom: 5 }}>
        {title}
      </div>
      <PersonaPriceRow labels={labels} crowned={crowned} scale={9} />
    </div>
  );
}
