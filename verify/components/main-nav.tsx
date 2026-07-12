"use client";

/**
 * MAD Gambit — MainNav
 * ------------------------------------------------------------------
 * Hamburger command drawer docked inside the DeviceFrame phone. Mirrors the
 * seven hub tabs (parity with BottomNav), links to the /pitch data-room, and
 * drives the GLOBAL theme via useTheme() so the theme button restyles the
 * whole app (not just this hub). Fixed inside the phone transform; INK tokens
 * only (no raw hex); reduced-motion aware.
 */
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X, ShieldAlert, Layers, Trophy, Package, Ticket, Crown, Cpu, Palette, FileText } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import type { GambitTab } from "@/components/bottom-nav";
import { useTheme } from "@/context/theme-context";

const NAV: { id: GambitTab; label: string; icon: React.ReactNode }[] = [
  { id: "floor",  label: "The Floor", icon: <ShieldAlert className="w-5 h-5" /> },
  { id: "saga",   label: "NFT Saga",  icon: <Layers className="w-5 h-5" /> },
  { id: "arena",  label: "Arena",     icon: <Trophy className="w-5 h-5" /> },
  { id: "packs",  label: "Packs",     icon: <Package className="w-5 h-5" /> },
  { id: "portal", label: "Portal",    icon: <Ticket className="w-5 h-5" /> },
  { id: "casino", label: "Casino",    icon: <Crown className="w-5 h-5" /> },
  { id: "logic",  label: "Logic",     icon: <Cpu className="w-5 h-5" /> },
];

export default function MainNav({
  active,
  onSelect,
  hasGoldenHand = true,
}: {
  active: GambitTab;
  onSelect: (t: GambitTab) => void;
  hasGoldenHand?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { skin, skins, tokens, setSkin } = useTheme();
  const accent = tokens.primary;

  const pick = useCallback((t: GambitTab) => { onSelect(t); setOpen(false); }, [onSelect]);

  return (
    <>
      {/* official logo — top-left inside the phone */}
      <img src="/brand/madhatr-logo.png" alt="MAD Gambit" className="absolute top-2.5 left-3 z-40 h-8 w-auto pointer-events-none" />

      {/* hamburger with all links — top-right inside the phone */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="absolute top-3 right-3 z-40 grid place-items-center w-9 h-9 rounded-xl transition-transform active:scale-90"
        style={{ background: INK.bgPanel, border: `1px solid ${INK.borderGold}`, color: accent }}
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="absolute inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Main menu"
              className="absolute top-0 left-0 bottom-0 z-50 w-[78%] max-w-[320px] flex flex-col"
              style={{ background: INK.bgDeep, borderRight: `1px solid ${INK.borderGold}` }}
              initial={{ x: reduce ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : "-100%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${INK.border}` }}>
                <span className="font-black tracking-wide" style={{ color: accent, fontFamily: "Georgia, serif" }}>MΛĐ GAMBIT</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ color: INK.muted }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {NAV.map((n) => {
                  const isActive = active === n.id;
                  const locked = n.id === "casino" && !hasGoldenHand;
                  return (
                    <button
                      key={n.id}
                      onClick={() => !locked && pick(n.id)}
                      disabled={locked}
                      aria-current={isActive ? "page" : undefined}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                      style={{
                        color: isActive ? accent : INK.white,
                        background: isActive ? INK.bgPanel : "transparent",
                        borderLeft: `3px solid ${isActive ? accent : "transparent"}`,
                        opacity: locked ? 0.45 : 1,
                      }}
                    >
                      <span style={{ color: isActive ? accent : INK.muted }}>{n.icon}</span>
                      <span className="text-sm font-semibold tracking-wide">{n.label}</span>
                      {locked && <span className="ml-auto text-xs">🔒</span>}
                    </button>
                  );
                })}

                <a
                  href="/pitch/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                  style={{ color: INK.white }}
                >
                  <span style={{ color: INK.muted }}><FileText className="w-5 h-5" /></span>
                  <span className="text-sm font-semibold tracking-wide">Whitepaper · Data Room</span>
                </a>
              </div>

              {/* GLOBAL theme control — restyles the whole app */}
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${INK.border}` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: INK.muted }}>
                  <Palette className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-widest">Theme</span>
                </div>
                <div className="flex gap-2">
                  {skins.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSkin(s.id)}
                      aria-label={s.label}
                      aria-pressed={s.id === skin}
                      className="flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wide transition-all"
                      style={{
                        background: s.id === skin ? s.primary : INK.bgCard,
                        color: s.id === skin ? "#05070c" : INK.muted,
                        border: `1px solid ${s.id === skin ? s.primary : INK.border}`,
                      }}
                    >
                      {s.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
