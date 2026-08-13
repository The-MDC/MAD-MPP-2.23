/**
 * MAD Gambit — shared instrument chrome (canvas).
 * ------------------------------------------------------------------
 * One hardware family for every gauge on /preview. The primitives here are
 * lifted from the SVG chrome in components/analog-dial.tsx so a canvas
 * instrument and an SVG dial read as the same physical object: same bezel
 * ramp, same recessed track, same needle metal, same hub.
 *
 * Nothing in this module knows about a market. Geometry lives in the
 * instrument that calls it.
 *
 * FIDELITY NOTE — these primitives reproduce the CHROME object in the design
 * file (`MAD Gambit - Tickers and Dials.dc.html`), which is the visual source
 * of truth, because the six instrument geometries are authored against its
 * exact semantics. Three of those differ from a naive reading and matter:
 *
 *   · `ramp` takes a FLAT colour list and spaces the stops evenly. Every call
 *     site passes `["#00727f", s.c, "#b9f2ff"]`, not `[offset, colour]` pairs.
 *   · `ticks` takes `minor`/`major` as RADII (where each tick starts, sweeping
 *     out to `rOut`), not as lengths — and majors are every 5th, hardcoded.
 *     Call sites pass `major < minor < rOut`, so majors read longer.
 *   · `needle` rotates about the hub with its tip at (0, -len), so angle 0
 *     points UP; call sites pre-rotate by -PI/2 for left-origin gauges.
 *
 * `bezel` is a vertical ramp (not diagonal), `track` carries the inset shadow
 * that makes the channel read as recessed, and `hub` keeps its specular
 * highlight. Changing any of these silently breaks the instruments.
 */

export interface FitResult {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels, not device pixels — draw in these. */
  w: number;
  h: number;
  /** Card accent (--c), plus the skin roles the instruments read. */
  c: string;
  gd: string;
  a2: string;
  ac: string;
  po: string;
  mu: string;
}

/** Chrome constants — the values that make it read as glass. Do not tune
 *  these per instrument; tune the geometry instead. */
export const CHROME = {
  bezel: ["#2a2f3d", "#0d1017", "#03040a"] as const,
  trackFill: "#0a0c12",
  needle: { top: "#ffe3e8", mid: "#ff5d76", base: "#c81e3c" },
  hub: ["#3a4152", "#14171f", "#05060b"] as const,
  tickMajor: { color: "#5b6472", width: 2 },
  tickMinor: { color: "#2b313d", width: 1.2 },
  glow: { widen: 3, alpha: 0.5, blur: 14 },
  transition: "0.6s cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

const TAU = Math.PI * 2;

/**
 * DPR-aware sizing + skin read. Returns null when the canvas has no layout
 * yet (display:none, pre-layout) — callers must treat that as "skip frame",
 * never as an error.
 */
export function fitCanvas(cv: HTMLCanvasElement): FitResult | null {
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
  const pw = Math.round(r.width * dpr);
  const ph = Math.round(r.height * dpr);
  if (cv.width !== pw || cv.height !== ph) {
    cv.width = pw;
    cv.height = ph;
  }
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, r.width, r.height);

  // The skin drives the canvas: read the cascade rather than hard-coding.
  const cs = getComputedStyle(cv);
  const v = (n: string, f: string) => (cs.getPropertyValue(n) || "").trim() || f;
  return {
    ctx,
    w: r.width,
    h: r.height,
    c: v("--c", "#00e5ff"),
    gd: v("--gd", "#ffd700"),
    a2: v("--a2", "#ff007f"),
    ac: v("--ac", "#00e5ff"),
    po: v("--po", "#00ff88"),
    mu: v("--mu", "#6b7280"),
  };
}

/** Metallic ring — vertical ramp, so the highlight sits along the top edge. */
export function bezel(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  a0: number, a1: number, w: number,
) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, CHROME.bezel[0]);
  g.addColorStop(0.5, CHROME.bezel[1]);
  g.addColorStop(1, CHROME.bezel[2]);
  ctx.save();
  ctx.strokeStyle = g;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  ctx.restore();
}

/** Recessed black channel the live arc sits in — the inset shadow IS the
 *  recess; without it the track reads as a flat black stroke. */
export function track(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  a0: number, a1: number, w: number,
) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.85)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = CHROME.trackFill;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  ctx.restore();
}

/**
 * Horizontal ramp. Takes a flat colour list and spaces the stops evenly —
 * that is what every instrument passes. Explicit `[offset, colour]` pairs are
 * also accepted so the module stays usable for a non-uniform ramp.
 */
export function ramp(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number,
  stops: readonly string[] | readonly [number, string][],
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  const n = stops.length;
  stops.forEach((s, i) => {
    if (typeof s === "string") g.addColorStop(n > 1 ? i / (n - 1) : 0, s);
    else g.addColorStop(s[0], s[1]);
  });
  return g;
}

/** Glow underlay + crisp arc on top — the signature of a live reading. */
export function arc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  a0: number, a1: number, w: number,
  grad: string | CanvasGradient,
  glow?: string,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = grad;
  if (glow) {
    ctx.save();
    ctx.globalAlpha = CHROME.glow.alpha;
    ctx.shadowBlur = CHROME.glow.blur;
    ctx.shadowColor = glow;
    ctx.lineWidth = w + CHROME.glow.widen;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  ctx.restore();
}

/**
 * Graduations across a sweep. `minor` and `major` are the RADII each tick
 * starts at, sweeping out to `rOut` — pass `major < minor < rOut` so every
 * 5th tick reads longer as well as heavier.
 */
export function ticks(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  a0: number, a1: number,
  n = 21,
  rOut = 0,
  minor = 0,
  major = 0,
) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    const big = i % 5 === 0;
    const r1 = big ? major : minor;
    const s = big ? CHROME.tickMajor : CHROME.tickMinor;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Tapered needle. Rotates about (cx, cy) with the tip at (0, -len), so angle 0
 * points UP — left-origin gauges pre-rotate by -PI/2. Drawn twice: a wider
 * translucent pass for the glow, then the crisp blade.
 */
export function needle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  ang: number, len: number, wide: number,
  top: string = CHROME.needle.top,
  mid: string = CHROME.needle.mid,
  base: string = CHROME.needle.base,
  tail: boolean = false,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, -len, 0, 0);
  g.addColorStop(0, top);
  g.addColorStop(0.45, mid);
  g.addColorStop(1, base);
  const tri = (k: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(-wide * k, 0);
    ctx.lineTo(wide * k, 0);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.85;
  ctx.shadowBlur = 10;
  ctx.shadowColor = mid;
  tri(1.3);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  tri(1);
  if (tail) {
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(0, len * 0.22);
    ctx.lineTo(-wide * 0.7, 0);
    ctx.lineTo(wide * 0.7, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Centre boss the needle pivots on, with its specular highlight. */
export function hub(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  accent?: string,
) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  g.addColorStop(0, CHROME.hub[0]);
  g.addColorStop(0.55, CHROME.hub[1]);
  g.addColorStop(1, CHROME.hub[2]);
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  if (accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.21, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * Drive a whole deck of instruments from ONE loop.
 *
 * The instruments must not depend on rAF ever firing: a hidden frame, a print
 * pass or a screenshot capture suspends it, and every canvas stays unsized and
 * blank. So paint synchronously first, then animate. Each job is isolated —
 * one bad frame disables that instrument, never the loop.
 *
 * Returns a stop function; call it from the effect cleanup.
 */
export function runInstrumentLoop(
  jobs: () => [React.RefObject<HTMLCanvasElement | null>, (cv: HTMLCanvasElement, t: number) => void][],
): () => void {
  const t0 = performance.now();
  const bad = new Set<number>();
  let raf = 0;
  const timers: number[] = [];

  const drawAll = (t: number) => {
    jobs().forEach(([ref, fn], i) => {
      const cv = ref.current;
      if (!cv || bad.has(i)) return;
      try {
        fn(cv, t);
      } catch (err) {
        bad.add(i);
        console.error("[instrument] draw failed, disabling", i, err);
      }
    });
  };

  const loop = (ts: number) => {
    try {
      drawAll(ts - t0);
    } finally {
      raf = requestAnimationFrame(loop);
    }
  };

  drawAll(0);
  timers.push(window.setTimeout(() => drawAll(performance.now() - t0), 0));
  timers.push(window.setTimeout(() => drawAll(performance.now() - t0), 140));
  raf = requestAnimationFrame(loop);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
  };
}

/** A point in 3-space, pre-projection. Shared by every Octavian-family mesh. */
export interface P3 { x: number; y: number; z: number }

/**
 * Even placement on a sphere — no clustering at the poles. Shared by
 * components/octavian-mesh.tsx and any smaller companion visual that needs
 * the same node layout at a different scale.
 */
export function fibonacciSphere(n: number): P3[] {
  const out: P3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    out.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
  }
  return out;
}

/**
 * Registry accents are authored as CSS custom properties ("var(--gold)") —
 * canvas cannot resolve those, so read them off the live element.
 */
export function resolveColor(raw: string, el: HTMLElement, fallback: string): string {
  const m = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/.exec(raw);
  if (!m) return raw || fallback;
  const got = getComputedStyle(el).getPropertyValue(m[1]).trim();
  return got || (m[2] || "").trim() || fallback;
}
