"use client";

/**
 * Global theme provider — single source of truth for the app's skin.
 * ------------------------------------------------------------------
 * Holds the active ThemeSkin, persists it, and writes the skin's tokens as
 * CSS custom properties on <html> (`--mg-primary`, `--mg-bg`, …) so EVERY
 * page and component — the root `/` dashboard, the `/gambit` hub, and the
 * DeviceFrame render — share one theme. The `/gambit` skin menu and the
 * MainNav theme button both drive this, keeping aesthetics global and in sync.
 *
 * Consumers read either the typed `tokens` (SkinTokens) via useTheme(), or the
 * `var(--mg-*)` custom properties in CSS/inline styles.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ThemeSkin, SkinTokens, SKIN_TOKENS } from "@/lib/gambit-game-math";

interface ThemeCtx {
  skin: ThemeSkin;
  tokens: SkinTokens;
  skins: SkinTokens[];
  setSkin: (s: ThemeSkin) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const LS_KEY = "mad_theme_skin";
const DEFAULT: ThemeSkin = "HolographicGoldLaser";

function applyVars(t: SkinTokens) {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  r.style.setProperty("--mg-primary", t.primary);
  r.style.setProperty("--mg-secondary", t.secondary);
  r.style.setProperty("--mg-accent", t.accent);
  r.style.setProperty("--mg-bg", t.bg);
  r.style.setProperty("--mg-panel", t.panel);
  r.style.setProperty("--mg-border", t.border);
  r.style.setProperty("--mg-glow", t.glow);
  r.setAttribute("data-skin", t.id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<ThemeSkin>(DEFAULT);

  // hydrate persisted choice
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LS_KEY) as ThemeSkin | null;
    if (saved && SKIN_TOKENS[saved]) setSkinState(saved);
  }, []);

  // apply globally + persist on change
  useEffect(() => {
    applyVars(SKIN_TOKENS[skin]);
    if (typeof window !== "undefined") window.localStorage.setItem(LS_KEY, skin);
  }, [skin]);

  const setSkin = useCallback((s: ThemeSkin) => {
    if (SKIN_TOKENS[s]) setSkinState(s);
  }, []);

  return (
    <Ctx.Provider value={{ skin, tokens: SKIN_TOKENS[skin], skins: Object.values(SKIN_TOKENS), setSkin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
