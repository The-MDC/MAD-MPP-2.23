"use client";

/**
 * MAD Gambit — Activity Ledger / ReflexionVisualizer (Part Y).
 *
 * Honest, stack-native nuance of the "ReflexionVisualizer" concept: NOT a fake
 * AI-swarm self-improvement monitor, but a real platform decision/action
 * timeline reading the append-only audit_log (/api/v1/audit) — market creates,
 * bets, resolutions. Skin-aware. Empty-safe.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Entry {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown>;
  wallet: string | null;
  createdAt: string;
}

function rel(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ACTION_ICON: Record<string, string> = { create: "✦", bet: "◆", resolve: "✓" };

export default function ReflexionVisualizer() {
  const { skin } = useSkin();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let stop = false;
    fetch("/api/v1/audit?limit=20")
      .then((r) => r.json())
      .then((d) => {
        if (!stop && d?.success) setEntries(d.entries as Entry[]);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, []);

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase", marginBottom: 4 }}>
        Activity Ledger
      </div>
      <div style={{ fontSize: 7, color: skin.muted, marginBottom: 14 }}>
        Real decision/action cycles from the on-platform audit log.
      </div>

      {entries !== null && entries.length === 0 && (
        <div style={{ fontSize: 9, color: skin.muted }}>No activity yet — create a market or place a bet.</div>
      )}
      {entries === null && <div style={{ fontSize: 9, color: skin.muted }}>Loading…</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(entries ?? []).map((e) => (
          <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ color: skin.accent, fontSize: 12, fontWeight: 900, width: 14, textAlign: "center", flexShrink: 0 }}>
              {ACTION_ICON[e.action] ?? "•"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: skin.text }}>
                <span style={{ fontWeight: 900, color: skin.accent, textTransform: "uppercase" }}>{e.action}</span>{" "}
                <span style={{ color: skin.muted }}>{e.entityType}</span>{" "}
                <span style={{ color: skin.text }}>{e.entityId}</span>
              </div>
              <div style={{ fontSize: 7, color: skin.muted }}>
                {e.wallet ? `${e.wallet.slice(0, 6)}…${e.wallet.slice(-4)} · ` : ""}
                {rel(e.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
