"use client";

/**
 * MAD Gambit — DeviceFrame
 * ------------------------------------------------------------------
 * One responsive presentation shell for the whole dApp, applied globally in
 * app/layout.tsx. Renders its children exactly once:
 *
 *   Mobile  (< md)  — full-bleed, no frame. Native app feel.
 *   Tablet  (md)    — centered card with gutters on a dark field.
 *   Desktop (lg+)   — a real phone, auto-fitted to the workbench and zoomable.
 *
 * ZOOM, NOT STRETCH
 * The desktop bezel holds a REAL phone viewport (PHONE below) and is scaled as
 * a whole. It is deliberately not widened to fill the screen: widening changes
 * the CSS pixel width the app lays out against, so media queries flip, columns
 * re-flow, and it stops being a phone. Scaling multiplies every padding, gap,
 * radius and font by one factor, so what ships is pixel-identical to a handset
 * and the proportions cannot drift. Integrity comes from the geometry, not from
 * tuning components one at a time.
 *
 * WHICH PHONE
 * 393 x 852 is the modern median — iPhone 14 Pro/15/16 exactly, and within a
 * pixel of Pixel 5 (393x851). Scaling presents the whole 2020-2026 range
 * honestly, from Galaxy S20-S24 (360x800) to iPhone 16 Pro Max (440x956).
 *
 * TWO SCALES, MULTIPLIED
 *   fit  — auto, so the phone fills FILL of the workbench on any monitor
 *   user — the desktop zoom control, persisted, default 1
 * `--mg-device-zoom` is their product, so zooming stays proportional on every
 * screen instead of meaning something different on a laptop than on a 4K panel.
 *
 * The `transform` on .mg-device makes it the containing block for
 * `position: fixed` descendants, so the bottom-nav and concierge anchor to the
 * PHONE, not the browser window. That is load-bearing, and it is why the scale
 * uses `zoom` rather than a second transform: zoom participates in layout, so
 * scroll height, hit targets and fixed descendants stay consistent, where a
 * transform would scale the paint and leave the layout box — and the scrollable
 * area — at 1x.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";
import OVConvictionStateNode from "@/components/ov-conviction-state-node";

/** The logical phone the desktop bezel presents. iPhone 14 Pro/15/16. */
const PHONE = { w: 393, h: 852 };

/** Share of the workbench the auto-fit targets before any user zoom. */
const FILL = 0.85;

/**
 * Desktop-only enlargement, on top of FILL.
 *
 * The phone read small on a large monitor, so the fit target is raised by 20%.
 * The RESULT is then capped at the space actually available (see `maxFit`
 * below): 0.85 x 1.2 = 1.02 would put the phone slightly taller than the
 * workbench and crop its top and bottom, which is worse than being 2% smaller
 * than asked. In practice this lands at ~1.176x — the largest the phone can be
 * and still be whole. Users who want it bigger still have the zoom control.
 *
 * Desktop only by construction: below DESKTOP_MIN the CSS frame is
 * full-bleed/tablet and never reads the variable this feeds.
 */
const DESKTOP_BOOST = 1.2;

/** Below this the CSS frame is full-bleed/tablet and the scale is unused. */
const DESKTOP_MIN = 1024;

/** Bounds on the USER zoom. The fit scale is separate and always applied. */
const USER_MIN = 0.5;
const USER_MAX = 2.5;
const STEP = 0.1;

const STORAGE_KEY = "mg_device_zoom";

const clampUser = (z: number) => Math.min(USER_MAX, Math.max(USER_MIN, z));

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [userZoom, setUserZoom] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  // The auto-fit factor, kept in a ref: it is an input to the CSS variable, not
  // something the tree needs to re-render on.
  const fitRef = useRef(1);

  // Restore the saved zoom once, after mount, so server and first client paint
  // agree (reading localStorage during render would hydration-mismatch).
  useEffect(() => {
    try {
      const saved = parseFloat(localStorage.getItem(STORAGE_KEY) ?? "");
      if (Number.isFinite(saved)) setUserZoom(clampUser(saved));
    } catch {
      /* private mode — the default stands */
    }
  }, []);

  /** Push fit x user onto the element as the single CSS variable. */
  const publish = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (window.innerWidth < DESKTOP_MIN) {
      // Below desktop the CSS ignores it; clear so resizing down leaves no
      // stale scale behind.
      el.style.removeProperty("--mg-device-zoom");
      return;
    }
    el.style.setProperty("--mg-device-zoom", (fitRef.current * userZoom).toFixed(3));
  }, [userZoom]);

  useEffect(() => {
    const measure = () => {
      const desktop = window.innerWidth >= DESKTOP_MIN;
      setIsDesktop(desktop);
      if (desktop) {
        const styles = getComputedStyle(document.documentElement);
        const gutter = parseFloat(styles.getPropertyValue("--mg-frame-gutter-total")) || 56;
        // Fit against BOTH axes: height governs on a normal monitor, width
        // takes over on short-and-wide or split-screen windows. Whichever binds
        // first is what keeps the whole phone on screen.
        const availH = window.innerHeight - gutter;
        const availW = window.innerWidth - gutter;
        // The size asked for: FILL of the workbench, enlarged by the boost.
        const wanted = Math.min((availH * FILL) / PHONE.h, (availW * FILL) / PHONE.w) * DESKTOP_BOOST;
        // The largest that still fits whole, on whichever axis binds first.
        const maxFit = Math.min(availH / PHONE.h, availW / PHONE.w);
        fitRef.current = Math.min(wanted, maxFit);
      }
      publish();
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [publish]);

  // Re-publish whenever the user zoom changes, and persist it.
  useEffect(() => {
    publish();
    try {
      localStorage.setItem(STORAGE_KEY, String(userZoom));
    } catch {
      /* ignore */
    }
  }, [userZoom, publish]);

  // Ctrl/Cmd + wheel over the workbench zooms the phone, matching the gesture
  // people already use to zoom anything else. Without the modifier the wheel
  // scrolls the phone normally, so reading is never hijacked.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (window.innerWidth < DESKTOP_MIN) return;
      e.preventDefault(); // stop the browser's own page zoom
      setUserZoom((z) => clampUser(z - Math.sign(e.deltaY) * STEP));
    };
    // Not passive: preventDefault is the entire point.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="mg-workbench" ref={ref}>
      {/* .mg-device is the containing block for `position: fixed` descendants
          (via its transform) — that is what anchors the bottom nav and the
          concierge to the phone. It must therefore NOT be the thing that
          scrolls: a fixed child of a scrolling element scrolls with it, which
          is why the bottom bar and the concierge bubble rode up the screen.
          The scroll moves to an inner layer, so the phone's chrome stays put
          while its content moves under it. */}
      <div className="mg-device">
        <div className="mg-device-scroll">{children}</div>
      </div>

      {/* O-V Conviction State Node — desktop only, outside .mg-device for the
          same reason as the zoom bar below. Self-gates on isDesktop. */}
      <OVConvictionStateNode isDesktop={isDesktop} />

      {/* Zoom control — desktop only, and outside .mg-device so it is not
          itself zoomed by the variable it sets. */}
      {isDesktop ? (
        <div className="mg-zoombar" role="group" aria-label="Phone zoom">
          <button
            type="button"
            onClick={() => setUserZoom((z) => clampUser(z - STEP))}
            disabled={userZoom <= USER_MIN}
            aria-label="Zoom out"
            title="Zoom out (Ctrl/⌘ + scroll)"
          >
            <Minus size={13} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setUserZoom(1)}
            aria-label="Reset zoom to fit"
            title="Reset to fit"
            className="mg-zoombar-reset"
          >
            <Maximize2 size={11} strokeWidth={2.5} />
            <span>{Math.round(userZoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={() => setUserZoom((z) => clampUser(z + STEP))}
            disabled={userZoom >= USER_MAX}
            aria-label="Zoom in"
            title="Zoom in (Ctrl/⌘ + scroll)"
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
