"use client";

/**
 * MAD Gambit — Pack Shop
 * ------------------------------------------------------------------
 * "Open Packs" button → dropdown of 5 buyable packs. Buy & Rip fires the
 * Web-Audio rip SFX (hooks/use-rip-sound) + a celebration burst + haptic +
 * a RIPPED! flash. Below: a rotating carousel of MAD Gambit NFT play cards
 * (carbon-copy NftCardView). INK tokens, reduced-motion friendly.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronDown, Sparkles } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import Carousel from "@/components/carousel";
import { celebrate } from "@/components/joy-layer";
import { useRipSound } from "@/hooks/use-rip-sound";
import { NftCardView } from "@/components/nft-card";
import { useGame } from "@/context/game-context";

const PACKS = [
  { id: "starter", name: "Starter Pack", price: 4.88,  tint: INK.cyan,  cards: 3 },
  { id: "degen",   name: "Degen Pack",   price: 8.88,  tint: INK.green, cards: 5 },
  { id: "scandal", name: "Scandal Pack", price: 12.88, tint: INK.pink,  cards: 5 },
  { id: "golden",  name: "Golden Hand",  price: 28.88, tint: INK.gold,  cards: 7 },
  { id: "mythic",  name: "Mythic Vault", price: 48.88, tint: "#c98aff", cards: 7 },
];

export default function PackShop() {
  const [open, setOpen] = useState(false);
  const [ripped, setRipped] = useState<string | null>(null);
  const playRip = useRipSound();
  const { cards } = useGame();

  const rip = (pack: (typeof PACKS)[number]) => {
    playRip();
    celebrate({ intensity: pack.price > 20 ? 1.3 : 0.9, colors: [pack.tint, INK.gold, INK.white] });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate([12, 30, 12]); } catch {} }
    setRipped(pack.name);
    setOpen(false);
    setTimeout(() => setRipped(null), 1600);
  };

  return (
    <div className="rounded-2xl border p-5 space-y-4 relative" style={{ borderColor: INK.borderGold, background: "rgba(8,10,18,0.6)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" style={{ color: INK.gold }} />
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: INK.white }}>MADHATs Card Game</h3>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
            style={{ background: INK.gold, color: "#05070c" }}>
            <Sparkles className="w-4 h-4" /> Open Packs <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 mt-1 z-50 w-56 rounded-2xl border p-2 shadow-2xl"
                  style={{ background: INK.bgDeep, borderColor: INK.borderGold }} role="menu">
                  {PACKS.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl" style={{ background: "transparent" }}>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold truncate" style={{ color: p.tint }}>{p.name}</p>
                        <p className="font-mono text-[8px] uppercase" style={{ color: INK.muted }}>{p.cards} cards · {p.price} $MADx</p>
                      </div>
                      <button type="button" onClick={() => rip(p)}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider active:scale-90 transition-transform"
                        style={{ background: `${p.tint}22`, color: p.tint, border: `1px solid ${p.tint}66` }}>
                        Buy &amp; Rip
                      </button>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NFT play-card carousel (carbon-copy NftCardView) */}
      <Carousel ariaLabel="MAD Gambit play cards">
        {cards.map((c) => (
          <div key={c.id} className="w-[150px]"><NftCardView card={c} compact /></div>
        ))}
      </Carousel>

      {/* RIPPED! flash */}
      <AnimatePresence>
        {ripped && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -12 }}
            animate={{ opacity: 1, scale: [0.3, 1.35, 0.92, 1.12, 1], rotate: [-12, 8, -5, 3, 0] }}
            exit={{ opacity: 0, scale: 1.4, rotate: 6 }}
            transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.4, 0.6, 0.8, 1] }}
            className="absolute inset-0 z-30 grid place-items-center pointer-events-none">
            <span className="font-black text-2xl tracking-widest" style={{ color: INK.gold, textShadow: `0 0 20px ${INK.gold}`, fontFamily: "Georgia, serif" }}>🎩 RIPPED! {ripped}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
