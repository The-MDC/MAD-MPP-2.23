"use client";

/**
 * MAD Gambit — two-row satirical headline carousel (restored, center column).
 * ────────────────────────────────────────────────────────────────
 * Two perpetual marquee rows (scrolling opposite directions) of satirical headline
 * cards spanning the feeds: Celebrity · Crypto · Political (from the news wire) plus
 * Z-Liar Meter and GossipCop perp items (from the classifier). Each card = source
 * photo + our satirical headline + kind + Z-Liar badge, and is clickable (news →
 * source article, markets → the app). Hover pauses; reduced-motion safe.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

type Kind =
  | "celebrity" | "entertainment" | "influencer" | "political" | "sports"
  | "tabloid" | "television" | "viral" | "crypto" | "funnies"
  | "zliar" | "gossipcop";
interface Card {
  kind: Kind;
  source: string;
  headline: string;
  image: string | null;
  z: number;
  link: string;
}

// The 10 satirical feed categories (order mirrors the API / left rail).
const FEED_KINDS: Kind[] = [
  "celebrity", "entertainment", "influencer", "political", "sports",
  "tabloid", "television", "viral", "crypto", "funnies",
];

const LABEL: Record<Kind, string> = {
  celebrity: "Celebrity", entertainment: "Entertainment", influencer: "Influencers & KOLs",
  political: "Politics", sports: "Sports", tabloid: "Tabloid", television: "Television",
  viral: "Viral Social", crypto: "Crypto", funnies: "Funnies & Gaffes",
  zliar: "Z-Liar", gossipcop: "GossipCop",
};

function ThumbImg({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
}

function CardView({ c }: { c: Card }) {
  const { skin } = useSkin();
  const color =
    c.kind === "crypto" || c.kind === "zliar" || c.kind === "funnies"
      ? skin.gold
      : c.kind === "political" || c.kind === "entertainment" || c.kind === "television"
      ? skin.accent
      : c.kind === "viral" || c.kind === "sports"
      ? skin.positive
      : skin.accent2; // celebrity · tabloid · influencer · gossipcop
  const onClick = () => {
    if (!c.link) return;
    if (c.link.charAt(0) === "/") window.location.href = c.link;
    else window.open(c.link, "_blank", "noopener");
  };
  return (
    <div
      onClick={onClick}
      role="link"
      title={c.link ? "Open" : undefined}
      style={{ minWidth: 238, width: 238, flex: "0 0 auto", background: skin.card, border: `1px solid ${color}66`, borderRadius: 12, overflow: "hidden", cursor: c.link ? "pointer" : "default", fontFamily: INSTRUMENT_FONT }}
    >
      <div style={{ height: 76, position: "relative", background: `linear-gradient(135deg, ${color}, ${skin.accent})` }}>
        {c.image ? <ThumbImg src={c.image} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.05))" }} />
        <span style={{ position: "absolute", top: 6, left: 6, fontSize: 6.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: `${color}cc`, padding: "2px 6px", borderRadius: 5 }}>{LABEL[c.kind]}</span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: skin.text, lineHeight: 1.3, height: 35, overflow: "hidden" }}>{c.headline}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 6.5, color: skin.muted }}>
          <span style={{ color, fontWeight: 900 }}>{c.source}</span>
          <span style={{ marginLeft: "auto" }}>Z-Liar <b style={{ color: skin.gold }}>{Math.round(c.z)}</b></span>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ cards, dir }: { cards: Card[]; dir: "l" | "r" }) {
  if (!cards.length) return null;
  const run = cards.concat(cards);
  return (
    <div className="mg-nr-row" style={{ overflow: "hidden" }}>
      <div className={`mg-nr-track ${dir === "l" ? "mg-nr-l" : "mg-nr-r"}`} style={{ display: "inline-flex", gap: 10, willChange: "transform" }}>
        {run.map((c, i) => (
          <CardView key={i} c={c} />
        ))}
      </div>
    </div>
  );
}

export default function NewsTwoRow() {
  const { skin } = useSkin();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [active, setActive] = useState<Kind | null>(null);

  // Left-rail categories filter this feed in place (worksheet item D). null = All.
  useEffect(() => {
    const onCategory = (e: Event) => {
      const detail = (e as CustomEvent).detail as Kind | null;
      setActive(detail ?? null);
    };
    window.addEventListener("mg:category", onCategory as EventListener);
    return () => window.removeEventListener("mg:category", onCategory as EventListener);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/news/satirical").then((r) => r.json()).catch(() => null),
      fetch("/api/v1/markets/proposals?limit=40").then((r) => r.json()).catch(() => null),
    ]).then(([news, markets]) => {
      const out: Card[] = [];
      if (news?.success) {
        FEED_KINDS.forEach((k) => {
          const arr = news.byCategory?.[k] ?? [];
          arr.slice(0, 5).forEach((it: { source: string; satiricalHeadline: string; image: string | null; satireScore: number; link: string }) => {
            out.push({ kind: k, source: it.source, headline: it.satiricalHeadline, image: it.image, z: it.satireScore, link: it.link ?? "" });
          });
        });
      }
      if (markets?.success) {
        (markets.proposals ?? []).forEach((p: { type: Kind; title: string; zliarScore: number }) => {
          if (p.type === "zliar") out.push({ kind: "zliar", source: "Z-Liar Meter", headline: p.title, image: null, z: p.zliarScore, link: "/gambit" });
          if (p.type === "gossipcop") out.push({ kind: "gossipcop", source: "GossipCop", headline: p.title, image: null, z: p.zliarScore, link: "/gambit" });
        });
      }
      setCards(out);
    });
  }, []);

  const all = cards ?? [];
  // Active category filters the wire in place; null = the full two-row marquee.
  const list = active ? all.filter((c) => c.kind === active) : all;
  const rowA = list.filter((_, i) => i % 2 === 0);
  const rowB = list.filter((_, i) => i % 2 === 1);

  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px 2px" }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.text, textTransform: "uppercase" }}>
          News Flow 📰 <span style={{ color: skin.accent2 }}>{active ? `· ${LABEL[active]}` : "· Satirical Two-Row Wire"}</span>
        </span>
        {active ? (
          <button
            type="button"
            onClick={() => { setActive(null); if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("mg:category", { detail: null })); }}
            style={{ marginLeft: "auto", fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.gold, background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
          >
            All ✕
          </button>
        ) : null}
      </div>
      {cards === null ? (
        <div style={{ fontSize: 9, color: skin.muted, padding: "18px 2px" }}>Loading the scandal wire…</div>
      ) : list.length === 0 ? (
        <div style={{ fontSize: 9, color: skin.muted, padding: "18px 2px" }}>No headlines in {active ? LABEL[active] : "this feed"} yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <MarqueeRow cards={rowA.length ? rowA : list} dir="l" />
          <MarqueeRow cards={rowB.length ? rowB : list} dir="r" />
        </div>
      )}
      <style>{`
        .mg-nr-track { animation-timing-function: linear; animation-iteration-count: infinite; animation-duration: 46s; }
        .mg-nr-track.mg-nr-l { animation-name: mgNrL; }
        .mg-nr-track.mg-nr-r { animation-name: mgNrR; }
        .mg-nr-row:hover .mg-nr-track { animation-play-state: paused; }
        @keyframes mgNrL { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes mgNrR { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .mg-nr-track { animation: none; } }
      `}</style>
    </div>
  );
}
