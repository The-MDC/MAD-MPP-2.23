"use client";

/**
 * MAD Gambit — the PERP card.
 * ══════════════════════════════════════════════════════════════════════
 * A perpetual: no expiry, no settlement, advanced by lunar leg. The Kalshi
 * perp pages the founder supplied are the reference for the information set —
 * mark, 24h change, funding, open interest, max leverage, an up/down split.
 *
 * Two things this card does that the reference does not:
 *
 *   LEG, NOT EXPIRY. The countdown is to the next leg roll, not to a
 *   settlement, because nothing here ever settles (see lib/perp-store.ts).
 *   Labelling it "expires" would misdescribe the instrument.
 *
 *   HONEST VENUE STATE. Three of the six families (Scandal, Z-Liar,
 *   Gossip-Cop) have live signals but no `perp_markets` rows behind them.
 *   Those render fully but wear a SIGNAL ONLY badge and expose no trade
 *   affordance, so the card never invites a position the backend would reject.
 */
import React from "react";
import {
  InstrumentCard, CardHeader, Well, KpiStrip, SplitBar, Sparkline, StatGrid,
  ChipRow, SignalOnly, LivePip, TapeStrip, LcdPlate, Countdown,
} from "@/components/deck-primitives";
import { ROLE, ENGRAVED, TYPE, mix } from "@/lib/deck-tokens";
import { fmtCompact, fmtChange, type MarketView } from "@/lib/market-view";

export function PerpCard({
  view, onOpen, chips,
}: {
  view: MarketView;
  onOpen?: () => void;
  chips?: string[];
}) {
  const up = (view.change24h ?? 0) >= 0;
  const mark = view.mark ?? 0;
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
            label="Mark"
            value={mark.toFixed(1)}
            unit="%"
            band={fmtChange(view.change24h ?? 0)}
          />
        </div>

        <SplitBar upPct={view.upPct ?? Math.round(mark)} />

        <div>
          <Sparkline series={view.series} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
            <span style={{ ...TYPE.kpiLabel, color: ENGRAVED }}>Modelled trace</span>
            <span style={{ ...TYPE.tapeMetric, color: up ? ROLE.positive : ROLE.accent2 }}>
              {fmtChange(view.change24h ?? 0)}
            </span>
          </div>
        </div>

        <StatGrid
          items={[
            ["Open interest", view.oi != null ? fmtCompact(view.oi) : "—", ROLE.text],
            ["Max leverage", view.leverage != null ? `${view.leverage}×` : "—", ROLE.gold],
          ]}
        />
      </Well>

      <KpiStrip
        items={[
          ["Volume", fmtCompact(view.volume), ROLE.text],
          ["Family", view.category, ROLE.c],
          ["24h", fmtChange(view.change24h ?? 0), up ? ROLE.positive : ROLE.accent2],
        ]}
      />

      {/* "Leg rolls in", never "expires" — a perp has no expiry to count to. */}
      <TapeStrip plate={{ label: "Next leg", value: <Countdown iso={view.closesAt} prefix="" />, sub: "rolls, never settles" }}>
        <span style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 8px", gap: 10 }}>
          <span style={{ ...TYPE.tapeMetric, color: mix(ROLE.c, 80, ROLE.text), whiteSpace: "nowrap" }}>
            MARK {mark.toFixed(1)}%
          </span>
          <span style={{ ...TYPE.tapeMetric, color: up ? ROLE.positive : ROLE.accent2, whiteSpace: "nowrap" }}>
            {fmtChange(view.change24h ?? 0)}
          </span>
        </span>
      </TapeStrip>

      <ChipRow chips={chips ?? [view.category, "No expiry", "Lunar leg"]} action={view.tradeable ? "Open desk ›" : null} />
    </InstrumentCard>
  );
}
