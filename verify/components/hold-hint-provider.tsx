"use client";

/**
 * MAD Gambit — hold-hint provider and surface.
 * ══════════════════════════════════════════════════════════════════════
 * Mounted once, at the root. Owns the single hint surface for the whole app
 * and the small amount of state that makes one hint at a time behave.
 *
 * ── Why a portal, and why positioned from a viewport rect ─────────────
 * This app is built out of exactly the containers that break in-place
 * tooltips: a sticky header, horizontally-scrolling ticker rails with
 * `overflow: hidden`, a `transform`-ed device frame, and carousels that clip
 * their own children by design. A hint rendered next to its trigger inherits
 * all of that — clipped, stacked underneath, or offset by an ancestor
 * transform. Rendering into `document.body` from a rect captured at open time
 * sidesteps every one of them.
 *
 * ── The grace period is not polish ───────────────────────────────────
 * WCAG 1.4.13 requires hover-revealed content to be *hoverable*: the pointer
 * must be able to travel from the trigger onto the content without it
 * vanishing en route. A trigger that closes on `pointerleave` makes that
 * impossible, and takes the action button inside the hint with it. So `close`
 * defers, and the surface cancels the pending close when the pointer arrives.
 * Same reason Escape closes and an outside tap closes: dismissible, persistent,
 * hoverable — all three.
 * ══════════════════════════════════════════════════════════════════════ */
import React from "react";
import { createPortal } from "react-dom";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { HoldHintContext, type OpenHint } from "@/lib/hold-hint-context";

/** Pointer travel time from trigger to surface. See the header. */
const CLOSE_GRACE_MS = 160;
/** Gap between the trigger and the card. */
const OFFSET = 10;
/** Keep the card off the viewport edges. */
const EDGE = 8;
const MAX_W = 280;

/**
 * useLayoutEffect is the right hook here — the card must be measured and moved
 * before the browser paints, or it flashes at the wrong position — but React
 * warns when it runs during a server render, and this provider is in the root
 * layout, so that warning would print on every route. Falling back to
 * useEffect on the server keeps the correct behaviour in the browser and stays
 * quiet where the hook has nothing to do anyway.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

interface Placed {
  top: number;
  left: number;
}

const KIND_LABEL: Record<NonNullable<OpenHint["spec"]["kind"]>, string> = {
  measured: "measured",
  estimated: "est.",
  sample: "sample data",
};

export default function HoldHintProvider({ children }: { children: React.ReactNode }) {
  const { skin } = useSkin();
  const [hint, setHint] = React.useState<OpenHint | null>(null);
  const [placed, setPlaced] = React.useState<Placed | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portals need a DOM target, which does not exist during the server render.
  React.useEffect(() => setMounted(true), []);

  const cancelPendingClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const open = React.useCallback(
    (next: OpenHint) => {
      cancelPendingClose();
      setPlaced(null); // re-measure for the new trigger before painting
      setHint(next);
    },
    [cancelPendingClose],
  );

  const closeNow = React.useCallback(() => {
    cancelPendingClose();
    setHint(null);
    setPlaced(null);
  }, [cancelPendingClose]);

  /**
   * Deferred, and only if `id` still owns the surface. Without the ownership
   * check, moving the mouse from one hinted control straight onto the next
   * would let the first trigger's leave close the second trigger's hint.
   */
  const close = React.useCallback(
    (id: string) => {
      cancelPendingClose();
      closeTimer.current = setTimeout(() => {
        setHint((cur) => (cur && cur.id !== id ? cur : null));
        setPlaced((cur) => (cur ? null : cur));
      }, CLOSE_GRACE_MS);
    },
    [cancelPendingClose],
  );

  // Measure, then place. Below the trigger by preference; flipped above when
  // the card would run off the bottom; clamped horizontally either way.
  useIsomorphicLayoutEffect(() => {
    if (!hint || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const r = hint.rect;

    const below = r.top + r.height + OFFSET;
    const above = r.top - card.height - OFFSET;
    const fitsBelow = below + card.height <= vh - EDGE;
    const top = fitsBelow ? below : Math.max(EDGE, above);

    const centred = r.left + r.width / 2 - card.width / 2;
    const left = Math.min(Math.max(EDGE, centred), Math.max(EDGE, vw - card.width - EDGE));

    setPlaced({ top, left });
  }, [hint]);

  // A hint is anchored to a rect captured at open time, so any scroll or
  // resize invalidates it. Re-measuring on every scroll frame would be the
  // other option; closing is both cheaper and less disorienting than a card
  // that chases the page.
  React.useEffect(() => {
    if (!hint) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeNow(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", closeNow, true);
    window.addEventListener("resize", closeNow);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", closeNow, true);
      window.removeEventListener("resize", closeNow);
    };
  }, [hint, closeNow]);

  React.useEffect(() => () => cancelPendingClose(), [cancelPendingClose]);

  const ctx = React.useMemo(
    () => ({ open, close, openId: hint?.id ?? null }),
    [open, close, hint?.id],
  );

  const surface =
    mounted && hint
      ? createPortal(
          <div
            ref={cardRef}
            id={`${hint.id}-surface`}
            data-hold-hint-surface=""
            // A tooltip cannot contain a focusable control — screen readers
            // give no way to reach one. With an action it is a small non-modal
            // dialog; without, a plain tooltip. The role follows the content
            // rather than being asserted once and then quietly violated.
            role={hint.spec.action ? "dialog" : "tooltip"}
            aria-label={hint.spec.action ? hint.spec.title : undefined}
            onPointerEnter={cancelPendingClose}
            onPointerLeave={closeNow}
            style={{
              position: "fixed",
              top: placed?.top ?? 0,
              left: placed?.left ?? 0,
              // Off-screen and invisible for the measuring pass, so the card is
              // never seen at the wrong position for a frame.
              visibility: placed ? "visible" : "hidden",
              zIndex: 1400,
              width: `min(${MAX_W}px, calc(100vw - ${EDGE * 2}px))`,
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 12,
              background: skin.panel,
              border: `1px solid ${skin.border}`,
              boxShadow: "0 14px 44px rgba(0,0,0,0.55)",
              fontFamily: INSTRUMENT_FONT,
              color: skin.text,
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, fontSize: 9.5, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: skin.gold }}>
                {hint.spec.title}
              </span>
              {hint.spec.kind ? (
                <span
                  style={{
                    flex: "none",
                    fontSize: 7,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: 6,
                    color: hint.spec.kind === "measured" ? skin.positive : skin.gold,
                    background: `${hint.spec.kind === "measured" ? skin.positive : skin.gold}18`,
                    border: `1px solid ${hint.spec.kind === "measured" ? skin.positive : skin.gold}55`,
                  }}
                >
                  {KIND_LABEL[hint.spec.kind]}
                </span>
              ) : null}
            </div>

            <p style={{ margin: "6px 0 0", fontSize: 10, lineHeight: 1.5, color: skin.muted, textWrap: "pretty" }}>
              {hint.spec.body}
            </p>

            {hint.spec.action ? (
              <button
                type="button"
                onClick={() => {
                  hint.spec.action?.onSelect();
                  closeNow();
                }}
                style={{
                  marginTop: 9,
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 9,
                  background: skin.accent,
                  border: "none",
                  color: "#0b0b12",
                  fontSize: 9.5,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: INSTRUMENT_FONT,
                }}
              >
                {hint.spec.action.label}
              </button>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <HoldHintContext.Provider value={ctx}>
      {children}
      {surface}
    </HoldHintContext.Provider>
  );
}
