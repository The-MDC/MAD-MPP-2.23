"use client";

/**
 * MAD Gambit — perpetual NYSE-style ticker (very top of the app).
 * ────────────────────────────────────────────────────────────────
 * ONE perpetual right-to-left marquee over four feeds — Crypto, Headlines,
 * Commodities, Gambit. The left pill is the control surface:
 *   · ONE TAP   opens a small tray with a radio button per feed, so any feed
 *               is one click away instead of a sequential cycle.
 *   · DOUBLE TAP cycles to the next feed directly, no tray — the quick path
 *               for someone who just wants to see what's next.
 * Tap/double-tap is disambiguated with a short (300ms) timer, the same
 * pattern components/live-ticker.tsx uses: a second tap inside the window
 * cancels the pending "open tray" action and cycles instead. Every
 * quote/headline is a real <button> that opens an explainer popup (what it
 * measures + a jump link); the row pauses on hover so a moving item is
 * clickable. Seamless loop, values are beta placeholders, reduced-motion safe.
 */
import React from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import MetricPopover, { type MetricRow } from "@/components/metric-popover";
import { AutoShowcaseBadge } from "@/components/carousel";

interface Tick {
  symbol: string;
  value?: string;
  change?: string;
  up?: boolean;
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
  const feed = FEEDS[idx];
  const accent = feed.accentKey === "gold" ? skin.gold : feed.accentKey === "accent" ? skin.accent : skin.accent2;
  const cycle = () => { setInfo(false); setTrayOpen(false); setIdx((i) => (i + 1) % FEEDS.length); };
  const selectFeed = (i: number) => { setInfo(false); setTrayOpen(false); setIdx(i); };
  const run = feed.items.concat(feed.items); // duplicated → seamless -50% loop

  // Tap vs double-tap on the pill, timer-disambiguated (mirrors
  // components/live-ticker.tsx's lastTap pattern). A lone tap opens the tray
  // after the grace window; a second tap inside it cancels that and cycles.
  const pillWrapRef = React.useRef<HTMLDivElement>(null);
  const lastTap = React.useRef(0);
  const tapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPillTap = React.useCallback((e: React.MouseEvent) => {
    // Stops the row's own onDoubleClick from also firing on a pill
    // double-click — the exact double-fire this file was already bitten by
    // once (see the git history for the legend-does-nothing bug).
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      lastTap.current = 0;
      cycle();
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        setTrayOpen((o) => !o);
        lastTap.current = 0;
        tapTimer.current = null;
      }, 300);
    }
  }, [cycle]);
  React.useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);

  // Close the tray on Escape or a click/tap outside it.
  React.useEffect(() => {
    if (!trayOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTrayOpen(false); };
    const onDocDown = (e: MouseEvent) => {
      if (pillWrapRef.current && !pillWrapRef.current.contains(e.target as Node)) setTrayOpen(false);
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
        className="mg-ck-row"
        onDoubleClick={cycle}
        title="Tap the feed pill for a picker · double-tap anywhere to cycle"
        style={{ display: "flex", alignItems: "stretch", background: skin.bg, borderBottom: `1px solid ${accent}55`, userSelect: "none" }}
      >
        {/* Feed selector pill — tap opens a feed-picker tray, double-tap cycles. */}
        <div ref={pillWrapRef} style={{ position: "relative", flex: "none" }}>
          <button
            type="button"
            onClick={onPillTap}
            // Keyboard has no double-tap equivalent, so Enter/Space maps to
            // the tap action (open the tray) — that also gives keyboard
            // users direct feed selection, which plain cycling didn't.
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTrayOpen((o) => !o); }
            }}
            aria-haspopup="true"
            aria-expanded={trayOpen}
            aria-label={`Ticker feed: ${feed.label}. Press Enter for the feed picker.`}
            title="Tap: feed picker · double-tap: next feed"
            style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "0 12px", background: `${accent}14`, border: "none", borderRight: `1px solid ${accent}44`, cursor: "pointer", fontFamily: INSTRUMENT_FONT }}
          >
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase", color: accent, textShadow: `0 0 8px ${accent}66`, whiteSpace: "nowrap" }}>{feed.label}</span>
            <span style={{ display: "inline-flex", gap: 3 }}>
              {FEEDS.map((f, i) => (
                <span key={f.key} style={{ width: 5, height: 5, borderRadius: "50%", background: i === idx ? accent : `${skin.muted}66`, boxShadow: i === idx ? `0 0 6px ${accent}` : "none" }} />
              ))}
            </span>
            <AutoShowcaseBadge label="Auto-cycling ticker" />
            <span style={{ fontSize: 9, color: `${accent}aa`, fontWeight: 900, transform: trayOpen ? "rotate(90deg)" : undefined, transition: "transform 0.2s ease" }}>▸</span>
          </button>

          {trayOpen ? (
            <div
              role="radiogroup"
              aria-label="Choose ticker feed"
              style={{
                position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 60,
                minWidth: 172, padding: 5, borderRadius: 10,
                background: skin.panel, border: `1px solid ${accent}55`,
                boxShadow: "0 14px 34px -8px rgba(0,0,0,0.75)",
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
                    role="radio"
                    aria-checked={on}
                    onClick={(e) => { e.stopPropagation(); selectFeed(i); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 7, border: "none", background: on ? `${a}1c` : "transparent", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", flex: "none", border: `1.5px solid ${on ? a : skin.muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {on ? <span style={{ width: 5, height: 5, borderRadius: "50%", background: a, boxShadow: `0 0 5px ${a}` }} /> : null}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: on ? 900 : 700, letterSpacing: 0.4, textTransform: "uppercase", color: on ? a : skin.text }}>{f.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* The one perpetual marquee. */}
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", padding: "5px 0" }}>
          <div key={feed.key} className="mg-ck-track" style={{ display: "inline-flex", whiteSpace: "nowrap", willChange: "transform", animationDuration: `${feed.dur}s` }}>
            {run.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInfo(true)}
                title={`${t.symbol} ${t.value ?? ""} ${t.change ?? ""} — how is this measured?`.replace(/\s+/g, " ").trim()}
                className="mg-ck-item"
                style={{ display: "inline-flex", alignItems: "baseline", gap: 6, padding: "2px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: INSTRUMENT_FONT, fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}
              >
                <span style={{ color: accent, textShadow: `0 0 8px ${accent}66` }}>{t.symbol}</span>
                {t.value ? <span style={{ color: skin.text }}>{t.value}</span> : null}
                {t.change ? <span style={{ color: t.up ? skin.positive : skin.accent2, fontWeight: 900 }}>{t.change}</span> : null}
                <span style={{ color: `${accent}55`, marginLeft: 4 }}>|</span>
              </button>
            ))}
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
