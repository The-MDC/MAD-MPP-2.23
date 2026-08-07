"use client";

/**
 * MAD Gambit — the PREDICTION card.
 * ══════════════════════════════════════════════════════════════════════
 * A dated, resolving market with named outcomes. The Kalshi analogue is a
 * Browse-Markets tile: title, a list of outcomes with percentages, volume.
 *
 * Where this deliberately goes further:
 *   · percentages are DE-VIGGED (see deVig in lib/market-view.ts), so the
 *     outcome column sums to 100 instead of to 100-plus-the-margin;
 *   · the payout multiplier sits next to each probability, so a trader reads
 *     price and return in one line rather than doing 1/p in their head;
 *   · the card carries its own price history and a live tape — neither of
 *     which a Kalshi tile has at grid level.
 */
import React from "react";
import {
  InstrumentCard, CardHeader, Well, KpiStrip, OutcomeRow, Sparkline,
  Countdown, ChipRow, SignalOnly, LivePip, TapeStrip,
} from "@/components/deck-primitives";
import { ROLE, mix, ENGRAVED, TYPE } from "@/lib/deck-tokens";
import { fmtCompact, fmtChange, type MarketView } from "@/lib/market-view";

export function PredictionCard({
  view, onOpen, onPick, chips,
}: {
  view: MarketView;
  onOpen?: () => void;
  /** Fired with the outcome index when a leg is tapped. */
  onPick?: (index: number) => void;
  chips?: string[];
}) {
  const up = (view.change24h ?? 0) >= 0;
  return (
    <InstrumentCard accent={view.accent} onClick={onOpen}>
      <CardHeader
        sym={view.sym}
        symGlow={view.symGlow}
        title={view.title}
        kicker={view.kicker}
        right={view.tradeable ? <LivePip /> : <SignalOnly />}
      />

      <Well stretch gap={2}>
        {view.outcomes.map((o, i) => (
          <OutcomeRow
            key={o.label}
            label={o.label}
            prob={o.prob}
            multiplier={o.multiplier}
            avatar={o.avatar}
            onClick={onPick && view.tradeable ? () => onPick(i) : undefined}
          />
        ))}

        <div style={{ marginTop: 6 }}>
          <Sparkline series={view.series} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            {/* Labelled as derived — the platform has no price feed yet, and an
                unlabelled line would read as real history. */}
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
          ["Outcomes", String(view.outcomes.length), ROLE.c],
          ["Category", view.category, ROLE.gold],
        ]}
      />

      <TapeStrip plate={{ label: "Closes", value: <Countdown iso={view.closesAt} prefix="" />, sub: view.tradeable ? "open" : "locked" }}>
        <span style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 8px", gap: 10 }}>
          {view.outcomes.map((o) => (
            <span key={o.label} style={{ ...TYPE.tapeMetric, color: mix(ROLE.c, 80, ROLE.text), whiteSpace: "nowrap" }}>
              {o.label} {Math.round(o.prob * 100)}%
            </span>
          ))}
        </span>
      </TapeStrip>

      <ChipRow chips={chips ?? [view.category, "De-vigged", "Dated resolution"]} action={view.tradeable ? "Trade ›" : null} />
    </InstrumentCard>
  );
}
