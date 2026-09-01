"use client";

/**
 * MAD Gambit — Markets Panel (Part W)
 * The real prediction-market surface: lists markets from /api/v1/markets, lets
 * you spin up a new one, and shows YES/NO odds + volume. Live against Neon when
 * configured; clean empty state otherwise. Skin-aware design system (no external assets).
 */
import React, { useEffect, useState } from "react";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { useSkin } from "@/components/skin-provider";

interface Mkt {
  id: string;
  title: string;
  category: string;
  yesOdds: number;
  noOdds: number;
  status: string;
  volume: number;
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function MarketsPanel() {
  const { skin } = useSkin();
  const [markets, setMarkets] = useState<Mkt[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = () => {
    fetch("/api/v1/markets")
      .then((r) => r.json())
      .then((d) => setMarkets(d?.success ? (d.markets as Mkt[]) : []))
      .catch(() => setMarkets([]));
  };
  useEffect(load, []);

  const create = () => {
    if (!title.trim()) return;
    setBusy(true);
    setNote(null);
    fetch("/api/v1/markets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    })
      // The status is read BEFORE the body. Creating a market is signed-in only
      // now, and a 401 arrives as {success:false,error:"unauthorized"} — which
      // this panel would otherwise have surfaced to the user as the bare word
      // "unauthorized" in a status line, next to a form that still looked
      // usable. A person who is simply not signed in deserves to be told that,
      // not handed the API's word for it.
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
      .then(({ status, body: d }) => {
        if (status === 401) {
          setNote("Sign in with your wallet to create a market.");
          return;
        }
        if (d?.success) {
          setTitle("");
          load();
          return;
        }
        setNote(d?.error === "markets need DATABASE_URL" ? "Connect the DB to create markets." : d?.error || "failed");
      })
      .catch(() => setNote("failed"))
      .finally(() => setBusy(false));
  };

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          Prediction Markets
        </div>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: skin.muted, background: `${skin.muted}18`, border: `1px solid ${skin.muted}40` }}>
          {markets ? `${markets.length} live` : "…"}
        </span>
      </div>

      {/* create */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Will X happen by …?"
          style={{ flex: 1, background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 8, padding: "8px 10px", color: skin.text, fontFamily: INSTRUMENT_FONT, fontSize: 11 }}
        />
        <button onClick={create} disabled={busy} style={{ padding: "8px 12px", borderRadius: 8, cursor: busy ? "default" : "pointer", fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.text, background: `${skin.positive}18`, border: `1px solid ${skin.positive}`, fontFamily: INSTRUMENT_FONT, opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : "Create"}
        </button>
      </div>
      {note && <div style={{ fontSize: 8, color: skin.muted, marginBottom: 10 }}>{note}</div>}

      {markets !== null && markets.length === 0 && (
        <div style={{ fontSize: 9, color: skin.muted }}>No markets yet — create the first one above.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(markets ?? []).map((m) => (
          <div key={m.id} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: skin.text }}>{m.title}</span>
              <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: m.status === "open" ? skin.positive : skin.muted }}>{m.status}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: `${skin.positive}14`, border: `1px solid ${skin.positive}40` }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: skin.positive }}>{m.yesOdds.toFixed(2)}×</div>
                <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>Yes</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, background: `${skin.accent2}14`, border: `1px solid ${skin.accent2}40` }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: skin.accent2 }}>{m.noOdds.toFixed(2)}×</div>
                <div style={{ fontSize: 7, color: skin.muted, textTransform: "uppercase", letterSpacing: 1 }}>No</div>
              </div>
            </div>
            <div style={{ fontSize: 7, color: skin.muted, marginTop: 6, textAlign: "right" }}>vol {usd(m.volume)} · {m.category}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 7, color: skin.muted, marginTop: 12, lineHeight: 1.5 }}>
        Live against Neon when configured. Betting settles on-chain (Phase 3) — POST /api/v1/bets records the wager.
      </div>
    </div>
  );
}
