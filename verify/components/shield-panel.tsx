"use client";

/**
 * MAD Gambit — Shield Panel (Part P, P-4)
 * Surfaces the canonical MAD Shield loss-protection engine as a live product
 * surface: three recovery tiers (Standard 28.8% / Shielded up to 40% / Whale
 * 60%) with a premium + payout calculator. Read-only preview — no value moves
 * (the on-chain vault is the Phase-3 gated slice). Skin-aware (neonNoir=INK); hits
 * POST /api/v1/shield/quote and always renders (calculator needs no DB).
 */
import React, { useEffect, useMemo, useState } from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useSkin } from "@/components/skin-provider";

type Tier = "standard" | "shielded" | "whale";

interface Quote {
  stake: number;
  requestedTier: Tier;
  appliedTier: Tier;
  premium: number;
  payout: number;
  effectivePct: number;
  returnWindowHours: number;
  whaleEligible: boolean;
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function ShieldPanel() {
  const { skin } = useSkin();
  const TIER_META: Record<Tier, { label: string; color: string; blurb: string }> = {
    standard: { label: "Standard", color: skin.accent, blurb: "28.8% recovery · flat" },
    shielded: { label: "Shielded", color: skin.gold, blurb: "28.8 → 40% · opt-in fee dial" },
    whale: { label: "Whale / Partner", color: skin.accent2, blurb: "60% · trust-gated" },
  };
  const [stake, setStake] = useState(1000);
  const [tier, setTier] = useState<Tier>("shielded");
  const [premiumTier, setPremiumTier] = useState(0.5);
  const [requestWhaleTier, setRequestWhaleTier] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  // Demo eligibility so the whale preview resolves; the real gate is on-chain
  // trust (lifetime volume + tenure + EigenTrust + Golden Hand stake).
  const eligibility = useMemo(
    () => ({ lifetimeVolume: 300000, accountAgeDays: 120, trustScore: 90, goldenHandCardsStaked: 1 }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetch("/api/v1/shield/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stake,
          tier,
          premiumTier,
          requestWhaleTier: tier === "whale" ? requestWhaleTier : false,
          eligibility,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d?.success) setQuote(d.quote as Quote);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [stake, tier, premiumTier, requestWhaleTier, eligibility]);

  const chipStyle = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: "8px 6px",
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "center",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: active ? skin.text : skin.muted,
    background: active ? `${color}22` : skin.card,
    border: `1px solid ${active ? color : skin.border}`,
    transition: "all .15s ease",
  });

  const result: [string, string, string][] = [
    ["Opt-in fee (2–4%)", quote ? usd(quote.premium) : "—", skin.accent2],
    ["Recovery payout", quote ? usd(quote.payout) : "—", skin.positive],
    ["Effective rate", quote ? pct(quote.effectivePct) : "—", skin.gold],
    ["Return window", quote ? `${quote.returnWindowHours}h` : "—", skin.accent],
  ];

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
          MAD Shield · Loss Protection
        </div>
        <span
          style={{
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: 4,
            color: skin.muted,
            background: `${skin.muted}18`,
            border: `1px solid ${skin.muted}40`,
          }}
        >
          {loading ? "…" : "preview"}
        </span>
      </div>

      {/* Tier cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        {(Object.keys(TIER_META) as Tier[]).map((t) => {
          const m = TIER_META[t];
          const active = tier === t;
          return (
            <button
              key={t}
              onClick={() => setTier(t)}
              style={{
                textAlign: "left",
                background: active ? `${m.color}18` : skin.card,
                border: `1px solid ${active ? m.color : skin.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: INSTRUMENT_FONT,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 900, color: m.color, textTransform: "uppercase", letterSpacing: 1 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 8, color: skin.muted, marginTop: 4 }}>{m.blurb}</div>
            </button>
          );
        })}
      </div>

      {/* Stake input */}
      <label style={{ display: "block", fontSize: 8, color: skin.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
        Stake ($MADx)
      </label>
      <input
        type="number"
        min={0}
        value={stake}
        onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: skin.card,
          border: `1px solid ${skin.border}`,
          borderRadius: 8,
          padding: "8px 10px",
          color: skin.text,
          fontFamily: INSTRUMENT_FONT,
          fontSize: 14,
          fontWeight: 900,
          marginBottom: 12,
        }}
      />

      {/* Shielded dial */}
      {tier === "shielded" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>
            <span>Premium dial</span>
            <span style={{ color: skin.gold }}>{pct(0.288 + premiumTier * (0.4 - 0.288))} recovery</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={premiumTier}
            onChange={(e) => setPremiumTier(Number(e.target.value))}
            style={{ width: "100%", accentColor: skin.gold }}
          />
        </div>
      )}

      {/* Whale toggle */}
      {tier === "whale" && (
        <button
          onClick={() => setRequestWhaleTier((v) => !v)}
          style={chipStyle(requestWhaleTier, skin.accent2)}
        >
          {requestWhaleTier ? "Whale tier requested" : "Request whale tier (gated)"}
        </button>
      )}

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginTop: 14 }}>
        {result.map(([label, val, color]) => (
          <div key={label} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 8, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {quote && quote.requestedTier === "whale" && !quote.whaleEligible && (
        <div style={{ fontSize: 8, color: skin.muted, marginTop: 10 }}>
          Whale tier requires sustained trust (≥250k lifetime volume · ≥90d age · ≥85 trust · ≥1 Golden Hand).
          Falling back to <span style={{ color: TIER_META[quote.appliedTier].color }}>{TIER_META[quote.appliedTier].label}</span>.
        </div>
      )}

      <div style={{ fontSize: 7, color: skin.muted, marginTop: 12, lineHeight: 1.5 }}>
        Preview only — no funds move. On-chain premium + recovery settle via MADShieldVault (Phase 3).
      </div>
    </div>
  );
}
