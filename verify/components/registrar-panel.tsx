"use client";

/**
 * MAD Gambit — the Registrar surfaces (§9.1, §6.2.2).
 * ────────────────────────────────────────────────────────────────
 * Two components, both launch-gating rather than backlog:
 *
 *   RegistrarStatusPanel — the Phase-4 gate and the transparency report, in
 *   public. Whether the portrait key registry is live, which workstreams are
 *   outstanding, the platform pause state, the published SLAs, and the
 *   moderation statistics INCLUDING our own error rate. §9.1 asks for these
 *   before the DSA thresholds bind, and the reason is not only compliance: a
 *   platform that can show its own error rate is in a very different position
 *   from one that cannot.
 *
 *   SubjectReplyPanel — the standing right of reply, rendered adjacent to the
 *   Waterline at equal prominence. "Equal prominence" is a real constraint and
 *   it is why this panel uses the same type scale and the same card treatment
 *   as the market it sits beside rather than a muted footnote style. There is
 *   no collapse, no "show more", and no moderation affordance anywhere in it.
 */
import React, { useEffect, useState } from "react";
import { useSkin } from "@/components/skin-provider";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";

interface Outstanding {
  workstream: string;
  missing: string;
}
interface StatusResp {
  success: boolean;
  source?: string;
  registry: { live: boolean; outstanding: Outstanding[] };
  pause: { paused: boolean; reason: string | null; changedAt: string };
  pepperConfigured: boolean;
  slas: { listingHours: number; delistingHours: number; trustedFlaggerHours: number };
  stats: {
    pending: number;
    approved: number;
    denied: number;
    slaBreaches: number;
    byLane: Record<string, number>;
    complaintsOpen: number;
    complaintsSubstantiated: number;
    errorRate: number;
  } | null;
}

const WORKSTREAM_LABEL: Record<string, string> = {
  key_custody: "Key custody",
  ciphertext_store: "Ciphertext store",
  registry_contract: "Registry contract",
  identity_map: "Subject identity map",
  legal_instruments: "Legal instruments",
  destruction_drill: "Tested destruction drill",
};
const MISSING_LABEL: Record<string, string> = {
  complete: "not complete",
  tested: "complete, not tested",
  signoff: "tested, not signed off",
};

export function RegistrarStatusPanel() {
  const { skin } = useSkin();
  const [data, setData] = useState<StatusResp | null>(null);

  useEffect(() => {
    fetch("/api/v1/registrar/status")
      .then((r) => r.json())
      .then((d: StatusResp) => {
        if (d?.success) setData(d);
      })
      .catch(() => {});
  }, []);

  const live = data?.registry.live ?? false;
  const gateColor = live ? skin.positive : skin.gold;

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.border}`, borderRadius: 16, padding: 18, fontFamily: INSTRUMENT_FONT, color: skin.text, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: skin.gold, textTransform: "uppercase" }}>
          The Codex Registrar <span style={{ color: skin.muted, fontSize: 8, letterSpacing: 1 }}>transparency</span>
        </div>
        {data && (
          <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 4, color: gateColor, background: `${gateColor}18`, border: `1px solid ${gateColor}55` }}>
            {live ? "registry live" : "phase-4 gate closed"}
          </span>
        )}
      </div>

      {data === null && <div style={{ fontSize: 9, color: skin.muted }}>Reading the gate…</div>}

      {data && data.pause.paused && (
        <div style={{ background: `${skin.accent2}18`, border: `1px solid ${skin.accent2}66`, borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: skin.accent2, letterSpacing: 1, textTransform: "uppercase" }}>
            New conviction halted
          </div>
          <div style={{ fontSize: 8, color: skin.text, marginTop: 4, opacity: 0.9 }}>{data.pause.reason ?? "—"}</div>
        </div>
      )}

      {data && !live && (
        <div>
          <div style={{ fontSize: 7.5, color: skin.muted, marginBottom: 6, lineHeight: 1.5 }}>
            No named-individual portrait mints until all six workstreams are complete, tested and signed off.
            Untested destruction is not destruction.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.registry.outstanding.map((o) => (
              <div key={o.workstream} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 8, background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 8, padding: "6px 9px" }}>
                <span style={{ color: skin.text }}>{WORKSTREAM_LABEL[o.workstream] ?? o.workstream}</span>
                <span style={{ color: skin.gold, fontWeight: 900, whiteSpace: "nowrap" }}>
                  {MISSING_LABEL[o.missing] ?? o.missing}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 7, color: skin.muted }}>
          <span>Listing SLA <b style={{ color: skin.text }}>{data.slas.listingHours}h</b></span>
          <span>Delisting SLA <b style={{ color: skin.text }}>{data.slas.delistingHours}h</b></span>
          <span>Trusted flagger <b style={{ color: skin.accent }}>{data.slas.trustedFlaggerHours}h</b></span>
          <span>Identity pepper <b style={{ color: data.pepperConfigured ? skin.positive : skin.gold }}>{data.pepperConfigured ? "configured" : "unset"}</b></span>
        </div>
      )}

      {data?.stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 110px), 1fr))", gap: 8 }}>
          <Stat label="Pending" value={String(data.stats.pending)} color={skin.text} />
          <Stat label="Approved" value={String(data.stats.approved)} color={skin.positive} />
          <Stat label="Denied" value={String(data.stats.denied)} color={skin.muted} />
          <Stat label="SLA breaches" value={String(data.stats.slaBreaches)} color={data.stats.slaBreaches ? skin.accent2 : skin.muted} />
          <Stat label="Complaints open" value={String(data.stats.complaintsOpen)} color={skin.text} />
          {/* Published on purpose. This is the number that defends the product. */}
          <Stat label="Error rate" value={`${(data.stats.errorRate * 100).toFixed(1)}%`} color={skin.gold} />
        </div>
      )}

      {data?.stats && (
        <div style={{ fontSize: 7, color: skin.muted }}>
          Decided by lane — classifier <b style={{ color: skin.text }}>{data.stats.byLane.classifier ?? 0}</b> · judge{" "}
          <b style={{ color: skin.text }}>{data.stats.byLane.judge ?? 0}</b> · human{" "}
          <b style={{ color: skin.text }}>{data.stats.byLane.human ?? 0}</b>. Every appeal is decided by a human.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { skin } = useSkin();
  return (
    <div style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontSize: 6.5, color: skin.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

interface Reply {
  id: number;
  body: string;
  verification: string;
  postedAt: string;
}

/**
 * §9.1 RIGHT OF REPLY. Renders adjacent to the Waterline at equal prominence.
 *
 * Note what this component does not have: a collapse toggle, a "show more", a
 * report button, a moderation badge, or a muted style. Each of those would be a
 * way of rendering the reply while diminishing it, and diminished is the same
 * as filtered for the purpose this surface serves.
 */
export function SubjectReplyPanel({ subjectRef }: { subjectRef: string }) {
  const { skin } = useSkin();
  const [replies, setReplies] = useState<Reply[] | null>(null);

  useEffect(() => {
    if (!subjectRef) return;
    fetch(`/api/v1/registrar/reply?subjectRef=${encodeURIComponent(subjectRef)}`)
      .then((r) => r.json())
      .then((d: { success: boolean; replies: Reply[] }) => {
        if (d?.success) setReplies(d.replies);
      })
      .catch(() => setReplies([]));
  }, [subjectRef]);

  return (
    <div style={{ background: skin.panel, border: `1px solid ${skin.accent}55`, borderRadius: 14, padding: 14, fontFamily: INSTRUMENT_FONT }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: skin.accent, textTransform: "uppercase" }}>
        The subject's reply
      </div>
      <div style={{ fontSize: 7.5, color: skin.muted, marginTop: 4, lineHeight: 1.5 }}>
        A standing, unmoderated channel for the subject or a verified representative. Nothing posted here is
        reviewed, ranked or filtered by MAD Gambit.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {replies === null && <div style={{ fontSize: 9, color: skin.muted }}>Loading…</div>}
        {replies !== null && replies.length === 0 && (
          <div style={{ fontSize: 9, color: skin.muted }}>The subject has not responded. The channel stays open.</div>
        )}
        {(replies ?? []).map((r) => (
          <div key={r.id} style={{ background: skin.card, border: `1px solid ${skin.border}`, borderRadius: 10, padding: "10px 12px" }}>
            {/* Same 9px body scale as a market card — equal prominence is not a
                figure of speech in §9.1. */}
            <div style={{ fontSize: 9, color: skin.text, lineHeight: 1.55 }}>{r.body}</div>
            <div style={{ fontSize: 6.5, color: skin.muted, marginTop: 6, letterSpacing: 0.5 }}>
              Verified via {r.verification.replace(/_/g, " ")} · {r.postedAt.slice(0, 10)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RegistrarStatusPanel;
