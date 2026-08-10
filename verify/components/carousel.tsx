"use client";

/**
 * MAD Gambit — Carousel (shared primitive)
 * ------------------------------------------------------------------
 * One horizontal snap-scroll rail reused by every market/card rail.
 * INK edge-fade mask, momentum scroll, optional peek of the next item.
 * Reduced-motion → static wrap (no snap). SSR-safe.
 *
 * Auto-showcase
 * -------------
 * A rail that auto-advances showcases its markets/tickers without the
 * user touching it. Any section that does this MUST carry
 * <AutoShowcaseBadge /> in its header — the blue circle-and-arrow mark
 * is the platform's promise that the rail moves on its own. Badge and
 * behaviour ship together; do not use one without the other.
 *
 * Rails built on this primitive get it from the `auto` prop. Rails with
 * their own scroll container (market-type-carousels) call
 * `useAutoShowcase` directly so the pause rules live in one place.
 *
 * Auto-advance yields to the user in every case that matters: it never
 * starts under prefers-reduced-motion, and it pauses while the rail is
 * hovered, focused, touched, scrolled off screen, or on a hidden tab.
 */

import React from "react";
import { INK } from "@/lib/gambit-design-tokens";

/** Pause this long after the user touches/drags/wheels the rail themselves. */
const USER_PAUSE_MS = 6000;

/**
 * The blue circle-and-arrow mark. Its presence on a section header means
 * "this rail auto-showcases its markets or tickers".
 */
export function AutoShowcaseBadge({
  label = "Auto-showcasing",
}: {
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ display: "inline-flex", alignItems: "center", flex: "none" }}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ filter: `drop-shadow(0 0 3px ${INK.cyan}66)` }}
      >
        <circle
          cx="12"
          cy="12"
          r="9.25"
          fill={`${INK.cyan}1a`}
          stroke={INK.cyan}
          strokeWidth="1.6"
        />
        <path
          d="M10 8.5 L14.5 12 L10 15.5"
          fill="none"
          stroke={INK.cyan}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Handlers the caller must spread onto the scrolling element. */
export interface AutoShowcaseHandlers {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onPointerDown?: () => void;
  onWheel?: () => void;
}

/**
 * Advances a horizontal scroll container one item at a time, wrapping at
 * the end. Returns the handlers that implement the pause rules — spread
 * them onto the same element the ref points at.
 */
export function useAutoShowcase(
  ref: { current: HTMLElement | null },
  {
    enabled = true,
    intervalMs = 4200,
    gap = 0,
  }: { enabled?: boolean; intervalMs?: number; gap?: number } = {},
): AutoShowcaseHandlers {
  // Every reason the rail might be holding still is tracked separately, so
  // releasing one (un-hovering) doesn't resume while another (scrolled off
  // screen) still applies.
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [onScreen, setOnScreen] = React.useState(true);
  const [pageVisible, setPageVisible] = React.useState(true);
  // Read at tick time rather than gating the effect, so the deadline
  // passing doesn't need to re-run anything.
  const userPausedUntil = React.useRef(0);
  // Resolved after mount only — SSR has no matchMedia, and defaulting to
  // "reduced" keeps the server and first client render identical.
  const [reducedMotion, setReducedMotion] = React.useState(true);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const sync = () => setPageVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [enabled]);

  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, ref]);

  const running =
    enabled && !reducedMotion && !hovered && !focused && onScreen && pageVisible;

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const el = ref.current;
      if (!el || Date.now() < userPausedUntil.current) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) return; // nothing overflows — nothing to showcase

      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + gap : el.clientWidth;
      const next = el.scrollLeft + step;
      el.scrollTo({
        left: next > maxScroll - 1 ? 0 : next,
        behavior: "smooth",
      });
    }, Math.max(1200, intervalMs));
    return () => window.clearInterval(id);
  }, [running, intervalMs, gap, ref]);

  const hold = React.useCallback(() => {
    userPausedUntil.current = Date.now() + USER_PAUSE_MS;
  }, []);

  if (!enabled) return {};
  return {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onPointerDown: hold,
    onWheel: hold,
  };
}

export default function Carousel({
  children,
  gap = 12,
  peek = true,
  ariaLabel = "carousel",
  auto = false,
  intervalMs = 4200,
}: {
  children: React.ReactNode;
  gap?: number;
  peek?: boolean;
  ariaLabel?: string;
  /** Advance on a timer. Requires <AutoShowcaseBadge /> on the section header. */
  auto?: boolean;
  intervalMs?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const handlers = useAutoShowcase(ref, { enabled: auto, intervalMs, gap });

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      {...handlers}
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
