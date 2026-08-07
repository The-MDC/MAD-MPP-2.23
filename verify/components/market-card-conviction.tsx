"use client";

/**
 * MAD Gambit — the CONVICTION card.
 * ══════════════════════════════════════════════════════════════════════
 * Conviction markets grade how strongly a belief is held. They have no clean
 * win/lose leg, which is exactly why they cannot borrow the prediction card:
 * a YES/NO row would misrepresent the instrument.
 *
 * So the centre of this card is the BELIEF SPLIT — the share of conviction
 * held versus shed — over a bar rather than a pair of outcomes. Kalshi has no
 * analogue for this at all; it is the class of market that distinguishes the
 * platform from a straight event exchange.
 *
 * The creator-ladder rung is shown because conviction markets are the ones
 * creators earn against (28.8 → 40 → 60%).
 */
import React from "react";
import {
  InstrumentCard, CardHeader, Well, KpiStrip, SplitBar, Sparkline,
  ChipRow, SignalOnly, LivePip, TapeStrip, LcdPlate, Countdown,
} from "@/components/deck-primitives";
import { ROLE, ENGRAVED, TYPE, CANON, mix } from "@/lib/deck-tokens";
import { fmtCompact, fmtChange, type MarketView } from "@/lib/market-view";

export function ConvictionCard({
  view, onOpen, chips, ladderRung,
}: {
  view: MarketView;
  onOpen?: () => void;
  chips?: string[];
  /** Creator's current share, e.g. "28.8%". Defaults to the ladder's entry rung. */
  ladderRung?: string;
}) {
  const up = (view.change24h ?? 0) >= 0;
  const held = view.upPct ?? Math.round((view.outcomes[0]?.prob ?? 0.5) * 100);
  return (
    <InstrumentCard accent={view.accent} onClick={onOpen}>
      <CardHeader
        sym={view.sym}
        symGlow={view.symGlow}
        title={view.title}
        kicker={view.kicker}
        right={view.tradeable ? <LivePip /> : <SignalOnly />}
      />

      <Well stretch gap={8}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LcdPlate
            label="Conviction"
            value={held}
            unit="%"
            band={held >= 66 ? "Held firm" : held >= 33 ? "Contested" : "Shedding"}
          />
        </div>

        <SplitBar upPct={held} upLabel="Held" downLabel="Shed" />

        <div>
          <Sparkline series={view.series} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            <span style={{ ...TYPE.kpiLabel, color: ENGRAVED }}>Modelled trace</span>
            <span style={{ ...TYPE.tapeMetric, color: up ? ROLE.positive : ROLE.accent2 }}>
              {fmtChange(view.change24h ?? 0)}
            </span>
          </div>
        </div>
      </Well>

      <KpiStrip
        items={[
          ["Volume", fmtCompact(view.volume), ROLE.text],
          ["Creator", ladderRung ?? CANON.community, ROLE.gold],
          ["Fee", CANON.platformFee, ROLE.c],
        ]}
      />

      <TapeStrip plate={{ label: "Ladder", value: CANON.creatorLadder, sub: "creator share" }}>
        <span style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 8px", gap: 10 }}>
          <span style={{ ...TYPE.tapeMetric, color: mix(ROLE.c, 80, ROLE.text), whiteSpace: "nowrap" }}>
            Held {held}%
          </span>
          <span style={{ ...TYPE.tapeMetric, color: ROLE.muted, whiteSpace: "nowrap" }}>
            <Countdown iso={view.closesAt} prefix="Review in" />
          </span>
        </span>
      </TapeStrip>

      <ChipRow chips={chips ?? [view.category, "Graded belief", "No settle leg"]} action={view.tradeable ? "Take conviction ›" : null} />
    </InstrumentCard>
  );
}
