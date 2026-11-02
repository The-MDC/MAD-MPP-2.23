"use client";

/**
 * MAD Gambit — TabStrip: the one tab bar for every group of option buttons.
 *
 * News Flow's category filter, the news carousel, the open-markets hub, the
 * markets-for-today panel and the platform tabs were each a row of loose pills
 * with their own sizes, colours and states. They are one pattern — pick one of
 * several views — so they are one component: a recessed rail, with the chosen
 * tab raised in gold glass, and everything a tab bar owes its users:
 *
 *   · role="tablist" / "tab" with aria-selected, and a roving tabindex so the
 *     rail is a single tab stop and Left / Right / Home / End move between tabs
 *   · the active tab scrolls itself into view in a rail that overflows
 *   · optional count / badge per tab, optional disabled tab
 *
 * It does not render the panel: the caller owns the content, so this works for
 * a filter that re-renders a list as well as for a tab that swaps a whole page.
 * Pass `panelId` when there is a single panel the tabs control.
 */
import React, { useEffect, useRef } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** A count or short mark shown after the label. */
  badge?: React.ReactNode;
  disabled?: boolean;
}

export default function TabStrip<T extends string>({
  items, value, onChange, label, panelId, size = "md", fill = false,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** The accessible name of the tab list. */
  label: string;
  panelId?: string;
  size?: "sm" | "md";
  /** Share the row equally instead of sizing each tab to its label. */
  fill?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the chosen tab in view. Scrolls the rail itself, never the page.
  useEffect(() => {
    const rail = railRef.current;
    const on = rail?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!rail || !on) return;
    const left = on.offsetLeft - (rail.clientWidth - on.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [value]);

  const move = (e: React.KeyboardEvent, from: number) => {
    const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
    const at = enabled.indexOf(from);
    let next: number | undefined;
    if (e.key === "ArrowRight") next = enabled[(at + 1) % enabled.length];
    else if (e.key === "ArrowLeft") next = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    onChange(items[next].id);
    railRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label={label}
      className={`mg-tabs mg-tabs-${size}${fill ? " mg-tabs-fill" : ""}`}
    >
      {items.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            disabled={t.disabled}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => move(e, i)}
            className={`mg-tab${on ? " mg-tab-on mg-glass" : ""}`}
          >
            {t.icon ? <span className="mg-tab-icon" aria-hidden="true">{t.icon}</span> : null}
            <span>{t.label}</span>
            {t.badge !== undefined && t.badge !== null && t.badge !== "" ? <span className="mg-tab-badge">{t.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
