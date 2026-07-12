"use client";

/**
 * MAD Gambit — useRipSound
 * ------------------------------------------------------------------
 * Synthesizes the pack-rip SFX with the Web Audio API (no binary asset):
 *   1. low "pop" as the foil breaks
 *   2. filtered noise sweep = the tear
 *   3. rising triangle sparkles = holo foil shimmer
 * Returns play(); SSR-safe, respects a muted flag.
 */
import { useCallback, useRef } from "react";

export function useRipSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = ctxRef.current ?? (ctxRef.current = new AC());
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;

      // 1. foil-break pop
      const pop = ctx.createOscillator(); pop.type = "sine";
      pop.frequency.setValueAtTime(140, now); pop.frequency.exponentialRampToValueAtTime(55, now + 0.14);
      const pg = ctx.createGain(); pg.gain.setValueAtTime(0.4, now); pg.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      pop.connect(pg).connect(ctx.destination); pop.start(now); pop.stop(now + 0.2);

      // 2. tear — filtered noise sweep
      const dur = 0.5;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) { const t = i / data.length; data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.5); }
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(1100, now + 0.04); bp.frequency.exponentialRampToValueAtTime(4200, now + dur);
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, now + 0.04); ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(bp).connect(ng).connect(ctx.destination); noise.start(now + 0.04); noise.stop(now + dur);

      // 3. holo shimmer sparkles
      [880, 1320, 1760, 2200].forEach((f, i) => {
        const s = now + 0.18 + i * 0.05;
        const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(f, s);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.13, s + 0.02); g.gain.exponentialRampToValueAtTime(0.001, s + 0.28);
        o.connect(g).connect(ctx.destination); o.start(s); o.stop(s + 0.3);
      });
    } catch { /* audio unavailable — silent no-op */ }
  }, []);
}
