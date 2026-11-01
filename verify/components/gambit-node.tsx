"use client";

/**
 * MAD Gambit — THE GAMBIT NODE (D14 §3, S0.6).
 * ------------------------------------------------------------------
 * One component. Two variants. Twenty contents. Every dead link in the
 * hub summons a node; every node celebrates.
 *
 * - variant="modal": ReactDOM.createPortal at document.body — zero
 *   structural change to the 5-zone layout. Backdrop rgba(8,8,8,0.82)
 *   + blur(6px). Enter scale 0.96→1 over --dur-enter (233ms Fibonacci),
 *   exit --dur-exit (144ms). Dismiss: backdrop tap · ✕ · Escape ·
 *   swipe-down. role="dialog" aria-modal, focus trap, reduced-motion →
 *   fades only.
 * - variant="panel": same content, no portal/backdrop — reserved for the
 *   /story carousel (build the prop now, use it later).
 * - On open: JoyLayer micro burst + session VRS +1. On CTA: full burst
 *   + VRS +1 → route | scroll | nested node | external | dismiss.
 * - Content is local registry data — every node opens in <100ms, no fetch.
 * - Consumes tokens.css custom properties exclusively (VIII.5 amendment).
 *
 * Open mechanism: const { openNode } = useGambitNode() — one line
 * converts any dead link.
 */
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { NODE_REGISTRY, type GambitNodeDef, type LiveElement, type NodeId } from "@/lib/node-registry";
import { STAKING_TIERS, shieldPremium } from "@/lib/gambit-game-math";
import { bumpVrsStreak, getVrsStreak, nextVrsTrigger, VRS_EVENT } from "@/lib/session-vrs";
import { useRollingNumber } from "@/lib/use-rolling-number";
import { celebrate } from "@/components/joy-layer";
import VrsToast from "@/components/vrs-toast";

/* ================================================================
 * Context — the open mechanism
 * ================================================================ */
interface GambitNodeContextValue {
  openNode: (id: NodeId) => void;
  closeNode: () => void;
  activeNode: NodeId | null;
}
const GambitNodeContext = createContext<GambitNodeContextValue | null>(null);

export function useGambitNode(): GambitNodeContextValue {
  const ctx = useContext(GambitNodeContext);
  if (!ctx) throw new Error("useGambitNode must be within GambitNodeProvider");
  return ctx;
}

export function GambitNodeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<NodeId | null>(null);
  const [closing, setClosing] = useState(false);

  const openNode = useCallback((id: NodeId) => {
    setClosing(false);
    setActive(id);
    // On open: micro burst (8 particles ≈ intensity 0.25) + session VRS +1.
    celebrate({ intensity: 0.25 });
    bumpVrsStreak();
  }, []);

  const closeNode = useCallback(() => {
    setClosing(true);
    // Match --dur-exit (144ms) before unmount so the exit animation plays.
    setTimeout(() => { setActive(null); setClosing(false); }, 150);
  }, []);

  const value = useMemo(() => ({ openNode, closeNode, activeNode: active }), [openNode, closeNode, active]);

  // Decoupled open mechanism (mirrors the mg:category pattern): components
  // that may render outside this provider dispatch
  //   window.dispatchEvent(new CustomEvent("mg:open-node", { detail: "shield" }))
  // and the provider answers when mounted. No-op when it isn't.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent).detail as NodeId | undefined;
      if (id && NODE_REGISTRY[id]) openNode(id);
    };
    window.addEventListener("mg:open-node", onOpen as EventListener);
    return () => window.removeEventListener("mg:open-node", onOpen as EventListener);
  }, [openNode]);

  return (
    <GambitNodeContext.Provider value={value}>
      {children}
      {active ? <GambitNode id={active} variant="modal" closing={closing} /> : null}
      <VrsToast onReserve={() => openNode("beta-gate")} />
    </GambitNodeContext.Provider>
  );
}

/* ================================================================
 * Live element renderers — one small component per kind, CSS-first.
 * Exactly ONE live element per node; the restraint is the design.
 * ================================================================ */
function LiveBars({ el }: { el: Extract<LiveElement, { kind: "bars" }> }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 30); return () => clearTimeout(t); }, []);
  const max = Math.max(...el.bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {el.bars.map((b, i) => (
        <div key={b.label}>
          <div className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1 }}>
            <span>{b.label}</span>
            <span style={{ color: b.color ?? "var(--paper)" }}>{b.value}{el.unit ?? ""}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: b.color ?? "var(--blood-1)", width: on ? `${(b.value / max) * 100}%` : "0%", transition: `width var(--dur-reveal) var(--ease-conviction) ${i * 60}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveCounter({ el }: { el: Extract<LiveElement, { kind: "counter" }> }) {
  const { value, ref } = useRollingNumber(el.to, el.durationMs);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} style={{ textAlign: "center", padding: "var(--s1) 0" }}>
      <div className="font-numeral" style={{ fontSize: "var(--t-head)", fontWeight: 700, color: "var(--gold)", lineHeight: 1 }}>
        {Math.round(value).toLocaleString()}
      </div>
      <div style={{ fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, marginTop: 6 }}>{el.label}</div>
    </div>
  );
}

function LiveSlider({ el }: { el: Extract<LiveElement, { kind: "slider" }> }) {
  const [v, setV] = useState(el.formula === "effApy" ? 100 : 0.23);
  if (el.formula === "effApy") {
    const clout = v;
    return (
      <div>
        <input type="range" min={0} max={200} step={1} value={clout} onChange={(e) => setV(+e.target.value)}
          aria-label="Clout" style={{ width: "100%", accentColor: "#d69d41" }} />
        <div className="font-numeral" style={{ fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, marginBottom: 6 }}>
          CLOUT {clout} · {el.label}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {STAKING_TIERS.map((t) => (
            <div key={t.name} className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", padding: "4px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius)" }}>
              <span style={{ color: "var(--ink-3)" }}>{t.name.toUpperCase()}</span>
              <span style={{ color: "var(--gold)" }}>{(t.apy * (1 + clout / 200) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // shieldFee: σ slider — fee = shieldPremium(stake, pWin, σ²), clamp visible.
  const sigma = v;
  const stake = 1000;
  const fee = shieldPremium(stake, 0.5, sigma * sigma);
  const feePct = (fee / stake) * 100;
  return (
    <div>
      <input type="range" min={0.09} max={0.68} step={0.01} value={sigma} onChange={(e) => setV(+e.target.value)}
        aria-label="Volatility sigma" style={{ width: "100%", accentColor: "#7cffc7" }} />
      <div className="font-numeral" style={{ fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1 }}>
        σ {sigma.toFixed(2)} · {el.label}
      </div>
      <div style={{ position: "relative", height: 10, marginTop: 8, background: "rgba(255,255,255,0.06)", borderRadius: 5 }}>
        {/* the 2–4% clamp window, always visible */}
        <div style={{ position: "absolute", left: "50%", width: "50%", top: 0, bottom: 0, background: "rgba(124,255,199,0.15)", borderRadius: 5 }} />
        <div style={{ position: "absolute", left: `${Math.min(100, (feePct / 4) * 100)}%`, top: -2, width: 3, height: 14, background: "var(--gold)", borderRadius: 2, transition: "left var(--dur-micro) linear" }} />
      </div>
      <div className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", color: "var(--ink-3)", marginTop: 4 }}>
        <span>0%</span>
        <span style={{ color: "var(--dopamine-active, #7cffc7)" }}>opt-in fee {fee.toFixed(0)} on 1,000 ({feePct.toFixed(1)}%)</span>
        <span>4% cap</span>
      </div>
    </div>
  );
}

function LiveDial({ el }: { el: Extract<LiveElement, { kind: "dial" }> }) {
  const frac = (el.needle - el.min) / (el.max - el.min);
  const sweet = (el.sweetSpot - el.min) / (el.max - el.min);
  const angle = -90 + frac * 180;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 150, height: 78, margin: "0 auto", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "150px 150px 0 0", background: "conic-gradient(from -90deg at 50% 100%, #00f0ff 0deg 60deg, #d69d41 60deg 120deg, var(--blood-1) 120deg 180deg)", opacity: 0.7 }} />
        <div style={{ position: "absolute", inset: 8, top: 8, borderRadius: "150px 150px 0 0", background: "var(--ink-0)" }} />
        {/* sweet-spot pulse at σ=0.385 */}
        <div style={{ position: "absolute", left: "50%", bottom: 0, width: 2, height: 70, transformOrigin: "bottom center", transform: `rotate(${-90 + sweet * 180}deg)`, background: "var(--gold)", opacity: 0.5, animation: "mgSweetPulse 2s ease-in-out infinite" }} />
        <div style={{ position: "absolute", left: "50%", bottom: 0, width: 3, height: 64, transformOrigin: "bottom center", transform: `rotate(${angle}deg)`, background: "var(--paper)", borderRadius: 2, transition: "transform 300ms var(--ease-conviction)" }} />
      </div>
      <div className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, marginTop: 4 }}>
        {el.zones.map((z) => <span key={z}>{z}</span>)}
      </div>
      <div className="font-numeral" style={{ fontSize: "var(--t-sub)", color: "var(--gold)", marginTop: 2 }}>σ = {el.needle}</div>
      <style>{`@keyframes mgSweetPulse { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }`}</style>
    </div>
  );
}

function LiveGauge({ el }: { el: Extract<LiveElement, { kind: "gauge" }> }) {
  const { value, ref } = useRollingNumber(el.sweepTo, 900);
  const band = el.bands[Math.min(el.bands.length - 1, Math.floor((value / 100) * el.bands.length))];
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto", borderRadius: "50%", background: `conic-gradient(var(--blood-1) ${value * 3.6}deg, rgba(255,255,255,0.07) 0deg)` }}>
        <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "var(--ink-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="font-numeral" style={{ fontSize: "var(--t-head)", color: "var(--paper)", fontWeight: 700 }}>{Math.round(value)}</span>
        </div>
      </div>
      <div className="font-stencil" style={{ fontSize: "var(--t-overline)", color: "var(--blood-1)", marginTop: 8 }}>{band}</div>
    </div>
  );
}

function LiveStreak() {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(getVrsStreak());
    const onVrs = (e: Event) => setStreak(((e as CustomEvent).detail?.streak as number) ?? getVrsStreak());
    window.addEventListener(VRS_EVENT, onVrs as EventListener);
    return () => window.removeEventListener(VRS_EVENT, onVrs as EventListener);
  }, []);
  const next = nextVrsTrigger(streak);
  const prev = next === 5 ? 0 : [0, 5, 8, 13, 21, 34][[5, 8, 13, 21, 34, 55].indexOf(next)];
  const progress = Math.min(1, (streak - prev) / (next - prev));
  return (
    <div style={{ textAlign: "center" }}>
      <div className="font-stencil" style={{ fontSize: "var(--t-hero)", color: "var(--gold)", lineHeight: 1 }}>{streak}</div>
      <div style={{ fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, margin: "6px 0" }}>NEXT TRIGGER: {next}</div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "var(--gold)", borderRadius: 3, transition: "width var(--dur-reveal) var(--ease-conviction)" }} />
      </div>
    </div>
  );
}

function LiveStrip({ el }: { el: Extract<LiveElement, { kind: "strip" }> }) {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOn((i) => (i + 1) % el.states.length), 1200);
    return () => clearInterval(t);
  }, [el.states.length]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" }}>
      {el.states.map((s, i) => (
        <span key={s} className="font-stencil" style={{ fontSize: "var(--t-overline)", padding: "5px 9px", borderRadius: 0, border: `1px solid ${i === on ? "var(--gold)" : "rgba(255,255,255,0.14)"}`, color: i === on ? "var(--gold)" : "var(--ink-3)", transition: "all var(--dur-micro) linear" }}>
          {s}
        </span>
      ))}
      {el.counter ? (
        <span className="font-numeral" style={{ fontSize: "var(--t-overline)", color: "var(--paper)", marginLeft: 6 }}>
          {el.counter.label}: <b style={{ color: "var(--gold)" }}>{el.counter.value}</b>
        </span>
      ) : null}
    </div>
  );
}

function LiveBar({ el }: { el: Extract<LiveElement, { kind: "bar" }> }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 30); return () => clearTimeout(t); }, []);
  return (
    <div>
      <div className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, marginBottom: 4 }}>
        <span>{el.label}</span><span style={{ color: "var(--gold)" }}>{el.pct}%</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: on ? `${el.pct}%` : "0%", background: "linear-gradient(90deg, var(--blood-3), var(--blood-1))", borderRadius: 4, transition: "width var(--dur-grand) var(--ease-conviction)" }} />
      </div>
    </div>
  );
}

function LiveCapture() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input type="email" placeholder="wallet or email" aria-label="Wallet or email"
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: "var(--t-body)", color: "var(--paper)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(214,157,65,0.3)", borderRadius: "var(--radius)", outline: "none" }} />
      <div className="font-numeral" style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1 }}>
        <span>GUEST LOGINS</span><span style={{ color: "var(--gold)" }}>4 / 4 ACTIVE</span>
      </div>
    </div>
  );
}

function LiveDash({ el }: { el: Extract<LiveElement, { kind: "dash" }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {el.stats.map((s) => (
        <div key={s.label} style={{ padding: "var(--s1)", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius)", textAlign: "center" }}>
          <div className="font-numeral" style={{ fontSize: "var(--t-sub)", color: "var(--gold)", fontWeight: 700 }}>{s.value}</div>
          <div style={{ fontSize: "var(--t-overline)", color: "var(--ink-3)", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function LiveChips({ el }: { el: Extract<LiveElement, { kind: "chips" }> }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
      {el.chips.map((c) => (
        <span key={c} className="font-stencil" style={{ fontSize: "var(--t-overline)", padding: "5px 9px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.18)", color: "var(--paper)" }}>{c}</span>
      ))}
    </div>
  );
}

function LiveElementView({ el }: { el: LiveElement }) {
  switch (el.kind) {
    case "bars": return <LiveBars el={el} />;
    case "counter": return <LiveCounter el={el} />;
    case "slider": return <LiveSlider el={el} />;
    case "dial": return <LiveDial el={el} />;
    case "gauge": return <LiveGauge el={el} />;
    case "streak": return <LiveStreak />;
    case "strip": return <LiveStrip el={el} />;
    case "bar": return <LiveBar el={el} />;
    case "capture": return <LiveCapture />;
    case "dash": return <LiveDash el={el} />;
    case "chips": return <LiveChips el={el} />;
    default: return null;
  }
}

/* ================================================================
 * The node itself
 * ================================================================ */
function NodeContent({ def, onCta, onClose }: { def: GambitNodeDef; onCta: () => void; onClose: () => void }) {
  const quip = def.live.kind === "streak" ? def.quip.replace("{n}", String(getVrsStreak())) : def.quip;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
        <span className="font-stencil" style={{ fontSize: "var(--t-overline)", color: def.accent, padding: "4px 8px", border: `1px solid ${def.accent}`, borderRadius: 0 }}>
          {def.badge}
        </span>
        <button type="button" onClick={onClose} aria-label="Close"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "var(--radius)", background: "rgba(255,255,255,0.06)", border: "none", color: "var(--ink-3)", cursor: "pointer" }}>
          <X size={14} />
        </button>
      </div>
      <h2 className="font-stencil" style={{ fontSize: "var(--t-sub)", color: "var(--paper)", margin: "0 0 var(--s1)", lineHeight: 1.15 }}>
        {def.headline}
      </h2>
      <p style={{ fontSize: "var(--t-body)", color: "var(--ink-3)", lineHeight: 1.5, margin: "0 0 var(--s2)" }}>{def.body}</p>
      <div style={{ padding: "var(--s2)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius)", marginBottom: "var(--s2)" }}>
        <LiveElementView el={def.live} />
      </div>
      <div className="font-numeral" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-overline)", letterSpacing: 1, color: "var(--gold)", marginBottom: "var(--s1)" }}>
        {def.stat}
      </div>
      <p style={{ fontSize: "var(--t-body)", fontStyle: "italic", color: "var(--ink-3)", margin: `0 0 ${def.cta ? "var(--s2)" : "0"}` }}>
        &ldquo;{quip}&rdquo;
      </p>
      {def.cta ? (
        <button type="button" onClick={onCta} className="font-stencil"
          style={{ width: "100%", padding: "12px 0", fontSize: "var(--t-body)", color: "#080808", background: "var(--gold)", border: "none", borderRadius: "var(--radius)", cursor: "pointer", boxShadow: "var(--glow-gold)" }}>
          {def.cta.label} →
        </button>
      ) : null}
    </>
  );
}

export default function GambitNode({
  id, variant = "modal", closing = false,
}: { id: NodeId; variant?: "modal" | "panel"; closing?: boolean }) {
  const def = NODE_REGISTRY[id];
  const { openNode, closeNode } = useGambitNode();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const touchY = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Focus trap + Escape (modal only).
  useEffect(() => {
    if (variant !== "modal") return;
    const el = dialogRef.current;
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeNode(); return; }
      if (e.key !== "Tab" || !el) return;
      const focusables = el.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, closeNode, id]);

  const fireCta = useCallback(() => {
    if (!def.cta) return;
    celebrate({ intensity: 0.8 });
    bumpVrsStreak();
    const cta = def.cta;
    if (cta.kind === "node" && cta.target) { openNode(cta.target as NodeId); return; }
    closeNode();
    if (cta.kind === "scroll" && cta.target) {
      setTimeout(() => document.getElementById(cta.target as string)?.scrollIntoView({ behavior: "smooth", block: "start" }), 160);
    } else if (cta.kind === "route" && cta.target) {
      window.location.href = cta.target;
    } else if (cta.kind === "external" && cta.target) {
      window.open(cta.target, "_blank", "noopener");
    }
  }, [def, openNode, closeNode]);

  if (!def) return null;

  const card = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal={variant === "modal" ? true : undefined}
      aria-label={def.headline}
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => { touchY.current = e.touches[0]?.clientY ?? null; }}
      onTouchEnd={(e) => {
        const start = touchY.current;
        const end = e.changedTouches[0]?.clientY ?? null;
        if (variant === "modal" && start !== null && end !== null && end - start > 60) closeNode();
        touchY.current = null;
      }}
      className={variant === "modal" ? (closing ? "mg-node-out" : "mg-node-in") : undefined}
      style={{ width: "min(92vw, 380px)", maxHeight: "84vh", overflowY: "auto", padding: "var(--s2)", background: "var(--ink-0)", border: "1px solid rgba(214,157,65,0.25)", borderRadius: variant === "modal" ? 12 : "var(--radius)", boxShadow: "var(--glow-gold)", outline: "none" }}
    >
      <NodeContent def={def} onCta={fireCta} onClose={closeNode} />
    </div>
  );

  if (variant === "panel") return card;
  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      onClick={closeNode}
      className={closing ? "mg-node-backdrop-out" : "mg-node-backdrop-in"}
      style={{ position: "fixed", inset: 0, zIndex: 100 /* --z-node */, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,8,8,0.82)", backdropFilter: "blur(6px)" }}
    >
      {card}
      <style>{`
        .mg-node-in { animation: mgNodeIn var(--dur-enter) var(--ease-conviction); }
        .mg-node-out { animation: mgNodeOut var(--dur-exit) var(--ease-settle) forwards; }
        .mg-node-backdrop-in { animation: mgFadeIn var(--dur-enter) ease-out; }
        .mg-node-backdrop-out { animation: mgFadeOut var(--dur-exit) ease-in forwards; }
        @keyframes mgNodeIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes mgNodeOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.97); opacity: 0; } }
        @keyframes mgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mgFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .mg-node-in, .mg-node-out { animation-name: mgFadeIn; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
