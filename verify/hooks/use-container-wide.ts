"use client";

/**
 * MAD Gambit — useContainerWide
 * ------------------------------------------------------------------
 * "Is this element wide enough for the desktop layout?" — measured on the
 * ELEMENT, not on the browser window.
 *
 * Why this exists: the whole dApp renders inside DeviceFrame, and on desktop
 * .mg-device is a 440px phone (clamp(360px, 42vw, 440px)). A page that asks
 * window.matchMedia("(min-width: 1024px)") gets `true` on a 1920px monitor and
 * lays out for 1024px+ — pinning side rails and a 1300px column — inside a
 * 440px box. The viewport stopped describing the layout box the moment the
 * frame went global; the container is the only honest source.
 *
 * ResizeObserver rather than a media query because that is exactly the
 * question being asked: how wide is THIS box, whatever the window is doing.
 *
 * SSR-safe: starts false and measures after mount, so the server and the first
 * client paint agree (a window read during render would mismatch).
 */

import { useEffect, useState, type RefObject } from "react";

export function useContainerWide(
  ref: RefObject<HTMLElement | null>,
  breakpointPx = 1024,
): boolean {
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Older engines without ResizeObserver fall back to the window, which is
    // the pre-frame behaviour — degraded, but never a crash.
    if (typeof ResizeObserver === "undefined") {
      const apply = () => setWide(window.innerWidth >= breakpointPx);
      apply();
      window.addEventListener("resize", apply);
      return () => window.removeEventListener("resize", apply);
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // borderBoxSize is the modern read; contentRect is the fallback for
        // engines that implement ResizeObserver but not the newer boxes.
        const w = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setWide(w >= breakpointPx);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, breakpointPx]);

  return wide;
}

export default useContainerWide;
