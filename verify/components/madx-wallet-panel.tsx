"use client";

/**
 * MAD Gambit — $MADx (Beta) Wallet.
 * The web2 onboarding token surface: mirrors the on-chain $MADx (balance, mint-to-
 * cap onboard/buy, staking into STAKING_TIERS with APY, claim) against the Neon
 * credit engine (/api/v1/madx/*). Clearly labelled BETA. Skin-aware, degrade-safe.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Tier {
  name: string;
  minMadx: number;
  apy: number;
}
interface Account {
  owner: string;
  balance: number;
  staked: number;
  rewardAccrued: number;
  pendingRewards: number;
  tier: Tier | null;
  onboarded: boolean;
}
interface Supply {
  minted: number;
  cap: number;
  remaining: number;
}
interface Meta {
  symbol: string;
  label: string;
  cap: number;
  welcomeGrant: number;
  maxBuyPerTx: number;
  note: string;
}
interface Resp {
  success: boolean;
  source?: string;
  meta?: Meta;
  account: Account | null;
  supply?: Supply;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

function ensureOwner(): string {
  try {
    const k = "mg_beta_owner";
    let v = localStorage.getItem(k);
    if (!v) {
      const rand = globalThis.crypto?.getRandomValues?.(new Uint8Array(6)) ?? new Uint8Array(6);
      v = "beta_" + Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return "beta_guest";
  }
}

export default function MadxWalletPanel() {
  const { skin } = useSkin();
  const [owner, setOwner] = useState("");
  const [data, setData] = useState<Resp | null>(null);
  const [amt, setAmt] = useState(100);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback((o: string) => {
    fetch(`/api/v1/madx/account?owner=${encodeURIComponent(o)}`)
      .then((r) => r.json())
      .then((d: Resp) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const o = ensureOwner();
    setOwner(o);
    load(o);
  }, [load]);

  const act = async (path: string, body: Record<string, unknown>, tag: string) => {
    if (!owner) return;
    setBusy(tag);
    try {
      await fetch(`/api/v1/madx/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner, ...body }),
      });
    } catch {
      /* ignore */
    }
    load(owner);
    setBusy(null);
  };

  const acct = data?.account ?? null;
  const meta = data?.meta;
  const supply = data?.supply;
  const live = data?.source === "live";
  const pct = supply && supply.cap > 0 ? Math.min(100, (supply.minted / supply.cap) * 100) : 0;

  const btn = (bg: string): React.CSSProperties => ({
    flex: 1,
    padding: "8px 6px",
    borderRadius: 8,
    cursor: busy ? "default" : "pointer",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: skin.text,
    background: `${bg}18`,
    border: `1px solid ${bg}`,
    fontFamily: INSTRUMENT_FONT,
    opacity: busy ? 0.6 : 1,
  });

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          {meta?.label ?? "MADx · Beta"} Wallet
        </div>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
          {live ? "live" : "demo"}
        </span>
      </div>
      <div style={{ fontSize: 7, color: skin.muted, marginBottom: 12 }}>
        {meta?.note ?? "Beta credits — off-chain, redeemable 1:1 for on-chain $MADx at TGE."}
      </div>

      {/* Balance + tier */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: skin.gold }}>{acct ? fmt(acct.balance) : "—"}</span>
        <span style={{ fontSize: 10, color: skin.muted, fontWeight: 900 }}>{meta?.symbol ?? "MADx"}</span>
        {acct?.tier && (
          <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, color: skin.accent, background: `${skin.accent}18`, border: `1px solid ${skin.accent}` }}>
            {acct.tier.name} · {(acct.tier.apy * 100).toFixed(0)}% APY
          </span>
        )}
      </div>

      {/* Staked + pending */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, margin: "12px 0" }}>
        <div style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: skin.accent }}>{acct ? fmt(acct.staked) : "—"}</div>
          <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>Staked</div>
        </div>
        <div style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: skin.positive }}>{acct ? fmt(acct.pendingRewards) : "—"}</div>
          <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>Pending rewards</div>
        </div>
      </div>

      {/* Amount + actions */}
      <input
        type="number"
        min={0}
        value={amt}
        onChange={(e) => setAmt(Math.max(0, Number(e.target.value)))}
        style={{ width: "100%", boxSizing: "border-box", background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 8, padding: "8px 10px", color: skin.text, fontFamily: INSTRUMENT_FONT, fontSize: 13, fontWeight: 900, marginBottom: 8 }}
        aria-label="amount"
      />
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button disabled={!!busy} onClick={() => act("buy", { amount: amt }, "buy")} style={btn(skin.gold)}>
          {busy === "buy" ? "…" : "Buy (beta)"}
        </button>
        <button disabled={!!busy} onClick={() => act("stake", { amount: amt }, "stake")} style={btn(skin.accent)}>
          {busy === "stake" ? "…" : "Stake"}
        </button>
        <button disabled={!!busy} onClick={() => act("unstake", { amount: amt }, "unstake")} style={btn(skin.accent2)}>
          {busy === "unstake" ? "…" : "Unstake"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {!acct?.onboarded && (
          <button disabled={!!busy} onClick={() => act("onboard", {}, "onboard")} style={btn(skin.positive)}>
            {busy === "onboard" ? "…" : `Claim ${meta?.welcomeGrant ?? 500} welcome`}
          </button>
        )}
        <button disabled={!!busy} onClick={() => act("claim", {}, "claim")} style={btn(skin.positive)}>
          {busy === "claim" ? "…" : "Claim rewards"}
        </button>
      </div>

      {/* Supply cap bar (mirrors on-chain mint-to-cap) */}
      {supply && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
            <span>Beta supply minted</span>
            <span>{fmt(supply.minted)} / {fmt(supply.cap)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: skin.card, border: `1px solid ${skin.border}`, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: skin.gold, transition: "width .4s ease" }} />
          </div>
        </div>
      )}

      <div style={{ fontSize: 7, color: skin.muted, marginTop: 10, wordBreak: "break-all" }}>
        Beta wallet: {owner || "…"} · mirrors on-chain $MADx (cap {fmt(meta?.cap ?? 224573096)}).
      </div>
    </div>
  );
}
