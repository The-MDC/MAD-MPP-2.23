"use client";

/**
 * MAD Gambit — Affliction lobby: MADHAT's Gambit card drops.
 *
 * The hook, made playable: a live Dutch-auction drop whose price walks down to
 * its floor, a pack shop, a flip-reveal rip, and the collection it builds.
 * Cards come from openCardPack() in lib/gambit-game-math — the weighted
 * generator the server route uses — so every rarity on screen is the real
 * distribution. Demo floor: spends free-play $MADx from the shared store.
 */
import React, { useEffect, useState } from "react";
import { celebrate } from "@/components/joy-layer";
import { useOpenMarkets, ripPacks, type RippedCard } from "@/lib/open-markets-store";
import { PLATFORM, RARITY_ORDER, RARITY_TABLE, type Rarity } from "@/lib/gambit-game-math";
import { madx } from "@/lib/open-markets";

const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const LINE = "rgba(214,157,65,.16)";
const MUTED = "#8e8a80";
const PACK = PLATFORM.CARD_PACK_COST; // 4.88 $MADx
const SIZE = PLATFORM.CARD_PACK_SIZE; // 5 cards

/* Demo drop curve — ceiling → floor in 0.88 steps, all eights by design. */
const CEIL = 18.8;
const FLOOR = 4.88;
const STEP = 0.88;

export default function AfflictionLobby() {
  const s = useOpenMarkets();
  const [price, setPrice] = useState(CEIL);
  const [left, setLeft] = useState(188);
  const [bidders, setBidders] = useState(412);
  const [reveal, setReveal] = useState<RippedCard[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      setPrice((p) => (p - STEP < FLOOR ? CEIL : Math.round((p - STEP) * 100) / 100));
      setBidders((b) => b + (Math.random() < 0.6 ? 1 : 0));
    }, reduce ? 6000 : 2600);
    return () => window.clearInterval(id);
  }, []);

  const rip = (count: number, each: number) => {
    const r = ripPacks(count, each);
    if (!r.ok) { setErr(r.error); return; }
    setErr(null);
    setReveal(r.value.slice(0, Math.min(r.value.length, 10)));
    const best = r.value.reduce((a, c) => Math.max(a, RARITY_ORDER.indexOf(c.rarity)), 0);
    celebrate({ intensity: best >= RARITY_ORDER.indexOf("Legendary") ? 1 : 0.7 });
    if (count === 1 && each !== PACK) setLeft((l) => Math.max(0, l - 1));
  };

  const counts = RARITY_ORDER.map((r) => ({ r, n: s.cards.filter((c) => c.rarity === r).length }));
  const power = s.cards.reduce((a, c) => a + (RARITY_TABLE[c.rarity]?.powerScore ?? 0), 0);
  const frac = (CEIL - price) / (CEIL - FLOOR);

  return (
    <div data-explain="affliction" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/madhatr-logo.png" alt="" width={56} height={56} style={{ borderRadius: 16, border: "1px solid rgba(249,86,57,.5)", boxShadow: "0 0 24px -6px rgba(249,86,57,.7)" }} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, lineHeight: .95 }}>
            <span className="mg-display" style={{ fontSize: 36, color: "#f6f1e3" }}>Rip the </span>
            <span className="mg-punch mg-gold-text" style={{ fontSize: 38 }}>Pack</span>
          </h2>
          <div style={{ fontSize: 11.5, color: "#c9bfa9", marginTop: 4 }}>MADHAT&apos;s Gambit · 992 satirical cards · meme it, rip it, flex it</div>
        </div>
      </div>

      {/* Dutch auction drop */}
      <section style={{ position: "relative", borderRadius: 22, padding: 2, background: "var(--mg-gold-chisel)", boxShadow: "0 18px 40px -18px rgba(255,190,0,.55)" }}>
        <div style={{ borderRadius: 20, padding: 16, background: "radial-gradient(120% 90% at 0% 0%, rgba(249,86,57,.32) 0%, rgba(122,17,15,.22) 35%, #0b0907 75%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span className="mg-chip" style={{ color: "#ffd3c4", borderColor: "rgba(249,86,57,.6)", background: "rgba(249,86,57,.16)" }}>● Demo drop · Dutch auction</span>
            <span style={{ fontSize: 10.5, color: "#e8d9b8", fontFamily: MONO }}>{left} packs left</span>
          </div>
          <div className="mg-display" style={{ marginTop: 10, fontSize: 30, color: "#fff4e8" }}>Scandal Pack · Leg Drop</div>
          <div style={{ fontSize: 11.5, color: "#d9c7b0" }}>Uniform price — everyone pays the clearing price. Clears at the floor or sell-out.</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 14, gap: 10 }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 1.3, color: "#e7c98a" }}>NOW</div>
              <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, lineHeight: 1 }} className="mg-gold-text">{price.toFixed(2)}</div>
              <div style={{ fontSize: 10.5, color: "#d9c7b0" }}>$MADx · falling {STEP} per tick</div>
            </div>
            <div style={{ textAlign: "right", fontFamily: MONO, fontSize: 11, color: "#e8d9b8", lineHeight: 1.7 }}>
              <div>CEILING {CEIL.toFixed(2)}</div>
              <div>FLOOR {FLOOR.toFixed(2)}</div>
              <div>{bidders} bidders</div>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: "rgba(0,0,0,.45)", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(4, frac * 100)}%`, height: "100%", background: "linear-gradient(90deg, #f95639, #d69d41)", transition: "width .6s var(--mg-ease)" }} />
          </div>
          <button type="button" className="mg-btn-gold" onClick={() => rip(1, price)} style={{ width: "100%", minHeight: 52, marginTop: 14, fontSize: 15 }}>
            Bid &amp; rip at {price.toFixed(2)} $MADx
          </button>
        </div>
      </section>

      {/* Pack shop */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { n: 1, name: "Scandal Pack", tag: `${SIZE} cards`, glow: "#f95639" },
          { n: 5, name: "Gossip Bundle", tag: `${5 * SIZE} cards`, glow: "#fc3437" },
          { n: 10, name: "Golden Hunt", tag: `${10 * SIZE} cards`, glow: "#d69d41" },
        ].map((p) => (
          <button key={p.n} type="button" onClick={() => rip(p.n, PACK)} className="mg-tile mg-tile-hover"
            style={{ padding: "14px 8px 12px", cursor: "pointer", color: "#f6f1e3", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ width: 46, height: 60, borderRadius: 10, background: `linear-gradient(160deg, ${p.glow} 0%, #1b0f05 70%)`, border: "1px solid rgba(214,157,65,.5)", boxShadow: `0 0 18px -4px ${p.glow}`, display: "grid", placeItems: "center", fontSize: 20 }}>🎩</span>
            <span style={{ fontWeight: 900, fontSize: 12 }}>{p.name}</span>
            <span style={{ fontSize: 10, color: MUTED }}>{p.tag}</span>
            <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 13, color: "#d69d41" }}>{madx(p.n * PACK)}</span>
          </button>
        ))}
      </section>
      <div style={{ marginTop: -8, fontSize: 10.5, color: MUTED, textAlign: "center" }}>{madx(PACK)} $MADx per pack · {SIZE} cards · slot 1 guaranteed Uncommon+ · packs roll dice, markets never do</div>
      {err ? <div role="alert" style={{ fontSize: 12.5, color: "#ffb4ab", textAlign: "center" }}>{err} <a href="/profile" style={{ color: "#d69d41", fontWeight: 900 }}>Top up ›</a></div> : null}

      {/* Reveal */}
      {reveal ? (
        <section aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="mg-display" style={{ fontSize: 24 }}>Fresh rip</div>
            <button type="button" onClick={() => setReveal(null)} style={{ background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", minHeight: 32 }}>Close ✕</button>
          </div>
          <div className="mg-carousel-track" style={{ ["--mg-gap" as string]: "10px" }}>
            {reveal.map((c, i) => <CardFace key={c.id} c={c} delay={i * 170} />)}
          </div>
        </section>
      ) : null}

      {/* Collection dashboard */}
      <section className="mg-tile" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="mg-display" style={{ fontSize: 24 }}>Your collection</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{s.cards.length} cards · power {power.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {counts.map(({ r, n }) => (
            <span key={r} className="mg-chip" style={{ color: RARITY_TABLE[r].accent, borderColor: `${RARITY_TABLE[r].accent}66`, background: n ? `${RARITY_TABLE[r].accent}14` : "transparent", opacity: n ? 1 : 0.45 }}>
              {r} · {n}
            </span>
          ))}
        </div>
        {s.cards.length ? (
          <div className="mg-carousel-track" style={{ ["--mg-gap" as string]: "8px" }}>
            {s.cards.slice(0, 16).map((c) => <CardFace key={c.id} c={c} small />)}
          </div>
        ) : <div style={{ fontSize: 12.5, color: MUTED }}>Empty — your first rip lands here.</div>}
        <div style={{ fontSize: 11.5, color: MUTED }}>Balance <span style={{ fontFamily: MONO, color: "#d69d41" }}>{madx(s.credits)}</span> demo $MADx</div>
      </section>
    </div>
  );
}

function CardFace({ c, delay = 0, small }: { c: RippedCard; delay?: number; small?: boolean }) {
  const t = RARITY_TABLE[c.rarity as Rarity];
  const holo = t?.holographic;
  const w = small ? 120 : 168;
  return (
    <div className="mg-card-flip" style={{ flex: `0 0 ${w}px`, height: small ? 168 : 236, animationDelay: `${delay}ms` }}>
      <div className={`mg-card-face${holo ? " mg-holo" : ""}`} style={{ borderColor: t?.accent ?? "#999", boxShadow: `0 0 22px -8px ${t?.accent ?? "#999"}` }}>
        <span className="mg-chip" style={{ alignSelf: "flex-start", height: 20, fontSize: 8.5, color: "#0a0a0a", background: t?.accent ?? "#999", borderColor: "transparent" }}>{c.rarity}</span>
        <div style={{ flex: 1, display: "grid", placeItems: "center", fontSize: small ? 30 : 42 }} aria-hidden="true">🎩</div>
        <div style={{ fontWeight: 900, fontSize: small ? 11 : 13, lineHeight: 1.2 }}>{c.name}</div>
        <div style={{ fontSize: small ? 9 : 10, color: "#c9bfa9", marginTop: 2 }}>{c.faction} · #{c.serial}</div>
        {!small ? <div style={{ fontSize: 10, color: "#a99f8a", marginTop: 6, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.caption}</div> : null}
      </div>
    </div>
  );
}
