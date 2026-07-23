"use client";

/**
 * MAD Gambit — Card Lifecycle Panel (Part Q)
 * Surfaces the post-acquisition card engine: usage WEAR (rarity-tiered
 * durability loss) + EVOLUTION (deterministic burn ladder + chance-based VRF
 * simulate). Read-only preview — no card is destroyed and no value moves (real
 * burns / VRF settle on-chain, Phase-3 gated). Hits /api/v1/cards/{wear,evolve}.
 */
import React, { useEffect, useState } from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useSkin } from "@/components/skin-provider";
import { RARITY_ORDER, RARITY_TABLE, type Rarity } from "@/lib/gambit-game-math";

interface WearResult {
  wearPct: string;
  newDurability: number;
  usesUntilWorn: number;
  worn: boolean;
}
interface LadderStep {
  from: Rarity;
  to: Rarity;
  cardsRequired: number;
  xpRequired: number;
}
interface LadderResult {
  next: LadderStep | null;
  atMax: boolean;
  note: string;
}
interface VrfResult {
  result: { success: boolean; fibReward: number; card: { evolutionStage: number } | null };
  note: string;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function CardLifecyclePanel() {
  const { skin } = useSkin();
  const [rarity, setRarity] = useState<Rarity>("Rare");
  const [durability, setDurability] = useState(1);
  const [uses, setUses] = useState(5);
  const [wear, setWear] = useState<WearResult | null>(null);
  const [ladder, setLadder] = useState<LadderResult | null>(null);
  const [vrf, setVrf] = useState<VrfResult | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetch("/api/v1/cards/wear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rarity, durability, uses }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.success) setWear(d.wear as WearResult);
        })
        .catch(() => {});
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [rarity, durability, uses]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/cards/evolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "ladder", rarity }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.success) setLadder(d as LadderResult);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [rarity]);

  const simulateVrf = () => {
    setRolling(true);
    const tier = RARITY_TABLE[rarity];
    fetch("/api/v1/cards/evolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "vrf",
        card: {
          evolutionStage: 1,
          durability,
          cloutMultiplier: tier.cloutMultiplier,
          powerLevel: tier.powerScore,
        },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setVrf(d as VrfResult);
      })
      .catch(() => {})
      .finally(() => setRolling(false));
  };

  const accent = RARITY_TABLE[rarity].accent;
  const durColor = durability > 0.5 ? skin.positive : durability > 0.2 ? skin.gold : skin.accent2;

  return (
    <div
      style={{
        background: skin.panel,
        border: `1px solid ${skin.border}`,
        borderRadius: 16,
        padding: 18,
        fontFamily: INSTRUMENT_FONT,
        color: skin.text,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Card Lifecycle · Wear + Evolution
        </div>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: skin.muted, background: `${skin.muted}18`, border: `1px solid ${skin.muted}40` }}>
          preview
        </span>
      </div>

      {/* Rarity selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
        {(RARITY_ORDER as Rarity[]).map((r) => {
          const active = rarity === r;
          const a = RARITY_TABLE[r].accent;
          return (
            <button
              key={r}
              onClick={() => setRarity(r)}
              style={{
                flex: "1 1 auto",
                padding: "6px 8px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: active ? skin.text : skin.muted,
                background: active ? `${a}22` : skin.card,
                border: `1px solid ${active ? a : skin.border}`,
                fontFamily: INSTRUMENT_FONT,
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Durability bar */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        <span>Durability</span>
        <span style={{ color: durColor }}>{pct(durability)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: skin.card, border: `1px solid ${skin.border}`, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${durability * 100}%`, height: "100%", background: durColor, transition: "width .2s ease" }} />
      </div>
      <input type="range" min={0} max={1} step={0.05} value={durability} onChange={(e) => setDurability(Number(e.target.value))} style={{ width: "100%", accentColor: accent, marginBottom: 12 }} />

      {/* Uses slider */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>
        <span>Uses to simulate</span>
        <span style={{ color: skin.accent }}>{uses}×</span>
      </div>
      <input type="range" min={1} max={20} step={1} value={uses} onChange={(e) => setUses(Number(e.target.value))} style={{ width: "100%", accentColor: skin.accent, marginBottom: 14 }} />

      {/* Wear result */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        {([
          ["Wear / use", wear ? wear.wearPct : "—", skin.accent2],
          ["After " + uses + "×", wear ? pct(wear.newDurability) : "—", skin.gold],
          ["Uses left", wear ? String(wear.usesUntilWorn) : "—", skin.accent],
        ] as [string, string, string][]).map(([label, val, color]) => (
          <div key={label} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Evolution */}
      <div style={{ fontSize: 8, color: skin.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
        Evolution
      </div>
      <div style={{ fontSize: 9, color: skin.text, marginBottom: 10 }}>
        {ladder ? ladder.note : "…"}
      </div>

      <button
        onClick={simulateVrf}
        disabled={rolling}
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: 8,
          cursor: rolling ? "default" : "pointer",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: skin.text,
          background: `${skin.accent}18`,
          border: `1px solid ${skin.accent}`,
          fontFamily: INSTRUMENT_FONT,
          opacity: rolling ? 0.6 : 1,
        }}
      >
        {rolling ? "Rolling…" : "Simulate VRF evolution"}
      </button>

      {vrf && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            borderRadius: 8,
            background: vrf.result.success ? `${skin.positive}14` : `${skin.accent2}14`,
            border: `1px solid ${vrf.result.success ? skin.positive : skin.accent2}40`,
            fontSize: 9,
            color: vrf.result.success ? skin.positive : skin.accent2,
          }}
        >
          {vrf.note}
        </div>
      )}

      <div style={{ fontSize: 7, color: skin.muted, marginTop: 12, lineHeight: 1.5 }}>
        Preview only — no card is destroyed. Real burns + VRF settle on-chain (Phase 3).
      </div>
    </div>
  );
}
