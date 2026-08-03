"use client";

/**
 * MAD Gambit — useRollingNumber (D14 §7). rAF count-up to a target value,
 * 200–300ms ease-out, re-fires on value change and on first viewport entry
 * (IntersectionObserver). Consumers render with `font-variant-numeric:
 * tabular-nums` (the .font-numeral token class) so digits never shift
 * layout mid-roll. Robinhood-benchmark smoothness, zero dependencies.
 */
import { useEffect, useRef, useState } from "react";

export function useRollingNumber(target: number, durationMs = 280) {
  const [value, setValue] = useState(0);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const raf = useRef<number | undefined>(undefined);
  const from = useRef(0);

  // First-entry observer — the roll starts when the number scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0] && entries[0].isIntersecting) setSeen(true);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const startVal = from.current;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const v = startVal + (target - startVal) * ease;
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      from.current = target;
    };
  }, [target, seen, durationMs]);

  return { value, ref };
}
