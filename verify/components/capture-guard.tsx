"use client";

/**
 * Capture guard — screenshot, copy and save deterrents for the private beta.
 *
 * Honest scope: no web page can stop a screenshot. The OS owns the screen, and a
 * phone camera beats every trick here. What this does is make casual capture
 * awkward and make any capture that does leak TRACEABLE:
 *
 *   • A faint, tiled watermark with the signed-in guest's name and the date, so
 *     a leaked screenshot names its source. (Skipped on /beta: nothing private.)
 *   • The page veils (blurs) the moment the OS screenshot chords start —
 *     ⌘⇧ on macOS (⌘⇧3/4/5), Win+Shift on Windows (Win+Shift+S) — and on
 *     PrintScreen, which also overwrites the clipboard.
 *   • Printing renders a notice instead of the page (globals.css, html.mg-guard).
 *   • Text selection, image drag, iOS long-press save and the context menu are
 *     off outside form fields; ⌘/Ctrl + S, P, U and the devtools chords are eaten.
 *   • A browser driven by automation (navigator.webdriver) gets an opaque veil.
 *
 * Exemptions: development builds; NEXT_PUBLIC_CAPTURE_GUARD=off; and guests
 * listed in CAPTURE_ALLOWED_USERS (the proxy sets mg_cap=1 for them) — so the
 * founder can still screenshot the app for the deck.
 */
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const VIEWER_COOKIE = "mg_viewer";
const CAPTURE_COOKIE = "mg_cap";
const VEIL_MS = 4000;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  if (!hit) return null;
  try {
    return decodeURIComponent(hit.slice(name.length + 1));
  } catch {
    return null;
  }
}

function inField(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.closest) return false;
  return !!el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], .mg-selectable");
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string);
}

function watermarkTile(viewer: string, day: string): string {
  const line1 = escapeXml(`MAD GAMBIT · PRIVATE BETA`);
  const line2 = escapeXml(`${viewer} · ${day}`);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='190'>` +
    `<g transform='rotate(-24 150 95)' font-family='ui-monospace, Menlo, monospace' font-size='12' fill='rgba(255,255,255,0.055)' text-anchor='middle'>` +
    `<text x='150' y='90'>${line1}</text><text x='150' y='108'>${line2}</text></g></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function CaptureGuard() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [veil, setVeil] = useState<null | "capture" | "automation">(null);

  // Decide on the client only: the cookies and navigator are browser state, so
  // rendering nothing on the server and on first paint keeps hydration exact.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_CAPTURE_GUARD === "off") return;
    if (readCookie(CAPTURE_COOKIE) === "1") return;
    setActive(true);
    setViewer(readCookie(VIEWER_COOKIE));
    if (navigator.webdriver) setVeil("automation");
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add("mg-guard");

    let timer: number | undefined;
    const flash = () => {
      setVeil((v) => (v === "automation" ? v : "capture"));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVeil((v) => (v === "capture" ? null : v)), VEIL_MS);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      // ⌘⇧ (macOS screenshots) / Win+Shift (Snipping Tool): veil before the OS grabs the frame.
      if (e.metaKey && e.shiftKey && !inField(e.target)) flash();
      if (k === "printscreen") flash();
      if (mod && !e.shiftKey && (k === "s" || k === "p" || k === "u")) e.preventDefault();
      if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) e.preventDefault();
      if (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "u")) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };
    // Chrome on Windows reports PrintScreen on keyup only.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "PrintScreen") return;
      flash();
      navigator.clipboard?.writeText("Screen capture is off in the MAD Gambit private beta.").catch(() => {});
    };
    const onContext = (e: MouseEvent) => {
      if (!inField(e.target)) e.preventDefault();
    };
    const onDrag = (e: DragEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "IMG" || el.tagName === "svg" || el.tagName === "A")) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      if (!inField(e.target)) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("contextmenu", onContext, true);
    document.addEventListener("dragstart", onDrag, true);
    document.addEventListener("copy", onCopy, true);
    window.addEventListener("beforeprint", flash);
    return () => {
      window.clearTimeout(timer);
      root.classList.remove("mg-guard");
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("contextmenu", onContext, true);
      document.removeEventListener("dragstart", onDrag, true);
      document.removeEventListener("copy", onCopy, true);
      window.removeEventListener("beforeprint", flash);
    };
  }, [active]);

  const tile = useMemo(() => {
    if (!active) return null;
    const day = new Date().toISOString().slice(0, 10);
    return watermarkTile(viewer || "guest", day);
  }, [active, viewer]);

  if (!active) return null;
  const showMark = !!tile && pathname !== "/beta";

  return (
    <>
      {showMark && (
        <div
          aria-hidden
          className="mg-watermark"
          style={{ backgroundImage: tile ?? undefined }}
        />
      )}
      {veil && (
        <div className={`mg-capture-veil${veil === "automation" ? " is-opaque" : ""}`} role="alert">
          <div className="mg-capture-veil-card">
            <strong>MAD Gambit · private beta</strong>
            <span>
              {veil === "automation"
                ? "Automated browsers are not supported."
                : "Screen capture is off on the floor."}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
