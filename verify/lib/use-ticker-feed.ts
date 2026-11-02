"use client";

import { useEffect, useState } from "react";
import type { TickerSnapshot } from "@/lib/ticker-feed";

export const TICKER_POLL_MS = 60_000;

/**
 * Polls /api/v1/tickers once a minute (the MoE-curated analytics + markets snapshot) and returns the latest.
 * Pauses while the tab is hidden and refreshes the moment it becomes visible again, so a background tab costs nothing.
 */
export function useTickerFeed(everyMs: number = TICKER_POLL_MS): TickerSnapshot | null {
  const [snap, setSnap] = useState<TickerSnapshot | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/v1/tickers", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive && d?.success) setSnap(d as TickerSnapshot); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, everyMs);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [everyMs]);
  return snap;
}
