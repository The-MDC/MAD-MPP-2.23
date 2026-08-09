"use client";

/**
 * MAD Gambit — PersonaPrice. The only sanctioned way to render a face price.
 * ────────────────────────────────────────────────────────────────
 * FIVE FACES §2: the quantification IS the actionable assertion, so the Codex
 * definition binds to the NUMBER, not to a footnote somewhere on the page.
 *
 * That requirement is enforced twice over, deliberately:
 *
 *   AT THE TYPE LEVEL — the component takes a whole `StakeableLabel`, and
 *   `definition` is a required field of that type. There is no prop shape that
 *   renders a price without one. `stakeableLabel()` is the only constructor,
 *   and it never returns a catchphrase, so flavour cannot reach this surface
 *   even by accident.
 *
 *   AT THE STYLE LEVEL — one `scale` drives both type sizes. The definition can
 *   never be styled smaller than the name it qualifies, because there is no
 *   separate number to shrink. This is why there is no `compact` variant: the
 *   compact variant of a bound disclosure is an unbound one.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import type { StakeableLabel } from "@/lib/persona-codex";

export interface PersonaPriceProps {
  /** Price and definition as one indivisible unit. */
  label: StakeableLabel;
  /** Base type size in px. Drives BOTH the name and the definition. */
  scale?: number;
  /** Highlight the crowned face. */
  crowned?: boolean;
  onSelect?: (label: StakeableLabel) => void;
}

export default function PersonaPrice({ label, scale = 11, crowned = false, onSelect }: PersonaPriceProps) {
  const { skin } = useSkin();
  const accent = crowned ? skin.gold : skin.accent2;
  const interactive = typeof onSelect === "function";

  const body = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: scale, fontWeight: 900, letterSpacing: 1, color: accent, textTransform: "uppercase" }}>
          {label.name}
        </span>
        <span style={{ fontSize: scale * 1.45, fontWeight: 900, color: skin.text, fontVariantNumeric: "tabular-nums" }}>
          {label.price}
        </span>
      </div>
      {/* Same `scale` as the name — bound by construction, not by discipline. */}
      <div style={{ fontSize: scale, fontWeight: 600, lineHeight: 1.45, color: skin.text, marginTop: 4, opacity: 0.85 }}>
        {label.definition}
      </div>
    </>
  );

  const frame: React.CSSProperties = {
    background: skin.card,
    border: `1px solid ${crowned ? `${skin.gold}77` : skin.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontFamily: INSTRUMENT_FONT,
    textAlign: "left",
    width: "100%",
  };

  if (!interactive) return <div style={frame}>{body}</div>;
  return (
    <button type="button" onClick={() => onSelect?.(label)} style={{ ...frame, cursor: "pointer" }}>
      {body}
    </button>
  );
}

/** The five faces of one layer, in codex order. */
export function PersonaPriceRow({
  labels,
  crowned,
  scale = 10,
  onSelect,
}: {
  labels: StakeableLabel[];
  crowned?: string | null;
  scale?: number;
  onSelect?: (label: StakeableLabel) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 8 }}>
      {labels.map((l) => (
        <PersonaPrice key={l.face} label={l} scale={scale} crowned={crowned === l.face} onSelect={onSelect} />
      ))}
    </div>
  );
}
