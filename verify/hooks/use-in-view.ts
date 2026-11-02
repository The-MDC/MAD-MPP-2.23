"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether an element is near the viewport. `seen` latches true the first time it
 * is, so a heavy child can be mounted on approach and never torn down by
 * scrolling away; `inView` tracks it live, so that child can pause while it is
 * off screen. Without IntersectionObserver both are true — show it, don't hide it.
 */
export function useInView<T extends Element>(rootMargin = "240px") {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ seen: false, inView: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      let live = true;
      queueMicrotask(() => { if (live) setState({ seen: true, inView: true }); });
      return () => { live = false; };
    }
    const io = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (last) setState((s) => ({ seen: s.seen || last.isIntersecting, inView: last.isIntersecting }));
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, ...state };
}
