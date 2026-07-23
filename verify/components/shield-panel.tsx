"use client";

/**
 * MAD Gambit — Shield Panel (Part P, P-4)
 * Surfaces the canonical MAD Shield loss-protection engine as a live product
 * surface: three recovery tiers (Standard 28.8% / Shielded up to 40% / Whale
 * 60%) with a premium + payout calculator. Read-only preview — no value moves
 * (the on-chain vault is the Phase-3 gated slice). Token-driven (INK); hits
 * POST /api/v1/shield/quote and always renders (calculator needs no DB).
 */
import React, { useEffect, useMemo, useState } from "react";
import { INK, INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

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

const TIER_META: Record<Tier, { label: string; color: string; blurb: string }> = {
  standard: { label: "Standard", color: INK.cyan, blurb: "28.8% recovery · flat" },
  shielded: { label: "Shielded", color: INK.gold, blurb: "28.8 → 40% · premium dial" },
  whale: { label: "Whale / Partner", color: INK.pink, blurb: "60% · trust-gated" },
};

export default function ShieldPanel() {
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
    color: active ? INK.white : INK.muted,
    background: active ? `${color}22` : INK.bgCard,
    border: `1px solid ${active ? color : INK.border}`,
    transition: "all .15s ease",
  });

  const result: [string, string, string][] = [
    ["Premium (2–4%)", quote ? usd(quote.premium) : "—", INK.pink],
    ["Recovery payout", quote ? usd(quote.payout) : "—", INK.green],
    ["Effective rate", quote ? pct(quote.effectivePct) : "—", INK.gold],
    ["Return window", quote ? `${quote.returnWindowHours}h` : "—", INK.cyan],
  ];

  return (
    <div
      style={{
        background: INK.bgPanel,
        border: `1px solid ${INK.border}`,
        borderRadius: 16,
        padding: 18,
        fontFamily: INSTRUMENT_FONT,
        color: INK.white,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: INK.gold, textTransform: "uppercase" }}>
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
            color: INK.muted,
            background: `${INK.muted}18`,
            border: `1px solid ${INK.muted}40`,
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
                background: active ? `${m.color}18` : INK.bgCard,
                border: `1px solid ${active ? m.color : INK.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: INSTRUMENT_FONT,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 900, color: m.color, textTransform: "uppercase", letterSpacing: 1 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 8, color: INK.muted, marginTop: 4 }}>{m.blurb}</div>
            </button>
          );
        })}
      </div>

      {/* Stake input */}
      <label style={{ display: "block", fontSize: 8, color: INK.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
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
          background: INK.bgCard,
          border: `1px solid ${INK.border}`,
          borderRadius: 8,
          padding: "8px 10px",
          color: INK.white,
          fontFamily: INSTRUMENT_FONT,
          fontSize: 14,
          fontWeight: 900,
          marginBottom: 12,
        }}
      />

      {/* Shielded dial */}
      {tier === "shielded" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: INK.muted, textTransform: "uppercase", letterSpacing: 1 }}>
            <span>Premium dial</span>
            <span style={{ color: INK.gold }}>{pct(0.288 + premiumTier * (0.4 - 0.288))} recovery</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={premiumTier}
            onChange={(e) => setPremiumTier(Number(e.target.value))}
            style={{ width: "100%", accentColor: INK.gold }}
          />
        </div>
      )}

      {/* Whale toggle */}
      {tier === "whale" && (
        <button
          onClick={() => setRequestWhaleTier((v) => !v)}
          style={chipStyle(requestWhaleTier, INK.pink)}
        >
          {requestWhaleTier ? "Whale tier requested" : "Request whale tier (gated)"}
        </button>
      )}

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginTop: 14 }}>
        {result.map(([label, val, color]) => (
          <div key={label} style={{ background: INK.bgCard, border: `1px solid ${INK.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 8, color: INK.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {quote && quote.requestedTier === "whale" && !quote.whaleEligible && (
        <div style={{ fontSize: 8, color: INK.muted, marginTop: 10 }}>
          Whale tier requires sustained trust (≥250k lifetime volume · ≥90d age · ≥85 trust · ≥1 Golden Hand).
          Falling back to <span style={{ color: TIER_META[quote.appliedTier].color }}>{TIER_META[quote.appliedTier].label}</span>.
        </div>
      )}

      <div style={{ fontSize: 7, color: INK.muted, marginTop: 12, lineHeight: 1.5 }}>
        Preview only — no funds move. On-chain premium + recovery settle via MADShieldVault (Phase 3).
      </div>
    </div>
  );
}
