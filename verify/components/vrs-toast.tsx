"use client";

/**
 * MAD Gambit — VRS celebration toast (D14 §6, S0.8).
 * Listens for `mg:vrs` events from session-vrs. On a Fibonacci trigger:
 * fires the JoyLayer scaled to the trigger's particle count, shows the
 * bottom-center toast (stencil number + Outfit-style quip, auto-dismiss
 * 2.8s), and at streak 34 adds the gold wash + beta-gate CTA.
 * prefers-reduced-motion: fade-only toast, no particles (JoyLayer
 * already no-ops on its own).
 */
import React, { useEffect, useRef, useState } from "react";
import { celebrate } from "@/components/joy-layer";
import { VRS_EVENT, type VrsCelebration } from "@/lib/session-vrs";

export default function VrsToast({ onReserve }: { onReserve?: () => void }) {
  const [active, setActive] = useState<VrsCelebration | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onVrs = (e: Event) => {
      const detail = (e as CustomEvent).detail as { streak: number; celebration: VrsCelebration | null };
      if (!detail?.celebration) return;
      const c = detail.celebration;
      // JoyLayer intensity scales with the Fibonacci particle count (cap 1.4).
      celebrate({
        intensity: Math.min(1.4, c.particles / 70),
        colors: c.goldWash ? ["#ffd700", "#ffe066", "#fffcf0"] : undefined,
      });
      setActive(c);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(null), 2800);
    };
    window.addEventListener(VRS_EVENT, onVrs as EventListener);
    return () => {
      window.removeEventListener(VRS_EVENT, onVrs as EventListener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!active) return null;
  return (
    <>
      {/* streak-34 gold wash — a full-viewport breath, then gone */}
      {active.goldWash ? (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 200 /* --z-joy */, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 60%, rgba(255,215,0,0.22), transparent 70%)", animation: `mgGoldWash ${active.durationMs}ms var(--ease-settle) forwards` }} />
      ) : null}
      <div
        role="status"
        style={{ position: "fixed", left: "50%", bottom: 84, transform: "translateX(-50%)", zIndex: 300 /* --z-toast */, display: "flex", alignItems: "center", gap: "var(--s2)", padding: "var(--s1) var(--s2)", borderRadius: "var(--radius)", background: "rgba(8,8,8,0.92)", border: `1px solid ${active.goldWash ? "var(--gold)" : "rgba(255,215,0,0.35)"}`, boxShadow: "var(--glow-gold)", animation: "mgToastIn var(--dur-enter) var(--ease-conviction)" }}
      >
        <span className="font-stencil" style={{ fontSize: "var(--t-sub)", color: "var(--gold)", lineHeight: 1 }}>{active.streak}</span>
        <span style={{ fontSize: "var(--t-body)", color: "var(--paper)", maxWidth: 260 }}>{active.quip}</span>
        {active.goldWash && onReserve ? (
          <button
            type="button"
            onClick={() => { setActive(null); onReserve(); }}
            className="font-stencil"
            style={{ fontSize: "var(--t-overline)", color: "#080808", background: "var(--gold)", border: "none", borderRadius: 0, padding: "6px 10px", cursor: "pointer" }}
          >
            Reserve your seat
          </button>
        ) : null}
      </div>
      <style>{`
        @keyframes mgToastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes mgGoldWash { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; }
        }
      `}</style>
    </>
  );
}
