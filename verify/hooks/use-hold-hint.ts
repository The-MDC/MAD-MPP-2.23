"use client";

/**
 * MAD Gambit — useHoldHint.
 * ══════════════════════════════════════════════════════════════════════
 * One hook, three input methods, one behaviour: reveal what a control is and
 * what to do with it, without stealing the control's primary action.
 *
 *   mouse     — hover with intent (a dwell delay, so sweeping the pointer
 *               across a dense instrument panel does not strobe hints)
 *   touch/pen — press and hold, cancelled by movement or an early release
 *   keyboard  — focus, immediately
 *
 * The keyboard path is not a nicety. WCAG 1.4.13 requires that content made
 * available on hover also be available on focus, so a hover-only version of
 * this would put every explanation in the app out of reach of anyone
 * navigating by keyboard. Focus opens without the dwell delay because focus is
 * already deliberate — there is no equivalent of sweeping past.
 *
 * ── The two traps this exists to get right ────────────────────────────
 *
 * 1. A hold must not also fire the tap. On touch, `pointerdown` → hold →
 *    `pointerup` still produces a `click`, so a long-press to ask "what is
 *    this?" would ALSO buy the card / place the bet / navigate away. The
 *    answer has to be a capture-phase click swallow, because by bubble phase
 *    the child's own onClick has already run.
 *
 * 2. A long press on touch raises the platform context menu (iOS callout,
 *    Android selection). Left alone it lands on top of the hint the press was
 *    meant to open. Suppressed only when a hold actually fired, so
 *    right-click on desktop keeps working normally.
 *
 * Returns props to spread onto the trigger. `HoldHint` does the spreading for
 * you; call the hook directly only when a component needs to merge these into
 * handlers it already owns.
 * ══════════════════════════════════════════════════════════════════════ */
import * as React from "react";
import { useHoldHintController, type HoldHintSpec } from "@/lib/hold-hint-context";

/** Pointer dwell before a mouse hover counts as intent, not transit. */
const HOVER_DELAY_MS = 450;
/** Press duration that separates a hold from a tap. */
const HOLD_DELAY_MS = 420;
/** Movement (px) that reclassifies a press as a drag or a scroll. */
const MOVE_CANCEL_PX = 8;

let hintSeq = 0;

export interface HoldHintTriggerProps {
  id?: string;
  "aria-describedby"?: string;
  "data-hold-hint"?: "true" | "open";
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onFocus: (e: React.FocusEvent) => void;
  onBlur: (e: React.FocusEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function useHoldHint(spec: HoldHintSpec | null | undefined): HoldHintTriggerProps {
  const { open, close, openId } = useHoldHintController();

  // Stable per mount. useState's initializer rather than useRef so the id is
  // allocated exactly once even under StrictMode's double-invoked render.
  const [id] = React.useState(() => `mg-hint-${++hintSeq}`);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = React.useRef({ x: 0, y: 0 });
  /** Set when a hold fired, so the resulting click and context menu are eaten. */
  const heldRef = React.useRef(false);
  const specRef = React.useRef(spec);
  specRef.current = spec;

  const isOpen = openId === id;

  const clearTimer = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = React.useCallback(
    (el: Element | null) => {
      const current = specRef.current;
      if (!current || !el) return;
      const r = el.getBoundingClientRect();
      open({ spec: current, id, rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
    },
    [open, id],
  );

  // Never leave a timer behind on unmount, and never leave the shared surface
  // showing a hint whose trigger has gone away.
  React.useEffect(() => {
    return () => {
      clearTimer();
      close(id);
    };
  }, [clearTimer, close, id]);

  const noop = !spec;

  const onPointerEnter = React.useCallback(
    (e: React.PointerEvent) => {
      if (noop || e.pointerType !== "mouse") return;
      const el = e.currentTarget;
      clearTimer();
      timer.current = setTimeout(() => show(el), HOVER_DELAY_MS);
    },
    [noop, clearTimer, show],
  );

  const onPointerLeave = React.useCallback(
    (e: React.PointerEvent) => {
      if (noop || e.pointerType !== "mouse") return;
      clearTimer();
      close(id);
    },
    [noop, clearTimer, close, id],
  );

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (noop || e.pointerType === "mouse") return; // mouse uses hover, not hold
      const el = e.currentTarget;
      origin.current = { x: e.clientX, y: e.clientY };
      heldRef.current = false;
      clearTimer();
      timer.current = setTimeout(() => {
        heldRef.current = true;
        // A hold produces no visible motion of its own, so without a tick of
        // haptic feedback the only signal that it worked is the hint appearing
        // — which is exactly what a user who does not yet know the gesture
        // exists is waiting to find out. Optional-chained: absent on iOS.
        navigator.vibrate?.(8);
        show(el);
      }, HOLD_DELAY_MS);
    },
    [noop, clearTimer, show],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (noop || !timer.current || e.pointerType === "mouse") return;
      const moved = Math.abs(e.clientX - origin.current.x) + Math.abs(e.clientY - origin.current.y);
      if (moved > MOVE_CANCEL_PX) clearTimer(); // it's a scroll or a drag
    },
    [noop, clearTimer],
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (noop || e.pointerType === "mouse") return;
      clearTimer(); // released before the threshold: an ordinary tap, let it through
    },
    [noop, clearTimer],
  );

  const onPointerCancel = React.useCallback(() => {
    if (noop) return;
    clearTimer();
    heldRef.current = false;
  }, [noop, clearTimer]);

  // Focus opens immediately (WCAG 1.4.13 — see header). Blur closes, unless
  // focus moved INTO the hint itself, which is how the action button inside it
  // stays reachable by keyboard.
  const onFocus = React.useCallback((e: React.FocusEvent) => {
    if (noop) return;
    show(e.currentTarget);
  }, [noop, show]);

  const onBlur = React.useCallback(
    (e: React.FocusEvent) => {
      if (noop) return;
      const next = e.relatedTarget as HTMLElement | null;
      if (next?.closest?.("[data-hold-hint-surface]")) return;
      close(id);
    },
    [noop, close, id],
  );

  const onClickCapture = React.useCallback((e: React.MouseEvent) => {
    if (!heldRef.current) return;
    // Capture phase, before the child's own onClick — see trap 1 above.
    heldRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onContextMenu = React.useCallback((e: React.MouseEvent) => {
    if (!heldRef.current) return; // desktop right-click is untouched
    e.preventDefault();
  }, []);

  return {
    id: noop ? undefined : id,
    "aria-describedby": isOpen ? `${id}-surface` : undefined,
    "data-hold-hint": noop ? undefined : isOpen ? "open" : "true",
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onFocus,
    onBlur,
    onClickCapture,
    onContextMenu,
  };
}
