"use client";

/**
 * MAD Gambit — deck primitives.
 * ══════════════════════════════════════════════════════════════════════
 * The six-card perp deck's anatomy, as components. Every surface in the dApp
 * composes from these rather than restyling by hand, so the instrument
 * language stays one thing instead of six drifting impressions of it.
 *
 * Anatomy of a card, top to bottom:
 *
 *   <InstrumentCard accent="--ac">        ← sets the local --c
 *     <CardHeader sym title kicker live/>  ← symbol · title · kicker · LIVE
 *     <Well>            …instrument…       ← min-height 183px × --dial
 *       <LcdPlate/>                        ← seats INTO the instrument (-26px)
 *     </Well>
 *     <KpiStrip/>                          ← 3-up, margin-top:auto
 *     <TapeStrip/>                         ← labelled plate + tape/canvas
 *     <ChipRow/>                           ← chips + "Open desk ›"
 *   </InstrumentCard>
 *
 * `margin-top:auto` on the KPI strip is load-bearing: wells of unequal height
 * still land their KPI rows, tapes and chip rows on the same baseline across
 * the row. Without it the deck reads as six unrelated cards.
 */
import React from "react";
import {
  ROLE, TYPE, GEO, ENGRAVED, mix, cardSurface, shellSurface, lcdSurface,
  tapeSurface, chipSurface, deckGrid, DECK_KEYFRAMES, type AccentVar,
} from "@/lib/deck-tokens";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

/** Injects the keyframes + focus ring once per surface tree. */
export function DeckStyles() {
  return <style>{DECK_KEYFRAMES}</style>;
}

/* ── Shell ─────────────────────────────────────────────────────────────── */

export function DeckShell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ ...shellSurface(), display: "flex", flexDirection: "column", gap: GEO.gap, ...style }}>
      {children}
    </div>
  );
}

/** The responsive card grid — reflows before it crushes. */
export function DeckGrid({ children, gap = GEO.gap }: { children: React.ReactNode; gap?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: deckGrid(gap), gap }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...TYPE.sectionTitle, color: ROLE.gold, fontFamily: INSTRUMENT_FONT }}>
      {children}
    </div>
  );
}

/* ── Card ──────────────────────────────────────────────────────────────── */

export function InstrumentCard({
  accent, children, onClick, style, minHeight = GEO.cardMinHeight,
}: {
  accent: AccentVar;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  minHeight?: number;
}) {
  return (
    <section
      className={onClick ? "mg-focusable" : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      style={{
        ["--c" as string]: `var(${accent})`,
        display: "flex", flexDirection: "column", minHeight,
        fontFamily: INSTRUMENT_FONT,
        cursor: onClick ? "pointer" : undefined,
        ...cardSurface(),
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function LivePip({ label = "Live" }: { label?: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, ...TYPE.pip, color: ROLE.gold, border: `1px solid ${mix(ROLE.gold, 35)}`, background: mix(ROLE.gold, 8), borderRadius: 6, padding: "3px 6px" }}>
      <i className="mg-pip" style={{ display: "block", width: 4, height: 4, borderRadius: "50%", background: ROLE.gold, animation: "mgPulse 1.6s ease-in-out infinite" }} />
      {label}
    </span>
  );
}

export function CardHeader({
  sym, symGlow, title, kicker, live = true, right,
}: {
  sym?: string; symGlow?: string; title: string; kicker?: string;
  live?: boolean; right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 10 }}>
      {sym ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sym} alt=""
          style={{ width: "var(--sym,26px)", height: "var(--sym,26px)", objectFit: "contain", flex: "none", filter: symGlow ? `drop-shadow(0 0 7px ${symGlow})` : undefined }}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...TYPE.cardTitle, color: ROLE.c, whiteSpace: "nowrap", textShadow: `0 0 10px ${mix(ROLE.c, 45)}` }}>
          {title}
        </div>
        {kicker ? (
          <div style={{ ...TYPE.kicker, color: ROLE.muted, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {kicker}
          </div>
        ) : null}
      </div>
      {right ?? (live ? <LivePip /> : null)}
    </div>
  );
}

/** The instrument well. Centres a canvas dial; stretches for DOM instruments. */
export function Well({
  children, stretch = false, gap = 0,
}: { children: React.ReactNode; stretch?: boolean; gap?: number }) {
  return (
    <div style={{ minHeight: GEO.wellMinHeight, display: "flex", flexDirection: "column", alignItems: stretch ? "stretch" : "center", justifyContent: "center", gap }}>
      {children}
    </div>
  );
}

/**
 * The LCD plate. `margin-top:-26px` is intentional — the plate seats INTO the
 * dial's lower arc, the way a real instrument's readout window does. Rendered
 * below the gauge instead, it reads as a caption and the illusion dies.
 */
export function LcdPlate({
  label, value, unit, band,
}: { label: string; value: React.ReactNode; unit?: string; band?: string }) {
  return (
    <div style={{ marginTop: -26, textAlign: "center", padding: "6px 16px", ...lcdSurface() }}>
      <div style={{ whiteSpace: "nowrap", ...TYPE.lcdLabel, color: "#5a6070" }}>{label}</div>
      <div style={{ whiteSpace: "nowrap", ...TYPE.lcdValue, color: "#fff", marginTop: 2, textShadow: `0 0 18px ${mix(ROLE.c, 55)}` }}>
        {value}{unit ? <span style={{ ...TYPE.lcdUnit, color: ROLE.c }}> {unit}</span> : null}
      </div>
      {band ? <div style={{ whiteSpace: "nowrap", ...TYPE.lcdBand, color: ROLE.c, marginTop: 1 }}>{band}</div> : null}
    </div>
  );
}

/** [label, value, colour] — colours are per-surface literals or ROLE vars. */
export type Kpi = [string, React.ReactNode, string];

export function KpiStrip({ items, columns }: { items: Kpi[]; columns?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns ?? items.length},1fr)`, gap: 8, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${mix(ROLE.text, 7)}` }}>
      {items.map(([label, value, colour]) => (
        <div key={label}>
          <div style={{ ...TYPE.kpiLabel, color: ENGRAVED }}>{label}</div>
          <div style={{ ...TYPE.kpiValue, color: colour, marginTop: 1 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Ticker ────────────────────────────────────────────────────────────── */

/** The labelled plate on the left of a ticker strip. */
export function TapePlate({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <span style={{ flex: "none", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1, padding: "3px 8px", background: mix(ROLE.c, 16), borderRight: `1px solid ${mix(ROLE.c, 30)}` }}>
      <span style={{ whiteSpace: "nowrap", fontSize: 6, fontWeight: 800, letterSpacing: 1.2, color: ROLE.c, textTransform: "uppercase" }}>{label}</span>
      <span style={{ whiteSpace: "nowrap", fontSize: 8, fontWeight: 800, color: ROLE.text, lineHeight: 1 }}>{value}</span>
      <span style={{ whiteSpace: "nowrap", fontSize: 5.5, letterSpacing: 0.8, color: ROLE.muted, textTransform: "uppercase" }}>{sub}</span>
    </span>
  );
}

export function TapeStrip({
  plate, children, onClick, style,
}: {
  plate?: { label: string; value: React.ReactNode; sub: string };
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={onClick ? "mg-focusable" : undefined}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ display: "flex", alignItems: "stretch", width: "100%", marginTop: 9, cursor: onClick ? "pointer" : undefined, ...tapeSurface(), ...style }}
    >
      {plate ? <TapePlate {...plate} /> : null}
      <span style={{ flex: 1, minWidth: 0, display: "block" }}>{children}</span>
    </div>
  );
}

/**
 * A scrolling marquee. The row is duplicated and translated -50%, so the loop
 * is seamless; `--tk` drives duration and direction alternates between cards
 * so a wall of tapes doesn't read as one sliding sheet.
 */
export function Marquee({
  items, dir = "L", size = 9,
}: { items: [React.ReactNode, string][]; dir?: "L" | "R"; size?: number }) {
  return (
    <span style={{ display: "block", overflow: "hidden" }}>
      <span
        className="mg-tape"
        style={{ display: "inline-flex", gap: 15, whiteSpace: "nowrap", padding: "4px 0", animation: `mgTk${dir} var(--tk,30s) linear infinite` }}
      >
        {[...items, ...items].map(([node, colour], i) => (
          <span key={i} style={{ fontSize: size, fontWeight: 800, color: colour }}>{node}</span>
        ))}
      </span>
    </span>
  );
}

/** A canvas tape with its caption and right-hand reading overlaid. */
export function TapeCanvas({
  canvasRef, height = 50, caption, right,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  height?: number; caption?: string; right?: React.ReactNode;
}) {
  return (
    <span style={{ display: "block", position: "relative", height }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height }} aria-hidden="true" />
      {caption ? (
        <span style={{ position: "absolute", left: 7, top: 4, whiteSpace: "nowrap", fontSize: 5.5, fontWeight: 800, letterSpacing: 1, color: mix(ROLE.c, 65), textTransform: "uppercase" }}>
          {caption}
        </span>
      ) : null}
      {right ? (
        <span style={{ position: "absolute", right: 7, bottom: 4, whiteSpace: "nowrap", fontSize: 8, fontWeight: 800, color: ROLE.gold }}>{right}</span>
      ) : null}
    </span>
  );
}

/* ── Chips ─────────────────────────────────────────────────────────────── */

export function ChipRow({ chips, action = "Open desk ›" }: { chips: string[]; action?: string | null }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 9 }}>
      <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {chips.map((chip) => (
          <span key={chip} style={{ flex: "0 0 auto", ...chipSurface() }}>{chip}</span>
        ))}
      </span>
      {action ? (
        <span style={{ marginLeft: "auto", flex: "none", fontSize: 7, fontWeight: 800, letterSpacing: 1, color: ROLE.muted, textTransform: "uppercase" }}>
          {action}
        </span>
      ) : null}
    </div>
  );
}

/** A standalone pill — the footer's canon badges, and any inline stat. */
export function Pill({ children, tone = ROLE.gold }: { children: React.ReactNode; tone?: string }) {
  return (
    <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1, color: tone, textTransform: "uppercase", border: `1px solid ${mix(tone, 34)}`, background: mix(tone, 7), borderRadius: GEO.pillRadius, padding: "4px 10px" }}>
      {children}
    </span>
  );
}
