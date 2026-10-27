"use client";

/**
 * MAD Gambit — "Markets for Today". Surfaces auto-generated, classified market
 * proposals (progression / saga / z-liar / perp) from real scandal signals via
 * /api/v1/markets/proposals. Filterable by type. Skin-aware, degrade-safe.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

// Imported, never redeclared — see market-type-carousels.tsx for why.
import { MARKET_TYPES, type MarketType } from "@/lib/market-classifier";

interface Proposal {
  type: MarketType;
  title: string;
  horizonDays: number;
  zliarScore: number;
  perpProbability: number;
  convictionPrior: number;
  score: number;
}
interface Resp {
  success: boolean;
  source?: string;
  proposals: Proposal[];
  byType: Record<MarketType, number>;
}

const TYPE_LABEL: Record<MarketType, string> = {
  progression: "Progression",
  saga: "Saga",
  zliar: "Z-Liar",
  perp: "Perp",
  gossipcop: "Gossip Perp",
  faces: "Five Faces",
  zeitgeist: "Zeitgeist",
  epiphany: "Epiphany",
};

export default function MarketsForTodayPanel() {
  const { skin } = useSkin();
  const [data, setData] = useState<Resp | null>(null);
  const [filter, setFilter] = useState<MarketType | "all">("all");
  const [pulling, setPulling] = useState(false);
  const [pullNote, setPullNote] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/v1/markets/proposals?limit=16")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Yank fresh chaos from GDELT, then re-classify. Calls the public, rate-limited
  // refresh route (not /api/v1/ingest/gdelt directly — that one is CRON_SECRET-gated
  // for the scheduled job and a browser can never supply that header, so calling it
  // here always 401/503'd). That route does real work now instead of always refusing;
  // a genuine failure (rate-limited, network error) is surfaced via pullNote rather
  // than swallowed by an empty .catch(). Degrades the same way the route does: without
  // a DB it still fetches+scores a preview, persisting nothing, rather than failing.
  const pullFresh = async () => {
    setPulling(true);
    setPullNote(null);
    const res = await fetch("/api/v1/markets/proposals/refresh", { method: "POST" }).catch(() => null);
    if (!res || !res.ok) {
      setPullNote(
        res?.status === 429
          ? "Refresh is rate-limited — try again in a few minutes."
          : "Refresh failed. Showing the last stored signals.",
      );
    }
    load();
    setPulling(false);
  };

  const typeColor = (t: MarketType): string =>
    t === "perp" || t === "gossipcop" || t === "faces" || t === "zeitgeist" || t === "epiphany"
      ? skin.accent2
      : t === "zliar"
      ? skin.gold
      : t === "saga"
      ? skin.accent
      : skin.positive;

  const proposals = (data?.proposals ?? []).filter((p) => filter === "all" || p.type === filter);
  const live = data?.source === "live";
  // Driven from MARKET_TYPES so a new family gets a filter chip automatically.
  const chips: (MarketType | "all")[] = ["all", ...MARKET_TYPES];

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Markets for Today
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={pullFresh}
            disabled={pulling}
            title="Pull fresh scandals from GDELT"
            style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "3px 7px", borderRadius: 5, cursor: pulling ? "default" : "pointer", color: skin.gold, background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, fontFamily: INSTRUMENT_FONT, opacity: pulling ? 0.6 : 1 }}
          >
            {pulling ? "…" : "⚡ Pull fresh"}
          </button>
          {/* Rendered, not just stored. A note nobody displays swallows the
              failure exactly as the empty .catch() used to. */}
          {pullNote && (
            <span
              role="status"
              style={{ fontSize: 7, letterSpacing: 0.6, color: skin.muted, fontFamily: INSTRUMENT_FONT, maxWidth: 220 }}
            >
              {pullNote}
            </span>
          )}
          {data && (
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
              {live ? "live" : "demo"}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 7, color: skin.muted, marginBottom: 12 }}>
        Auto-classified from scandal signals · Progression / Saga / Z-Liar / Perp.
      </div>

      {/* Type filter chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
        {chips.map((c) => {
          const active = filter === c;
          const count = c === "all" ? data?.proposals.length ?? 0 : data?.byType?.[c] ?? 0;
          const color = c === "all" ? skin.text : typeColor(c);
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{ padding: "4px 9px", borderRadius: 999, cursor: "pointer", fontSize: 8, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: active ? skin.text : skin.muted, background: active ? `${color}22` : skin.card, border: `1px solid ${active ? color : skin.border}`, fontFamily: INSTRUMENT_FONT }}
            >
              {c === "all" ? "All" : TYPE_LABEL[c]} {count}
            </button>
          );
        })}
      </div>

      {data === null && <div style={{ fontSize: 9, color: skin.muted }}>Loading…</div>}
      {data !== null && proposals.length === 0 && <div style={{ fontSize: 9, color: skin.muted }}>No signals yet.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {proposals.map((p, i) => (
          <div key={i} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: skin.text, lineHeight: 1.35, flex: 1 }}>{p.title}</span>
              <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", color: typeColor(p.type), background: `${typeColor(p.type)}18`, border: `1px solid ${typeColor(p.type)}55` }}>
                {TYPE_LABEL[p.type]}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 7, color: skin.muted }}>
              <span>Z-Liar <span style={{ color: skin.gold, fontWeight: 900 }}>{Math.round(p.zliarScore)}</span></span>
              <span>Perp <span style={{ color: skin.accent2, fontWeight: 900 }}>{Math.round(p.perpProbability * 100)}%</span></span>
              <span>~{p.horizonDays}d</span>
              <span style={{ marginLeft: "auto" }}>score <span style={{ color: skin.accent, fontWeight: 900 }}>{p.score.toFixed(2)}</span></span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 7, color: skin.muted, marginTop: 10 }}>
        Heuristic classifier (zLiarMeter + perp trigger + lexicon sentiment) — not ML training. Publish to the ledger via /api/v1/markets.
      </div>
    </div>
  );
}
