"use client";

/**
 * MAD Gambit — reusable metric explainer popup.
 * ────────────────────────────────────────────────────────────────
 * Every ticker / dopamine number on the hub is clickable and opens this dialog,
 * which explains WHAT the metric measures and HOW it's computed (worksheet:
 * "all tickers and dopamine items should be clickable globally with a link to a
 * market or report or popup explaining … how it is algorithmically measuring").
 *
 * Signals are tagged measured vs est. so we never imply a number is live when
 * it's an algorithmic proxy. Skin-aware; closes on backdrop click or Esc.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

export interface MetricRow {
  label: string;
  value?: string | number;
  kind?: "measured" | "estimated";
  note?: string;
}

export interface MetricPopoverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  blurb: string;
  score?: { label: string; value: number }; // optional headline number (e.g. Heat 87)
  rows?: MetricRow[];
  cta?: { label: string; onClick: () => void }; // optional "link to a market/report"
}

export default function MetricPopover({ open, onClose, title, blurb, score, rows, cta }: MetricPopoverProps) {
  const { skin } = useSkin();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: INSTRUMENT_FONT }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, boxShadow: `0 18px 60px rgba(0,0,0,0.5)` }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: skin.text, textTransform: "uppercase" }}>{title}</div>
          </div>
          {score ? (
            <div style={{ flex: "none", textAlign: "center", background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, borderRadius: 10, padding: "4px 10px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: skin.gold, lineHeight: 1 }}>{Math.round(score.value)}</div>
              <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: skin.muted, textTransform: "uppercase" }}>{score.label}</div>
            </div>
          ) : null}
          <button type="button" onClick={onClose} aria-label="Close" style={{ flex: "none", width: 26, height: 26, borderRadius: 8, background: "transparent", border: `1px solid ${skin.border}`, color: skin.muted, cursor: "pointer", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ fontSize: 10.5, lineHeight: 1.5, color: skin.muted, margin: "0 0 12px" }}>{blurb}</p>

        {rows && rows.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ background: skin.bg, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: skin.text, flex: 1 }}>{r.label}</span>
                  {r.kind ? (
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase", padding: "2px 6px", borderRadius: 6, color: r.kind === "measured" ? skin.positive : skin.gold, background: `${r.kind === "measured" ? skin.positive : skin.gold}18`, border: `1px solid ${r.kind === "measured" ? skin.positive : skin.gold}55` }}>
                      {r.kind === "measured" ? "measured" : "est."}
                    </span>
                  ) : null}
                  {r.value !== undefined ? <span style={{ fontSize: 11, fontWeight: 900, color: skin.accent2, minWidth: 26, textAlign: "right" }}>{r.value}</span> : null}
                </div>
                {r.note ? <div style={{ fontSize: 9, lineHeight: 1.45, color: skin.muted, marginTop: 3 }}>{r.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}

        {cta ? (
          <button
            type="button"
            onClick={() => { cta.onClick(); onClose(); }}
            style={{ marginTop: 14, width: "100%", padding: "9px 12px", borderRadius: 10, background: skin.accent, border: "none", color: "#0b0b12", fontSize: 10.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
          >
            {cta.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
