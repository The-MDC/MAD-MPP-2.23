"use client";

/**
 * MAD Gambit — Card Evolution display (Part V)
 * Living-card collection: level progress toward the L3+ mint gate, W/L, scandal
 * meter, buzz, abilities, clown + minted badges. Reads /api/v1/cards/evolution/
 * owner/<owner> (real DB when configured; clean empty state otherwise).
 */
import React, { useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface EvoCard {
  id: string;
  name: string | null;
  faction: string | null;
  evolutionLevel: number;
  wins: number;
  losses: number;
  scandalMeter: number;
  buzzScore: number;
  specialAbilities: string[];
  isClown: boolean;
  isMinted: boolean;
}

const LEVELS = ["—", "Base", "Enhanced", "Legendary", "Mythic"];
const LEVEL_COLOR = ["", INK.muted, INK.cyan, INK.gold, INK.pink];

export default function CardStatsDisplay() {
  const [owner, setOwner] = useState("");
  const [cards, setCards] = useState<EvoCard[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!owner.trim()) return;
    setLoading(true);
    fetch(`/api/v1/cards/evolution/owner/${encodeURIComponent(owner.trim())}`)
      .then((r) => r.json())
      .then((d) => setCards(d?.success ? (d.cards as EvoCard[]) : []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ background: INK.bgPanel, border: `1px solid ${INK.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: INK.white }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: INK.gold, textTransform: "uppercase" }}>
          Card Evolution
        </div>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: INK.muted, background: `${INK.muted}18`, border: `1px solid ${INK.muted}40` }}>
          virtual → mint @ L3
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="owner wallet / id"
          style={{ flex: 1, background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 8, padding: "8px 10px", color: INK.white, fontFamily: INSTRUMENT_FONT, fontSize: 11 }}
        />
        <button onClick={load} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, cursor: loading ? "default" : "pointer", fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: INK.white, background: `${INK.cyan}18`, border: `1px solid ${INK.cyan}`, fontFamily: INSTRUMENT_FONT, opacity: loading ? 0.6 : 1 }}>
          {loading ? "…" : "Load"}
        </button>
      </div>

      {cards === null && (
        <div style={{ fontSize: 9, color: INK.muted, lineHeight: 1.6 }}>
          Living cards evolve off-chain through battles, predictions & saga contributions.
          Levels: <span style={{ color: INK.muted }}>Base</span> → <span style={{ color: INK.cyan }}>Enhanced</span> → <span style={{ color: INK.gold }}>Legendary (mints on-chain)</span> → <span style={{ color: INK.pink }}>Mythic</span>.
          Enter an owner to load their collection.
        </div>
      )}

      {cards !== null && cards.length === 0 && (
        <div style={{ fontSize: 9, color: INK.muted }}>No living cards for this owner yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(cards ?? []).map((c) => {
          const lvl = Math.min(4, Math.max(1, c.evolutionLevel));
          const color = LEVEL_COLOR[lvl] || INK.muted;
          return (
            <div key={c.id} style={{ background: INK.bgCard, border: `1px solid ${c.isClown ? INK.pink : INK.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, color }}>
                  {c.name || c.id} · <span style={{ textTransform: "uppercase" }}>{LEVELS[lvl]}</span>
                </span>
                <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: c.isMinted ? INK.green : INK.muted }}>
                  {c.isClown ? "🤡 clown" : c.isMinted ? "◆ minted" : "virtual"}
                </span>
              </div>
              {/* level progress toward L3 mint gate */}
              <div style={{ height: 6, borderRadius: 3, background: INK.bgDeep, overflow: "hidden", margin: "8px 0 6px" }}>
                <div style={{ width: `${(Math.min(3, lvl) / 3) * 100}%`, height: "100%", background: color }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: INK.muted }}>
                <span>W {c.wins} · L {c.losses}</span>
                <span>scandal {Math.round(c.scandalMeter)} · buzz {Math.round(c.buzzScore)}</span>
              </div>
              {c.specialAbilities.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {c.specialAbilities.map((a) => (
                    <span key={a} style={{ fontSize: 7, fontWeight: 900, color: INK.gold, background: `${INK.gold}14`, border: `1px solid ${INK.gold}30`, borderRadius: 4, padding: "1px 5px" }}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
