"use client";

/**
 * AGENT-BETA — Roast/Meme Share (Step 6 of The Affliction)
 * ─────────────────────────────────────────────────────────
 * "Auto-generate & one-tap share meme" — biggest dopamine spike
 * in the entire loop (laughs + virality).
 * Source: MADHATs Gambit Card Game Master Bible §7-Step Conviction Loop, Step 6.
 *
 * Generates a shareable card image using Canvas API:
 *   card art + user take + outcome badge + @MADGambit watermark
 * Web Share API → Twitter/X fallback → copy-link fallback.
 * Auto-hides after 10 seconds if not acted on.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Share2, Copy, CheckCheck, Flame, X } from "lucide-react";

/** The X (Twitter) mark. lucide-react 1.x dropped every brand icon, so the glyph lives here. */
function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { NftCard } from "@/context/game-context";
import { RARITY_TABLE } from "@/lib/gambit-game-math";

interface RoastShareProps {
  card: NftCard;
  outcome: "won" | "lost" | "near-miss";
  convictionTake?: string;   // user's written take (optional, max 120 chars)
  multiplier?: number;       // e.g. 2.4x
  onDismiss: () => void;
  autoHideMs?: number;       // default 10000ms
}

const OUTCOME_COPY: Record<string, { badge: string; color: string; roastLine: string }> = {
  won:       { badge: "✓ CALLED IT",       color: "#7cffc7", roastLine: "The market bowed to my genius." },
  lost:      { badge: "✗ REKT",            color: "#f5242a", roastLine: "The market humbled me. Temporarily." },
  "near-miss": { badge: "≈ ALMOST",        color: "#fbbf24", roastLine: "So close the oracle had to check twice." },
};

const TWITTER_TEMPLATES: Record<string, string> = {
  won:       "Just called it on @MADGambit 🎩 {mult}x payout. The Affliction hits different when you're right.",
  lost:      "The market got me on @MADGambit. Shield saved {pct}%. I'll be back.",
  "near-miss": "Near-miss on @MADGambit 🔥 Still standing. Still predicting. Still MAD.",
};

export default function RoastShare({
  card,
  outcome,
  convictionTake,
  multiplier = 1,
  onDismiss,
  autoHideMs = 10000,
}: RoastShareProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(autoHideMs / 1000);
  const [shared, setShared] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const meta = OUTCOME_COPY[outcome];
  const tier = RARITY_TABLE[card.rarity];

  // Auto-hide countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); onDismiss(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onDismiss]);

  // Generate the canvas share image
  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1200×630 — standard OG image size for Twitter cards
    canvas.width = 1200;
    canvas.height = 630;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 1200, 630);
    bg.addColorStop(0, "#0b0e14");
    bg.addColorStop(1, "#030508");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 630);

    // Rarity accent border
    ctx.strokeStyle = tier.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 1176, 606);

    // Faction glyph (large, background)
    ctx.font = "bold 240px serif";
    ctx.fillStyle = tier.accent + "18";
    ctx.textAlign = "center";
    ctx.fillText("🎩", 950, 420);

    // Card name
    ctx.font = "bold 58px 'ui-monospace', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(card.name.toUpperCase().slice(0, 28), 60, 120);

    // Rarity badge
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = tier.accent;
    ctx.fillText(`◈ ${card.rarity.toUpperCase()} · ${tier.powerScore.toLocaleString()} PWR`, 60, 160);

    // Outcome badge
    ctx.font = "bold 52px monospace";
    ctx.fillStyle = meta.color;
    ctx.fillText(meta.badge, 60, 280);

    // Conviction take or roast line
    const displayTake = (convictionTake || meta.roastLine).slice(0, 100);
    ctx.font = "28px Georgia, serif";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`"${displayTake}"`, 60, 360);

    // Multiplier if won
    if (outcome === "won" && multiplier > 1) {
      ctx.font = "bold 44px monospace";
      ctx.fillStyle = "#d69d41";
      ctx.fillText(`${multiplier.toFixed(1)}x`, 60, 450);
    }

    // MAD Gambit watermark
    ctx.font = "bold 26px Georgia, serif";
    ctx.fillStyle = "#4a5568";
    ctx.textAlign = "right";
    ctx.fillText("@MADGambit · MADGambit.fun", 1140, 600);

    return new Promise(res => canvas.toBlob(res, "image/png"));
  }, [card, outcome, multiplier, convictionTake, meta, tier]);

  const twitterText = TWITTER_TEMPLATES[outcome]
    .replace("{mult}", multiplier.toFixed(1))
    .replace("{pct}", "28.8");
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&hashtags=MADGambit,TheAffliction`;

  const handleShare = useCallback(async () => {
    clearInterval(timerRef.current);
    const blob = await generateImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "mad-gambit-roast.png", { type: "image/png" });
        await navigator.share({ title: "MAD Gambit", text: twitterText, files: [file] });
        setShared(true);
        setTimeout(onDismiss, 1500);
        return;
      } catch { /* fallthrough to Twitter */ }
    }
    window.open(twitterUrl, "_blank");
    setShared(true);
    setTimeout(onDismiss, 1500);
  }, [generateImage, twitterText, twitterUrl, onDismiss]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(twitterText + " " + twitterUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [twitterText, twitterUrl]);

  if (shared) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 animate-resolve-win">
        <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">Roasted & Shared! 🎩</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all ${
      outcome === "won" ? "border-yellow-500/40 bg-yellow-500/5" :
      outcome === "near-miss" ? "border-yellow-400/30 bg-yellow-400/5" :
      "border-rose-500/30 bg-rose-500/5"
    } ${outcome === "won" ? "animate-gold-jackpot" : outcome === "near-miss" ? "animate-near-miss" : ""}`}>
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: meta.color }} />
          <span className="font-mono text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.badge}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-neutral-600">{timeLeft}s</span>
          <button onClick={onDismiss} className="text-neutral-700 hover:text-neutral-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Roast line */}
      <p className="font-mono text-[10px] text-neutral-400 italic leading-relaxed">
        &ldquo;{convictionTake || meta.roastLine}&rdquo;
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 font-mono text-[9px] font-black uppercase tracking-wider transition-all bg-[#1da1f2]/15 border border-[#1da1f2]/30 text-[#1da1f2] hover:bg-[#1da1f2]/25"
        >
          <XMark className="w-3 h-3" />
          ROAST IT
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 rounded-xl py-2 font-mono text-[9px] font-bold uppercase tracking-wider transition-all bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300"
        >
          {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={() => { clearInterval(timerRef.current); onDismiss(); }}
          className="px-3 rounded-xl py-2 font-mono text-[9px] font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-800 text-neutral-600 hover:text-neutral-400 transition-all"
        >
          Skip
        </button>
      </div>

      {/* Progress bar — visual countdown */}
      <div className="h-0.5 rounded-full bg-neutral-900 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(timeLeft / (autoHideMs / 1000)) * 100}%`,
            background: meta.color,
          }}
        />
      </div>
    </div>
  );
}
