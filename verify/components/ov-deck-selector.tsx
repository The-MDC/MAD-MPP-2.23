"use client";

/**
 * MΛĐ Gambit — O-V Deck Selector
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt GambitViewModel.ovDecks + OVDeckSelectorCard.
 * Dropdown selects from 3 named deck versions; changing deck updates
 * the live conviction math (multiplier → δ-limit, threshold, APY).
 */

import React, { useState } from "react";
import { OVDeck, OV_DECKS } from "@/lib/gambit-game-math";
import { ChevronDown } from "lucide-react";

interface OVDeckSelectorProps {
  selectedDeck: OVDeck;
  onSelect: (deck: OVDeck) => void;
  /** Kept for callers; the δ-limit it fed now reads in the Kaito feed. */
  convictionStake?: number;
}

export default function OVDeckSelector({
  selectedDeck,
  onSelect,
}: OVDeckSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-[#030508] px-4 py-3 text-left hover:border-neutral-700 transition-all"
      >
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mb-0.5">
            Active O-V Deck
          </p>
          <p className="font-mono text-sm font-black text-cyan-300">{selectedDeck.name}</p>
          <p className="font-mono text-[10px] text-neutral-500 mt-0.5 leading-tight line-clamp-1">
            {selectedDeck.description}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full rounded-xl border border-neutral-800 bg-[#05070c] shadow-2xl overflow-hidden">
          {OV_DECKS.map((deck) => {
            const active = deck.id === selectedDeck.id;
            return (
              <button
                key={deck.id}
                onClick={() => { onSelect(deck); setOpen(false); }}
                className={`w-full text-left px-4 py-3 transition-all hover:bg-[#0b0e14] ${active ? "bg-[#0b0e14] border-l-2 border-cyan-400" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-mono text-xs font-bold ${active ? "text-cyan-300" : "text-neutral-300"}`}>
                      {deck.name}
                    </p>
                    <p className="font-mono text-[9px] text-neutral-500 mt-0.5 leading-tight">{deck.description}</p>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-600 shrink-0 mt-0.5">{deck.version}</span>
                </div>
                <div className="flex gap-3 mt-1.5">
                  <Stat label="MULT" value={`${deck.multiplier}x`} color="#7cffc7" />
                  <Stat label="MIN" value={deck.minThreshold.toString()} color="#58a6ff" />
                  <Stat label="APY" value={`${deck.yieldApy}%`} color="#fbbf24" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* The live stats (multiplier, min threshold, shield APY, δ-limit and the
          shield reserve pool) moved into the Kaito feed, which flips through them
          every 3.5 s and reads this same deck. */}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="font-mono text-[8px]" style={{ color }}>
      <span className="text-neutral-600">{label} </span>{value}
    </span>
  );
}
