"use client";

/**
 * MAD Gambit — the sign-in nudge.
 *
 * A visitor who is not signed in earns nothing: no streak, no positions that
 * persist, no rewards. So every 165 seconds a small banner rises above the
 * bottom nav, says so, and offers the one Login / Sign Up button. It is
 * deliberately a banner and not a modal — it never takes the screen, never
 * blocks a tap — and it takes itself away after a few seconds if ignored.
 *
 * Timing rules:
 *   · the first prompt comes 165 s after load, not on arrival
 *   · never while the sign-in dialog is already open
 *   · never once signed in (and the timer is torn down, not merely muted)
 *   · "Not now" closes it; the next one is the next 165 s tick
 */
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

/** Seconds between prompts, as specified. */
export const NUDGE_EVERY_S = 165;
/** How long a prompt stays up if nobody answers it. */
const SHOW_FOR_MS = 14_000;

export default function SignInNudge({
  signedIn, dialogOpen, onOpen, bottom = 64,
}: {
  signedIn: boolean;
  /** True while the sign-in dialog is open: a nudge would sit behind it. */
  dialogOpen: boolean;
  onOpen: () => void;
  /** Distance from the bottom edge, to clear a bottom nav. */
  bottom?: number;
}) {
  const [show, setShow] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dialogRef = useRef(dialogOpen);
  dialogRef.current = dialogOpen;

  useEffect(() => {
    if (signedIn) { setShow(false); return; }
    const tick = setInterval(() => {
      if (dialogRef.current) return;
      setShow(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShow(false), SHOW_FOR_MS);
    }, NUDGE_EVERY_S * 1000);
    return () => { clearInterval(tick); clearTimeout(hideTimer.current); };
  }, [signedIn]);

  // Opening the dialog (from anywhere) answers the prompt.
  useEffect(() => { if (dialogOpen) setShow(false); }, [dialogOpen]);

  if (!show || signedIn) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", left: 12, right: 12, bottom, zIndex: 45, margin: "0 auto", maxWidth: 420,
        display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 10px 14px", borderRadius: 14,
        background: "linear-gradient(180deg, #1c1608, #0c0905)", border: "1px solid rgba(246,211,120,.55)",
        boxShadow: "0 14px 30px -10px rgba(0,0,0,.85), 0 0 22px -4px rgba(214,157,65,.45)",
        fontFamily: INSTRUMENT_FONT, color: "#f6f1e3",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#f6d378" }}>
          You&apos;re not earning yet
        </div>
        <div style={{ fontSize: 10, color: "#c9ccd6", marginTop: 2 }}>
          Sign up or sign in to earn, keep your streak and save your positions.
        </div>
      </div>
      <button
        type="button"
        onClick={() => { setShow(false); onOpen(); }}
        className="mg-tap mg-glass"
        style={{
          flex: "none", padding: "8px 12px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap",
          fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
          color: "#1a1205", background: "var(--mg-gold-fill)", border: "1px solid rgba(246,211,120,.7)",
          fontFamily: INSTRUMENT_FONT,
        }}
      >
        Login / Sign Up
      </button>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Not now"
        title="Not now"
        style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "transparent", border: "none", cursor: "pointer", color: "#8a8a95" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
