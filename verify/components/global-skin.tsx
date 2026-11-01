"use client";

/**
 * One theme for the whole app.
 * ------------------------------------------------------------------
 * ThemeProvider (context/theme-context.tsx) is the single store: it persists the
 * active ThemeSkin and writes the --mg-* custom properties on <html>. Before this
 * component, only /mpp2.23 projected that skin onto useSkin(); /preview ran its own
 * uncontrolled SkinProvider with a second storage key (mg_skin), and every other
 * route fell back to the default skin. That is the "two different apps" effect.
 *
 * Mounted once in app/layout.tsx, this publishes the ThemeProvider skin to every
 * useSkin() consumer on every route, and routes useSkin().toggle()/setSkin() back
 * into ThemeProvider so there is exactly one theme control and one store.
 */
import React from "react";
import { useTheme } from "@/context/theme-context";
import { SkinProvider } from "@/components/skin-provider";
import { THEME_SKIN_TO_SKIN_NAME, type SkinName } from "@/lib/skins";
import type { ThemeSkin } from "@/lib/gambit-game-math";

/** Inverse of THEME_SKIN_TO_SKIN_NAME for the two-way toggle (the map is many-to-one). */
const SKIN_NAME_TO_THEME_SKIN: Record<SkinName, ThemeSkin> = {
  neonNoir: "CyberOnyx",
  gilded: "HolographicGoldLaser",
};

export default function GlobalSkin({ children }: { children: React.ReactNode }) {
  const { skin, setSkin } = useTheme();
  return (
    <SkinProvider
      value={THEME_SKIN_TO_SKIN_NAME[skin]}
      onChange={(n) => setSkin(SKIN_NAME_TO_THEME_SKIN[n])}
    >
      {children}
    </SkinProvider>
  );
}
