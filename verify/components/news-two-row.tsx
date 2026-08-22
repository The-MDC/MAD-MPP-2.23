"use client";

/**
 * MAD Gambit — two-row satirical headline carousel (restored, center column).
 * ────────────────────────────────────────────────────────────────
 * Two perpetual marquee rows (scrolling opposite directions) of satirical headline
 * cards spanning the 6 canonical category feeds (from the news wire) plus
 * Z-Liar Meter and GossipCop perp items (from the classifier). Each card = source
 * photo + our satirical headline + kind + Z-Liar badge, and is clickable (news →
 * source article, markets → the app). Hover pauses; reduced-motion safe.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import MetricPopover from "@/components/metric-popover";
import { HEAT_EXPLAINER, type HeatSignals } from "@/lib/heat-score";

type Kind =
  | "headlines" | "entertainment" | "sports" | "viraltech" | "crypto" | "tabloid"
  | "zliar" | "gossipcop";
interface Card {
  kind: Kind;
  source: string;
  headline: string;
  image: string | null;
  z: number;
  link: string;
  heat: number;
  signals: HeatSignals | null;
}

// The 6 canonical feed categories (order mirrors the API / left rail).
const FEED_KINDS: Kind[] = [
  "headlines", "entertainment", "sports", "viraltech", "crypto", "tabloid",
];

// Labels are founder marketing canon (31 Jul 2026) — verbatim, do not paraphrase.
const LABEL: Record<Kind, string> = {
  headlines: "Headlines & Politics", entertainment: "Entertainment & Celebrity",
  sports: "Athletes & Sports", viraltech: "Viral Media & Tech",
  crypto: "Crypto & Finance", tabloid: "Tabloids & Gossip",
  zliar: "Z-Liar", gossipcop: "GossipCop",
};

/**
 * Every headline on this wire names the instrument it trades as. Row one
 * carries the two market types; row two carries the perps.
 *
 * The split is by instrument, not by index. It used to be `i % 2`, which
 * interleaved one ranked list into two rows — the rows looked different but
 * meant nothing, and a perp could surface in either.
 */
const PERP_KINDS: ReadonlySet<Kind> = new Set<Kind>(["zliar", "gossipcop"]);

/** Perp instrument names, as they are branded. */
const PERP_LABEL: Partial<Record<Kind, string>> = {
  zliar: "Z-LIAR METER",
  gossipcop: "GOSSIP-COP",
};

/**
 * Which market a news category lists as.
 *
 * Categories that resolve against a fact — a price, a result, a published
 * number — list as PREDICTION, because they settle. Categories that resolve
 * against sentiment list as CONVICTION, because what is traded is the strength
 * of belief, not the outcome. The mapping is total and deterministic: the same
 * headline always shows the same instrument, with no randomness to drift
 * between server and client paint.
 */
function marketLabel(kind: Kind): string {
  const perp = PERP_LABEL[kind];
  if (perp) return perp;
  return kind === "crypto" || kind === "sports" || kind === "headlines"
    ? "PREDICTION"
    : "CONVICTION";
}

function ThumbImg({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
}

/** Rows for the Heat explainer popup: HEAT_EXPLAINER copy + this card's values. */
function heatRows(sig: HeatSignals) {
  return HEAT_EXPLAINER.signals.map((s) => ({
    label: s.label,
    kind: s.kind,
    note: s.note,
    value: s.key === "crossSource" ? `×${sig.crossSource}` : sig[s.key],
  }));
}

function CardView({ c }: { c: Card }) {
  const { skin } = useSkin();
  const [info, setInfo] = useState(false);
  const color =
    c.kind === "crypto" || c.kind === "zliar"
      ? skin.gold
      : c.kind === "headlines" || c.kind === "entertainment"
      ? skin.accent
      : c.kind === "viraltech" || c.kind === "sports"
      ? skin.positive
      : skin.accent2; // tabloid · gossipcop
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
      // marginRight (not the track's gap) carries the spacing — see MarqueeRow.
      style={{ minWidth: 238, width: 238, flex: "0 0 auto", marginRight: 10, background: skin.card, border: `1px solid ${color}66`, borderRadius: 12, overflow: "hidden", cursor: c.link ? "pointer" : "default", fontFamily: INSTRUMENT_FONT }}
    >
      <div style={{ height: 76, position: "relative", background: `linear-gradient(135deg, ${color}, ${skin.accent})` }}>
        {c.image ? <ThumbImg src={c.image} /> : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.05))" }} />
        <span style={{ position: "absolute", top: 6, left: 6, fontSize: 6.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: `${color}cc`, padding: "2px 6px", borderRadius: 5 }}>{LABEL[c.kind]}</span>
        {/* Heat badge — clickable; explains how the ranking is measured. */}
        {c.signals ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInfo(true); }}
            title="How is Heat measured?"
            style={{ position: "absolute", top: 6, right: 6, display: "inline-flex", alignItems: "center", gap: 2, fontSize: 8, fontWeight: 900, color: "#0b0b12", background: skin.gold, border: "none", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontFamily: INSTRUMENT_FONT, boxShadow: `0 0 10px ${skin.gold}66` }}
          >
            🔥 {Math.round(c.heat)}
          </button>
        ) : null}
        {/* The instrument this headline trades as — every card names one. */}
        <span
          style={{
            position: "absolute", bottom: 6, left: 6,
            fontSize: 6.5, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
            color: PERP_KINDS.has(c.kind) ? "#0b0b12" : "#fff",
            background: PERP_KINDS.has(c.kind) ? skin.gold : "rgba(8,8,14,0.78)",
            border: `1px solid ${PERP_KINDS.has(c.kind) ? skin.gold : `${color}88`}`,
            padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap",
          }}
        >
          {marketLabel(c.kind)}
        </span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        {/* Headline box.
            Was lineHeight:1.3 (= 11.7px) in a 35px box, so the third line was
            sliced through the glyphs — the formatting artifact on this wire.
            An integer 12px line box times exactly 3 lines is 36px, so nothing
            is ever cut mid-character, and line-clamp ends an over-long
            headline with an ellipsis instead of a shaved row of letters. */}
        <div
          style={{
            fontSize: 9, fontWeight: 700, color: skin.text,
            lineHeight: "12px", height: 36,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {c.headline}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 6.5, color: skin.muted }}>
          <span style={{ color, fontWeight: 900 }}>{c.source}</span>
          <span style={{ marginLeft: "auto" }}>Z-Liar <b style={{ color: skin.gold }}>{Math.round(c.z)}</b></span>
        </div>
      </div>
      {c.signals ? (
        <MetricPopover
          open={info}
          onClose={() => setInfo(false)}
          title={HEAT_EXPLAINER.title}
          blurb={HEAT_EXPLAINER.blurb}
          score={{ label: "Heat", value: c.heat }}
          rows={heatRows(c.signals)}
          cta={c.link ? { label: "Open this story →", onClick } : undefined}
        />
      ) : null}
    </div>
  );
}

function MarqueeRow({ cards, dir }: { cards: Card[]; dir: "l" | "r" }) {
  if (!cards.length) return null;
  const run = cards.concat(cards);
  return (
    <div className="mg-nr-row" style={{ overflow: "hidden" }}>
      {/* No `gap` here, deliberately. The track duplicates the card list and
          animates to translateX(-50%), so the repeating unit must be exactly
          half the track. With a flex gap the two copies are separated by one
          extra gap, making half the track 5px short of one copy and jolting the
          row every loop. The spacing is carried by each card's own margin
          instead, so half the track is exactly one copy and the loop is
          seamless. */}
      <div className={`mg-nr-track ${dir === "l" ? "mg-nr-l" : "mg-nr-r"}`} style={{ display: "inline-flex", willChange: "transform" }}>
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
  // The APIs already report whether they served live data or demo
  // constants. Nothing rendered it, so an UNCONFIGURED feed was
  // indistinguishable from a BROKEN one — which is exactly how this was
  // reported, and it cost real time to disprove. Surfaced below.
  const [feedDemo, setFeedDemo] = useState(false);
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
          arr.slice(0, 5).forEach((it: { source: string; satiricalHeadline: string; image: string | null; satireScore: number; link: string; heat?: number; heatSignals?: HeatSignals }) => {
            out.push({ kind: k, source: it.source, headline: it.satiricalHeadline, image: it.image, z: it.satireScore, link: it.link ?? "", heat: it.heat ?? 0, signals: it.heatSignals ?? null });
          });
        });
      }
      if (markets?.success) {
        (markets.proposals ?? []).forEach((p: { type: Kind; title: string; zliarScore: number }) => {
          if (p.type === "zliar") out.push({ kind: "zliar", source: "Z-Liar Meter", headline: p.title, image: null, z: p.zliarScore, link: "/gambit", heat: 0, signals: null });
          if (p.type === "gossipcop") out.push({ kind: "gossipcop", source: "GossipCop", headline: p.title, image: null, z: p.zliarScore, link: "/gambit", heat: 0, signals: null });
        });
      }
      // `source: "demo"` from either endpoint means the wire is running on
      // hardcoded constants — RSS unreachable, or DATABASE_URL unset.
      setFeedDemo(news?.source === "demo" || markets?.source === "demo");
      setCards(out);
    });
  }, []);

  // Auto-surface the hottest first: rank the whole wire by Heat (traffic value),
  // then filter in place when a category is active. null = the full two-row wire.
  const all = [...(cards ?? [])].sort((a, b) => b.heat - a.heat);
  const list = active ? all.filter((c) => c.kind === active) : all;
  // Row 1: the Conviction / Prediction markets. Row 2: the perps.
  // If one side is empty (a category filter that selects only perps, or the
  // proposals endpoint being down) the other row carries the whole wire rather
  // than the section collapsing to a single row.
  const marketCards = list.filter((c) => !PERP_KINDS.has(c.kind));
  const perpCards = list.filter((c) => PERP_KINDS.has(c.kind));
  const rowA = marketCards.length ? marketCards : perpCards;
  const rowB = perpCards.length && marketCards.length ? perpCards : [];

  return (
    <div style={{ fontFamily: INSTRUMENT_FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px 2px" }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.text, textTransform: "uppercase" }}>
          News Flow 📰 <span style={{ color: skin.accent2 }}>{active ? `· ${LABEL[active]}` : "· Satirical Two-Row Wire"}</span>
        </span>
        {feedDemo ? (
          <span
            title="Serving demo constants — the RSS feed is unreachable or DATABASE_URL is unset. Not a code fault."
            style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.bg, background: skin.gold, borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}
          >
            demo feed
          </span>
        ) : null}
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
        <div style={{ fontSize: 9, color: skin.muted, padding: "18px 2px", display: "flex", alignItems: "center", gap: 8 }}>
          <span>No headlines in {active ? LABEL[active] : "this feed"} yet.</span>
          {/* §5 matrix: the empty-category state resolves to the markets-all node
              (event-dispatched so this component stays provider-agnostic). */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("mg:open-node", { detail: "markets-all" }))}
            style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: skin.gold, background: `${skin.gold}18`, border: `1px solid ${skin.gold}55`, borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
          >
            Browse markets →
          </button>
        </div>
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
