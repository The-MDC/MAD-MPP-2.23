"use client";

/**
 * MAD Gambit — useRipSound (satirical)
 * ------------------------------------------------------------------
 * Pack-rip SFX, Web Audio only (no binary). Tone: Willy-Wonka whimsy
 * meets a cheeky little South Park gag —
 *   1. cartoon BOING as the foil breaks
 *   2. magical SLIDE-WHISTLE sweep up
 *   3. glockenspiel SPARKLE arpeggio (pure-imagination bells)
 *   4. a crude little RASPBERRY buzz to undercut it (the joke)
 * Returns play(); SSR-safe, silent no-op if audio unavailable.
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
      const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);

      const tone = (type: OscillatorType, f0: number, f1: number, t0: number, dur: number, vol: number, vibrato = 0) => {
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(f0, now + t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + t0 + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + t0); g.gain.linearRampToValueAtTime(vol, now + t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
        if (vibrato) { const lfo = ctx.createOscillator(); lfo.frequency.value = vibrato; const la = ctx.createGain(); la.gain.value = f0 * 0.06; lfo.connect(la).connect(o.frequency); lfo.start(now + t0); lfo.stop(now + t0 + dur); }
        o.connect(g).connect(master); o.start(now + t0); o.stop(now + t0 + dur + 0.02);
      };

      // 1. cartoon BOING — square, quick down-then-up wobble
      tone("square", 320, 90, 0, 0.12, 0.32);
      tone("square", 90, 300, 0.10, 0.12, 0.28);

      // 2. magical SLIDE-WHISTLE up (Wonka whimsy)
      tone("triangle", 480, 1900, 0.18, 0.34, 0.28, 6);

      // 3. glockenspiel SPARKLE arpeggio — pure-imagination bells (C E G C)
      [1046, 1318, 1568, 2093].forEach((f, i) => tone("triangle", f, f, 0.30 + i * 0.06, 0.30, 0.16));

      // 4. crude little RASPBERRY buzz to undercut it (South Park)
      tone("sawtooth", 95, 70, 0.66, 0.26, 0.30, 24);
    } catch { /* audio unavailable — silent no-op */ }
  }, []);
}
