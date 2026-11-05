import React from "react";
import { BRAND_SYMBOLS, tierById, TIERS, type SymbolId, type TierId } from "@/lib/brand-symbols";

/** One MAD Gambit symbol. Decorative by default; pass `label` when it is the only thing saying what it is. */
export default function BrandSymbol({
  id, size = 24, label, style,
}: {
  id: SymbolId;
  size?: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  const s = BRAND_SYMBOLS[id];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={s.src}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ width: size, height: size, objectFit: "contain", flex: "none", filter: "drop-shadow(0 2px 6px rgba(0,0,0,.45))", ...style }}
    />
  );
}

/** A tier as a pill: its symbol and its name. */
export function TierBadge({ tier, compact = false }: { tier: TierId; compact?: boolean }) {
  const t = tierById(tier);
  return (
    <span
      title={`${t.name} — ${t.how}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999,
        padding: compact ? "2px 8px 2px 4px" : "4px 12px 4px 6px",
        border: "1px solid rgba(214,157,65,.4)", background: "rgba(214,157,65,.08)",
        fontSize: compact ? 10 : 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", whiteSpace: "nowrap",
      }}
    >
      <BrandSymbol id={t.symbol} size={compact ? 16 : 22} />
      {t.name}
    </span>
  );
}

/** The whole user → Creator VIP ladder, with the current tier lit and the rest dimmed. */
export function TierLadder({ current }: { current: TierId }) {
  const at = TIERS.findIndex((t) => t.id === current);
  return (
    <ol aria-label="Your standing: user to Creator VIP" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: `repeat(${TIERS.length}, minmax(0,1fr))`, gap: 6 }}>
      {TIERS.map((t, i) => {
        const on = i === at;
        const reached = i <= at;
        return (
          <li key={t.id} aria-current={on ? "step" : undefined} title={t.how}
            style={{ textAlign: "center", opacity: reached ? 1 : 0.42, borderRadius: 12, padding: "8px 2px",
              border: on ? "1px solid rgba(246,211,120,.8)" : "1px solid rgba(255,255,255,.08)",
              background: on ? "rgba(214,157,65,.14)" : "rgba(255,255,255,.03)" }}>
            <BrandSymbol id={t.symbol} size={30} style={{ margin: "0 auto", display: "block" }} />
            <span style={{ display: "block", marginTop: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>{t.name}</span>
          </li>
        );
      })}
    </ol>
  );
}
