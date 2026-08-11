"use client";

/**
 * MAD Gambit — Game Cards + Dutch Auction feature section.
 *
 * One feature section, two stacked bands:
 *   1. MADHATs Gambit game cards, on an auto-advancing carousel
 *   2. the Dutch auction, directly beneath, inside the same bordered shell
 *
 * They live together because they are two halves of one loop: the cards are
 * what the auction sells, and the auction is how the cards are priced. Split
 * across the page they read as unrelated features; stacked, the rail shows you
 * what is in the deck and the auction underneath shows what it costs right now.
 *
 * Cards come from /api/v1/cards/showcase, which is deterministic, so the rail
 * does not reshuffle under the user and the server and client agree on first
 * paint. If the fetch fails the rail is omitted and the auction still renders —
 * a dead endpoint should cost one band, not the whole section.
 */

import React, { useEffect, useState } from "react";
import Carousel, { AutoShowcaseBadge } from "@/components/carousel";
import DutchAuctionPanel from "@/components/dutch-auction-panel";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface ShowcaseCard {
  id: string;
  name: string;
  rarity: string;
  faction: string;
  serial: number;
  caption: string;
  cloutPct: number;
  odds: number;
  apyBoost: number;
}

/** Rarity -> accent. Unknown tiers fall back to the skin accent, never crash. */
function rarityColor(rarity: string, skin: ReturnType<typeof useSkin>["skin"]): string {
  const r = rarity.toLowerCase();
  if (r.includes("golden") || r.includes("mythic")) return skin.gold;
  if (r.includes("legend")) return skin.accent2;
  if (r.includes("rare")) return skin.accent;
  return skin.positive;
}

function CardTile({ c }: { c: ShowcaseCard }) {
  const { skin } = useSkin();
  const color = rarityColor(c.rarity, skin);
  return (
    <article
      style={{
        minWidth: 172, width: 172, flex: "0 0 auto",
        background: skin.card, border: `1px solid ${color}66`, borderRadius: 12,
        overflow: "hidden", fontFamily: INSTRUMENT_FONT,
      }}
    >
      <div style={{ height: 84, background: `linear-gradient(135deg, ${color}, ${skin.accent})`, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.05))" }} />
        <span style={{
          position: "absolute", top: 6, left: 6, fontSize: 6.5, fontWeight: 900,
          letterSpacing: 0.6, textTransform: "uppercase", color: "#0b0b12",
          background: color, padding: "2px 6px", borderRadius: 5,
        }}>
          {c.rarity}
        </span>
        <span style={{
          position: "absolute", bottom: 6, left: 6, fontSize: 6.5, fontWeight: 800,
          color: "#fff", background: "rgba(8,8,14,0.78)", border: `1px solid ${color}88`,
          padding: "2px 6px", borderRadius: 5,
        }}>
          #{c.serial}
        </span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        {/* Integer line box x 2 lines — no glyph is ever sliced mid-character. */}
        <div style={{
          fontSize: 9, fontWeight: 800, color: skin.text,
          lineHeight: "12px", height: 24,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {c.caption || c.name}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 6.5, color: skin.muted }}>
          <span style={{ color, fontWeight: 900 }}>{c.faction}</span>
          <span style={{ marginLeft: "auto" }}>
            APY <b style={{ color: skin.gold }}>+{Math.round(c.apyBoost)}%</b>
          </span>
        </div>
      </div>
    </article>
  );
}

export default function GambitCardsAuctionSection() {
  const { skin } = useSkin();
  const [cards, setCards] = useState<ShowcaseCard[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/v1/cards/showcase?count=12")
      .then((r) => r.json())
      .then((d) => { if (live && d?.success) setCards(d.cards ?? []); })
      .catch(() => { /* rail is omitted; the auction below still renders */ });
    return () => { live = false; };
  }, []);

  return (
    <section
      aria-label="MADHATs Gambit cards and Dutch auction"
      style={{
        border: `1px solid ${skin.border}`, borderRadius: 14,
        background: skin.panel, overflow: "hidden", fontFamily: INSTRUMENT_FONT,
      }}
    >
      {/* BAND 1 — the deck, auto-advancing. */}
      <div style={{ padding: "12px 14px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <h3 style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase",
            color: skin.gold, margin: 0,
          }}>
            MADHATs Gambit — the deck
          </h3>
          {/* Required whenever a rail auto-advances: the badge is what tells the
              user the motion is the rail showcasing itself, not their input. */}
          <AutoShowcaseBadge />
        </div>

        {cards === null ? (
          <div style={{ fontSize: 8, color: skin.muted, padding: "10px 0" }}>Loading the deck…</div>
        ) : cards.length ? (
          <Carousel auto ariaLabel="MADHATs Gambit game cards" gap={10}>
            {cards.map((c) => <CardTile key={c.id} c={c} />)}
          </Carousel>
        ) : null}
      </div>

      {/* BAND 2 — what the deck costs right now, in the same shell. */}
      <div style={{ borderTop: `1px solid ${skin.border}`, padding: "10px 14px 12px" }}>
        <h3 style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase",
          color: skin.accent, margin: "0 0 8px",
        }}>
          Dutch auction — live pack price
        </h3>
        <DutchAuctionPanel />
      </div>
    </section>
  );
}
