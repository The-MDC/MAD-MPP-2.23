"use client";

/**
 * MAD Gambit — Instrument Deck section.
 *
 * The two analog dials with the Seiko split-flap chrono between them, in a
 * container of their own.
 *
 * This used to hang off the foot of the perps deck (perp-dials.tsx), below six
 * market cards, which buried it: the cluster is a platform-state instrument —
 * chaos, shield, conviction, and the crypto tape — not a per-market readout,
 * so reading it as a footnote to the market cards mis-states what it measures.
 * On its own, directly above the dopamine carousel, it reads as what it is: the
 * dashboard the rest of the column is measured against.
 *
 * The composition — chrono in the cluster's centreSlot, flanked by the dials —
 * is the one the cluster was designed for, and is unchanged from the deck. Only
 * its container moved. PerpDials keeps its own copy behind `showInstrument`,
 * which the hosts that mount this section set to false so a page never renders
 * the instrument twice.
 */

import React from "react";
import GambitInstrumentCluster from "@/components/gambit-instrument-cluster";
import SeikoFlipClock from "@/components/seiko-flip-clock";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

export default function InstrumentDeckSection({
  /** Distinguishes this cluster's element ids when a page mounts more than one. */
  uid = "instrument-deck",
}: {
  uid?: string;
}) {
  const { skin } = useSkin();

  return (
    <section
      aria-label="Instrument deck — platform dials and chrono"
      style={{
        border: `1px solid ${skin.border}`,
        borderRadius: 14,
        background: skin.panel,
        // Tightened: the deck reads well but was spending height on padding
        // and a full-width header row rather than on the instruments.
        padding: "8px 12px 10px",
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      {/* The section's own title and strapline are gone: the cluster carries the
          two lines of heading, so there are two lines of small print above the
          dials, not four. */}
      <GambitInstrumentCluster
        uid={uid}
        centerSlot={<SeikoFlipClock label="MAD·STATE · TAP A DOT TO PIN" scale={1.2} fit />}
      />
    </section>
  );
}
