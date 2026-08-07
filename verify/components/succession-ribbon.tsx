"use client";

/**
 * MAD Gambit — the succession ribbon (ZEITGEIST §5.1, §11.3).
 * ────────────────────────────────────────────────────────────────
 * Where conviction goes at THE TURNING. Retiring slots on the left, the incoming
 * slate on the right, and one ribbon per edge of the succession matrix S with
 * stroke width proportional to the share.
 *
 * WHY A RIBBON AND NOT A TABLE. The one thing a holder needs to understand
 * before a Turning is that their conviction does not evaporate — it moves, and
 * it moves in proportions somebody can check. A 3×3 table of decimals states
 * that; a flow picture makes the conservation visible, because a ribbon that
 * loses width has visibly lost something and a table that does not sum to 1 just
 * looks like a table.
 *
 * The conservation error is printed rather than hidden. If it is ever non-zero,
 * that is the single most important number on the page.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface SuccessionResp {
  success: boolean;
  fromVintage: number;
  toVintage: number;
  weights: { measured: number; voted: number };
  matrix: number[][];
  conserved: boolean;
  conservationError: number;
  holdings: number[];
  landed: number[];
}

const W = 520;
const ROW_H = 58;
const PAD_Y = 22;
const NODE_W = 116;

export default function SuccessionRibbon({ labels }: { labels?: string[] }) {
  const { skin } = useSkin();
  const [data, setData] = useState<SuccessionResp | null>(null);

  useEffect(() => {
    // POST with no body: the endpoint defaults both sides to the live slate, so
    // the ribbon renders the real matrix without needing an auction to exist yet.
    fetch("/api/v1/zeitgeist/succession", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
      .then((r) => r.json())
      .then((d: SuccessionResp) => {
        if (d?.success) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{ fontSize: 9, color: skin.muted, fontFamily: INSTRUMENT_FONT }}>
        Building the succession matrix…
      </div>
    );
  }

  const rows = data.matrix.length;
  const cols = data.matrix[0]?.length ?? 0;
  const H = PAD_Y * 2 + Math.max(rows, cols) * ROW_H;
  const yOf = (i: number, n: number) => PAD_Y + ROW_H * i + ROW_H / 2 + ((Math.max(rows, cols) - n) * ROW_H) / 2;
  const name = (i: number) => labels?.[i] ?? `Slot ${i + 1}`;

  return (
    <div style={{ fontFamily: INSTRUMENT_FONT, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: skin.accent, textTransform: "uppercase" }}>
          Succession · vintage {data.fromVintage} → {data.toVintage}
        </div>
        <div style={{ fontSize: 7, color: skin.muted }}>
          measured <b style={{ color: skin.text }}>{Math.round(data.weights.measured * 100)}%</b> · voted{" "}
          <b style={{ color: skin.text }}>{Math.round(data.weights.voted * 100)}%</b>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 320, display: "block" }} role="img"
             aria-label="Succession matrix flow from retiring slots to the incoming slate">
          {/* Ribbons first, so nodes sit on top of them. */}
          {data.matrix.map((row, i) =>
            row.map((share, j) => {
              if (share <= 0.001) return null;
              const y1 = yOf(i, rows);
              const y2 = yOf(j, cols);
              const x1 = NODE_W;
              const x2 = W - NODE_W;
              const mid = (x1 + x2) / 2;
              // Stroke width carries the share. 1 unit of conviction = ROW_H*0.62
              // of ribbon, so a full row visibly equals its source node's height.
              const width = Math.max(1, share * ROW_H * 0.62);
              return (
                <path
                  key={`${i}-${j}`}
                  d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={skin.accent2}
                  strokeOpacity={0.18 + share * 0.5}
                  strokeWidth={width}
                  strokeLinecap="round"
                />
              );
            }),
          )}

          {data.matrix.map((_, i) => (
            <g key={`from-${i}`}>
              <rect x={4} y={yOf(i, rows) - 15} width={NODE_W - 10} height={30} rx={7}
                    fill={skin.card} stroke={skin.border} />
              <text x={NODE_W / 2 - 3} y={yOf(i, rows) + 4} textAnchor="middle"
                    fontSize={9} fontWeight={900} fill={skin.text} fontFamily={INSTRUMENT_FONT}>
                {name(i)}
              </text>
            </g>
          ))}

          {Array.from({ length: cols }, (_, j) => (
            <g key={`to-${j}`}>
              <rect x={W - NODE_W + 6} y={yOf(j, cols) - 15} width={NODE_W - 10} height={30} rx={7}
                    fill={skin.card} stroke={`${skin.gold}66`} />
              <text x={W - NODE_W / 2 + 1} y={yOf(j, cols) + 4} textAnchor="middle"
                    fontSize={9} fontWeight={900} fill={skin.gold} fontFamily={INSTRUMENT_FONT}>
                {name(j)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 7, color: skin.muted }}>
        <span>
          Conviction in <b style={{ color: skin.text }}>{data.holdings.reduce((a, b) => a + b, 0).toFixed(2)}</b>
        </span>
        <span>
          out <b style={{ color: skin.text }}>{data.landed.reduce((a, b) => a + b, 0).toFixed(2)}</b>
        </span>
        {/* If this is ever non-zero it is the most important number on the page:
            a leaky Turning destroys holder value with no other visible symptom. */}
        <span>
          conservation error{" "}
          <b style={{ color: data.conserved ? skin.positive : skin.accent2 }}>
            {data.conservationError.toExponential(1)}
          </b>
        </span>
      </div>
    </div>
  );
}
