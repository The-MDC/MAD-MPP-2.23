"use client";

/**
 * MAD Gambit — Tickers & Dials : the perp instrument deck.
 * ────────────────────────────────────────────────────────────────────────
 * Six cards from ONE hardware family. Each card is:
 *   header (symbol · title · kicker · LIVE pip)
 *   → instrument well  (min-height 183px × --dial)
 *   → 3-up KPI strip   (margin-top:auto, so wells of unequal height still
 *                       land their KPI rows on the same baseline)
 *   → live ticker      (bespoke per market)
 *
 * Only the CHROME is shared — every instrument keeps its own geometry, drawn
 * with the primitives in lib/instrument-chrome.ts. Five of the six are canvas
 * dials; Scandal Velocity is a DOM numeral + bar field, because a GARCH σ²
 * reading is a number you read, not an angle you estimate.
 *
 * The whole deck runs on ONE loop (runInstrumentLoop), which paints
 * synchronously on mount before it ever asks for a frame — rAF is suspended
 * in hidden frames, print passes and screenshot captures, and every canvas
 * would otherwise sit unsized and blank at its default 300×150.
 */
import React, { useEffect, useMemo, useState } from "react";
import HoldHint from "@/components/hold-hint";
import { DECK_ID_TO_FAMILY, pendingBook, type PerpFamilyBook } from "@/lib/perp-family-markets";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import SeikoFlipClock from "@/components/seiko-flip-clock";
import {
  fitCanvas, bezel, track, ramp, arc, ticks, needle, hub, runInstrumentLoop,
} from "@/lib/instrument-chrome";

const PI = Math.PI;
const TAU = 6.2832;

const VERDICT_STOPS = ["#7cffc7", "#fbbf24", "#f43f5e", "#ff00f0"];
const GOLD_CHISEL = ["#5c3c04", "#ab7b29", "#efc76d", "#fffcf0"];
const FACES: [string, number][] = [
  ["Saint", 0.31], ["Rice", 0.24], ["Mega", 0.18], ["Narc", 0.15], ["Sell", 0.12],
];

/** Control ranges, persisted alongside the existing `mg_skin` preference. */
const CONTROLS = {
  tk: { key: "mg_ticker_speed", min: 8, max: 70, step: 2, def: 30 },
  sym: { key: "mg_symbol_size", min: 0, max: 44, step: 2, def: 26 },
  dial: { key: "mg_dial_size", min: 60, max: 125, step: 1, def: 100 },
  cols: { key: "mg_cols", min: 2, max: 4, step: 1, def: 3 },
} as const;

/**
 * The mock's client-side drift. Replace with GET /api/v1/perps/:family/reading
 * once that endpoint exists — the shape is one scalar per family.
 */
function liveVals(t: number) {
  const w = (b: number, a: number, f: number, p: number) =>
    b + a * Math.sin(t * f + p) + a * 0.4 * Math.sin(t * f * 2.7 + p * 1.7);
  return {
    scandal: w(44.9, 2.6, 0.00013, 0),
    zliar: w(77, 3.2, 0.00017, 1.1),
    gossip: w(61, 4, 0.00011, 2.3),
    epi: w(77, 2.6, 0.00015, 0.7),
    faces: w(88, 2.1, 0.00012, 1.9),
    zeit: w(69, 2.3, 0.0001, 3.1),
  };
}

/** The five Z-Liar verdict bands, in canon order. */
const zliarBand = (v: number) =>
  v < 20 ? "Straight shooter"
    : v < 38 ? "Mostly candid"
      : v < 60 ? "Slippery"
        : v < 84 ? "Serial embellisher"
          : "Total fabrication";

/* ── Instrument geometries ──────────────────────────────────────────────
   Ported from the design file. Each builds its own shape from the shared
   chrome; none of them is a copy of another. */

/** Z-LIAR — the reference: 180° verdict sweep, 21 ticks, triangular needle. */
function drawDialZliar(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w } = s, k = w / 280, cx = 140 * k, cy = 140 * k, v = liveVals(t).zliar;
  bezel(ctx, cx, cy, 118 * k, PI, 2 * PI, 26 * k);
  track(ctx, cx, cy, 106 * k, PI, 2 * PI, 15 * k);
  arc(ctx, cx, cy, 106 * k, PI, PI + PI * (v / 100), 9 * k,
    ramp(ctx, cx - 106 * k, cx + 106 * k, VERDICT_STOPS), "#f43f5e");
  ticks(ctx, cx, cy, PI, 2 * PI, 21, 100 * k, 92 * k, 86 * k);
  needle(ctx, cx, cy, (v / 100) * PI - PI / 2, 96 * k, 3.5 * k, "#ffe3e8", "#ff5d76", "#c81e3c", false);
  hub(ctx, cx, cy, 14 * k, "#f43f5e");
}

/** GOSSIP-COP — a full ring gauge: closed bezel, ring track, 36 ticks and a
 *  travelling head on the arc. No needle: a long arc has no single moment. */
function drawDialGossip(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.38, v = liveVals(t).gossip;
  bezel(ctx, cx, cy, r + 15, 0, TAU, 11);
  track(ctx, cx, cy, r, 0, TAU, 11);
  const a0 = -PI / 2, a1 = a0 + TAU * (v / 100);
  arc(ctx, cx, cy, r, a0, a1, 9, ramp(ctx, cx - r, cx + r, ["#7e5bef", s.c, s.gd]), s.c);
  ticks(ctx, cx, cy, 0, TAU, 37, r + 9, r + 6, r + 4);
  ctx.fillStyle = s.gd; ctx.shadowBlur = 14; ctx.shadowColor = s.gd;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 3.4, 0, TAU);
  ctx.fill(); ctx.shadowBlur = 0;
}

/** EPIPHANIES — a 270° persistence dial with a blade needle and counterweight,
 *  because a model book reads slowly across a long scale. */
function drawDialEpi(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, cx = w / 2, cy = h * 0.56, r = h * 0.34, v = liveVals(t).epi;
  const a0 = PI * 0.75, sweep = PI * 1.5;
  bezel(ctx, cx, cy, r + 13, a0, a0 + sweep, 20);
  track(ctx, cx, cy, r, a0, a0 + sweep, 12);
  arc(ctx, cx, cy, r, a0, a0 + sweep * (v / 100), 8,
    ramp(ctx, cx - r, cx + r, ["#00727f", s.c, "#b9f2ff"]), s.c);
  ticks(ctx, cx, cy, a0, a0 + sweep, 26, r + 8, r + 3, r - 2);
  needle(ctx, cx, cy, a0 + sweep * (v / 100) + PI / 2, r * 0.92, 2.4, "#eafeff", s.c, "#00727f", true);
  hub(ctx, cx, cy, 9, s.c);
}

/** FIVE FACES — the simplex as five weighted wedges. The pointer crowns the
 *  leading face; the wedges are the traded allocation, not a scale. */
function drawDialFaces(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, cx = w / 2, cy = h * 0.84, r = h * 0.6;
  bezel(ctx, cx, cy, r + 12, PI, 2 * PI, 18);
  track(ctx, cx, cy, r, PI, 2 * PI, 26);
  let a = PI;
  FACES.forEach(([, wgt], i) => {
    const a1 = a + PI * wgt;
    const col = GOLD_CHISEL[Math.min(3, 3 - i)] || GOLD_CHISEL[0];
    ctx.strokeStyle = col;
    ctx.lineWidth = 24; ctx.lineCap = "butt";
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.16 * (4 - i) + 0.08 * Math.sin(t * 0.0012 + i);
    ctx.shadowBlur = 10; ctx.shadowColor = col;
    ctx.beginPath(); ctx.arc(cx, cy, r, a + 0.012, a1 - 0.012); ctx.stroke();
    ctx.restore();
    a = a1;
  });
  ticks(ctx, cx, cy, PI, 2 * PI, 21, r + 8, r + 15, r + 13);
  needle(ctx, cx, cy, PI * 0.155 - PI / 2 + 0.05 * Math.sin(t * 0.0009), r * 0.95, 3.2,
    "#fffcf0", "#efc76d", "#5c3c04", false);
  hub(ctx, cx, cy, 12, s.c);
  ctx.font = `800 7px ${INSTRUMENT_FONT}`; ctx.textAlign = "center";
  let b = PI;
  FACES.forEach(([name, wgt]) => {
    const mid = b + (PI * wgt) / 2; b += PI * wgt;
    ctx.fillStyle = "rgba(230,236,246,.6)";
    ctx.fillText(name.toUpperCase(), cx + Math.cos(mid) * (r - 26), cy + Math.sin(mid) * (r - 26) + 2);
  });
}

/** ZEITGEIST — six legs of one Turning as six sectors; the hand sweeps the
 *  leg in progress and the marching sector is the live one. */
function drawDialZeit(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, cx = w / 2, cy = h * 0.84, r = h * 0.6, v = liveVals(t).zeit;
  bezel(ctx, cx, cy, r + 12, PI, 2 * PI, 18);
  track(ctx, cx, cy, r, PI, 2 * PI, 22);
  for (let i = 0; i < 6; i++) {
    const a0 = PI + (PI / 6) * i + 0.014, a1 = PI + (PI / 6) * (i + 1) - 0.014;
    ctx.lineWidth = 20; ctx.lineCap = "butt";
    if (i < 2) {
      ctx.strokeStyle = s.c; ctx.globalAlpha = 0.85; ctx.shadowBlur = 10; ctx.shadowColor = s.c;
    } else if (i === 2) {
      ctx.strokeStyle = s.gd;
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.002));
      ctx.shadowBlur = 14; ctx.shadowColor = s.gd;
    } else {
      ctx.strokeStyle = "rgba(140,160,180,.16)"; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.font = `800 7px ${INSTRUMENT_FONT}`; ctx.textAlign = "center";
    ctx.fillStyle = i === 2 ? s.gd : "rgba(230,236,246,.45)";
    const mid = (a0 + a1) / 2;
    ctx.fillText("L" + (i + 1), cx + Math.cos(mid) * (r - 22), cy + Math.sin(mid) * (r - 22) + 2);
  }
  ticks(ctx, cx, cy, PI, 2 * PI, 25, r + 8, r + 14, r + 12);
  needle(ctx, cx, cy, (v / 100) * PI - PI / 2, r * 0.95, 3, "#eaffe9", s.c, "#0b5f38", true);
  hub(ctx, cx, cy, 12, s.c);
}

/* ── Bespoke tickers ────────────────────────────────────────────────────── */

/** Z-LIAR tape — the five verdict bands as a spectrum, the reading riding it,
 *  and the BS-index trace rolling underneath. */
function drawZliarTape(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, v = liveVals(t).zliar, yb = h * 0.42;
  ctx.fillStyle = ramp(ctx, 0, w, VERDICT_STOPS);
  ctx.globalAlpha = 0.32; ctx.fillRect(0, yb - 7, w, 14); ctx.globalAlpha = 1;
  for (let i = 1; i < 5; i++) {
    const x = (w / 5) * i;
    ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, yb - 7); ctx.lineTo(x, yb + 7); ctx.stroke();
  }
  const mx = (v / 100) * w;
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.shadowBlur = 12; ctx.shadowColor = "#f43f5e";
  ctx.beginPath(); ctx.moveTo(mx, yb - 11); ctx.lineTo(mx, yb + 11); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.moveTo(mx, yb - 12); ctx.lineTo(mx - 4, yb - 18); ctx.lineTo(mx + 4, yb - 18);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  const off = t * 0.022, base = h * 0.84;
  ctx.beginPath();
  for (let x = 0; x <= w; x++) {
    const u = x + off;
    const y = base - (5 + 3.4 * Math.sin(u * 0.05) + 2.2 * Math.sin(u * 0.017 + 1.4));
    if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = s.c; ctx.lineWidth = 1.2; ctx.shadowBlur = 8; ctx.shadowColor = s.c;
  ctx.stroke(); ctx.shadowBlur = 0;
}

/** GOSSIP-COP — the arc field: every live arc plotted in three axes,
 *  heat × source × leg, on a slowly turning floor. */
function drawGossipField(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, yaw = t * 0.00022;
  const proj = (x: number, y: number, z: number): [number, number, number] => {
    const X = x * Math.cos(yaw) - z * Math.sin(yaw), Z = x * Math.sin(yaw) + z * Math.cos(yaw);
    const k = 1 / (2.05 + Z * 0.5);
    return [w / 2 + X * w * 1.15 * k, h * 0.9 - y * h * 0.78 * k, k];
  };
  ctx.lineWidth = 1;
  ctx.strokeStyle = `color-mix(in srgb, ${s.c} 16%, transparent)`;
  for (let i = 0; i <= 5; i++) {
    const x = (i - 2.5) * 0.3;
    const a = proj(x, 0, -0.6), b = proj(x, 0, 0.6);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  for (let j = 0; j <= 3; j++) {
    const z = (j - 1.5) * 0.4;
    const a = proj(-0.75, 0, z), b = proj(0.75, 0, z);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  const pts: { p: [number, number, number]; heat: number; base: [number, number, number] }[] = [];
  for (let i = 0; i < 12; i++) {
    const leg = i % 6, src = i % 4;
    const heat = 0.3 + 0.55 * Math.abs(Math.sin(i * 1.7 + t * 0.00035 + src));
    pts.push({
      p: proj((leg - 2.5) * 0.3, heat, (src - 1.5) * 0.4),
      heat,
      base: proj((leg - 2.5) * 0.3, 0, (src - 1.5) * 0.4),
    });
  }
  pts.sort((a, b) => a.p[2] - b.p[2]);
  pts.forEach((o) => {
    const g = ctx.createLinearGradient(o.base[0], o.base[1], o.p[0], o.p[1]);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, s.c);
    ctx.strokeStyle = g; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.moveTo(o.base[0], o.base[1]); ctx.lineTo(o.p[0], o.p[1]); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 10; ctx.shadowColor = o.heat > 0.62 ? s.gd : s.c;
    ctx.fillStyle = o.heat > 0.62 ? s.gd : s.c;
    ctx.beginPath(); ctx.arc(o.p[0], o.p[1], 1.2 + 3.2 * o.p[2] * o.heat, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  });
}

/** EPIPHANIES — a seismograph. Deliberately steady: the trace scrolls at a
 *  fixed 26px/s regardless of the deck's ticker speed, because persistence is
 *  a slow reading and a fast one would lie about it. */
function drawSeismic(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, mid = h * 0.56, off = t * 0.026;
  ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1;
  for (let x = -(off % 34); x < w; x += 34) {
    ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x, h - 6); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid);
  ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.stroke();
  const amp = (u: number) => {
    let v = 1.6 * Math.sin(u * 0.055) + 1.1 * Math.sin(u * 0.021 + 1.2) + 0.5 * Math.sin(u * 0.17);
    const q = (((u % 260) + 260) % 260) - 130;
    v += Math.exp(-(q * q) / 90) * 13 * Math.sin(u * 0.9);
    return v;
  };
  ctx.beginPath();
  for (let x = 0; x <= w; x++) {
    const y = mid - amp(x + off);
    if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = s.c; ctx.lineWidth = 1.3; ctx.shadowBlur = 9; ctx.shadowColor = s.c;
  ctx.stroke(); ctx.shadowBlur = 0;
  const yEnd = mid - amp(w + off);
  ctx.fillStyle = s.gd; ctx.shadowBlur = 10; ctx.shadowColor = s.gd;
  ctx.beginPath(); ctx.arc(w - 2, yEnd, 2.1, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
}

/** FIVE FACES — two flowing components, permanent against transitory. When the
 *  gap opens past the band, the tape plots THE DIVERGENCE. */
function drawDivergence(cv: HTMLCanvasElement, t: number) {
  const s = fitCanvas(cv); if (!s) return;
  const { ctx, w, h } = s, ph = t * 0.0011;
  const perm = (x: number) => h * 0.63 + 3.4 * Math.sin(x * 0.028 - ph) + 1.8 * Math.sin(x * 0.011 - ph * 0.6);
  const tran = (x: number) => h * 0.37 - 6.2 * Math.sin(x * 0.021 - ph * 1.25) - 3.1 * Math.sin(x * 0.043 - ph * 0.8);
  ctx.beginPath(); ctx.moveTo(0, perm(0));
  for (let x = 1; x <= w; x++) ctx.lineTo(x, perm(x));
  for (let x = w; x >= 0; x--) ctx.lineTo(x, tran(x));
  ctx.closePath();
  ctx.fillStyle = `color-mix(in srgb, ${s.c} 7%, transparent)`; ctx.fill();
  const stroke = (fn: (x: number) => number, col: string, wd: number) => {
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const y = fn(x);
      if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.shadowBlur = 8; ctx.shadowColor = col;
    ctx.stroke(); ctx.shadowBlur = 0;
  };
  stroke(tran, s.a2, 1.3);
  stroke(perm, s.c, 1.3);
  const cyc = (t % 7000) / 7000;
  if (cyc < 0.62) {
    const mx = 12 + (cyc / 0.62) * (w - 24), gap = perm(mx) - tran(mx);
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = `color-mix(in srgb, ${s.gd} 60%, transparent)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, tran(mx)); ctx.lineTo(mx, perm(mx)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = s.gd; ctx.shadowBlur = 9; ctx.shadowColor = s.gd;
    ctx.beginPath(); ctx.arc(mx, tran(mx), 2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(mx, perm(mx), 2, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = `800 8px ${INSTRUMENT_FONT}`; ctx.fillStyle = s.gd;
    ctx.textAlign = mx > w - 54 ? "right" : "left";
    ctx.fillText("Δ " + (gap / h).toFixed(2), mx > w - 54 ? mx - 5 : mx + 5, h * 0.5 + 3);
  }
}

/* ── Card scaffolding ───────────────────────────────────────────────────── */

type TapeTone = "po" | "c" | "a2" | "gd";

interface CardDef {
  id: string;
  title: string;
  kicker: string;
  /** CSS var the card's local --c resolves to. */
  accent: "--ac" | "--a2" | "--gd" | "--po";
  sym: string;
  symGlow: string;
  /** The DOM LCD plate that sits over the dial. Absent on Scandal, whose
   *  instrument IS the numeral. */
  lcd?: { label: string; unit: string };
  /** [label, value, colour] — colours are per-card literals in the design. */
  kpis: [string, string, string][];
  /** Ticker: the labelled left plate. */
  plate?: { label: string; value: string; sub: string };
  /** Caption printed over the ticker canvas, and the right-hand reading. */
  caption?: string;
  right?: string;
  /** Marquee content, when the card's ticker is not a canvas. */
  tape?: [string, TapeTone][];
  dir?: "L" | "R";
  chips: string[];
}

const TX = "var(--tx,#f0f0f8)";
const PO = "var(--po,#00ff88)";
const AC = "var(--ac,#00e5ff)";
const GD = "var(--gd,#ffd700)";
const C = "var(--c)";

const CARDS: CardDef[] = [
  {
    id: "scandal", title: "Scandal Velocity", kicker: "GARCH(1,1) · epoch 137 · L_θ 1.021",
    accent: "--ac", sym: "/brand/card-scandal.png", symGlow: "rgba(126,91,239,.6)",
    kpis: [["Epoch", "137", TX], ["Heat", "+17", PO], ["Viral", "0.72", C]],
    tape: [["GCAM 88.5 ▲", "po"], ["HEAT +17 ▲", "po"], ["VIRAL 0.72", "c"],
      ["RISK 34 ▼", "a2"], ["DRIFT +4 ▲", "po"], ["CHAOS LIVE", "gd"]],
    dir: "L",
    chips: ["Cross-source pickup", "Chaos fusion", "Freshness"],
  },
  {
    id: "zliar", title: "Z-Liar Meter", kicker: "Narrative credibility · Sentinel",
    accent: "--a2", sym: "/brand/card-zliar.png", symGlow: "rgba(255,0,127,.6)",
    lcd: { label: "Z-Liar score", unit: "ZL" },
    kpis: [["BS Index", "63%", "#f43f5e"], ["GARCH σ²", "0.018", "#58a6ff"], ["Lunar tilt", "+1.7", "#c98aff"]],
    plate: { label: "Verdict", value: "", sub: "5 bands" },
    caption: "Band spectrum · BS-index trace", right: "BS 63%",
    chips: ["BS-index", "Audit log", "Moon tilt"],
  },
  {
    id: "gossip", title: "Gossip-Cop Perp", kicker: "Long-arc claim contest · no expiry",
    accent: "--a2", sym: "/brand/card-gossip.png", symGlow: "rgba(126,91,239,.6)",
    lcd: { label: "Perp probability", unit: "%" },
    kpis: [["Arcs", "12", TX], ["Sources", "4", AC], ["Half-life", "21d", GD]],
    plate: { label: "Arc field", value: "12 arcs", sub: "4 src · 6 legs" },
    caption: "Heat × source × leg", right: "61 ▲",
    chips: ["Tabloid drag", "Source lineage", "Cycle"],
  },
  {
    id: "epi", title: "Perpetual Epiphanies", kicker: "Perpetual mental-model book",
    accent: "--ac", sym: "/brand/card-epi.png", symGlow: "rgba(0,229,255,.6)",
    lcd: { label: "Persistence", unit: "PS" },
    kpis: [["Models", "34", TX], ["Cross", "62", PO], ["Regions", "5", C]],
    plate: { label: "Seismo", value: "34 mdl", sub: "steady trace" },
    caption: "Persistence · 34 models", right: "77 ▲",
    chips: ["Skin in the game", "Hanlon filter", "Jevons"],
  },
  {
    id: "faces", title: "Five Faces", kicker: "Permanent vs transitory mask",
    accent: "--gd", sym: "/brand/card-faces.png", symGlow: "rgba(255,215,0,.6)",
    lcd: { label: "The divergence", unit: "Δ" },
    kpis: [["Crowned", "Saint", C], ["Entropy", ".61", TX], ["τ perm", ".34", AC]],
    caption: "τ perm .34 flowing against τ trans .66",
    chips: ["Crowned face", "Entropy gap", "Waterline"],
  },
  {
    id: "zeit", title: "Zeitgeist", kicker: "Succession slate and turning",
    accent: "--po", sym: "/brand/card-zeit.png", symGlow: "rgba(0,255,136,.6)",
    lcd: { label: "Turning", unit: "%" },
    kpis: [["Leg", "3 / 6", TX], ["Slate", "03", AC], ["T-minus", "4d", GD]],
    tape: [["PROGRESSION 0.61 ▲", "po"], ["SUCCESSION 03", "c"], ["TURNING L3/6", "gd"],
      ["SLATE LOCKED", "c"], ["T-MINUS 4d", "a2"], ["DRIFT +2 ▲", "po"]],
    dir: "R",
    chips: ["Burnout race", "Vintage leg", "Lineage"],
  },
];

const TAPE_COLOR: Record<TapeTone, string> = { po: PO, c: C, a2: "var(--a2,#ff007f)", gd: GD };

interface NavEntry {
  label: string; sub: string; title: string; href: string;
  color: string; border: string;
  /** Class symbol, or the generated mesh orb for Octavian. */
  sym?: string; orb?: boolean;
}

/** The four class entries in the deck header. */
const NAV: NavEntry[] = [
  { label: "Prediction", sub: "Open markets ›", title: "Open markets · create a market", href: "/preview#markets", sym: "/brand/sym-prediction.png", color: "#c6cbd6", border: "color-mix(in srgb, var(--tx,#f0f0f8) 14%, transparent)" },
  { label: "Conviction", sub: "All markets ›", title: "All markets", href: "/preview#conviction", sym: "/brand/sym-conviction.png", color: GD, border: "color-mix(in srgb, var(--gd,#ffd700) 30%, transparent)" },
  { label: "Affliction", sub: "MADHATs game ›", title: "MADHATs Gambit card game", href: "/preview#affliction", sym: "/brand/sym-affliction.png", color: "#b79cff", border: "rgba(126,91,239,.4)" },
  { label: "Octavian", sub: "Node mesh ›", title: "Octavian · self-sustaining mesh", href: "/octavian", orb: true, color: AC, border: "color-mix(in srgb, var(--ac,#00e5ff) 38%, transparent)" },
];

/** Scandal's second lane — the dual-lane metric tape. */
const SCANDAL_LANE2 = ["Cross-source pickup", "Chaos fusion", "Freshness half-life", "Faction drift"];

/** The five simplex weights, drawn as the waterline strip above Five Faces'
 *  ticker — same allocation the dial's wedges show. */
const WATERLINE: [number, string][] = [
  [31, `color-mix(in srgb, ${GD} 78%, transparent)`],
  [24, "color-mix(in srgb, var(--c) 62%, transparent)"],
  [18, "color-mix(in srgb, var(--a2,#ff007f) 75%, transparent)"],
  [15, `color-mix(in srgb, ${AC} 70%, transparent)`],
  [12, `color-mix(in srgb, ${TX} 32%, transparent)`],
];

/** Reads a persisted control, clamped to its range. */
function useControl(cfg: { key: string; min: number; max: number; def: number }) {
  const [v, setV] = useState(cfg.def);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cfg.key);
      if (raw !== null) {
        const n = Number(raw);
        if (Number.isFinite(n)) setV(Math.min(cfg.max, Math.max(cfg.min, n)));
      }
    } catch { /* ignore */ }
  }, [cfg.key, cfg.min, cfg.max]);
  const set = (n: number) => {
    setV(n);
    try { localStorage.setItem(cfg.key, String(n)); } catch { /* ignore */ }
  };
  return [v, set] as const;
}

function Slider({
  label, value, onChange, cfg, accent, readout,
}: {
  label: string; value: number; onChange: (n: number) => void;
  cfg: { min: number; max: number; step: number }; accent: string; readout: string;
}) {
  return (
    <label title={label} style={{ flex: "1 1 150px", minWidth: 120, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ flex: "none", whiteSpace: "nowrap", fontSize: 6.5, fontWeight: 800, letterSpacing: 1.2, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>
        {label}
      </span>
      <input
        type="range"
        min={cfg.min} max={cfg.max} step={cfg.step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: 48, height: 18, accentColor: accent, background: "transparent", cursor: "pointer" }}
      />
      <span style={{ flex: "none", whiteSpace: "nowrap", textAlign: "right", fontSize: 8, fontWeight: 800, color: accent, minWidth: 28 }}>
        {readout}
      </span>
    </label>
  );
}


/**
 * Every market in one perp family, opened by tapping that card's instrument or
 * its ticker — the same gesture the Z-Liar gauge already answers to.
 *
 * A signal-only family renders the reason instead of a list. Three of the six
 * families have no perp book (market-view.ts: "The other three are
 * signal-only"), and inventing rows so all six cards behave identically would
 * make the deck assert positions the platform cannot take.
 */
function PerpBookDialog({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  // Starts as the pending shell, then fills from the scrape. Signal-only
  // families never fetch — their answer is a statement, not a list.
  const [book, setBook] = React.useState<PerpFamilyBook | null>(() => pendingBook(deckId));

  React.useEffect(() => {
    const family = DECK_ID_TO_FAMILY[deckId];
    if (!family) return;
    let alive = true;
    fetch(`/api/v1/perps/family?family=${encodeURIComponent(family)}&limit=8`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.success) return;
        setBook({
          family: d.family, label: d.label, tradeable: d.tradeable,
          source: d.source, markets: d.markets ?? [], note: d.note ?? "",
        });
      })
      .catch(() => {/* keep the pending shell; the note already says so */});
    return () => { alive = false; };
  }, [deckId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!book) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`${book.label} — all markets`}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(3,4,10,.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(460px,94vw)", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "var(--bg,#080a12)", border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 12%, transparent)", borderRadius: 16, padding: 16, boxShadow: "0 18px 60px rgba(0,0,0,.55)" }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 900, letterSpacing: 2, color: TX, textTransform: "uppercase" }}>{book.label}</span>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{ flex: "none", width: 26, height: 26, borderRadius: 8, border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 14%, transparent)", background: "transparent", color: "var(--mu,#6b7280)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
          >×</button>
        </div>
        <div style={{ fontSize: 7, letterSpacing: 1.2, color: "var(--mu,#6b7280)", textTransform: "uppercase", marginBottom: 12 }}>
          {book.source === "live" ? "From the latest scrape" : book.source === "demo" ? "Demo signals · real classifier" : "Signal-only"}
        </div>

        {book.tradeable ? (
          <>
            <div style={{ fontSize: 8, color: "var(--mu,#6b7280)", marginBottom: 9 }}>{book.note}</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {book.markets.length === 0 ? (
                <div style={{ fontSize: 10, color: "var(--mu,#6b7280)", padding: "10px 0" }}>
                  Nothing in this family yet — the note above says why.
                </div>
              ) : null}
              {book.markets.map((m) => (
                <div key={m.id} style={{ border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 9%, transparent)", background: "var(--cd,#111520)", borderRadius: 10, padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: TX, textTransform: "uppercase" }}>{m.subject}</span>
                    <span style={{ flex: "none", fontSize: 12, fontWeight: 900, color: C }}>{Math.round(m.reading * 100)}%</span>
                  </div>
                  {/* The satirical one-liner leads; the headline it rewrites sits
                      under it. A rewrite shown without its source is the
                      attribution problem the ticker already had. */}
                  <div style={{ fontSize: 9.5, fontStyle: "italic", color: TX, margin: "3px 0 2px" }}>{m.oneLiner ?? m.subject}</div>
                  {m.realHeadline ? (
                    <div style={{ fontSize: 7.5, color: "var(--mu,#6b7280)", margin: "0 0 7px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ color: GD }}>satire</span> · {m.realHeadline}
                    </div>
                  ) : <div style={{ height: 5 }} />}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ flex: 1, textAlign: "center", borderRadius: 6, padding: "3px 0", fontSize: 8.5, fontWeight: 800, color: PO, background: "color-mix(in srgb, var(--po,#00ff88) 12%, transparent)" }}>LONG {m.longOdds}x</span>
                    <span style={{ flex: 1, textAlign: "center", borderRadius: 6, padding: "3px 0", fontSize: 8.5, fontWeight: 800, color: "var(--a2,#ff007f)", background: "color-mix(in srgb, var(--a2,#ff007f) 12%, transparent)" }}>SHORT {m.shortOdds}x</span>
                    <span style={{ flex: "none", fontSize: 7, letterSpacing: 0.8, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>{m.legDays}d leg · {m.horizonDays}d horizon</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ border: "1px solid color-mix(in srgb, var(--gd,#ffd700) 24%, transparent)", background: "color-mix(in srgb, var(--gd,#ffd700) 6%, transparent)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.4, color: GD, textTransform: "uppercase", marginBottom: 6 }}>Signal-only</div>
            <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: "var(--mu,#6b7280)" }}>{book.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerpDials({
  showInstrument = true,
}: {
  /**
   * Whether to render the instrument cluster + split-flap chrono at the foot
   * of the deck.
   *
   * Defaults to true, so /preview — where this deck is the ONLY carrier of the
   * instrument — is unaffected. A page that already shows the instrument
   * elsewhere (e.g. /mpp2.23, where SeikoDopamineHub carries it) passes false,
   * so the page ends up with one instrument instead of two. Nothing is deleted
   * either way: this is a mount-site switch, and flipping it back restores the
   * deck's own instrument immediately.
   */
  showInstrument?: boolean;
} = {}) {
  const { skin, toggle, name } = useSkin();
  // Which family's book is open, by DECK card id (not the canonical family
  // key — see DECK_ID_TO_FAMILY in lib/perp-family-markets.ts).
  const [openBook, setOpenBook] = React.useState<string | null>(null);

  const [tk, setTk] = useControl(CONTROLS.tk);
  const [sym, setSym] = useControl(CONTROLS.sym);
  const [dial, setDial] = useControl(CONTROLS.dial);
  const [cols, setCols] = useControl(CONTROLS.cols);

  // One ref per canvas, stable across renders.
  const refs = useMemo(() => ({
    dZliar: React.createRef<HTMLCanvasElement>(),
    dGossip: React.createRef<HTMLCanvasElement>(),
    dEpi: React.createRef<HTMLCanvasElement>(),
    dFaces: React.createRef<HTMLCanvasElement>(),
    dZeit: React.createRef<HTMLCanvasElement>(),
    zTape: React.createRef<HTMLCanvasElement>(),
    gossip: React.createRef<HTMLCanvasElement>(),
    epi: React.createRef<HTMLCanvasElement>(),
    faces: React.createRef<HTMLCanvasElement>(),
  }), []);

  // ONE loop for the whole deck. Paints synchronously before the first frame,
  // so a hidden frame / print pass / screenshot still gets real instruments.
  useEffect(() => runInstrumentLoop(() => [
    [refs.dZliar, drawDialZliar],
    [refs.dGossip, drawDialGossip],
    [refs.dEpi, drawDialEpi],
    [refs.dFaces, drawDialFaces],
    [refs.dZeit, drawDialZeit],
    [refs.zTape, drawZliarTape],
    [refs.gossip, drawGossipField],
    [refs.epi, drawSeismic],
    [refs.faces, drawDivergence],
  ]), [refs]);

  // The LCD plates read live. Ticked at 10Hz rather than per-frame: the plate
  // is a numeral you read, and re-rendering the tree at 60fps to animate six
  // digits would cost far more than it shows.
  const [lcd, setLcd] = useState(() => liveVals(0));
  useEffect(() => {
    const t0 = performance.now();
    const id = window.setInterval(() => setLcd(liveVals(performance.now() - t0)), 100);
    return () => clearInterval(id);
  }, []);

  const [scandal, setScandal] = useState("44.9");
  useEffect(() => {
    // Keep the existing proposals fetch: the headline reading comes from the
    // live book when it is available, and drifts locally when it is not.
    let alive = true;
    fetch("/api/v1/markets/proposals?limit=60")
      .then((r) => r.json())
      .then((d: { success?: boolean; proposals?: { perpProbability: number }[] }) => {
        if (!alive || !d?.success || !d.proposals?.length) return;
        const top = Math.max(...d.proposals.map((p) => p.perpProbability || 0));
        if (Number.isFinite(top) && top > 0) setScandal((top * 100).toFixed(1));
      })
      .catch(() => { /* drift stands */ });
    return () => { alive = false; };
  }, []);

  /** Live LCD reading + band, per card. */
  const reading = (id: string) => {
    switch (id) {
      case "zliar": return Math.round(lcd.zliar);
      case "gossip": return Math.round(lcd.gossip);
      case "epi": return Math.round(lcd.epi);
      case "faces": return Math.round(lcd.faces);
      case "zeit": return Math.round(lcd.zeit);
      default: return "";
    }
  };
  const band = (id: string) => {
    switch (id) {
      case "zliar": return zliarBand(lcd.zliar);
      case "gossip": return "12 live arcs";
      case "epi": return "34 models";
      case "faces": return "Crowned Saint";
      case "zeit": return "Leg 3 of 6 · T−4d";
      default: return "";
    }
  };

  const wrapVars = {
    "--bg": skin.bg, "--pn": skin.panel, "--cd": skin.card, "--tx": skin.text,
    "--mu": skin.muted, "--ac": skin.accent, "--a2": skin.accent2,
    "--gd": skin.gold, "--po": skin.positive,
    "--tk": `${tk}s`, "--sym": `${sym}px`, "--dial": dial / 100, "--cols": cols,
  } as React.CSSProperties;

  const dialRef = (id: string) => {
    switch (id) {
      case "zliar": return refs.dZliar;
      case "gossip": return refs.dGossip;
      case "epi": return refs.dEpi;
      case "faces": return refs.dFaces;
      case "zeit": return refs.dZeit;
      default: return undefined;
    }
  };

  const tickerCanvas = (id: string) => {
    switch (id) {
      case "zliar": return refs.zTape;
      case "gossip": return refs.gossip;
      case "epi": return refs.epi;
      case "faces": return refs.faces;
      default: return null;
    }
  };

  return (
    <div style={{ ...wrapVars, display: "flex", flexDirection: "column", gap: 12, fontFamily: INSTRUMENT_FONT }}>
      <style>{`
        @keyframes mgTkL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes mgTkR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes mgPulse { 0%,100% { opacity:.35; transform: scale(1); } 50% { opacity:1; transform: scale(1.35); } }
        @keyframes mgBar { 0%,100% { transform: scaleY(.72); } 50% { transform: scaleY(1); } }
        @keyframes mgSeg { 0%,100% { opacity:.55; } 50% { opacity:1; } }

        /* Hover + focus on the two controls each card now carries.
           The deck had no hover state at all — six instruments and six live
           tickers, none of which gave any sign they could be interacted with.
           Both cues are drawn from the card's own accent (--c), so each family
           highlights in its own colour rather than in one borrowed grey. */
        .mg-perp-well, .mg-perp-tape { transition: background .16s ease, box-shadow .16s ease, filter .16s ease; }
        .mg-perp-well:hover { filter: brightness(1.07); }
        .mg-perp-tape:hover { background: color-mix(in srgb, var(--c) 12%, transparent); }
        .mg-perp-well:focus-visible, .mg-perp-tape:focus-visible {
          outline: 2px solid var(--c); outline-offset: 2px;
        }
        /* The instrument is a canvas, so it cannot carry its own affordance —
           a ring on the well says "this whole panel is the control". */
        .mg-perp-well:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 30%, transparent); border-radius: 12px; }
        @media (prefers-reduced-motion: reduce) {
          .mg-perp-well, .mg-perp-tape { transition: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mg-tape, .mg-pip, .mg-bar, .mg-seg { animation: none !important; }
        }
      `}</style>

      {/* Deck header — brand mark, canon line, and the four class entries. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/madhat-hat.png" alt="MAD HAT'r"
            style={{ width: 46, height: 46, objectFit: "contain", filter: "drop-shadow(0 0 12px color-mix(in srgb, var(--a2,#ff007f) 45%, transparent))" }}
          />
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2.4, color: GD, textTransform: "uppercase", textShadow: "0 0 14px color-mix(in srgb, var(--gd,#ffd700) 35%, transparent)" }}>
              MAD Gambit
            </span>
            <span style={{ fontSize: 8, letterSpacing: 1.4, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>
              Instrument deck · platform fee 1.88% · community 28.8%
            </span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {NAV.map((n) => (
            <a
              key={n.label} href={n.href} title={n.title}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", border: `1px solid ${n.border}`, borderRadius: 10, background: "var(--pn,#0d1018)", cursor: "pointer", textDecoration: "none" }}
            >
              {n.orb ? (
                <span style={{ display: "block", width: "var(--sym,26px)", height: "var(--sym,26px)", borderRadius: "50%", background: "radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--ac,#00e5ff) 85%, transparent), transparent 62%), radial-gradient(circle at 70% 74%, color-mix(in srgb, var(--a2,#ff007f) 70%, transparent), transparent 60%)", border: "1px solid color-mix(in srgb, var(--ac,#00e5ff) 45%, transparent)", boxShadow: "0 0 12px color-mix(in srgb, var(--ac,#00e5ff) 35%, transparent)" }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.sym} alt="" style={{ width: "var(--sym,26px)", height: "var(--sym,26px)", objectFit: "contain" }} />
              )}
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                <span style={{ whiteSpace: "nowrap", fontSize: 8, fontWeight: 800, letterSpacing: 1.6, color: n.color, textTransform: "uppercase" }}>{n.label}</span>
                <span style={{ whiteSpace: "nowrap", fontSize: 6, letterSpacing: 1, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>{n.sub}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div
        title="Tap a ticker for its mini report · tap a card for the perp desk"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "6px 9px", border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 9%, transparent)", borderRadius: 14, background: "linear-gradient(180deg, var(--pn,#0d1018), var(--bg,#080a12))", boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--tx,#f0f0f8) 6%, transparent)" }}
      >
        <button
          type="button" onClick={toggle} title="Switch skin"
          style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 5px", borderRadius: 99, border: "1px solid color-mix(in srgb, var(--ac,#00e5ff) 45%, transparent)", background: "color-mix(in srgb, var(--ac,#00e5ff) 8%, transparent)", cursor: "pointer", color: TX, whiteSpace: "nowrap" }}
        >
          <span style={{ display: "block", width: 26, height: 14, borderRadius: 99, background: "color-mix(in srgb, var(--tx,#f0f0f8) 14%, transparent)", position: "relative" }}>
            <i style={{ display: "block", position: "absolute", top: 2, left: name === "neonNoir" ? 2 : 14, width: 10, height: 10, borderRadius: "50%", background: GD, transition: "left .2s ease" }} />
          </span>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
            {name === "neonNoir" ? "Neon Noir" : "Gilded"}
          </span>
        </button>

        <Slider label="SPD" value={tk} onChange={setTk} cfg={CONTROLS.tk} accent={AC} readout={`${tk}s`} />
        <Slider label="SYM" value={sym} onChange={setSym} cfg={CONTROLS.sym} accent={GD} readout={`${sym}px`} />
        <Slider label="DIAL" value={dial} onChange={setDial} cfg={CONTROLS.dial} accent="var(--a2,#ff007f)" readout={`${dial}%`} />

        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ whiteSpace: "nowrap", fontSize: 6.5, fontWeight: 800, letterSpacing: 1.2, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>Cols</span>
          <div style={{ display: "flex", border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 12%, transparent)", borderRadius: 99, overflow: "hidden" }}>
            {[2, 3, 4].map((n) => (
              <button
                key={n} type="button" onClick={() => setCols(n)} aria-pressed={cols === n}
                style={{ fontSize: 8, fontWeight: 800, padding: "3px 9px", cursor: "pointer", border: 0, color: cols === n ? "var(--bg,#080a12)" : "var(--mu,#6b7280)", background: cols === n ? AC : "transparent" }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deck shell */}
      <div style={{ background: "linear-gradient(180deg, var(--pn,#0d1018), var(--bg,#080a12))", border: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 8%, transparent)", borderRadius: 24, padding: "clamp(10px, 1.4vw, 16px)", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 0 0 1px color-mix(in srgb, var(--gd,#ffd700) 13%, transparent), 0 0 44px color-mix(in srgb, var(--ac,#00e5ff) 7%, transparent)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(max(238px, calc((100% - (var(--cols,3) - 1) * 14px) / var(--cols,3))), 1fr))",
          gap: 14,
        }}
      >
        {CARDS.map((card) => {
          const tCanvas = tickerCanvas(card.id);
          // The shell only — the real list comes from the scrape when the
          // dialog opens. Enough to word the hint and the aria-label.
          const book = pendingBook(card.id);
          const openThis = () => setOpenBook(card.id);
          // Shared by the instrument and the ticker: both open the same book,
          // because to a reader they are two views of one family.
          const cardHint = book
            ? {
                title: book.label,
                kind: book.tradeable ? ("measured" as const) : undefined,
                body: book.tradeable
                  ? "Tap for every market in this family, straight from the latest scrape — each one classified by the same engine and carrying its satirical one-liner. Readings from GARCH(1,1); legs paced by the lunar phase multiplier."
                  : book.note,
                action: { label: book.tradeable ? "Open all markets" : "What this means", onSelect: openThis },
              }
            : undefined;
          return (
            <section
              key={card.id}
              style={{
                ["--c" as string]: `var(${card.accent})`,
                display: "flex", flexDirection: "column", minHeight: 378,
                background: "linear-gradient(145deg, var(--pn,#0d1018), var(--cd,#111520))",
                border: "1px solid color-mix(in srgb, var(--c) 42%, transparent)",
                borderRadius: 18, padding: 12,
                boxShadow: "0 0 0 1px color-mix(in srgb, var(--tx,#f0f0f8) 6%, transparent), 0 0 26px color-mix(in srgb, var(--c) 10%, transparent)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.sym} alt=""
                  style={{ width: "var(--sym,26px)", height: "var(--sym,26px)", objectFit: "contain", flex: "none", filter: `drop-shadow(0 0 7px ${card.symGlow})` }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, color: "var(--c)", textTransform: "uppercase", whiteSpace: "nowrap", textShadow: "0 0 10px color-mix(in srgb, var(--c) 45%, transparent)" }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 6.5, letterSpacing: 0.9, color: "var(--mu,#6b7280)", textTransform: "uppercase", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {card.kicker}
                  </div>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 7, fontWeight: 800, letterSpacing: 1, color: "var(--gd,#ffd700)", border: "1px solid color-mix(in srgb, var(--gd,#ffd700) 35%, transparent)", background: "color-mix(in srgb, var(--gd,#ffd700) 8%, transparent)", borderRadius: 6, padding: "3px 6px" }}>
                  <i className="mg-pip" style={{ display: "block", width: 4, height: 4, borderRadius: "50%", background: "var(--gd,#ffd700)", animation: "mgPulse 1.6s ease-in-out infinite" }} />
                  LIVE
                </span>
              </div>

              {/* Instrument well — now a control.
                  Every card in this deck was inert: no onClick, no href, no
                  hover state anywhere on the six instruments. The Z-Liar gauge
                  on its own panel opens that family's markets on tap, and there
                  was no reason the other five should behave differently. */}
              <HoldHint hint={cardHint}>
              <div
                className="mg-perp-well"
                role="button"
                tabIndex={0}
                aria-label={book ? `${book.label} — open all markets` : undefined}
                onClick={openThis}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThis(); } }}
                style={{ minHeight: "calc(183px * var(--dial, 1))", display: "flex", flexDirection: "column", alignItems: card.id === "scandal" ? "stretch" : "center", justifyContent: "center", gap: card.id === "scandal" ? 9 : 0, cursor: "pointer" }}
              >
                {card.id === "scandal" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                      <div style={{ flex: "none" }}>
                        <div style={{ fontSize: 7, letterSpacing: 1.2, color: "#565d6b", textTransform: "uppercase" }}>
                          GARCH σ² × 10⁴
                        </div>
                        <div style={{ fontSize: "calc(40px * var(--dial,1))", fontWeight: 800, lineHeight: 1, color: "#8b93a7", letterSpacing: "-.015em", marginTop: 1 }}>
                          {scandal}
                        </div>
                        <div style={{ fontSize: 8.5, color: "var(--mu,#6b7280)", marginTop: 4 }}>Market resting</div>
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 1, height: 52 }}>
                        {[16, 24, 19, 31, 27, 38, 22, 33, 41, 29, 36, 44, 30, 48].map((bh, i, a) => (
                          <div
                            key={i} className="mg-bar"
                            style={{ flex: 1, height: bh, background: i === a.length - 1 ? "#8b93a7" : "rgba(139,147,167,.35)", transformOrigin: "bottom", animation: `mgBar 2.4s ease-in-out ${i * 0.1}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ height: 7, borderRadius: 99, background: "#0a0c12", border: "1px solid rgba(255,255,255,.05)", overflow: "hidden", boxShadow: "inset 0 0 5px #000" }}>
                        <div style={{ width: "64%", height: "100%", borderRadius: 99, background: "linear-gradient(to right, var(--c), #475569)", boxShadow: "0 0 10px rgba(71,85,105,.6)" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6.5, color: "#3f4653", marginTop: 3, letterSpacing: 0.6 }}>
                        <span>QUIET</span><span>WARMING</span><span>ACTIVE</span><span>HOT</span><span>PEAK</span>
                      </div>
                    </div>
                    <div style={{ border: "1px solid rgba(71,85,105,.5)", background: "rgba(71,85,105,.08)", borderRadius: 9, padding: "6px 9px", fontSize: 9, fontWeight: 700, color: "#94a0b4", letterSpacing: 0.4 }}>
                      Monitor for entry
                    </div>
                  </>
                ) : (
                  <>
                    <canvas
                      ref={dialRef(card.id)} aria-hidden="true"
                      style={{ display: "block", flex: "none", width: "100%", maxWidth: "calc(252px * var(--dial,1))", height: "auto", aspectRatio: "280 / 168" }}
                    />
                    {/* The LCD plate. Overlaps the dial by 26px — it sits IN
                        the instrument, not under it. */}
                    {card.lcd ? (
                      <div style={{ marginTop: -26, textAlign: "center", padding: "6px 16px", borderRadius: 12, background: "linear-gradient(180deg,rgba(0,0,0,.9),rgba(8,10,16,.9))", border: "1px solid rgba(120,130,160,.14)", boxShadow: "inset 0 2px 10px rgba(0,0,0,.8), 0 0 24px color-mix(in srgb, var(--c) 18%, transparent)" }}>
                        <div style={{ whiteSpace: "nowrap", fontSize: 6.5, letterSpacing: 2.4, color: "#5a6070", textTransform: "uppercase" }}>{card.lcd.label}</div>
                        <div style={{ whiteSpace: "nowrap", fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1, marginTop: 2, textShadow: "0 0 18px color-mix(in srgb, var(--c) 55%, transparent)" }}>
                          {reading(card.id)} <span style={{ fontSize: 11, color: C }}>{card.lcd.unit}</span>
                        </div>
                        <div style={{ whiteSpace: "nowrap", fontSize: 6.5, letterSpacing: 1.6, color: C, textTransform: "uppercase", marginTop: 1 }}>{band(card.id)}</div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              </HoldHint>

              {/* 3-up KPI strip — margin-top:auto keeps every card's row aligned */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: "1px solid color-mix(in srgb, var(--tx,#f0f0f8) 7%, transparent)" }}>
                {card.kpis.map(([label, value, colour]) => (
                  <div key={label}>
                    <div style={{ fontSize: 6.5, letterSpacing: 1, color: "#565d6b", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: colour, marginTop: 1 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Live ticker — bespoke per market, in the shared strip chrome.
                  Also a control, and pointed at the same book as the instrument
                  above it: a reader who taps the tape is asking about the same
                  family as a reader who taps the dial. */}
              <div
                className="mg-perp-tape"
                role="button"
                tabIndex={0}
                aria-label={book ? `${book.label} — open all markets` : undefined}
                onClick={openThis}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThis(); } }}
                style={{ display: "flex", alignItems: "stretch", width: "100%", marginTop: 9, borderTop: "1px solid color-mix(in srgb, var(--c) 24%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--c) 16%, transparent)", background: "color-mix(in srgb, var(--c) 5%, transparent)", overflow: "hidden", cursor: "pointer" }}
              >
                {card.plate ? (
                  <span style={{ flex: "none", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1, padding: "3px 8px", background: "color-mix(in srgb, var(--c) 16%, transparent)", borderRight: "1px solid color-mix(in srgb, var(--c) 30%, transparent)" }}>
                    <span style={{ whiteSpace: "nowrap", fontSize: 6, fontWeight: 800, letterSpacing: 1.2, color: C, textTransform: "uppercase" }}>{card.plate.label}</span>
                    <span style={{ whiteSpace: "nowrap", fontSize: 8, fontWeight: 800, color: TX, lineHeight: 1 }}>
                      {card.plate.value || `${Math.round(lcd.zliar)} ZL`}
                    </span>
                    <span style={{ whiteSpace: "nowrap", fontSize: 5.5, letterSpacing: 0.8, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>{card.plate.sub}</span>
                  </span>
                ) : null}

                <span style={{ flex: 1, minWidth: 0, display: "block" }}>
                  {card.id === "faces" ? (
                    <span style={{ display: "flex", height: 6, width: "100%" }}>
                      {WATERLINE.map(([f, bg], i) => (
                        <span key={i} className="mg-seg" style={{ flex: f, background: bg, animation: `mgSeg 3.4s ease-in-out ${i * 0.3}s infinite` }} />
                      ))}
                    </span>
                  ) : null}

                  {card.id === "zeit" ? (
                    /* Zeitgeist reads as a schedule, not a tape: progression
                       bars, the succession slate, and the turning gauge. */
                    <span style={{ display: "flex", flexDirection: "column", gap: 3, padding: "5px 7px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ flex: "none", width: 52, fontSize: 5.5, fontWeight: 800, letterSpacing: 0.8, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>Progression</span>
                        {[1, 2, 3, 4, 5, 6].map((leg) => (
                          <span
                            key={leg}
                            className={leg === 3 ? "mg-seg" : undefined}
                            style={{
                              flex: 1, height: 7, borderRadius: 2,
                              border: `1px solid color-mix(in srgb, ${PO} 30%, transparent)`,
                              background: leg < 3 ? PO
                                : leg === 3 ? `repeating-linear-gradient(90deg, ${GD} 0 4px, transparent 4px 8px)`
                                  : "transparent",
                              animation: leg === 3 ? "mgSeg 2.2s ease-in-out infinite" : undefined,
                            }}
                          />
                        ))}
                        <span style={{ flex: "none", fontSize: 6, fontWeight: 800, color: GD, whiteSpace: "nowrap" }}>T-4D</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ flex: "none", width: 52, fontSize: 5.5, fontWeight: 800, letterSpacing: 0.8, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>Succession</span>
                        {["01", "02", "03", "04"].map((slot) => (
                          <span
                            key={slot}
                            style={{
                              flex: 1, textAlign: "center", fontSize: 6, fontWeight: 800, padding: "1px 0", borderRadius: 3,
                              color: slot === "03" ? "var(--bg,#080a12)" : "var(--mu,#6b7280)",
                              background: slot === "03" ? PO : "transparent",
                              border: `1px solid color-mix(in srgb, ${PO} ${slot === "03" ? 60 : 22}%, transparent)`,
                            }}
                          >
                            {slot}
                          </span>
                        ))}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ flex: "none", fontSize: 10, lineHeight: 1, color: GD }}>◗</span>
                        <span style={{ flex: 1, height: 5, borderRadius: 99, background: "color-mix(in srgb, var(--tx,#f0f0f8) 10%, transparent)", overflow: "hidden" }}>
                          <span style={{ display: "block", width: `${Math.round(lcd.zeit)}%`, height: "100%", borderRadius: 99, background: `linear-gradient(to right, ${PO}, ${GD})`, transition: "width .6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                        </span>
                        <span style={{ flex: "none", fontSize: 7, fontWeight: 800, color: PO, whiteSpace: "nowrap" }}>
                          TURNING {Math.round(lcd.zeit)}%
                        </span>
                      </span>
                    </span>
                  ) : tCanvas ? (
                    <span style={{ display: "block", position: "relative", height: card.id === "faces" ? 46 : 50 }}>
                      <canvas ref={tCanvas} style={{ display: "block", width: "100%", height: card.id === "faces" ? 46 : 50 }} aria-hidden="true" />
                      {card.caption ? (
                        <span style={{ position: "absolute", left: 7, top: card.id === "faces" ? 3 : 4, whiteSpace: "nowrap", fontSize: 5.5, fontWeight: 800, letterSpacing: 1, color: "color-mix(in srgb, var(--c) 65%, transparent)", textTransform: "uppercase" }}>
                          {card.caption}
                        </span>
                      ) : null}
                      {card.right ? (
                        <span style={{ position: "absolute", right: 7, bottom: 4, whiteSpace: "nowrap", fontSize: 8, fontWeight: 800, color: GD }}>{card.right}</span>
                      ) : null}
                    </span>
                  ) : (
                    <span style={{ display: "block", overflow: "hidden" }}>
                      <span
                        className="mg-tape"
                        style={{ display: "inline-flex", gap: 15, whiteSpace: "nowrap", padding: "4px 0", animation: `mgTk${card.dir ?? "L"} var(--tk,30s) linear infinite` }}
                      >
                        {[...(card.tape ?? []), ...(card.tape ?? [])].map(([text, tone], i) => (
                          <span key={i} style={{ fontSize: 9, fontWeight: 800, color: TAPE_COLOR[tone] }}>{text}</span>
                        ))}
                      </span>
                      {/* Scandal is a DUAL-lane tape: metrics above, the
                          qualitative lane running the other way beneath. */}
                      {card.id === "scandal" ? (
                        <span
                          className="mg-tape"
                          style={{ display: "inline-flex", gap: 15, whiteSpace: "nowrap", padding: "0 0 4px", animation: "mgTkR var(--tk,30s) linear infinite" }}
                        >
                          {[...SCANDAL_LANE2, ...SCANDAL_LANE2].map((text, i) => (
                            <span key={i} style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.8, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>{text}</span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  )}
                </span>
              </div>

              {/* Chip row */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 9 }}>
                <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {card.chips.map((chip) => (
                    <span key={chip} style={{ flex: "0 0 auto", fontSize: 7, fontWeight: 700, color: C, border: "1px solid color-mix(in srgb, var(--c) 28%, transparent)", background: "color-mix(in srgb, var(--c) 7%, transparent)", borderRadius: 99, padding: "4px 8px", textTransform: "uppercase" }}>
                      {chip}
                    </span>
                  ))}
                </span>
                <span style={{ marginLeft: "auto", flex: "none", fontSize: 7, fontWeight: 800, letterSpacing: 1, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>
                  Open desk ›
                </span>
              </div>
            </section>
          );
        })}
      </div>

      {/*
        The SPLIT-FLAP CHRONO. Founder note: there were two Seiko retro clocks
        stacked on /preview — this one (the FIRST, inside the cluster at scale
        1.2) and a SeikoDopamineHub directly below it. Keep this one exactly as
        it rendered, measured and sized; the duplicate below has been removed
        from app/preview/page.tsx rather than this one being dropped.
      */}
      {showInstrument && (
        <div style={{ overflowX: "auto" }}>
          <GambitInstrumentCluster centerSlot={<SeikoFlipClock label="MAD·STATE · TAP A DOT TO PIN" scale={1.2} />} />
        </div>
      )}

      {/* Deck footer — the thesis line and the two canon pills. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 2 }}>
        <span style={{ fontSize: 7, letterSpacing: 1.2, color: "var(--mu,#6b7280)", textTransform: "uppercase" }}>
          Six instruments · one shell · every card carries its own symbol and its own live ticker
        </span>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1, color: GD, textTransform: "uppercase", border: "1px solid color-mix(in srgb, var(--gd,#ffd700) 34%, transparent)", background: "color-mix(in srgb, var(--gd,#ffd700) 7%, transparent)", borderRadius: 99, padding: "4px 10px" }}>
            Platform fee 1.88%
          </span>
          <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1, color: AC, textTransform: "uppercase", border: "1px solid color-mix(in srgb, var(--ac,#00e5ff) 34%, transparent)", background: "color-mix(in srgb, var(--ac,#00e5ff) 7%, transparent)", borderRadius: 99, padding: "4px 10px" }}>
            Community 28.8%
          </span>
        </span>
      </div>
      </div>

      {openBook ? <PerpBookDialog deckId={openBook} onClose={() => setOpenBook(null)} /> : null}
    </div>
  );
}
