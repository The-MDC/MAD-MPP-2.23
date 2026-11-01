"use client";

/**
 * MAD Gambit — /swap : Swap · Lend · P2P Escrow.
 * Preview surfaces, clearly labelled. Quotes are illustrative and nothing is
 * submitted: on-chain routing (Arbitrum One), Morpho-style lending markets and
 * the escrow contract are the wiring that follows. The 1.88% flat platform fee
 * applies to swaps and escrow exactly as it does to markets.
 */
import React, { useEffect, useState } from "react";
import { OMShell, Headline, Stat, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";

type Tab = "swap" | "lend" | "p2p";

/** The digital-asset twin a ticker tick opens. Backing is stated only where a 1:1 token exists. */
const TWINS: Record<string, { name: string; twin: string; backing: string; kind: "tokenized" | "native" | "synthetic" }> = {
  GOLD: { name: "Gold", twin: "PAXG · XAUt", backing: "Each token is backed by one fine troy ounce of London Good Delivery gold.", kind: "tokenized" },
  SILVER: { name: "Silver", twin: "KAG", backing: "Each token represents one ounce of allocated physical silver.", kind: "tokenized" },
  WTI: { name: "WTI crude", twin: "Synthetic", backing: "No 1:1 token exists — exposure would be a price-tracking synthetic.", kind: "synthetic" },
  NATGAS: { name: "Natural gas", twin: "Synthetic", backing: "No 1:1 token exists — exposure would be a price-tracking synthetic.", kind: "synthetic" },
  WHEAT: { name: "Wheat", twin: "Synthetic", backing: "No 1:1 token exists — exposure would be a price-tracking synthetic.", kind: "synthetic" },
  COPPER: { name: "Copper", twin: "Synthetic", backing: "No 1:1 token exists — exposure would be a price-tracking synthetic.", kind: "synthetic" },
  BTC: { name: "Bitcoin", twin: "WBTC", backing: "Wrapped bitcoin, held 1:1, tradable on Arbitrum One.", kind: "tokenized" },
  ETH: { name: "Ether", twin: "ETH", backing: "Native gas asset on Arbitrum One.", kind: "native" },
  SOL: { name: "Solana", twin: "SOL (bridged)", backing: "Bridged representation of SOL.", kind: "tokenized" },
  XRP: { name: "XRP", twin: "XRP (bridged)", backing: "Bridged representation of XRP.", kind: "tokenized" },
  MADX: { name: "$MADx", twin: "$MADx", backing: "The MAD Gambit platform token on Arbitrum One · 888,888,888 supply.", kind: "native" },
  DEGEN: { name: "DEGEN", twin: "DEGEN", backing: "Community meme token.", kind: "native" },
};
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const FROM = ["ETH", "ARB", "WBTC", "SOL (bridged)"];
const TO = ["$MADx", "USDC", "USDT"];
// Illustrative reference prices for the preview quote only.
const REF: Record<string, number> = { ETH: 3000, ARB: 0.8, WBTC: 60000, "SOL (bridged)": 150, USDC: 1, USDT: 1 };

export default function SwapPage() {
  const [tab, setTab] = useState<Tab>("swap");
  const [asset, setAsset] = useState<string | null>(null);
  useEffect(() => {
    const a = (new URLSearchParams(window.location.search).get("asset") || "").toUpperCase();
    if (TWINS[a]) setAsset(a);
  }, []);
  const twin = asset ? TWINS[asset] : null;
  return (
    <OMShell title="Swap · Lend · P2P Escrow">
      <section className="mg-seam">
        <Headline lead="Move it" punch="Anywhere" size={44} sub="Any crypto into stables or $MADx on Arbitrum One. Lend against it. Trade any digital asset peer-to-peer in escrow." />
        <div style={{ marginTop: 12 }}><span className="mg-chip" style={{ color: ROSSA, borderColor: "rgba(249,86,57,.5)" }}>Preview · on-chain wiring next</span></div>
      </section>
      {twin ? (
        <section className="mg-tile" style={{ padding: 16, borderColor: "rgba(214,157,65,.45)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span className="mg-chip" style={{ color: twin.kind === "synthetic" ? ROSSA : GOLD, borderColor: twin.kind === "synthetic" ? "rgba(249,86,57,.5)" : "rgba(214,157,65,.5)" }}>
              {twin.kind === "tokenized" ? "Tokenized twin" : twin.kind === "native" ? "Native asset" : "Synthetic twin"}
            </span>
            <a href="/preview" style={{ fontSize: 11, color: MUTED, textDecoration: "none" }}>From the ticker ›</a>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="mg-display" style={{ fontSize: 30 }}>{twin.name}</span>
            <span style={{ fontFamily: MONO, color: GOLD, fontWeight: 800 }}>→ {twin.twin}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#d6cfbf", lineHeight: 1.5 }}>{twin.backing}</div>
        </section>
      ) : null}
      <div role="tablist" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: 5, borderRadius: 18, background: "#0f1016", border: `1px solid ${LINE}` }}>
        {([["swap", "⇄ Swap"], ["lend", "◎ Lend"], ["p2p", "🤝 P2P Escrow"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            style={{ minHeight: 46, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 12.5, background: tab === k ? "var(--mg-gold-fill)" : "transparent", color: tab === k ? "#1a1205" : "#cfc9b9" }}>
            {l}
          </button>
        ))}
      </div>
      {tab === "swap" ? <SwapPanel /> : tab === "lend" ? <LendPanel /> : <P2PPanel />}
    </OMShell>
  );
}

function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      style={{ minHeight: 44, padding: "0 12px", borderRadius: 12, background: "#1a1c25", color: "#fff", border: `1px solid ${LINE}`, fontWeight: 800, fontSize: 14, colorScheme: "dark" }}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function SwapPanel() {
  const [from, setFrom] = useState("ETH");
  const [to, setTo] = useState("$MADx");
  const [amt, setAmt] = useState(0.25);
  // $MADx has no reference price until launch, so no number is shown for it.
  const priced = to in REF;
  const gross = priced ? (amt * (REF[from] ?? 0)) / REF[to] : 0;
  const fee = gross * 0.0188;
  return (
    <section className="mg-tile" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <Leg title="You pay">
        <input type="number" min={0} value={amt} onChange={(e) => setAmt(Number(e.target.value) || 0)} aria-label="Amount to swap"
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: MONO, fontSize: 24, fontWeight: 800 }} />
        <Select label="From token" value={from} options={FROM} onChange={setFrom} />
      </Leg>
      <div style={{ textAlign: "center", color: GOLD, fontSize: 20 }}>⇣</div>
      <Leg title="You receive · est.">
        <div style={{ flex: 1, fontFamily: MONO, fontSize: priced ? 24 : 14, fontWeight: 800 }} className="mg-gold-text">{priced ? (gross - fee).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "Priced at launch"}</div>
        <Select label="To token" value={to} options={TO} onChange={setTo} />
      </Leg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, fontSize: 12, color: MUTED }}>
        <span>Network</span><span style={{ color: "#fff" }}>Arbitrum One</span>
        <span>Platform fee · 1.88%</span><span style={{ fontFamily: MONO, color: "#fff" }}>{priced ? `${fee.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${to}` : "1.88% of output"}</span>
        <span>Route</span><span style={{ color: "#fff" }}>Best-price aggregator · next</span>
      </div>
      <button type="button" className="mg-btn-gold" disabled style={{ width: "100%", minHeight: 52 }}>Connect wallet to swap · coming next</button>
      <div style={{ fontSize: 10.5, color: MUTED, textAlign: "center" }}>Illustrative quote at reference prices. No transaction is sent.</div>
    </section>
  );
}

function Leg({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, background: "#0b0c11", border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{children}</div>
    </div>
  );
}

function LendPanel() {
  const vaults = [
    { c: "ETH", l: "USDC", lltv: "86%", oracle: "Chainlink" },
    { c: "WBTC", l: "USDC", lltv: "86%", oracle: "Chainlink" },
    { c: "$MADx", l: "USDC", lltv: "62.5%", oracle: "TWAP" },
  ];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>Isolated lending markets in the Morpho Blue style: one collateral, one loan asset, one oracle, one liquidation LTV per market. Market parameters shown; rates go live with the markets.</div>
      {vaults.map((v) => (
        <div key={v.c} className="mg-tile mg-tile-hover" style={{ padding: 14, display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 900 }}>{v.c} <span style={{ color: MUTED }}>→</span> {v.l}</span>
          <span><span style={{ display: "block", fontSize: 9, color: MUTED }}>LLTV</span><span style={{ fontFamily: MONO, color: GOLD }}>{v.lltv}</span></span>
          <span><span style={{ display: "block", fontSize: 9, color: MUTED }}>ORACLE</span><span style={{ fontFamily: MONO }}>{v.oracle}</span></span>
        </div>
      ))}
      <button type="button" className="mg-btn-gold" disabled style={{ width: "100%", minHeight: 52 }}>Supply · Borrow · coming next</button>
    </section>
  );
}

function P2PPanel() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Stat k="Escrow" v="2-of-2" accent={GOLD} />
        <Stat k="Assets" v="Any" />
        <Stat k="Fee" v="1.88%" accent={ROSSA} />
      </div>
      {[
        ["1", "List", "Any digital asset — tokens, NFTs, MADHAT's Gambit cards, domains."],
        ["2", "Lock", "Both sides deposit into the escrow contract. Nobody holds the other's asset."],
        ["3", "Release", "Both confirm and the swap settles atomically; a timeout refunds both sides."],
      ].map(([n, t, b]) => (
        <div key={n} className="mg-tile" style={{ padding: 14, display: "flex", gap: 12 }}>
          <span style={{ flex: "none", width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--mg-gold-fill)", color: "#1a1205", fontWeight: 900 }}>{n}</span>
          <span><span style={{ display: "block", fontWeight: 900 }}>{t}</span><span style={{ display: "block", fontSize: 12.5, color: "#cfc9b9", marginTop: 2, lineHeight: 1.45 }}>{b}</span></span>
        </div>
      ))}
      <button type="button" className="mg-btn-gold" disabled style={{ width: "100%", minHeight: 52 }}>Create an escrow offer · coming next</button>
    </section>
  );
}
