"use client";

/**
 * The hub's theme button: Gilded or Neon Noir. Both are skins of the one hub, so choosing one just switches the
 * app-wide skin (GlobalSkin forwards it to ThemeProvider, the one store). The earlier "Classic" 7-tab hub was merged
 * into this one, so it is no longer a separate choice.
 */
import React, { useEffect, useRef, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import type { SkinName } from "@/lib/skins";

type ThemeChoice = SkinName;

const OPTIONS: { id: ThemeChoice; glyph: string; label: string; note: string }[] = [
  { id: "gilded", glyph: "◑", label: "Gilded", note: "Pop-Baroque, velvet and gold leaf" },
  { id: "neonNoir", glyph: "◐", label: "Neon Noir", note: "Tabloid ink, cyan and rossa" },
];

export default function ThemeMenu() {
  const { skin, name, setSkin } = useSkin();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.id === name) ?? OPTIONS[1];

  // Close on an outside press or Escape, the two ways a menu is dismissed.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (id: ThemeChoice) => {
    setOpen(false);
    setSkin(id);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", flex: "none" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Choose a theme: Gilded or Neon Noir"
        className="mg-tap"
        style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
          padding: "6px 11px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap",
          color: skin.text, background: skin.card, border: `1px solid ${skin.accent}66`,
          fontFamily: INSTRUMENT_FONT,
        }}
      >
        {current.glyph} {current.label} <span aria-hidden="true" style={{ opacity: 0.7 }}>▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Theme"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60, width: 214,
            padding: 5, borderRadius: 12, background: skin.panel, border: `1px solid ${skin.accent}55`,
            boxShadow: "0 14px 30px -10px rgba(0,0,0,.85)", fontFamily: INSTRUMENT_FONT,
          }}
        >
          {OPTIONS.map((o) => {
            const active = o.id === name;
            return (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(o.id)}
                className="mg-tap"
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                  padding: "8px 10px", marginBottom: 4, borderRadius: 9, cursor: "pointer",
                  color: skin.text, background: skin.card,
                  border: `1px solid ${active ? skin.gold : skin.border}`,
                  fontFamily: INSTRUMENT_FONT,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 15, color: active ? skin.gold : skin.muted, width: 16, textAlign: "center" }}>{o.glyph}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: active ? skin.gold : skin.text }}>{o.label}</span>
                  <span style={{ display: "block", marginTop: 1, fontSize: 9, color: skin.muted }}>{o.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
