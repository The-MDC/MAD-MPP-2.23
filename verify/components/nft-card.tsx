"use client";

/**
 * MAD Gambit — NFT Card
 * ------------------------------------------------------------------
 * Card visual language ported faithfully from the live presentation deck
 * (the-mdc.github.io/MADHATs-Gambit-Presentation) SVG brand system:
 *   - neon-gold-chisel logo gradient  #fffcf0→#efc76d→#ab7b29→#f7d983→#5c3c04
 *   - dual neon frame (cyan left / pink right) triple-stroke
 *   - neon glow filters (cyan/pink/yellow), backplate grid
 *   - top-hat mark + Conviction/Prediction/Affliction trinity language
 * Card ANATOMY from NFT Construction Brief:
 *   Faction banner (top) · Character art (center ~60%) · Name (lower)
 *   · Rarity badge (bottom-right) · MAD logo watermark (bottom-center)
 * Stats are LIVE/dynamic (smart-contract populated in prod) — here they
 * come from game-context simulated values.
 *
 * ART ZONE: stylized procedural SVG placeholder (clearly a placeholder).
 * Drop real 900+ AI-Studio card art into the art slot in production
 * (see docs/BACKEND_PLACEHOLDERS.md → CARD_ART_PIPELINE).
 */

import React from "react";
import { NftCard as Card, FACTIONS } from "@/context/game-context";
import { RARITY_TABLE } from "@/lib/gambit-game-math";
import { cardArtUrl } from "@/lib/card-art";

/** Default card art — the MAD Gambit brand logo, dynamically shrunk-to-fit
 *  the art zone (preserveAspectRatio meet). Overridden per-serial by card.artUrl. */
const CARD_ART_LOGO = "/brand/madhatr-logo.png";

const factionAccent = (f: Card["faction"]) =>
  FACTIONS.find((x) => x.name === f)?.accent ?? "#7cffc7";
const factionGlyph = (f: Card["faction"]) =>
  FACTIONS.find((x) => x.name === f)?.glyph ?? "★";

export function NftCardView({
  card,
  onClick,
  compact = false,
  savageMode = false,
}: {
  card: Card;
  onClick?: () => void;
  compact?: boolean;
  savageMode?: boolean; // Streak ≥7 visual upgrade — from Master Bible §Progression
}) {
  const tier = RARITY_TABLE[card.rarity];
  const accent = tier.accent;
  const fAccent = factionAccent(card.faction);
  const holo = tier.holographic;
  const uid = card.id;
  // Savage Mode: intensify accent colors when streak ≥7
  const activeAccent = savageMode ? "#ff4500" : accent;
  const activeFAccent = savageMode ? "#ffd700" : fAccent;

  return (
    <button
      onClick={onClick}
      className="group relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 rounded-2xl"
      style={{ aspectRatio: compact ? "3 / 4" : undefined }}
    >
      <svg viewBox="0 0 320 440" className="w-full h-full block" role="img" aria-label={`${card.name}, ${card.rarity} ${card.faction} card`}>
        <defs>
          {/* card backplate */}
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b0e14" />
            <stop offset="55%" stopColor="#05070c" />
            <stop offset="100%" stopColor="#030508" />
          </linearGradient>
          {/* rarity-accent glow */}
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b1" />
            <feGaussianBlur stdDeviation="9" result="b2" />
            <feMerge>
              <feMergeNode in="b2" /><feMergeNode in="b1" /><feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* holographic rainbow foil (legendary+) */}
          <linearGradient id={`holo-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="25%" stopColor="#7cffc7" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#c98aff" />
          </linearGradient>
          {/* gold chisel from deck */}
          <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffcf0" /><stop offset="25%" stopColor="#efc76d" />
            <stop offset="50%" stopColor="#ab7b29" /><stop offset="75%" stopColor="#f7d983" />
            <stop offset="100%" stopColor="#5c3c04" />
          </linearGradient>
          <radialGradient id={`art-${uid}`} cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.42" />
            <stop offset="55%" stopColor={fAccent} stopOpacity="0.16" />
            <stop offset="100%" stopColor="#030508" stopOpacity="0" />
          </radialGradient>
          <pattern id={`grid-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0 L0 0 0 16" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* body */}
        <rect x="6" y="6" width="308" height="428" rx="22" fill={`url(#bg-${uid})`} />
        <rect x="6" y="6" width="308" height="428" rx="22" fill={`url(#grid-${uid})`} />

        {/* dual neon frame — faithful to deck cover (cyan left / pink right); Savage Mode = fire */}
        <g opacity="0.9">
          <path d="M160 9 L40 9 A30 30 0 0 0 10 39 L10 401 A30 30 0 0 0 40 431 L160 431" fill="none" stroke={savageMode ? "#ff4500" : "#00f0ff"} strokeWidth="6" opacity="0.5" strokeLinecap="round" />
          <path d="M160 9 L280 9 A30 30 0 0 1 310 39 L310 401 A30 30 0 0 1 280 431 L160 431" fill="none" stroke={savageMode ? "#ffd700" : "#ff00f0"} strokeWidth="6" opacity="0.5" strokeLinecap="round" />
          <rect x="9" y="9" width="302" height="422" rx="21" fill="none" stroke={savageMode ? "#ff450060" : "#ffffff"} strokeWidth="1" opacity="0.85" />
        </g>

        {/* holographic foil ring on legendary+ */}
        {holo && (
          <rect x="9" y="9" width="302" height="422" rx="21" fill="none" stroke={`url(#holo-${uid})`} strokeWidth="2.5" opacity="0.85">
            <animate attributeName="opacity" values="0.45;0.95;0.45" dur="3.2s" repeatCount="indefinite" />
          </rect>
        )}

        {/* faction banner (top) */}
        <g>
          <rect x="22" y="22" width="276" height="34" rx="10" fill="#05070c" stroke={activeFAccent} strokeWidth="1.25" opacity="0.95" />
          {/* faction emblem — gold-leaf-flake sheen with a hint of the faction color,
              inlaid in the top border (clipped to the banner, no bleed). Faction-tinted
              glow behind + gold-gradient glyph with a faction-color edge on top. */}
          <text x="40" y="44.5" fontFamily="ui-monospace, monospace" fontSize="16.5" fill={activeFAccent} fontWeight="900" opacity="0.5" filter={`url(#glow-${uid})`}>{factionGlyph(card.faction)}</text>
          <text x="40" y="44" fontFamily="ui-monospace, monospace" fontSize="15" fill={`url(#gold-${uid})`} stroke={activeFAccent} strokeWidth="0.4" strokeOpacity="0.7" fontWeight="900">{factionGlyph(card.faction)}</text>
          <text x="62" y="44" fontFamily="ui-monospace, monospace" fontSize="11.5" letterSpacing="1.5" fill={activeFAccent} fontWeight="800">{card.faction.toUpperCase()}</text>
          <text x="290" y="44" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" fill={accent} fontWeight="900">{tier.powerScore.toLocaleString()} PWR</text>
        </g>

        {/* character art zone (~center 60%) — MAD Gambit logo, shrunk-to-fit.
            Real per-serial AI-Studio art overrides via card.artUrl when present. */}
        <g>
          <rect x="22" y="64" width="276" height="220" rx="14" fill="#04060b" stroke="#1f2937" strokeWidth="1" />
          <rect x="22" y="64" width="276" height="220" rx="14" fill={`url(#art-${uid})`} />
          {/* clip so the logo never bleeds past the rounded art frame */}
          <clipPath id={`artclip-${uid}`}><rect x="22" y="64" width="276" height="220" rx="14" /></clipPath>
          <image
            href={card.artUrl ?? cardArtUrl(card.serial) ?? CARD_ART_LOGO}
            x="44" y="82" width="232" height="184"
            preserveAspectRatio="xMidYMid meet"
            clipPath={`url(#artclip-${uid})`}
            filter={`url(#glow-${uid})`}
            opacity="0.98"
          />
          {/* faction color wash — highly transparent, light, faction-identifiable overlay so
              reused art on lower cards reads as a faction variant. Rarest (holographic) cards
              skip the wash and show pure, unique art. Clipped to the art frame (no bleed). */}
          {!holo && (
            <rect x="22" y="64" width="276" height="220" rx="14" fill={activeFAccent} opacity="0.16" clipPath={`url(#artclip-${uid})`} />
          )}
        </g>

        {/* card name (lower section) */}
        <text x="28" y="312" fontFamily="Georgia, serif" fontSize="19" fontWeight="900" fill="#ffffff" letterSpacing="0.5">{truncate(card.name, 22)}</text>
        <text x="28" y="330" fontFamily="ui-monospace, monospace" fontSize="9" fill="#64748b" fontStyle="italic">{truncate(card.caption, 44)}</text>

        {/* live stats row — 4 canonical stats (source: Card Game Logic Code Reference §2) */}
        <g fontFamily="ui-monospace, monospace">
          <StatPill uid={uid} x={12}  label="VOLATILITY" value={`${card.volatility}%`} color="#f43f5e" />
          <StatPill uid={uid} x={90}  label="CLOUT"      value={`${card.cloutPct}%`}  color={activeAccent} />
          <StatPill uid={uid} x={168} label="APY"        value={`${tier.stakingApy}%`} color="#7cffc7" />
          <StatPill uid={uid} x={246} label="EDGE"       value={`${(card.edgeMultiplier ?? 1.0).toFixed(2)}x`} color="#fbbf24" />
        </g>

        {/* odds + clout multiplier */}
        <text x="28" y="400" fontFamily="ui-monospace, monospace" fontSize="10" fill="#94a3b8" fontWeight="700">ODDS <tspan fill="#fbbf24" fontWeight="900">{card.odds.toFixed(1)}x</tspan></text>
        <text x="120" y="400" fontFamily="ui-monospace, monospace" fontSize="10" fill="#94a3b8" fontWeight="700">CLOUT <tspan fill={accent} fontWeight="900">{tier.cloutMultiplier}x</tspan></text>

        {/* Savage Mode overlay — fires at streak ≥7 (Master Bible §Progression) */}
        {savageMode && (
          <g>
            <rect x="12" y="388" width="100" height="22" rx="11" fill="#ff450020" stroke="#ff4500" strokeWidth="1.5" />
            <text x="62" y="403" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="900" letterSpacing="1" fill="#ff4500">🔥 SAVAGE</text>
          </g>
        )}

        {/* earnsCount badge on evolved cards (stage ≥2) */}
        {(card.stage ?? 1) >= 2 && (card.earnsCount ?? 0) > 0 && (
          <g>
            <text x="160" y="335" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="7" fill="#fbbf2480" letterSpacing="1">
              ✦ {(card.earnsCount ?? 0).toLocaleString()} $MADx earned
            </text>
          </g>
        )}

        {/* rarity badge (bottom-right — per AI Studio NFT Brief §1.2) */}
        <g>
          <rect x="196" y="388" width="102" height="22" rx="11" fill="#05070c" stroke={activeAccent} strokeWidth="1.25"
            filter={holo ? `url(#glow-${uid})` : undefined} />
          <text x="247" y="403" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9.5" fontWeight="900" letterSpacing="1" fill={activeAccent}>{card.rarity.toUpperCase()}</text>
        </g>

        {/* MAD logo watermark (bottom-center) + serial */}
        <text x="28" y="424" fontFamily="Georgia, serif" fontSize="11" fontWeight="900" fill={`url(#gold-${uid})`} letterSpacing="1">MΛĐ</text>
        <text x="290" y="424" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="9" fill="#475569">#{String(card.serial).padStart(4, "0")}</text>
      </svg>
    </button>
  );
}

function StatPill({ uid, x, label, value, color }: { uid: string; x: number; label: string; value: string; color: string }) {
  return (
    <g>
      <rect x={x} y={344} width={84} height={30} rx={8} fill="#05070c" stroke="#1f2937" strokeWidth="1" />
      <text x={x + 8} y={357} fontSize="6.5" fill="#64748b" letterSpacing="1" fontWeight="700">{label}</text>
      <text x={x + 8} y={369} fontSize="12" fill={color} fontWeight="900">{value}</text>
    </g>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default NftCardView;
