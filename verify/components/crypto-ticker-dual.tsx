"use client";

/**
 * MAD Gambit — perpetual NYSE-style ticker (very top of the app).
 * ────────────────────────────────────────────────────────────────
 * ONE perpetual right-to-left marquee over four feeds — Crypto, Headlines,
 * Commodities, Gambit. It runs edge to edge: there is no left legend pill.
 *
 * CONTROLS
 *   · DOUBLE TAP anywhere on the tape opens a 35%-transparent feed picker.
 *                Pick any of the four directly; the tape stays visible
 *                through the glass behind it.
 *   · ONE TAP on a tick opens THAT tick — a live headline opens the real
 *                publisher article in a new tab; a price quote (which has no
 *                article behind it) opens the "how is this measured?"
 *                explainer instead.
 *
 * The pill this replaced carried the feed name, four state dots and a
 * chevron — ~130px of permanent chrome for a control used seconds-rarely,
 * and it forced single-tap to mean "change feed", which is why ticks could
 * not be individually clickable before. Removing it also removed the
 * tap-vs-double-tap timer: with nothing to single-tap, there is nothing to
 * disambiguate. A visually-hidden focusable button preserves keyboard access
 * to the picker, since double-tap has no keyboard equivalent.
 *
 * Headline ticks hydrate from /api/v1/news/satirical — the same endpoint the
 * News Flow reads, so the two surfaces never disagree — and carry the real
 * publisher `link`. Fetch failure is silent: the authored ticks below remain
 * as the fallback. Price feeds are still beta placeholders.
 *
 * The row pauses on hover so a moving item is clickable. Seamless loop,
 * reduced-motion safe.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import MetricPopover, { type MetricRow } from "@/components/metric-popover";

interface Tick {
  symbol: string;
  value?: string;
  change?: string;
  up?: boolean;
  /**
   * Source article for this tick, when one exists.
   *
   * Present on live headline ticks (hydrated from /api/v1/news/satirical,
   * which carries the real publisher `link` alongside our satirical rewrite).
   * Absent on price ticks — a BTC quote has no article behind it, so those
   * keep opening the "how is this measured?" explainer instead. The renderer
   * branches on this: a tick WITH a url is an <a> to the publisher, a tick
   * WITHOUT one stays a <button> to the explainer.
   */
  url?: string;
}

const CRYPTO: Tick[] = [
  { symbol: "BTC", value: "$69,420", change: "+4.2%", up: true },
  { symbol: "ETH", value: "$3,500", change: "+2.5%", up: true },
  { symbol: "SOL", value: "$180", change: "+5%", up: true },
  { symbol: "XRP", value: "$2.1", change: "+1.8%", up: true },
];
/**
 * Crypto · Headlines · Commodities · Gambit.
 *
 * The house tape is back as a fourth stream — it was displaced when the brief
 * named three, and it is the only feed that reports the platform itself rather
 * than the world outside it, which is worth a place in the cycle.
 */
const GAMBIT: Tick[] = [
  { symbol: "MADx", value: "$0.85", change: "+12%", up: true },
  { symbol: "DEGEN", change: "+8.5%", up: true },
  { symbol: "CHAOS", value: "67%" },
  { symbol: "VOLUME", value: "$2.4M" },
];
const COMMODITIES: Tick[] = [
  { symbol: "GOLD", value: "$2,412", change: "+0.6%", up: true },
  { symbol: "WTI", value: "$78.40", change: "-1.2%", up: false },
  { symbol: "SILVER", value: "$31.15", change: "+1.4%", up: true },
  { symbol: "NATGAS", value: "$2.68", change: "-2.1%", up: false },
  { symbol: "WHEAT", value: "$604", change: "+0.9%", up: true },
  { symbol: "COPPER", value: "$4.52", change: "+2.3%", up: true },
];
const SCANDAL: Tick[] = [
  { symbol: "HOT", value: "Royal feud escalates into a docuseries" },
  { symbol: "CELEB", value: "Pop couple argues over one shared dessert" },
  { symbol: "TABLOID", value: "Mystery yacht photos spark three separate feuds" },
  { symbol: "CRYPTO", value: "Token rallies 40% on pure vibes" },
  { symbol: "POL", value: "Committee agrees only on the catering order" },
  { symbol: "VIRAL", value: "Cat interrupts live feed, becomes national icon" },
  { symbol: "GC", value: "GossipCop perp: is the empire saga forever?" },
];

// Each feed: its ticks, accent, jump target, marquee speed, and explainer copy.
interface Feed {
  key: string;
  label: string;
  items: Tick[];
  accentKey: "gold" | "accent" | "accent2";
  target: string;
  dur: number;
  title: string;
  blurb: string;
  rows: MetricRow[];
  ctaLabel: string;
}
const FEEDS: Feed[] = [
  {
    key: "crypto", label: "Crypto", items: CRYPTO, accentKey: "gold", target: "mg-featured", dur: 32,
    title: "Crypto prices",
    blurb: "Live spot quotes for the majors, the collateral behind on-platform markets. Beta placeholders today — wiring to Pyth / Chainlink price feeds.",
    rows: [
      { label: "Price", kind: "measured", note: "Last spot price from the oracle feed." },
      { label: "24h change", kind: "measured", note: "Percentage move over the trailing 24 hours." },
    ],
    ctaLabel: "View featured markets →",
  },
  {
    key: "headlines", label: "Headlines", items: SCANDAL, accentKey: "accent2", target: "mg-news", dur: 38,
    title: "Live headline wire",
    blurb: "The hottest satirical headlines right now, ranked by Heat — a traffic-value score led by cross-publisher pickup and estimated engagement. Click any card in the News Flow for its full Heat breakdown.",
    rows: [
      { label: "Cross-publisher pickup", kind: "measured", note: "How many distinct publishers ran a similar headline." },
      { label: "Engagement (likes · comments · views)", kind: "estimated", note: "Estimated until Reddit/X/YouTube counts are connected." },
      { label: "Freshness & satire", kind: "measured", note: "Recency plus the Z-Liar satire score." },
    ],
    ctaLabel: "Open the News Flow →",
  },
  {
    key: "commodities", label: "Commodities", items: COMMODITIES, accentKey: "accent", target: "mg-featured", dur: 30,
    title: "Commodities tape",
    blurb: "Metals, energy and agriculture — the macro backdrop the satirical markets price against. Beta placeholders today; wiring to the same oracle feed as the crypto tape.",
    rows: [
      { label: "Last", kind: "measured", note: "Front-month settlement price." },
      { label: "Session change", kind: "measured", note: "Move against the previous session's close." },
    ],
    ctaLabel: "View featured markets →",
  },
  {
    key: "gambit", label: "Gambit", items: GAMBIT, accentKey: "gold", target: "mg-featured", dur: 26,
    title: "MAD Gambit house metrics",
    blurb: "The platform's own tape: token price, degen momentum, the CHAOS index, and total market VOLUME. Beta placeholders until on-chain reads are wired.",
    rows: [
      { label: "MADx", kind: "measured", note: "MAD Gambit token spot price." },
      { label: "CHAOS", kind: "estimated", note: "Composite volatility/heat index across open markets." },
      { label: "VOLUME", kind: "measured", note: "Total value traded across all markets." },
    ],
    ctaLabel: "View featured markets →",
  },
];

function jumpTo(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CryptoTickerDual() {
  const { skin } = useSkin();
  const [idx, setIdx] = React.useState(0);
  const [info, setInfo] = React.useState(false);
  const [trayOpen, setTrayOpen] = React.useState(false);

  // Live headline ticks, so the wire carries REAL stories that open the real
  // publisher — not the static SCANDAL placeholders. Same endpoint the News
  // Flow reads, so the two surfaces never disagree about what is running.
  // Failure is silent and non-fatal: the static ticks below remain as the
  // fallback, which is why this is an override rather than a replacement.
  const [liveHeadlines, setLiveHeadlines] = React.useState<Tick[] | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/v1/news/satirical")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const arr = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
        const ticks: Tick[] = arr
          .filter((it: { satiricalHeadline?: string }) => it?.satiricalHeadline)
          .slice(0, 12)
          .map((it: { source?: string; satiricalHeadline: string; link?: string }) => ({
            symbol: (it.source ?? "WIRE").toUpperCase().slice(0, 8),
            value: it.satiricalHeadline,
            url: it.link || undefined,
          }));
        if (ticks.length) setLiveHeadlines(ticks);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const feed = FEEDS[idx];
  // Headlines is the only feed with a live source; the rest stay as authored.
  const items = feed.key === "headlines" && liveHeadlines ? liveHeadlines : feed.items;
  const accent = feed.accentKey === "gold" ? skin.gold : feed.accentKey === "accent" ? skin.accent : skin.accent2;
  // No sequential `cycle` any more — the picker offers all four directly, so
  // stepping one-at-a-time had no remaining caller.
  const selectFeed = (i: number) => { setInfo(false); setTrayOpen(false); setIdx(i); };
  const run = items.concat(items); // duplicated → seamless -50% loop

  // DOUBLE-TAP OPENS THE PICKER. The left-hand legend pill (feed name, the
  // four dots, the ▸ chevron) is gone, and with it the tap-vs-double-tap
  // timer this file used to need: with no pill to single-tap, there is
  // nothing to disambiguate against, so the browser's own dblclick/dbltap is
  // enough. That also frees single-tap to belong entirely to the ticks —
  // one tap on a headline opens that headline.
  //
  // onDoubleClick covers mouse and, via synthesised events, touch double-tap
  // on iOS/Android. touch-action stays default so scrolling is unaffected.
  const pickerWrapRef = React.useRef<HTMLDivElement>(null);

  // Close the tray on Escape or a click/tap outside it.
  React.useEffect(() => {
    if (!trayOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTrayOpen(false); };
    const onDocDown = (e: MouseEvent) => {
      if (pickerWrapRef.current && !pickerWrapRef.current.contains(e.target as Node)) setTrayOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, [trayOpen]);

  return (
    <div style={{ width: "100%" }}>
      <div
        ref={pickerWrapRef}
        className="mg-ck-row"
        onDoubleClick={() => { setInfo(false); setTrayOpen((o) => !o); }}
        title="Double-tap the tape for the feed picker · tap a headline to open it"
        style={{ position: "relative", display: "flex", alignItems: "stretch", background: skin.bg, borderBottom: `1px solid ${accent}55`, userSelect: "none" }}
      >
        {/* The legend pill is deliberately absent. It previously occupied the
            left edge with the feed name, four state dots and a chevron —
            roughly 130px of permanent chrome to expose a control used
            seconds-rarely. The tape now runs edge to edge and the picker is
            summoned by double-tap instead, which is also what frees a single
            tap to mean "open this story". */}

        {/* Keyboard equivalent for the double-tap, which has none. Visually
            hidden but focusable, so the picker stays reachable without a
            pointer — the pill used to serve this role. */}
        <button
          type="button"
          onClick={() => setTrayOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={trayOpen}
          aria-label={`Ticker feed: ${feed.label}. Activate to choose a different feed.`}
          style={{
            position: "absolute", left: 0, top: 0, width: 1, height: 1,
            opacity: 0, padding: 0, border: "none", background: "transparent",
          }}
        />

        {trayOpen ? (
          <div
            role="listbox"
            aria-label="Choose ticker feed"
            style={{
              position: "absolute", top: "100%", left: 12, marginTop: 4, zIndex: 60,
              minWidth: 188, padding: 6, borderRadius: 12,
              // 35% opaque — the tape stays legible THROUGH the picker, so the
              // feed you are leaving is visible behind the one you are choosing.
              // A backdrop blur keeps the labels readable over moving text;
              // without it, glass over a marquee is unreadable.
              background: `color-mix(in srgb, ${skin.panel} 35%, transparent)`,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: `1px solid ${accent}55`,
              boxShadow: "0 14px 34px -8px rgba(0,0,0,0.6)",
              fontFamily: INSTRUMENT_FONT,
            }}
          >
            {FEEDS.map((f, i) => {
              const on = i === idx;
              const a = f.accentKey === "gold" ? skin.gold : f.accentKey === "accent" ? skin.accent : skin.accent2;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={(e) => { e.stopPropagation(); selectFeed(i); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 9px", borderRadius: 8, border: "none",
                    // Selection is carried by weight, colour and a trailing rule
                    // rather than a radio dot — the dots were the other half of
                    // the chrome this change removes.
                    background: on ? `${a}22` : "transparent",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 10.5, fontWeight: on ? 900 : 700, letterSpacing: 0.6, textTransform: "uppercase", color: on ? a : skin.text }}>
                    {f.label}
                  </span>
                  {on ? <span aria-hidden style={{ fontSize: 9, fontWeight: 900, color: a, textShadow: `0 0 8px ${a}` }}>▬</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* The one perpetual marquee. */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "5px 0" }}>
          <div key={feed.key} className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", animationDuration: `${feed.dur}s` }}>
            {run.map((t, i) => {
              // A tick with a source article is a real link — right-click,
              // middle-click and "open in new tab" all behave as a user
              // expects, which an onClick-only <button> silently breaks.
              // A tick without one keeps the explainer.
              const shared = {
                className: "mg-ck-item",
                style: {
                  display: "inline-flex", alignItems: "baseline", gap: 6, padding: "2px 16px",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontFamily: INSTRUMENT_FONT, fontSize: 13, fontWeight: 900, letterSpacing: 0.5,
                  textDecoration: "none",
                } as React.CSSProperties,
              };
              const inner = (
                <>
                  <span style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>{t.symbol}</span>
                  {t.value ? <span style={{ color: skin.text }}>{t.value}</span> : null}
                  {t.change ? <span style={{ color: t.up ? skin.positive : skin.accent2, fontWeight: 900 }}>{t.change}</span> : null}
                  <span style={{ color: `${accent}55`, marginLeft: 4 }}>|</span>
                </>
              );
              return t.url ? (
                <a
                  key={i}
                  href={t.url}
                  target="_blank"
                  // noreferrer as well as noopener: these are third-party
                  // publisher links, so the referrer is not ours to leak.
                  rel="noopener noreferrer"
                  // Stops a fast double-click on a tick from also tripping the
                  // row's picker — the same double-fire the removed pill hit.
                  onDoubleClick={(e) => e.stopPropagation()}
                  title={`${t.symbol} — ${t.value ?? ""} · open the source article`.replace(/\s+/g, " ").trim()}
                  {...shared}
                >
                  {inner}
                </a>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInfo(true)}
                  onDoubleClick={(e) => e.stopPropagation()}
                  title={`${t.symbol} ${t.value ?? ""} ${t.change ?? ""} — how is this measured?`.replace(/\s+/g, " ").trim()}
                  {...shared}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <MetricPopover
        open={info}
        onClose={() => setInfo(false)}
        title={feed.title}
        blurb={feed.blurb}
        rows={feed.rows}
        cta={{ label: feed.ctaLabel, onClick: () => jumpTo(feed.target) }}
      />

      <style>{`
        .mg-ck-track { animation-name: mgCkScroll; animation-timing-function: linear; animation-iteration-count: infinite; }
        .mg-ck-row:hover .mg-ck-track { animation-play-state: paused; }
        .mg-ck-item:hover { filter: brightness(1.25); }
        @keyframes mgCkScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .mg-ck-track { animation: none; } }
      `}</style>
    </div>
  );
}
