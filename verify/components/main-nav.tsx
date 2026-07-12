"use client";

/**
 * MAD Gambit — Menu Bar (logo dashboards-menu + hamburger account-drawer)
 * ------------------------------------------------------------------
 * Two distinct menus, docked inside the DeviceFrame phone:
 *   LOGO (top-left)      → quick-menu of PLATFORM dashboards
 *                          (Markets · Reports · Admin · Analytics · Leaderboard).
 *                          Rapid-tapping the logo spins it like a fidget spinner.
 *   HAMBURGER (top-right) → PERSONAL/account drawer
 *                          (Profile · Wallet · Personal Marketplace · P2P Market ·
 *                           Staking · Settings) + global theme + data-room.
 * INK tokens only, reduced-motion aware, items map to hub tabs where one exists
 * and show a "soon" chip otherwise so nothing dead-ends.
 */
import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu, X, Palette, FileText, LayoutDashboard, BarChart3, ShieldCheck, LineChart, Trophy,
  User, Wallet, Store, ArrowLeftRight, Ticket, Settings as SettingsIcon, Percent, LifeBuoy, BookOpen, Gauge,
} from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import type { GambitTab } from "@/components/bottom-nav";
import { useTheme } from "@/context/theme-context";

type Item = { label: string; icon: React.ReactNode; tab?: GambitTab; href?: string; soon?: boolean };

// LOGO menu — platform dashboards only
const DASHBOARDS: Item[] = [
  { label: "Markets",       icon: <BarChart3 className="w-4 h-4" />,   tab: "floor" },
  { label: "Z-Liar Meter",  icon: <Gauge className="w-4 h-4" />,       tab: "floor" },
  { label: "Staking",       icon: <Ticket className="w-4 h-4" />,      tab: "portal" },
  { label: "Stop Loss 40%", icon: <Percent className="w-4 h-4" />,     tab: "floor" },
  { label: "Reports",       icon: <FileText className="w-4 h-4" />,    tab: "logic" },
  { label: "Analytics",     icon: <LineChart className="w-4 h-4" />,   tab: "logic" },
  { label: "Leaderboard",   icon: <Trophy className="w-4 h-4" />,      tab: "arena" },
  { label: "Admin",         icon: <ShieldCheck className="w-4 h-4" />, tab: "logic" },
];

// HAMBURGER — personal / account
const ACCOUNT: Item[] = [
  { label: "Profile",              icon: <User className="w-5 h-5" />,          tab: "portal" },
  { label: "Wallet",               icon: <Wallet className="w-5 h-5" />,         tab: "portal" },
  { label: "Personal Marketplace", icon: <Store className="w-5 h-5" />,          tab: "saga" },
  { label: "P2P Market",           icon: <ArrowLeftRight className="w-5 h-5" />, tab: "saga" },
  { label: "Support",              icon: <LifeBuoy className="w-5 h-5" />,       href: "/pitch/index.html" },
  { label: "Knowledge Base",       icon: <BookOpen className="w-5 h-5" />,       href: "/pitch/index.html" },
];

export default function MainNav({
  active,
  onSelect,
}: {
  active: GambitTab;
  onSelect: (t: GambitTab) => void;
  hasGoldenHand?: boolean;
}) {
  const [open, setOpen] = useState(false);   // hamburger drawer
  const [dash, setDash] = useState(false);   // logo dashboards menu
  const [spins, setSpins] = useState(0);     // fidget-spin accumulator
  const lastTap = useRef(0);
  const reduce = useReducedMotion();
  const { skin, skins, tokens, setSkin } = useTheme();
  const accent = tokens.primary;

  const haptic = () => { if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(6); } catch {} } };

  // Logo: deliberate tap toggles the dashboards menu; rapid taps fidget-spin.
  const onLogo = useCallback(() => {
    const now = Date.now();
    const rapid = now - lastTap.current < 350;
    lastTap.current = now;
    setSpins((s) => s + 1);
    haptic();
    if (rapid) setDash(false); else setDash((d) => !d);
  }, []);

  const pick = useCallback((it: Item, close: () => void) => {
    if (it.href) { if (typeof window !== "undefined") window.open(it.href, "_blank", "noopener"); close(); return; }
    if (it.tab) onSelect(it.tab);
    close();
  }, [onSelect]);

  return (
    <>
      {/* ── Official logo — top-left, clickable dashboards + fidget-spin ── */}
      <div className="absolute top-2 left-3 z-40">
        <motion.img
          src="/brand/madhatr-logo.png" alt="MAD Gambit — dashboards"
          onClick={onLogo} role="button" aria-label="Platform dashboards"
          className="h-9 w-auto cursor-pointer select-none"
          animate={reduce ? undefined : { rotate: spins * 360 }}
          transition={{ type: "spring", stiffness: 55, damping: 11 }}
          draggable={false}
        />
        <AnimatePresence>
          {dash && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDash(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: reduce ? 0 : 0.16 }}
                className="absolute left-0 mt-1 z-50 w-52 rounded-2xl border p-2 shadow-2xl"
                style={{ background: INK.bgDeep, borderColor: INK.borderGold }}
                role="menu" aria-label="Platform dashboards"
              >
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1" style={{ color: accent }}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]">Dashboards</span>
                </div>
                {DASHBOARDS.map((it) => (
                  <button key={it.label} type="button" role="menuitem" onClick={() => pick(it, () => setDash(false))}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors"
                    style={{ color: it.soon ? INK.muted : INK.white, background: it.tab === active ? `${accent}18` : "transparent" }}>
                    <span style={{ color: it.tab === active ? accent : INK.muted }}>{it.icon}</span>
                    <span className="text-[12px] font-semibold tracking-wide">{it.label}</span>
                    {it.soon && <span className="ml-auto text-[8px] font-bold uppercase" style={{ color: INK.goldDim }}>soon</span>}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Hamburger — top-right, personal/account drawer ── */}
      <button
        onClick={() => { haptic(); setOpen(true); }}
        aria-label="Open account menu" aria-expanded={open}
        className="absolute top-3 right-3 z-40 grid place-items-center w-9 h-9 rounded-xl transition-transform active:scale-90"
        style={{ background: INK.bgPanel, border: `1px solid ${INK.borderGold}`, color: accent }}
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="absolute inset-0 z-40" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.18 }} onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Account menu"
              className="absolute top-0 right-0 bottom-0 z-50 w-[78%] max-w-[320px] flex flex-col"
              style={{ background: INK.bgDeep, borderLeft: `1px solid ${INK.borderGold}` }}
              initial={{ x: reduce ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : "100%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${INK.border}` }}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>Account</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ color: INK.muted }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {ACCOUNT.map((it) => {
                  const isActive = it.tab === active;
                  return (
                    <button key={it.label} onClick={() => pick(it, () => setOpen(false))} disabled={it.soon}
                      aria-current={isActive ? "page" : undefined}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                      style={{ color: isActive ? accent : (it.soon ? INK.muted : INK.white), background: isActive ? INK.bgPanel : "transparent", borderLeft: `3px solid ${isActive ? accent : "transparent"}`, opacity: it.soon ? 0.6 : 1 }}>
                      <span style={{ color: isActive ? accent : INK.muted }}>{it.icon}</span>
                      <span className="text-sm font-semibold tracking-wide">{it.label}</span>
                      {it.soon && <span className="ml-auto text-[9px] font-bold uppercase" style={{ color: INK.goldDim }}>soon</span>}
                    </button>
                  );
                })}

                <a href="/pitch/index.html" target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors" style={{ color: INK.white }}>
                  <span style={{ color: INK.muted }}><FileText className="w-5 h-5" /></span>
                  <span className="text-sm font-semibold tracking-wide">Whitepaper · Data Room</span>
                </a>
              </div>

              {/* Settings — global theme control (restyles the whole app) */}
              <div className="px-5 py-4" style={{ borderTop: `1px solid ${INK.border}` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: INK.muted }}>
                  <SettingsIcon className="w-4 h-4" /><Palette className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-widest">Settings · Theme</span>
                </div>
                <div className="flex gap-2">
                  {skins.map((s) => (
                    <button key={s.id} onClick={() => setSkin(s.id)} aria-label={s.label} aria-pressed={s.id === skin}
                      className="flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wide transition-all"
                      style={{ background: s.id === skin ? s.primary : INK.bgCard, color: s.id === skin ? "#05070c" : INK.muted, border: `1px solid ${s.id === skin ? s.primary : INK.border}` }}>
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
