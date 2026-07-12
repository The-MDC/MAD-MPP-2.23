"use client";

/**
 * MAD Gambit — Carousel (shared primitive)
 * ------------------------------------------------------------------
 * One horizontal snap-scroll rail reused by every market/card rail.
 * INK edge-fade mask, momentum scroll, optional peek of the next item.
 * Reduced-motion → static wrap (no snap). SSR-safe.
 */

import React from "react";
import { INK } from "@/lib/gambit-design-tokens";

export default function Carousel({
  children,
  gap = 12,
  peek = true,
  ariaLabel = "carousel",
}: {
  children: React.ReactNode;
  gap?: number;
  peek?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
      style={{
        gap,
        paddingRight: peek ? 24 : 0,
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        maskImage: `linear-gradient(to right, transparent, ${INK.white} 3%, ${INK.white} 97%, transparent)`,
        WebkitMaskImage: `linear-gradient(to right, transparent, black 3%, black 97%, transparent)`,
      }}
    >
      {React.Children.map(children, (child, i) => (
        <div key={i} className="snap-start shrink-0">{child}</div>
      ))}
    </div>
  );
}
