"use client";

/**
 * MAD Gambit — Open Markets UI kit.
 *
 * One shell (header, tab bar, play-responsibly strip) and the shared pieces the
 * lobby, the create studio, the trade desk and the profile all use, so every
 * page reads as one product: ink + gold metal, the MAD rossa accent, condensed
 * caps with an italic serif punch word. Styling lives in the brand layer of
 * app/globals.css; this file only composes it.
 */
import React from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PlusCircle, ArrowLeftRight, User, ChevronLeft } from "lucide-react";
import { SkinProvider } from "@/components/skin-provider";
import JoyLayer from "@/components/joy-layer";
import { useOpenMarkets } from "@/lib/open-markets-store";
import {
  closesLabel, compact, crowdSplit, decimalOdds, madx, pct, prices, PERP_LABEL, type OMMarket,
} from "@/lib/open-markets";

export const INK = "#080808";
export const GOLD = "#d69d41";
export const ROSSA = "#f5242a";
export const MUTED = "#8e8a80";
export const LINE = "rgba(214,157,65,.14)";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/* ── Shell ───────────────────────────────────────────────────────────────── */

const TABS: { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean }[] = [
  { href: "/preview", label: "Home", icon: <Home size={18} />, match: (p) => p === "/preview" || p === "/" },
  { href: "/open-markets", label: "Markets", icon: <LayoutGrid size={18} />, match: (p) => p === "/open-markets" || (p.startsWith("/open-markets/") && !p.endsWith("/create")) },
  { href: "/open-markets/create", label: "Create", icon: <PlusCircle size={22} />, match: (p) => p.endsWith("/create") },
  { href: "/swap", label: "Swap", icon: <ArrowLeftRight size={18} />, match: (p) => p === "/swap" },
  { href: "/profile", label: "Profile", icon: <User size={18} />, match: (p) => p === "/profile" },
];

export function OMShell({ children, back, title }: { children: React.ReactNode; back?: { href: string; label: string }; title?: string }) {
  return (
    <SkinProvider>
      <ShellInner back={back} title={title}>{children}</ShellInner>
    </SkinProvider>
  );
}

function ShellInner({ children, back, title }: { children: React.ReactNode; back?: { href: string; label: string }; title?: string }) {
  const path = usePathname() || "";
  const s = useOpenMarkets();
  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(120% 40% at 50% 0%, #1b1407 0%, ${INK} 46%)`, color: "#f3efe4", fontFamily: SANS }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(8,8,8,.86)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE}` }}>
        {back ? (
          <a href={back.href} aria-label={back.label} className="mg-btn-ghost" style={{ minHeight: 36, width: 36, padding: 0 }}>
            <ChevronLeft size={18} />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/brand/madhatr-logo.png" alt="" width={36} height={36} style={{ objectFit: "contain", borderRadius: 10, filter: "drop-shadow(0 0 10px rgba(245,36,42,.45))" }} />
        )}
        <a href="/preview" style={{ textDecoration: "none", minWidth: 0, flex: 1 }}>
          <div className="mg-display mg-gold-text" style={{ fontSize: 22, lineHeight: 1 }}>MAD Gambit</div>
          <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: MUTED, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title ?? "Open Markets"}
          </div>
        </a>
        <a href="/profile" className="mg-chip" style={{ height: 32, color: GOLD, borderColor: "rgba(214,157,65,.35)", textDecoration: "none" }} aria-label="Demo balance — open profile">
          <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: 0 }}>{madx(s.credits)}</span>
          <span style={{ fontSize: 8.5, color: MUTED }}>$MADx</span>
        </a>
      </header>

      <JoyLayer />
      <main style={{ padding: "16px 16px 112px", display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
        <PlayResponsibly />
      </main>

      <nav aria-label="Primary" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", alignItems: "end", padding: "8px 8px max(10px, env(safe-area-inset-bottom))", background: "linear-gradient(180deg, rgba(8,8,8,.7), #080808 40%)", borderTop: `1px solid ${LINE}` }}>
        {TABS.map((t) => {
          const on = t.match(path);
          const create = t.label === "Create";
          return (
            <a key={t.href} href={t.href} aria-current={on ? "page" : undefined}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minHeight: 44, justifyContent: "center", textDecoration: "none", fontSize: 10, fontWeight: 800, letterSpacing: .4, color: on ? GOLD : MUTED }}>
              {create ? (
                <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, marginTop: -18, borderRadius: 999, background: "var(--mg-gold-fill)", color: "#1a1205", boxShadow: "0 8px 20px -6px rgba(214,157,65,.7), 0 0 0 4px #080808" }}>{t.icon}</span>
              ) : t.icon}
              {t.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

export function PlayResponsibly() {
  return (
    <div data-explain="fee" style={{ marginTop: 8, padding: "12px 14px", borderRadius: 14, border: `1px solid ${LINE}`, background: "rgba(255,255,255,.02)", fontSize: 10.5, lineHeight: 1.55, color: MUTED, textAlign: "center" }}>
      <span style={{ color: GOLD, fontWeight: 900 }}>1.88% flat fee</span> · community 28.8% of platform net · Entertainment conviction · 18+ · Play responsibly.
      <br />Demo floor uses free-play $MADx credits held in this browser. MAD Shield is loss mitigation, not a guarantee.
    </div>
  );
}

/* ── Type ────────────────────────────────────────────────────────────────── */

export function Headline({ lead, punch, tail, sub, size = 44 }: { lead?: string; punch: string; tail?: string; sub?: string; size?: number }) {
  return (
    <div>
      <h1 style={{ margin: 0, lineHeight: .95, fontSize: size }}>
        {lead ? <span className="mg-display" style={{ color: "#f6f1e3" }}>{lead} </span> : null}
        <span className="mg-punch mg-gold-text" style={{ fontSize: size * 1.02 }}>{punch}</span>
        {tail ? <span className="mg-display" style={{ color: "#f6f1e3" }}> {tail}</span> : null}
      </h1>
      {sub ? <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#bdb6a6" }}>{sub}</p> : null}
    </div>
  );
}

export function SectionTitle({ children, right, explain }: { children: React.ReactNode; right?: React.ReactNode; explain?: string }) {
  return (
    <div data-explain={explain} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
      <h2 className="mg-display" style={{ margin: 0, fontSize: 24, color: "#f6f1e3" }}>{children}</h2>
      {right}
    </div>
  );
}

/* ── Data pieces ─────────────────────────────────────────────────────────── */

export function ClassBadge({ m }: { m: OMMarket }) {
  const label = m.perp ? `∞ ${PERP_LABEL[m.perp]}` : m.cls === "prediction" ? "Prediction" : m.side === "counterfactual" ? "Paseome · Hindsight" : "Paseome · Foresight";
  const full = m.perp ? `Perpetual · ${PERP_LABEL[m.perp]}` : m.cls === "prediction" ? "Prediction market" : m.side === "counterfactual" ? "Paseome · Counterfactual (Hindsight) — never resolves" : "Paseome · Forward (Foresight) — settles at the leg roll";
  const color = m.perp ? "#00e5ff" : m.cls === "prediction" ? GOLD : ROSSA;
  return (
    <span className="mg-chip" title={full} style={{ color, borderColor: `${color}55`, background: `${color}12`, whiteSpace: "nowrap", minWidth: 0, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", lineHeight: "24px" }}>
      {label}
    </span>
  );
}

export function CrowdBar({ m, height = 6 }: { m: OMMarket; height?: number }) {
  const p = crowdSplit(m);
  const palette = [GOLD, ROSSA, "#00e5ff", "#b79cff", "#7cffc7"];
  return (
    <div data-explain="om-crowd">
      <div style={{ display: "flex", height, borderRadius: 999, overflow: "hidden", background: "#1d1f27" }}>
        {p.map((v, i) => (
          <div key={i} style={{ width: `${v * 100}%`, background: m.outcomes.length === 2 && i === 1 ? "#3a3d4a" : palette[i % palette.length], transition: "width .4s var(--mg-ease)" }} />
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ series, idx = 0, w = 120, h = 36, color = GOLD }: { series: number[][]; idx?: number; w?: number; h?: number; color?: string }) {
  const ys = series.map((s) => s[idx] ?? 0);
  if (ys.length < 2) ys.unshift(ys[0] ?? 0.5);
  const min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
  const span = Math.max(max - min, 0.02);
  const pts = ys.map((y, i) => `${(i / (ys.length - 1)) * w},${h - 3 - ((y - min) / span) * (h - 6)}`).join(" ");
  const id = `sg${idx}${Math.round(ys[ys.length - 1] * 1e4)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MarketTile({ m }: { m: OMMarket }) {
  const p = prices(m.outcomes, m.b);
  const binary = m.outcomes.length === 2;
  const lead = p.indexOf(Math.max.apply(null, p));
  const href = `/open-markets/${encodeURIComponent(m.id)}`;
  return (
    <article className="mg-tile mg-tile-hover" data-explain={m.perp ? `perp-${m.perp}` : m.cls === "prediction" ? "om-prediction" : "om-conviction"} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <a href={href} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <ClassBadge m={m} />
          <span style={{ flex: "none", fontSize: 10, color: MUTED, whiteSpace: "nowrap" }}>{closesLabel(m)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span aria-hidden="true" style={{ flex: "none", display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "#1a1c25", border: `1px solid ${LINE}`, fontSize: 18 }}>{m.emoji}</span>
          <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.35, fontWeight: 800, color: "#f6f1e3" }}>{m.title}</h3>
        </div>
      </a>
      {binary ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {m.outcomes.map((o, i) => (
            <a key={o.id} href={`${href}?o=${encodeURIComponent(o.id)}`} className="mg-odds" style={{ textDecoration: "none" }} aria-label={`${o.label} at ${pct(p[i])}`}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: i === 0 ? "#7cffc7" : "#f85b5f" }}>{o.label} · {pct(p[i])}</span>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800 }}>{decimalOdds(p[i]).toFixed(2)}</span>
            </a>
          ))}
        </div>
      ) : (
        <a href={`${href}?o=${encodeURIComponent(m.outcomes[lead].id)}`} className="mg-odds" style={{ textDecoration: "none", flexDirection: "row", justifyContent: "space-between", padding: "0 12px", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{m.outcomes[lead].label}</span>
          <span style={{ flex: "none", fontFamily: MONO, fontSize: 14, fontWeight: 800, color: GOLD }}>{pct(p[lead])}</span>
        </a>
      )}
      <CrowdBar m={m} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: MUTED }}>
        <span>{m.outcomes.length} {binary ? "sides" : "branches"} · Vol {compact(m.volume)}</span>
        <span>{m.traders} traders</span>
      </div>
    </article>
  );
}

export function Stat({ k, v, accent }: { k: string; v: string; accent?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 14, background: "#101118", border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: MUTED }}>{k}</div>
      <div style={{ marginTop: 3, fontFamily: MONO, fontSize: 16, fontWeight: 800, color: accent ?? "#f6f1e3", whiteSpace: "nowrap" }}>{v}</div>
    </div>
  );
}
