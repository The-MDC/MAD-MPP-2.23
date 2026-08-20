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
        padding: "12px 14px 14px",
        fontFamily: INSTRUMENT_FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <h3
          style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 1.4,
            textTransform: "uppercase", color: skin.gold, margin: 0,
          }}
        >
          Instrument deck
        </h3>
        <span style={{ fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: skin.muted }}>
          Two dials · split-flap chrono · tap a dot to pin
        </span>
      </div>

      {/* Horizontal scroll is the deliberate fallback: the cluster is a fixed,
          centred row, so a narrow phone scrolls it rather than wrapping the
          dials under the chrono and breaking the instrument's symmetry. */}
      <div style={{ overflowX: "auto" }}>
        <GambitInstrumentCluster
          uid={uid}
          centerSlot={<SeikoFlipClock label="MAD·STATE · TAP A DOT TO PIN" scale={1.2} />}
        />
      </div>
    </section>
  );
}
