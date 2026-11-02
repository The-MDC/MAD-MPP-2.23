"use client";

/**
 * MAD Gambit — usePlatformMetrics
 * ------------------------------------------------------------------
 * The platform-wide counters from GET /api/v1/dopamine/metrics, shared by the
 * pillar carousel and the Kaito feed so both read one answer.
 *
 * `source` matters: a database-less deployment answers with a ZEROED object
 * tagged "demo", and a zero there is a specific, false claim ("nothing is open")
 * rather than "nothing is known". Consumers treat anything but "live" as no
 * reading and show an em dash — see isLiveMetrics().
 */
import { useEffect, useState } from "react";

export interface PlatformMetrics {
  activeMarkets: number;
  openBets: number;
  chaos: number;
  source: "live" | "demo" | string;
}

export function isLiveMetrics(m: PlatformMetrics | null): m is PlatformMetrics {
  return !!m && m.source === "live";
}

export default function usePlatformMetrics(): PlatformMetrics | null {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/dopamine/metrics")
      .then((r) => r.json())
      .then((d) => { if (alive && d?.metrics) setMetrics(d.metrics); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return metrics;
}
