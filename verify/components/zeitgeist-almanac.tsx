"use client";

/**
 * MAD Gambit — THE ALMANAC. The ZEITGEIST hero instrument.
 * ────────────────────────────────────────────────────────────────
 * The live slate, its five-face reading, the trend-lifecycle phase per slot,
 * and the countdown to THE TURNING in legs.
 *
 * The Gregorian drift is stated, not hidden. A lunar year is 354.367 days, so
 * the Turning walks about eleven days earlier each calendar year. A countdown
 * that quietly slipped would read as a bug once a year; a countdown that says
 * why it slipped is the cadence doing its job.
 *
 * Each slot exposes its CORPUS — the actual headlines and figures behind the
 * trend, with sources. That is the same corpus `corpusLineage` scores the next
 * slate against, so what a holder reads here is literally the input to the
 * matrix that decides where their conviction lands at the Turning.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { PersonaPriceRow } from "@/components/persona-price";
import SuccessionRibbon from "@/components/succession-ribbon";
import type { StakeableLabel } from "@/lib/persona-codex";

interface Life {
  adoption: number;
  burnout: number;
  salience: number;
  momentum: number;
  phase: string;
}
interface Slot {
  slotIndex: number;
  trendKey: string;
  trendName: string;
  question: string;
  corpus: string[];
  sources: string[];
  labels: StakeableLabel[];
  life: Life;
  status: string;
}
interface SlateResp {
  success: boolean;
  source?: string;
  vintage: number;
  slotInTurning: number;
  slots: Slot[];
}
interface TurningResp {
  success: boolean;
  vintage: number;
  leg: { slotInTurning: number; countdown: string; progress: number; isTurningLeg: boolean };
  turning: { legsRemaining: number; at: string; legsPerTurning: number; legDays: number; turningDays: number; gregorianDriftDays: number };
  moon: { illumination: number };
}

const PHASE_COLOR: Record<string, "accent" | "gold" | "accent2" | "muted" | "positive"> = {
  emerging: "positive",
  peaking: "accent",
  saturated: "gold",
  "burning-out": "accent2",
  residual: "muted",
};

export default function ZeitgeistAlmanac() {
  const { skin } = useSkin();
  const [slate, setSlate] = useState<SlateResp | null>(null);
  const [turning, setTurning] = useState<TurningResp | null>(null);
  const [openSlot, setOpenSlot] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/zeitgeist/slate")
      .then((r) => r.json())
      .then((d: SlateResp) => {
        if (d?.success) setSlate(d);
      })
      .catch(() => {});
    fetch("/api/v1/zeitgeist/turning")
      .then((r) => r.json())
      .then((d: TurningResp) => {
        if (d?.success) setTurning(d);
      })
      .catch(() => {});
  }, []);

  const live = slate?.source === "live";
  const slots = slate?.slots ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          The Almanac <span style={{ color: skin.muted, fontSize: 8, letterSpacing: 1 }}>Zeitgeist</span>
          <AutoShowcaseBadge />
        </div>
        {slate && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
            {live ? "live" : "seed slate"}
          </span>
        )}
      </div>

      {/* Turning strip */}
      {turning && (
        <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 14, padding: 14, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Stat label="Vintage" value={`№ ${turning.vintage}`} color={skin.gold} />
          <Stat label="Leg" value={`${turning.leg.slotInTurning + 1} / ${turning.turning.legsPerTurning}`} color={skin.accent} />
          <Stat label="To the Turning" value={`${turning.turning.legsRemaining} leg${turning.turning.legsRemaining === 1 ? "" : "s"}`} color={skin.accent2} />
          <Stat label="Leg closes" value={turning.leg.countdown} color={skin.text} />
          <Stat label="Moon" value={`${Math.round(turning.moon.illumination * 100)}%`} color={skin.text} />
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <div style={{ height: 7, background: skin.card, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(turning.leg.progress * 100)}%`, height: "100%", background: turning.leg.isTurningLeg ? skin.gold : skin.accent, transition: "width .6s ease" }} />
            </div>
            <div style={{ fontSize: 6.5, color: skin.muted, marginTop: 4 }}>
              A lunar year is {turning.turning.turningDays}d — the Turning walks{" "}
              {turning.turning.gregorianDriftDays.toFixed(1)}d earlier every Gregorian year. That drift is the cadence,
              not a fault.
            </div>
          </div>
        </div>
      )}

      {slate === null && <div style={{ fontSize: 9, color: skin.muted }}>Reading the slate…</div>}

      {/* Where conviction goes at the Turning. Drawn, not tabulated — the
          conservation is the reassurance, and a picture carries it. */}
      <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 14, padding: 14 }}>
        <SuccessionRibbon labels={slots.map((s) => s.trendName)} />
      </div>

      <Carousel auto gap={12} ariaLabel="Zeitgeist slate">
        {slots.map((s) => {
          const expanded = openSlot === s.slotIndex;
          const phaseKey = PHASE_COLOR[s.life.phase] ?? "muted";
          const phaseColor = skin[phaseKey];
          return (
            <div key={s.trendKey} style={{ width: 320, maxWidth: "100%", height: "100%", background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: skin.text }}>
                    {s.trendName}
                  </span>
                  <span style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", color: phaseColor, background: `${phaseColor}18`, border: `1px solid ${phaseColor}55` }}>
                    {s.life.phase}
                  </span>
                </div>
                <div style={{ fontSize: 7.5, color: skin.muted, marginTop: 4, lineHeight: 1.45 }}>{s.question}</div>
              </div>

              <div style={{ display: "flex", gap: 12, fontSize: 7, color: skin.muted }}>
                <span>Adoption <b style={{ color: skin.positive }}>{Math.round(s.life.adoption * 100)}%</b></span>
                <span>Burnout <b style={{ color: skin.accent2 }}>{Math.round(s.life.burnout * 100)}%</b></span>
                <span>Salience <b style={{ color: skin.gold }}>{Math.round(s.life.salience * 100)}%</b></span>
              </div>

              <PersonaPriceRow labels={s.labels} scale={9} />

              <button
                type="button"
                onClick={() => setOpenSlot(expanded ? null : s.slotIndex)}
                style={{ alignSelf: "flex-start", fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "3px 8px", borderRadius: 5, cursor: "pointer", color: skin.gold, background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, fontFamily: INSTRUMENT_FONT }}
              >
                {expanded ? "Hide the corpus" : `Corpus · ${s.corpus.length} lines`}
              </button>

              {expanded && (
                <div style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: 10 }}>
                  <ul style={{ margin: 0, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                    {s.corpus.map((line, i) => (
                      <li key={i} style={{ fontSize: 8, color: skin.text, lineHeight: 1.45 }}>{line}</li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 6.5, color: skin.muted, marginTop: 8, lineHeight: 1.5 }}>
                    Sources: {s.sources.join(" · ")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Carousel>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { skin } = useSkin();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 900, color }}>{value}</span>
    </div>
  );
}
