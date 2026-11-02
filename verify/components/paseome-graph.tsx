"use client";

/**
 * MAD Gambit — The Paseome, in 3D.
 * ------------------------------------------------------------------
 * An interactive node-link graph of the Paseome's two frontiers, fed by
 * GET /api/v1/paseome/frontier (one call per side). Orbit and zoom, hover for a
 * tooltip, tap a node to focus it and read its figures.
 *
 * Mount it with next/dynamic and ssr:false (components/om-hub.tsx does); this
 * file imports the WebGL scene lazily in turn, so the empty and error states
 * never download three.js.
 *
 * HONEST BY CONSTRUCTION. Every figure on screen comes from the route through
 * lib/paseome-graph.ts, where a figure the API did not send is an em dash.
 *   · The route currently serves seeded branches with real maths and says so
 *     (`source: "demo"`); that is shown as DEMO DATA, with a plain-language
 *     line, for as long as it is true. Only an explicit "live" earns LIVE.
 *   · If the route fails, rate-limits or returns no branches, nothing is drawn —
 *     there is no placeholder tree — and every figure reads "—".
 *
 * The canvas is a picture; the node list under it is the same graph as buttons,
 * so keyboard and screen-reader users (and anyone without WebGL) lose nothing.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useInView } from "@/hooks/use-in-view";
import {
  EM_DASH, SIDE_LABEL, buildPaseomeGraph, fmtFixed, nodeColor, parseFrontier,
  type FrontierSnapshot, type GraphNode,
} from "@/lib/paseome-graph";
import type { PaseomeSide } from "@/lib/paseome";
// Type-only: erased at build, so the shell never pulls three.js in with it.
import type { HoverPoint } from "@/components/paseome-graph-scene";

const Scene = dynamic(() => import("@/components/paseome-graph-scene"), { ssr: false });

const SIDES: PaseomeSide[] = ["foresight", "hindsight"];
const ENDPOINT = "/api/v1/paseome/frontier";

type Load =
  | { status: "loading" }
  | { status: "ready"; snaps: FrontierSnapshot[]; missing: PaseomeSide[] }
  | { status: "unavailable"; reason: string };

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext(); // hand the context straight back
    return true;
  } catch {
    return false;
  }
}

// Probed once per page: the answer cannot change, and each probe costs a GL context.
let webglProbe: boolean | null = null;
const readWebGL = (): boolean => (webglProbe ??= hasWebGL());
const noSubscription = () => () => {};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(notify: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

export default function PaseomeGraph() {
  const { skin } = useSkin();
  // The server snapshot is "reduced" so a first render, if it ever happens off the
  // client, is the still one.
  const reduced = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => true);
  const webgl = useSyncExternalStore(noSubscription, readWebGL, () => null);
  const { ref: stageRef, seen, inView } = useInView<HTMLDivElement>("160px");

  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [lost, setLost] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const tip = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // One request per side, in parallel. Either side alone is enough to draw.
  useEffect(() => {
    const ctl = new AbortController();
    Promise.allSettled(
      SIDES.map(async (side) => {
        const res = await fetch(`${ENDPOINT}?side=${side}`, { signal: ctl.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`the route answered ${res.status}`);
        const snap = parseFrontier(await res.json());
        if (!snap) throw new Error("the route returned no usable branches");
        return snap;
      }),
    ).then((results) => {
      if (ctl.signal.aborted) return;
      const snaps: FrontierSnapshot[] = [];
      const missing: PaseomeSide[] = [];
      let reason = "";
      results.forEach((r, i) => {
        if (r.status === "fulfilled") snaps.push(r.value);
        else {
          missing.push(SIDES[i]);
          reason = reason || (r.reason instanceof Error ? r.reason.message : "the request failed");
        }
      });
      setLoad(snaps.length ? { status: "ready", snaps, missing } : { status: "unavailable", reason });
    });
    return () => ctl.abort();
  }, [revision]);

  const graph = useMemo(() => (load.status === "ready" ? buildPaseomeGraph(load.snaps) : null), [load]);
  const byId = useMemo(() => new Map((graph?.nodes ?? []).map((n) => [n.id, n])), [graph]);
  const focused = focusId ? byId.get(focusId) ?? null : null;
  const hovered = hoverId ? byId.get(hoverId) ?? null : null;

  const onHover = useCallback((id: string | null, at: HoverPoint | null) => {
    const el = tip.current;
    const stage = el?.parentElement;
    if (el && stage && at && !at.touch) {
      // The pointer is in viewport pixels; the tooltip is placed in layout pixels. They differ
      // by the CSS `zoom` the desktop phone frame applies, so convert through that ratio.
      const box = stage.getBoundingClientRect();
      const k = box.width / (stage.offsetWidth || box.width) || 1;
      const w = stage.offsetWidth, h = stage.offsetHeight;
      const x = Math.min(Math.max((at.x - box.left) / k, 0), w);
      const y = Math.min(Math.max((at.y - box.top) / k, 0), h);
      // Flip to the left / above near the edges so the card never leaves the frame.
      el.style.transform = `translate(${x > w - 230 ? x - 224 : x + 14}px, ${y > h - 120 ? y - 96 : y + 14}px)`;
    }
    const next = at?.touch ? null : id; // touch has no hover; the details card covers it
    if (hoverRef.current !== next) {
      hoverRef.current = next;
      setHoverId(next);
    }
  }, []);

  const reset = () => { setFocusId(null); setResetKey((k) => k + 1); };

  const live = graph?.source === "live";
  const unavailable = load.status === "unavailable" || (graph !== null && graph.nodes.length === 0);
  const reason =
    load.status === "unavailable" ? load.reason
      : graph && graph.withheld > 0 ? "every counterfactual branch lacked irrealis mood and was withheld"
        : "";
  const showStage = graph !== null && graph.nodes.length > 0;
  const showCanvas = showStage && webgl === true && !lost && seen;

  const chip: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, padding: "0 14px", borderRadius: 10,
    cursor: "pointer", fontFamily: INSTRUMENT_FONT, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
    color: skin.text, background: skin.card, border: `1px solid ${skin.border}`,
  };

  return (
    <section
      aria-label="The Paseome in 3D"
      style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, fontFamily: INSTRUMENT_FONT, color: skin.text }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: skin.gold }}>
          The Paseome · 3D
          <span style={{ marginLeft: 8, fontWeight: 700, letterSpacing: 0.3, textTransform: "none", color: skin.muted, fontSize: 10 }}>
            Size and reach = price
          </span>
        </span>
        {graph && graph.nodes.length > 0 ? (
          <span
            title={live ? "Served live by the frontier route." : "Seeded branches priced by the real DL-LMSR frontier."}
            style={{
              fontSize: 9, fontWeight: 900, letterSpacing: 1.1, padding: "3px 8px", borderRadius: 999, textTransform: "uppercase",
              color: live ? skin.positive : skin.gold, border: `1px solid ${live ? skin.positive : skin.gold}`,
            }}
          >
            {live ? "● Live" : "Demo data"}
          </span>
        ) : null}
      </header>

      {graph && graph.nodes.length > 0 && !live ? (
        <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.5, color: skin.muted }}>
          Demo data, real maths: the branch sets are seeded until the tree store lands. Every price shown is computed by the live
          DL-LMSR frontier, and each side sums to 1.
        </p>
      ) : null}

      <div
        ref={stageRef}
        style={{
          position: "relative", width: "100%", height: "clamp(280px, 76vw, 460px)", overflow: "hidden", borderRadius: 14,
          border: `1px solid ${skin.border}`, background: `radial-gradient(circle at 50% 45%, ${skin.card} 0%, ${skin.bg} 100%)`,
          cursor: hovered ? "pointer" : armed ? "grab" : "default", userSelect: "none",
        }}
        onKeyDown={(e) => { if (e.key === "Escape") { setArmed(false); setFocusId(null); } }}
      >
        {load.status === "loading" ? (
          <Centered color={skin.muted}>Loading the frontier…</Centered>
        ) : unavailable ? (
          <Centered color={skin.muted}>
            <div style={{ maxWidth: 280, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <strong style={{ color: skin.text, fontSize: 13 }}>No live Paseome data</strong>
              <span style={{ fontSize: 11, lineHeight: 1.55 }}>
                {reason ? `${reason[0].toUpperCase()}${reason.slice(1)}. ` : ""}Nothing is drawn rather than inventing a tree — every figure reads {EM_DASH}.
              </span>
              <button type="button" onClick={() => { setLoad({ status: "loading" }); setRevision((r) => r + 1); }} style={chip}>Retry</button>
            </div>
          </Centered>
        ) : showCanvas && graph ? (
          <>
            {/* touch-action is declared here as well as on the canvas: the effective value is the
                intersection up the tree, and drei's OrbitControls rewrites the canvas's own. */}
            <div role="img" aria-label={`3D graph of the Paseome: ${graph.nodes.filter((n) => n.kind === "branch").length} priced branches across ${graph.sides.length} frontier${graph.sides.length === 1 ? "" : "s"}. The list below holds the same nodes.`} style={{ position: "absolute", inset: 0, touchAction: armed ? "none" : "pan-y" }}>
              <Scene
                graph={graph}
                skin={skin}
                focusId={focusId}
                hoverId={hoverId}
                armed={armed}
                reduced={reduced}
                active={inView && pageVisible}
                resetKey={resetKey}
                onHover={onHover}
                onFocus={setFocusId}
                onLost={() => setLost(true)}
              />
            </div>

            <div
              ref={tip}
              role="tooltip"
              style={{
                position: "absolute", left: 0, top: 0, width: 210, pointerEvents: "none", padding: "8px 10px", borderRadius: 10,
                fontSize: 10.5, lineHeight: 1.45, background: skin.panel, border: `1px solid ${skin.border}`, color: skin.text,
                boxShadow: "0 6px 20px rgba(0,0,0,.45)", opacity: hovered ? 1 : 0, transition: "none",
              }}
            >
              {hovered ? (
                <>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.gold }}>{hovered.kicker}</div>
                  <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{hovered.title}</div>
                  {hovered.kind === "branch" ? <div style={{ marginTop: 3, fontWeight: 800 }}>{hovered.facts[0].v}</div> : null}
                </>
              ) : null}
            </div>

            <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <button type="button" aria-pressed={armed} onClick={() => setArmed((a) => !a)} style={{ ...chip, borderColor: armed ? skin.gold : skin.border }}>
                {armed ? "Done" : "Explore in 3D"}
              </button>
              <span style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 9.5, color: skin.muted, textShadow: "0 1px 2px rgba(0,0,0,.8)" }}>
                {armed ? "Drag to orbit · pinch or scroll to zoom" : "Tap a node to focus it"}
              </span>
              <button type="button" onClick={reset} style={chip} aria-label="Reset the view">Reset</button>
            </div>
          </>
        ) : (
          <Centered color={skin.muted}>
            <span style={{ fontSize: 11, lineHeight: 1.55, maxWidth: 280 }}>
              {lost
                ? "The 3D view lost its graphics context. The list below is the same graph."
                : webgl === false
                  ? "This device cannot draw WebGL. The list below is the same graph."
                  : "Loading the 3D view…"}
              {lost ? <><br /><button type="button" onClick={() => setLost(false)} style={{ ...chip, marginTop: 10 }}>Reload 3D view</button></> : null}
            </span>
          </Centered>
        )}
      </div>

      {showStage ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 10, color: skin.muted }}>
            <span><i style={{ color: skin.accent, fontStyle: "normal" }}>●</i> Forward</span>
            <span><i style={{ color: skin.accent2, fontStyle: "normal" }}>◆</i> Counterfactual</span>
            <span><i style={{ color: skin.gold, fontStyle: "normal" }}>◯</i> Sharpest knife edge</span>
            {SIDES.map((side) => {
              const snap = load.status === "ready" ? load.snaps.find((s) => s.side === side) : undefined;
              return <span key={side}>{SIDE_LABEL[side]} Σ {fmtFixed(snap?.sum, 3)}</span>;
            })}
          </div>

          {load.status === "ready" && load.missing.length > 0 ? (
            <p role="status" style={{ margin: 0, fontSize: 10.5, color: skin.muted }}>
              {load.missing.map((s) => SIDE_LABEL[s]).join(" and ")} frontier unavailable ({EM_DASH}). Showing the other side only.
            </p>
          ) : null}
          {graph && graph.withheld > 0 ? (
            <p role="status" style={{ margin: 0, fontSize: 10.5, color: skin.muted }}>
              {graph.withheld} counterfactual branch{graph.withheld === 1 ? "" : "es"} withheld: no irrealis mood, so it would assert rather than suppose.
            </p>
          ) : null}

          <div
            aria-live="polite"
            style={{ padding: 12, borderRadius: 12, background: skin.card, border: `1px solid ${focused ? skin.gold : skin.border}`, minHeight: 64 }}
          >
            {focused ? <Details node={focused} onClose={() => setFocusId(null)} /> : (
              <span style={{ fontSize: 11, color: skin.muted }}>Pick a node on the graph or in the list to read its figures.</span>
            )}
          </div>

          <ul aria-label="Paseome nodes" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {graph?.nodes.filter((n) => n.kind !== "hub").map((n) => {
              const on = focusId === n.id;
              return (
                <li key={n.id} style={{ minWidth: 0 }}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFocusId(on ? null : n.id)}
                    style={{
                      width: "100%", minHeight: 40, display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", textAlign: "left",
                      cursor: "pointer", borderRadius: 10, fontFamily: "inherit", fontSize: 11, color: skin.text, minWidth: 0,
                      background: on ? skin.card : "transparent", border: `1px solid ${on ? skin.gold : skin.border}`,
                      paddingLeft: n.kind === "root" ? 10 : 22,
                    }}
                  >
                    <span aria-hidden="true" style={{ flex: "none", color: nodeColor(n, skin) }}>{n.side === "hindsight" ? "◆" : "●"}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: n.kind === "root" ? 800 : 500 }}>
                      {n.kind === "root" ? `${n.label} · ${n.title}` : n.title}
                    </span>
                    {n.kind === "branch" ? (
                      <span style={{ flex: "none", fontWeight: 800, color: skin.gold }}>
                        {n.rank === 1 ? "◯ " : ""}{n.label}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function Centered({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 16, fontSize: 11, color }}>
      <div>{children}</div>
    </div>
  );
}

function Details({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { skin } = useSkin();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: skin.gold }}>{node.kicker}</div>
          <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, overflowWrap: "anywhere" }}>{node.title}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Clear focus" style={{ flex: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: skin.text, background: "transparent", border: `1px solid ${skin.border}`, fontFamily: "inherit" }}>
          ×
        </button>
      </div>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 14, rowGap: 4, fontSize: 11 }}>
        {node.facts.map((f) => (
          <React.Fragment key={f.k}>
            <dt style={{ color: skin.muted }}>{f.k}</dt>
            <dd style={{ margin: 0, textAlign: "right", fontWeight: 700, overflowWrap: "anywhere" }}>{f.v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
