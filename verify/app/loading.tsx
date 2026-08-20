"use client";

/**
 * Root loading state.
 *
 * Next renders this instantly on navigation while a server segment resolves.
 * Without it the previous route stays frozen on screen with no acknowledgement
 * of the click — the single most common cause of "it feels slow" on an app
 * whose routes hit Neon before they can paint.
 *
 * This is a SKELETON, not a spinner, and that is deliberate: it reserves the
 * same boxes the real instrument panels occupy, so the layout doesn't jump when
 * content arrives. A centred spinner would swap for a full grid and shove
 * everything down — measurable CLS, not just a cosmetic difference.
 *
 * The pulse is gated behind motion-safe: under prefers-reduced-motion this
 * renders as static blocks, consistent with how the Octavian swarm is pinned.
 */

import React from "react";

const Block = ({ className = "" }: { className?: string }) => (
  <div
    className={`rounded-xl border border-neutral-800/60 bg-neutral-900/40 motion-safe:animate-pulse ${className}`}
  />
);

export default function Loading() {
  return (
    <div
      className="min-h-screen bg-[#030303] p-4 sm:p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading platform segment</span>

      {/* Header lockup */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Block className="h-8 w-48" />
        <Block className="h-8 w-32" />
      </div>

      {/* Ticker strip */}
      <Block className="h-10 w-full mb-6" />

      {/* Instrument grid — mirrors the deck's auto-fit columns so the
          skeleton occupies the same footprint the real cards will. */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(238px,1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
