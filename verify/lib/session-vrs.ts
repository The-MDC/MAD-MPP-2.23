/**
 * MAD Gambit — session VRS (D14 §6, S0.8). Browser-only mechanic:
 * sessionStorage key `mg_vrs_streak`, incremented on node open · CTA tap ·
 * conviction tap. At the Fibonacci triggers [5,8,13,21,34] the JoyLayer
 * fires, scaled — celebration durations are the Part VIII retcon
 * (Fibonacci milliseconds: 610/987/1597/2584/4181). When accounts wire
 * in later, the streak migrates from sessionStorage to MADConv.
 */
import { VRS_TRIGGERS } from "@/lib/gambit-game-math";

export const VRS_STORAGE_KEY = "mg_vrs_streak";
export const VRS_EVENT = "mg:vrs";

export interface VrsCelebration {
  streak: number;
  particles: number;
  durationMs: number;
  quip: string;
  goldWash?: boolean;
}

/** Particle counts 88/144/233 are themselves Fibonacci. The reward IS the math. */
const CELEBRATIONS: Record<number, Omit<VrsCelebration, "streak">> = {
  5: { particles: 24, durationMs: 610, quip: "Streak engaged. 5 → 8." },
  8: { particles: 48, durationMs: 987, quip: "Eight. The platform notices." },
  13: { particles: 88, durationMs: 1597, quip: "Fibonacci 13. The streak multiplies." },
  21: { particles: 144, durationMs: 2584, quip: "Twenty-one. Conviction compounds." },
  34: { particles: 233, durationMs: 4181, quip: "THIRTY-FOUR. They all said quit.", goldWash: true },
};

export function getVrsStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(VRS_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** The next Fibonacci trigger strictly above the current streak (55 = beyond the table). */
export function nextVrsTrigger(streak: number): number {
  for (let i = 0; i < VRS_TRIGGERS.length; i++) {
    if (VRS_TRIGGERS[i] > streak) return VRS_TRIGGERS[i];
  }
  return 55;
}

/** Increment the session streak. Persists, dispatches `mg:vrs`, and returns
 *  the celebration when the new count lands on a Fibonacci node. */
export function bumpVrsStreak(): { streak: number; celebration: VrsCelebration | null } {
  if (typeof window === "undefined") return { streak: 0, celebration: null };
  const streak = getVrsStreak() + 1;
  try {
    window.sessionStorage.setItem(VRS_STORAGE_KEY, String(streak));
  } catch {
    /* private mode — streak still fires in-memory this tick */
  }
  const hit = CELEBRATIONS[streak];
  const celebration = hit ? { streak, ...hit } : null;
  window.dispatchEvent(new CustomEvent(VRS_EVENT, { detail: { streak, celebration } }));
  return { streak, celebration };
}
