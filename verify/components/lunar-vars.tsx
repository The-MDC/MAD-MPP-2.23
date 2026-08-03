"use client";

/**
 * MAD Gambit — lunar CSS vars (D14 §9, one call on load).
 * ------------------------------------------------------------------
 * Sets --lunar-warmth (0–1, new→full illumination) and --lunar-tempo
 * (0.85–1.15) on <html> once per mount. Full moon: warmer, 15% livelier.
 * New moon: pure black, slower. Felt, never shown. The math is the
 * canonical lunar engine in gambit-game-math (Immaculate Conception
 * epoch 1979-12-08, cycle 2,551,442,877ms).
 */
import { useEffect } from "react";
import { getLunarIllumination } from "@/lib/gambit-game-math";

export default function LunarVars() {
  useEffect(() => {
    const illum = getLunarIllumination();
    const root = document.documentElement;
    root.style.setProperty("--lunar-warmth", illum.toFixed(4));
    root.style.setProperty("--lunar-tempo", (0.85 + illum * 0.3).toFixed(4));
  }, []);
  return null;
}
