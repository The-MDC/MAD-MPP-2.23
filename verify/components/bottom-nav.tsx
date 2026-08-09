"use client";

/**
 * MAD Gambit — Fixed Mobile Bottom Action Bar
 * ------------------------------------------------------------------
 * Additive mobile UX (lg:hidden) — mirrors the 7 desktop tabs so the
 * whole app is thumb-reachable on a phone. The shipped desktop tab bar
 * and header are untouched. Active tab pulses + scales (haptic feel);
 * skin color drives the accent so it tracks the active theme.
 *
 * Design tokens: INK (no stock Tailwind neon).
 */

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Layers, Trophy, Package, Ticket, Crown, Cpu } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";

export type GambitTab = "floor" | "saga" | "arena" | "packs" | "portal" | "casino" | "logic";

const TABS: { id: GambitTab; label: string; icon: React.ReactNode }[] = [
  { id: "floor",  label: "Floor",  icon: <ShieldAlert className="w-5 h-5" /> },
  { id: "saga",   label: "Saga",   icon: <Layers className="w-5 h-5" /> },
  { id: "arena",  label: "Arena",  icon: <Trophy className="w-5 h-5" /> },
  { id: "packs",  label: "Packs",  icon: <Package className="w-5 h-5" /> },
  { id: "portal", label: "Portal", icon: <Ticket className="w-5 h-5" /> },
  { id: "casino", label: "Casino", icon: <Crown className="w-5 h-5" /> },
  { id: "logic",  label: "Logic",  icon: <Cpu className="w-5 h-5" /> },
];

export default function BottomNav({
  active,
  onSelect,
  color = INK.gold,
  hasGoldenHand = false,
}: {
  active: GambitTab;
  onSelect: (t: GambitTab) => void;
  color?: string;
  hasGoldenHand?: boolean;
}) {
  const tap = useCallback((t: GambitTab) => {
    // scale-haptic — tiny native vibration where supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(8); } catch { /* no-op */ }
    }
    onSelect(t);
  }, [onSelect]);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl"
      style={{ background: "rgba(8,10,18,0.92)", borderColor: INK.border, paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-between px-1.5 py-1.5">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const locked = t.id === "casino" && !hasGoldenHand;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => tap(t.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={locked ? `${t.label} (locked)` : t.label}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl"
            >
              {/* active glow pill */}
              {isActive && (
                <motion.span
                  layoutId="bottomnav-active"
                  className="absolute inset-x-1 inset-y-0.5 rounded-xl -z-0"
                  style={{ background: `${color}1f`, boxShadow: `0 0 16px -4px ${color}` }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              <motion.span
                className="relative z-10"
                animate={isActive ? { scale: [1, 1.18, 1.08], color } : { scale: 1, color: INK.muted }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ color: isActive ? color : INK.muted, opacity: locked ? 0.4 : 1 }}
              >
                {t.icon}
              </motion.span>
              <span
                className="relative z-10 font-mono text-[8.5px] font-bold uppercase tracking-wider leading-none"
                style={{ color: isActive ? color : INK.muted, opacity: locked ? 0.5 : 1 }}
              >
                {locked ? "🔒" : t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
