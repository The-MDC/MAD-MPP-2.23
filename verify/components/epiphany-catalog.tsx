"use client";

/**
 * MAD Gambit — PERPETUAL EPIPHANIES catalog browser.
 * ────────────────────────────────────────────────────────────────
 * Mental models as perpetual markets: not "will this be true" but "will people
 * still reach for this to explain the world". There is no resolution date
 * because there is no moment a proverb stops being a proverb — persistence is
 * the price, and the price is the whole market.
 *
 * The cross-cultural share is shown in the header on purpose. It is the number
 * this catalog is accountable to: a mental-models product that turns out to be
 * a shelf of Western aphorisms is a different, worse product, and putting the
 * share on screen makes that visible instead of arguable.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Model {
  id: string;
  name: string;
  statement: string;
  region: string;
  original: string | null;
  persistence: number;
  domains: string[];
}
interface Resp {
  success: boolean;
  source?: string;
  crossCulturalShare: number;
  models: Model[];
}

const REGIONS = ["all", "west", "east", "mena", "europe", "global"] as const;
type RegionFilter = (typeof REGIONS)[number];

const REGION_LABEL: Record<RegionFilter, string> = {
  all: "All",
  west: "West",
  east: "East",
  mena: "MENA",
  europe: "Europe",
  global: "Global",
};

export default function EpiphanyCatalog() {
  const { skin } = useSkin();
  const [data, setData] = useState<Resp | null>(null);
  const [region, setRegion] = useState<RegionFilter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/v1/epiphany/models?limit=100")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setData(d);
      })
      .catch(() => setData({ success: false, crossCulturalShare: 0, models: [] }));
  }, []);

  // Filtering client-side: the whole catalog is a few dozen rows, and a
  // round-trip per keystroke would be slower and no more correct.
  const models = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.models ?? []).filter((m) => {
      if (region !== "all" && m.region !== region) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.statement.toLowerCase().includes(needle) ||
        m.domains.some((d) => d.toLowerCase().includes(needle))
      );
    });
  }, [data, region, q]);

  const live = data?.source === "live";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Perpetual Epiphanies <span style={{ color: skin.muted, fontSize: 8, letterSpacing: 1 }}>mental models</span>
          <AutoShowcaseBadge />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {data && (
            <span style={{ fontSize: 7, color: skin.muted }}>
              cross-cultural{" "}
              <b style={{ color: skin.accent }}>{Math.round((data.crossCulturalShare ?? 0) * 100)}%</b>
            </span>
          )}
          {data && (
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
              {live ? "live" : "catalog"}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {REGIONS.map((r) => {
          const active = region === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              style={{ padding: "4px 9px", borderRadius: 999, cursor: "pointer", fontSize: 8, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: active ? skin.text : skin.muted, background: active ? `${skin.accent}22` : skin.card, border: `1px solid ${active ? skin.accent : skin.border}`, fontFamily: INSTRUMENT_FONT }}
            >
              {REGION_LABEL[r]}
            </button>
          );
        })}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search models, statements, domains…"
          style={{ flex: "1 1 180px", minWidth: 140, padding: "5px 10px", borderRadius: 8, fontSize: 8, color: skin.text, background: skin.card, border: `1px solid ${skin.border}`, fontFamily: INSTRUMENT_FONT, outline: "none" }}
        />
      </div>

      {data === null && <div style={{ fontSize: 9, color: skin.muted }}>Opening the catalog…</div>}
      {data !== null && models.length === 0 && (
        <div style={{ fontSize: 9, color: skin.muted }}>Nothing in the catalog matches that.</div>
      )}

      <Carousel auto gap={10} ariaLabel="Mental model catalog">
        {models.map((m) => (
          <div key={m.id} style={{ width: 260, maxWidth: "100%", height: "100%", background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: skin.text, lineHeight: 1.3 }}>{m.name}</span>
              <span style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 5px", borderRadius: 4, color: skin.accent2, background: `${skin.accent2}18`, border: `1px solid ${skin.accent2}44`, whiteSpace: "nowrap" }}>
                {m.region}
              </span>
            </div>
            {m.original && (
              <div style={{ fontSize: 8.5, color: skin.muted, fontStyle: "italic" }}>{m.original}</div>
            )}
            <div style={{ fontSize: 8.5, color: skin.text, lineHeight: 1.5, opacity: 0.9 }}>{m.statement}</div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6.5, color: skin.muted, marginBottom: 3 }}>
                <span>Cultural persistence</span>
                <b style={{ color: skin.gold }}>{Math.round(m.persistence * 100)}%</b>
              </div>
              <div style={{ height: 5, background: skin.panel, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(0, m.persistence * 100))}%`, height: "100%", background: skin.gold, transition: "width .6s ease" }} />
              </div>
            </div>
            {m.domains.length > 0 && (
              <div style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 0.5 }}>{m.domains.join(" · ")}</div>
            )}
          </div>
        ))}
      </Carousel>
    </div>
  );
}
