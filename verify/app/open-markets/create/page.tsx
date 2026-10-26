"use client";

/**
 * MAD Gambit — /open-markets/create : the creator studio.
 * Two classes, one studio: a dated Prediction, or a Conviction tree on The
 * Paseome (3–5 branches, forward or counterfactual). Example chips load the
 * eight founding markets so a market can be minted in one tap on stage.
 */
import React, { useEffect, useMemo, useState } from "react";
import { OMShell, Headline, MarketTile, SectionTitle, GOLD, ROSSA, MUTED, LINE } from "@/components/om-ui";
import { celebrate } from "@/components/joy-layer";
import { createConviction, createPrediction } from "@/lib/open-markets-store";
import {
  CONVICTION_EXAMPLES, PREDICTION_EXAMPLES, OM_B, decimalOdds, maxMakerLoss, pct, prices,
  qForProbabilities, validateConviction, validatePrediction, type OMMarket, type OMSide,
} from "@/lib/open-markets";
import { FRONTIER_MAX, FRONTIER_MIN } from "@/lib/paseome";

type Kind = "prediction" | "conviction";
const CATEGORIES = ["Culture", "Tech", "Business", "Crypto", "Sports", "Work", "City", "Social"];
const MONO = "ui-monospace, 'JetBrains Mono', monospace";

const field: React.CSSProperties = {
  width: "100%", minHeight: 46, padding: "12px 14px", borderRadius: 14, background: "#0f1016",
  border: `1px solid ${LINE}`, color: "#f6f1e3", fontSize: 15, fontFamily: "inherit", outline: "none",
};
const label: React.CSSProperties = { fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase", color: MUTED, marginBottom: 6, display: "block" };

function isoDay(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export default function CreateMarketPage() {
  const [kind, setKind] = useState<Kind>("prediction");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Prediction draft
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Culture");
  const [closes, setCloses] = useState(isoDay(Date.now() + 30 * 86_400_000));
  const [resolution, setResolution] = useState("");
  const [prob, setProb] = useState(50);
  // Conviction draft
  const [side, setSide] = useState<OMSide>("forward");
  const [root, setRoot] = useState("");
  const [branches, setBranches] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const k = q.get("kind");
    if (k === "conviction" || k === "prediction") setKind(k);
    // From the news tape's "Make it a market": start a prediction from the line.
    const t = q.get("title");
    if (t) { setKind("prediction"); setTitle(`Will "${t.slice(0, 120)}" still be the story by the next leg roll?`); setResolution("Wire pickup count at the leg boundary"); }
  }, []);

  const loadExample = (m: OMMarket) => {
    setError(null);
    if (m.cls === "prediction") {
      setKind("prediction");
      setTitle(m.title);
      setCategory(m.category);
      setResolution(m.resolution);
      setProb(Math.round(prices(m.outcomes, m.b)[0] * 100));
      setCloses(isoDay(Date.now() + 45 * 86_400_000));
    } else {
      setKind("conviction");
      setSide(m.side ?? "forward");
      setRoot(m.title);
      setCategory(m.category);
      setBranches(m.outcomes.map((o) => o.label));
    }
  };

  const closesAt = new Date(`${closes}T23:59:00`).getTime();
  const predDraft = { title, category, closesAt, resolution, openingProbability: prob / 100 };
  const convDraft = { side, root, branches, category };

  // A live preview built exactly as the store will build it.
  const preview: OMMarket = useMemo(() => {
    if (kind === "prediction") {
      const p = prob / 100;
      const q = qForProbabilities([p, 1 - p], OM_B);
      return {
        id: "preview", cls: "prediction", origin: "open", title: title || "Your question goes here?", category, emoji: "🎯",
        closesAt, resolution, creator: "You", b: OM_B, volume: 0, traders: 0, createdAt: Date.now(), history: [[p, 1 - p]],
        outcomes: [{ id: "p0", label: "Yes", q: q[0] }, { id: "p1", label: "No", q: q[1] }],
      };
    }
    const bs = branches.map((b, i) => b.trim() || `Branch ${i + 1}`);
    return {
      id: "preview", cls: "conviction", side, origin: "open", title: root || "The event your tree forks from.", category, emoji: "♞",
      closesAt: side === "forward" ? Date.now() + 59 * 86_400_000 : null, resolution: "", creator: "You", b: OM_B,
      volume: 0, traders: 0, createdAt: Date.now(), history: [bs.map(() => 1 / bs.length)],
      outcomes: bs.map((label, i) => ({ id: `b${i}`, label, q: 0 })),
    };
  }, [kind, prob, title, category, closesAt, resolution, branches, root, side]);

  const submit = () => {
    setBusy(true);
    const res = kind === "prediction" ? createPrediction(predDraft) : createConviction(convDraft);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    celebrate({ intensity: 1 });
    window.setTimeout(() => { window.location.href = `/open-markets/${encodeURIComponent(res.value.id)}?created=1`; }, 650);
  };

  const live = kind === "prediction" ? validatePrediction(predDraft) : validateConviction(convDraft);
  const examples = kind === "prediction" ? PREDICTION_EXAMPLES : CONVICTION_EXAMPLES;
  const n = branches.filter((b) => b.trim()).length;

  return (
    <OMShell title="Create a market" back={{ href: "/open-markets", label: "Back to markets" }}>
      <section className="mg-seam" data-explain="om-create">
        <Headline lead="Mint your" punch="Market" size={46}
          sub="Prediction or Conviction. You earn 28.8% → 40% of platform net on your own markets." />
      </section>

      <div role="tablist" aria-label="Market class" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 5, borderRadius: 18, background: "#0f1016", border: `1px solid ${LINE}` }}>
        {(["prediction", "conviction"] as Kind[]).map((k) => {
          const on = kind === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={on} onClick={() => { setKind(k); setError(null); }}
              data-explain={k === "prediction" ? "om-prediction" : "om-conviction"}
              style={{ minHeight: 48, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 13, letterSpacing: .4,
                background: on ? "var(--mg-gold-fill)" : "transparent", color: on ? "#1a1205" : "#cfc9b9", boxShadow: on ? "0 6px 18px -8px rgba(255,190,0,.7)" : "none" }}>
              {k === "prediction" ? "🎯 Prediction" : "♞ Conviction · Paseome"}
            </button>
          );
        })}
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionTitle>Start from an example</SectionTitle>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "2px 16px 6px", scrollbarWidth: "none" }}>
          {examples.map((m) => (
            <button key={m.id} type="button" onClick={() => loadExample(m)} className="mg-tile mg-tile-hover"
              style={{ flex: "none", width: 200, padding: 12, textAlign: "left", cursor: "pointer", color: "#f3efe4" }}>
              <div style={{ fontSize: 20 }}>{m.emoji}</div>
              <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{m.title}</div>
              <div style={{ marginTop: 8, fontSize: 9.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: m.cls === "prediction" ? GOLD : ROSSA }}>
                {m.cls === "prediction" ? "Prediction" : m.side === "counterfactual" ? "Counterfactual" : "Forward"} · Use ›
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mg-tile" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {kind === "prediction" ? (
          <>
            <div>
              <label style={label} htmlFor="om-q">Question</label>
              <textarea id="om-q" rows={3} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Will … before …?" style={{ ...field, resize: "vertical", lineHeight: 1.4 }} />
            </div>
            <Categories value={category} onChange={setCategory} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              <div>
                <label style={label} htmlFor="om-close">Closes</label>
                <input id="om-close" type="date" value={closes} onChange={(e) => setCloses(e.target.value)} style={{ ...field, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={label} htmlFor="om-src">Resolution source</label>
                <input id="om-src" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="e.g. Official transcript, publisher announcement" style={field} />
              </div>
            </div>
            <div data-explain="om-prediction">
              <label style={label} htmlFor="om-p">Opening probability · {prob}%</label>
              <input id="om-p" type="range" min={2} max={98} value={prob} onChange={(e) => setProb(Number(e.target.value))} style={{ width: "100%", accentColor: GOLD }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <OddsReadout side="Yes" p={prob / 100} color="#7cffc7" />
                <OddsReadout side="No" p={1 - prob / 100} color="#ff8f7a" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div data-explain="om-conviction">
              <span style={label}>Side</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["forward", "counterfactual"] as OMSide[]).map((sd) => {
                  const on = side === sd;
                  return (
                    <button key={sd} type="button" onClick={() => setSide(sd)} aria-pressed={on}
                      style={{ minHeight: 64, padding: "10px 12px", borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        background: on ? "rgba(249,86,57,.14)" : "#0f1016", border: `1px solid ${on ? "rgba(249,86,57,.6)" : LINE}`, color: "#f3efe4" }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{sd === "forward" ? "Forward · Foresight" : "Counterfactual · Hindsight"}</div>
                      <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>{sd === "forward" ? "Settles at the leg roll · untaken refunded" : "Never resolves · prices belief"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={label} htmlFor="om-root">Root event</label>
              <input id="om-root" value={root} onChange={(e) => setRoot(e.target.value)} placeholder={side === "forward" ? "A company announces…" : "If the meeting had been…"} style={field} />
            </div>
            <div>
              <span style={label}>Branches · {n} of {FRONTIER_MIN}–{FRONTIER_MAX} · change exactly one thing</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {branches.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ flex: "none", width: 30, display: "grid", placeItems: "center", borderRadius: 10, background: "#1a1c25", color: ROSSA, fontWeight: 900, fontFamily: MONO }}>{i + 1}</span>
                    <input value={b} aria-label={`Branch ${i + 1}`} onChange={(e) => setBranches(branches.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={side === "forward" ? "What if …?" : "What if it had …?"} style={{ ...field, minHeight: 44, fontSize: 14 }} />
                    {branches.length > FRONTIER_MIN ? (
                      <button type="button" aria-label={`Remove branch ${i + 1}`} onClick={() => setBranches(branches.filter((_, j) => j !== i))} className="mg-btn-ghost" style={{ flex: "none", width: 44, padding: 0 }}>×</button>
                    ) : null}
                  </div>
                ))}
              </div>
              {branches.length < FRONTIER_MAX ? (
                <button type="button" onClick={() => setBranches(branches.concat([""]))} className="mg-btn-ghost" style={{ marginTop: 10, width: "100%" }}>+ Add branch</button>
              ) : null}
              <div style={{ marginTop: 10, fontSize: 11, color: MUTED, fontFamily: MONO }} data-explain="om-certain">
                Opens uniform at {pct(1 / Math.max(n || branches.length, 1), 1)} each · max maker loss {maxMakerLoss(Math.max(n, FRONTIER_MIN)).toFixed(1)} $MADx
              </div>
            </div>
            <Categories value={category} onChange={setCategory} />
            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>Paseome trees open at MinorCreator or VIP. The demo floor lets anyone try one.</div>
          </>
        )}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionTitle>Live preview</SectionTitle>
        <div style={{ pointerEvents: "none" }}><MarketTile m={preview} /></div>
      </section>

      {error ? <div role="alert" style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(251,41,43,.12)", border: "1px solid rgba(251,41,43,.45)", color: "#ffd0cc", fontSize: 13 }}>{error}</div> : null}

      <button type="button" className="mg-btn-gold" onClick={submit} disabled={busy} style={{ width: "100%", minHeight: 54, fontSize: 16 }} data-explain="om-create">
        {busy ? "Minting…" : kind === "prediction" ? "Mint prediction market" : "Open Paseome tree"}
      </button>
      {live && !error ? <div style={{ marginTop: -10, textAlign: "center", fontSize: 11, color: MUTED }}>{live}</div> : null}
      <div style={{ textAlign: "center", fontSize: 11, color: MUTED, marginTop: -8 }}>1.88% flat fee · your share 28.8% → 40% · VIP 60% (4,888 seats)</div>
    </OMShell>
  );
}

function Categories({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span style={label}>Category</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CATEGORIES.map((c) => {
          const on = c === value;
          return (
            <button key={c} type="button" onClick={() => onChange(c)} aria-pressed={on} className="mg-chip"
              style={{ height: 34, padding: "0 13px", cursor: "pointer", color: on ? "#1a1205" : "#d7d2c4", background: on ? "var(--mg-gold-fill)" : "rgba(255,255,255,.04)", borderColor: on ? "transparent" : LINE }}>
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OddsReadout({ side, p, color }: { side: string; p: number; color: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: "#14161f", border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color }}>{side} · {pct(p)}</div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, marginTop: 2 }}>{decimalOdds(p).toFixed(2)}</div>
    </div>
  );
}
