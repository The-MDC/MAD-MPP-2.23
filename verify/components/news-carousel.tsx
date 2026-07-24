"use client";

/**
 * MAD Gambit — live satirical news carousel (mockup "News Flow" placeholder → real).
 * ────────────────────────────────────────────────────────────────
 * A rotating visual carousel over our satirical feed: source photo + real headline
 * + OUR satirical rewrite + Z-Liar / GossipCop badges. Category tabs across the top
 * publishers — Entertainment · Celebrity · Crypto · Political — from
 * /api/v1/news/satirical (live RSS or demo). Auto-rotates; reduced-motion safe.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

type NewsCategory = "entertainment" | "celebrity" | "crypto" | "political";
interface Item {
  source: string;
  category: NewsCategory;
  image: string | null;
  realHeadline: string;
  satiricalHeadline: string;
  satireScore: number;
  verdict: string;
  brandSafe: boolean;
  link: string;
}
interface Resp {
  success: boolean;
  source?: string;
  byCategory: Record<NewsCategory, Item[]>;
}

const TABS: { key: NewsCategory; label: string; emoji: string }[] = [
  { key: "entertainment", label: "Entertainment", emoji: "🎬" },
  { key: "celebrity", label: "Celebrity", emoji: "⭐" },
  { key: "crypto", label: "Crypto", emoji: "🪙" },
  { key: "political", label: "Political", emoji: "🏛️" },
];

function Art({ image, from, to }: { image: string | null; from: string; to: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {image && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 8%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.35))" }} />
    </div>
  );
}

export default function NewsCarousel() {
  const { skin } = useSkin();
  const [data, setData] = useState<Resp | null>(null);
  const [cat, setCat] = useState<NewsCategory>("entertainment");
  const [idx, setIdx] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    fetch("/api/v1/news/satirical")
      .then((r) => r.json())
      .then((d: Resp) => {
        if (d?.success) setData(d);
      })
      .catch(() => {});
  }, []);

  const items = data?.byCategory?.[cat] ?? [];

  useEffect(() => {
    setIdx(0);
  }, [cat, data]);

  useEffect(() => {
    if (reduce || items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [reduce, items.length, cat]);

  const item = items.length ? items[idx % items.length] : null;
  const live = data?.source === "live";
  const isGossip = cat === "celebrity" || cat === "entertainment";
  const palette = [skin.accent2, skin.accent, skin.gold, skin.accent];
  const from = palette[idx % palette.length];
  const to = palette[(idx + 1) % palette.length];

  const step = (d: number) => {
    if (items.length) setIdx((i) => (i + d + items.length) % items.length);
  };

  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 0 10px 2px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.text, textTransform: "uppercase" }}>
          News Flow 📰 <span style={{ color: skin.accent2 }}>· Satirical Feed</span>
        </div>
        {data && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, color: live ? skin.accent : skin.muted, background: `${live ? skin.accent : skin.muted}18`, border: `1px solid ${live ? skin.accent : skin.muted}40` }}>
            {live ? "live" : "demo"}
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {TABS.map((t) => {
          const active = cat === t.key;
          const count = data?.byCategory?.[t.key]?.length ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setCat(t.key)}
              style={{ padding: "5px 10px", borderRadius: 999, cursor: "pointer", fontSize: 8.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: active ? skin.bg : skin.text, background: active ? skin.gold : skin.card, border: `1px solid ${active ? skin.gold : skin.border}`, fontFamily: INSTRUMENT_FONT }}
            >
              {t.emoji} {t.label} {count ? <span style={{ opacity: 0.7 }}>{count}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Rotating slide */}
      {data === null ? (
        <div style={{ fontSize: 9, color: skin.muted, padding: "20px 2px" }}>Loading the scandal wire…</div>
      ) : item === null ? (
        <div style={{ fontSize: 9, color: skin.muted, padding: "20px 2px" }}>No headlines in this feed yet.</div>
      ) : (
        <div
          onClick={() => { if (item.link) window.open(item.link, "_blank", "noopener"); }}
          role="link"
          title={item.link ? "Open source article" : undefined}
          style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${skin.border}`, minHeight: 232, cursor: item.link ? "pointer" : "default" }}
        >
          <Art image={item.image} from={from} to={to} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: 232, padding: 16 }}>
            {/* top row: source + badges */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#fff", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 6 }}>
                {item.source}
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: skin.bg, background: skin.gold, padding: "3px 7px", borderRadius: 6 }}>
                  Z-Liar {Math.round(item.satireScore)} · {item.verdict}
                </span>
                {isGossip && (
                  <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: skin.accent2, padding: "3px 7px", borderRadius: 6 }}>
                    🗞️ GossipCop
                  </span>
                )}
              </div>
            </div>
            {/* bottom: satirical headline + real headline */}
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: skin.gold, lineHeight: 1.15, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                {item.satiricalHeadline}
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 1.35 }}>
                <span style={{ color: skin.accent2, fontWeight: 900 }}>REAL:</span> {item.realHeadline}
              </div>
            </div>
          </div>

          {/* arrows */}
          <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); step(-1); }} style={arrowStyle(skin.accent, "left")}>‹</button>
          <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); step(1); }} style={arrowStyle(skin.accent, "right")}>›</button>
        </div>
      )}

      {/* dots */}
      {items.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
          {items.map((_, i) => (
            <span key={i} style={{ width: i === idx % items.length ? 16 : 6, height: 6, borderRadius: 999, background: i === idx % items.length ? skin.gold : skin.border, transition: "width .3s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

function arrowStyle(color: string, side: "left" | "right"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    border: `1px solid ${color}`,
    color,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 900,
    lineHeight: "26px",
    textAlign: "center",
    padding: 0,
  };
  if (side === "left") base.left = 8;
  else base.right = 8;
  return base;
}
