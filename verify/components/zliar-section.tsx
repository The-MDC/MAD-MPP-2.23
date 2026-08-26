"use client";

/**
 * MAD Gambit — Z-Liar Section
 * ------------------------------------------------------------------
 * What is left here is the "Liar of the Day" Yes/No vote. The meter and the
 * markets carousel are both inside ZLiarMeter now — this file used to wrap the
 * instrument in a second header of the same name and keep a rival copy of the
 * market list, and both of those were removed rather than reconciled.
 * INK tokens, reduced-motion friendly, SSR-safe.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Flame } from "lucide-react";
import { INK } from "@/lib/gambit-design-tokens";
import ZLiarMeter from "@/components/zliar-meter";
import { celebrate } from "@/components/joy-layer";
import { zliarMarketsByCredibility } from "@/lib/zliar-markets";

/**
 * The market list moved to lib/zliar-markets.ts and is now DERIVED from
 * zLiarMeter() rather than hand-typed. The five literals that used to sit here
 * — `credibility: 22`, `yes: 2.4` and friends — had no relationship to the
 * engine driving the needle directly above them, so the instrument and the
 * cards beneath it were two sources of truth for the same quantity.
 *
 * The carousel that used to render them also moved: it now lives at the foot
 * of the meter card itself, so a page that mounts the meter always gets the
 * markets it grades, and the two cannot be separated by a later edit.
 */
const LIAR_OF_DAY = zliarMarketsByCredibility()[0];

export default function ZLiarSection() {
  const [vote, setVote] = useState<null | "yes" | "no">(null);
  const [tally, setTally] = useState({ yes: 6120, no: 2380 });

  const cast = (v: "yes" | "no") => {
    if (vote) return;
    setVote(v);
    setTally((t) => ({ ...t, [v]: t[v] + 1 }));
    celebrate({ intensity: 0.8, colors: [INK.pink, INK.gold] });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) { try { navigator.vibrate(12); } catch {} }
  };
  const total = tally.yes + tally.no;
  const yesPct = Math.round((tally.yes / total) * 100);

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: INK.border, background: "rgba(8,10,18,0.55)" }}>
      {/* No section header here, on purpose. This wrapper used to render
          "⌗ Z-LIAR METER · credibility markets" immediately above ZLiarMeter's
          own "THE Z-LIAR METER · Narrative Credibility Instrument" — two
          headers, same title, one on top of the other, inside one card. The
          instrument names itself; the wrapper does not need to name it again. */}
      <ZLiarMeter />

      {/* Liar of the Day — Yes/No vote */}
      <div className="rounded-2xl border p-4" style={{ borderColor: INK.borderGold, background: "rgba(3,5,8,0.6)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4" style={{ color: INK.gold }} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: INK.gold }}>Liar of the Day</span>
        </div>
        <p className="font-mono text-[13px] font-bold" style={{ color: INK.white }}>{LIAR_OF_DAY.subject}</p>
        <p className="font-sans text-[12px] italic mb-3" style={{ color: INK.muted }}>{LIAR_OF_DAY.claim}</p>
        <div className="flex gap-2">
          <VoteBtn active={vote === "yes"} disabled={!!vote} onClick={() => cast("yes")} color={INK.pink} icon={<ThumbsUp className="w-4 h-4" />} label="LIAR" />
          <VoteBtn active={vote === "no"} disabled={!!vote} onClick={() => cast("no")} color={INK.green} icon={<ThumbsDown className="w-4 h-4" />} label="TRUTH" />
        </div>
        {vote && (
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: INK.bgCard }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${yesPct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} style={{ height: "100%", background: INK.pink }} />
            </div>
            <div className="flex justify-between mt-1 font-mono text-[9px]">
              <span style={{ color: INK.pink }}>LIAR {yesPct}%</span>
              <span style={{ color: INK.green }}>TRUTH {100 - yesPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* The "All Z-Liar Markets" carousel that used to sit here now renders at
          the foot of the meter card — see the note at the top of this file. */}
    </div>
  );
}

function VoteBtn({ active, disabled, onClick, color, icon, label }: {
  active: boolean; disabled: boolean; onClick: () => void; color: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-70"
      style={{ background: active ? `${color}28` : `${color}12`, color, border: `1px solid ${color}${active ? "" : "55"}` }}>
      {icon}{label}
    </button>
  );
}
