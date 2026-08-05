/**
 * MAD Gambit — THE CODEX REGISTRAR (§9.1) and the Phase-4 gate (§6.2.2).
 * ────────────────────────────────────────────────────────────────
 * Every other perp on this platform is classified algorithmically. This one is
 * not. §9.1 is blunt about why: none of the other controls says WHO decides
 * that a named subject clears the bar, at volume, with legal consequence — and
 * "pretending otherwise is how the queue ends up owned by nobody."
 *
 * TRIAGE ARCHITECTURE, the 2026 trust-and-safety consensus shape:
 *
 *   classifier  → cheap pre-screen on the OBJECTIVE eligibility criteria.
 *                 Decides only the unambiguous cases in both directions.
 *   judge       → LLM-as-judge on the ambiguous remainder.
 *   human       → the genuinely hard cases, and EVERY appeal. No exceptions —
 *                 an appeal auto-resolved by the same machine that made the
 *                 original call is not an appeal.
 *
 * The hard blocks are checked FIRST and have no override. A subject can be a
 * sitting senator and still be blocked, because the block is about the QUESTION
 * (a minor, a protected-class mapping, conduct outside the public role), not
 * about the person's prominence. Running eligibility first would let a strong
 * bar wash out a categorical prohibition, which is the failure mode worth
 * designing against.
 */
import type { Pool } from "pg";

export type TriageLane = "classifier" | "judge" | "human";
export type QueueStatus = "pending" | "approved" | "denied" | "delisted" | "withdrawn";
export type EligibilityBar = "public_office" | "public_company_officer" | "sustained_national_media";
export type BlockReason =
  | "private_individual"
  | "minor"
  | "protected_class_mapping"
  | "outside_public_role";

/** §9.1 LISTING SLA — published, and the counterpart to the delisting SLA. */
export const LISTING_SLA_HOURS = 72;
/** Delisting complaints move faster; a live market is accruing exposure. */
export const DELISTING_SLA_HOURS = 24;
/** Trusted flaggers jump the queue — the DSA lane. */
export const TRUSTED_FLAGGER_SLA_HOURS = 6;

export interface EligibilityClaim {
  bar?: EligibilityBar;
  evidence?: string[];
  /** Declared facts the hard blocks test against. */
  isMinor?: boolean;
  isPrivateIndividual?: boolean;
  /** True when the conduct in question sits outside the subject's public role. */
  outsidePublicRole?: boolean;
  /** True when the market maps a persona onto a protected class. */
  mapsProtectedClass?: boolean;
}

export interface TriageResult {
  lane: TriageLane;
  decision: "approve" | "deny" | "escalate";
  bar: EligibilityBar | null;
  blockReason: BlockReason | null;
  rationale: string;
}

/**
 * The classifier pre-screen. Objective criteria only — it never weighs whether
 * something is "sufficiently public", it only recognises the cases where the
 * answer is not a judgement call.
 */
export function preScreen(claim: EligibilityClaim): TriageResult {
  // Hard blocks first, and no override exists for any of them (§9.1).
  if (claim.isMinor) {
    return block("minor", "Minors are hard-blocked with no override.");
  }
  if (claim.mapsProtectedClass) {
    return block("protected_class_mapping", "Persona-to-protected-class mapping is hard-blocked.");
  }
  if (claim.outsidePublicRole) {
    return block(
      "outside_public_role",
      "Conduct outside the subject's public role is out of scope regardless of how widely reported.",
    );
  }
  if (claim.isPrivateIndividual) {
    return block("private_individual", "Private individuals are hard-blocked with no override.");
  }

  const evidence = claim.evidence ?? [];
  if (!claim.bar) {
    return {
      lane: "classifier",
      decision: "escalate",
      bar: null,
      blockReason: null,
      rationale: "No eligibility bar claimed — needs a judgement call.",
    };
  }
  // An objective bar with corroborating evidence is the unambiguous approve.
  // Two items, because one link is a claim and two is a pattern.
  if (evidence.length >= 2) {
    return {
      lane: "classifier",
      decision: "approve",
      bar: claim.bar,
      blockReason: null,
      rationale: `Objective bar (${claim.bar}) met with ${evidence.length} evidence items.`,
    };
  }
  return {
    lane: "classifier",
    decision: "escalate",
    bar: claim.bar,
    blockReason: null,
    rationale: `Bar claimed (${claim.bar}) but evidence is thin — ${evidence.length} item(s).`,
  };
}

function block(blockReason: BlockReason, rationale: string): TriageResult {
  return { lane: "classifier", decision: "deny", bar: null, blockReason, rationale };
}

/**
 * Which lane an escalated case belongs in. The judge handles ambiguity; humans
 * handle the categories where being wrong is expensive and every appeal.
 */
export function laneFor(input: {
  preScreen: TriageResult;
  isAppeal?: boolean;
  /** THE PROSTITUTE on a named living person — the highest-risk cell (§9). */
  highestRiskCell?: boolean;
}): TriageLane {
  if (input.isAppeal) return "human";
  if (input.highestRiskCell) return "human";
  if (input.preScreen.decision === "escalate") return "judge";
  return "classifier";
}

export function slaDueAt(
  kind: "listing" | "delisting",
  trustedFlagger = false,
  nowMs = Date.now(),
): number {
  const hours = trustedFlagger
    ? TRUSTED_FLAGGER_SLA_HOURS
    : kind === "listing"
    ? LISTING_SLA_HOURS
    : DELISTING_SLA_HOURS;
  return nowMs + hours * 3_600_000;
}

/* ────────────────────────────────────────────────────────────────
 * §6.2.2 — what "live" actually requires
 * ──────────────────────────────────────────────────────────────── */

export const READINESS_WORKSTREAMS = [
  "key_custody",
  "ciphertext_store",
  "registry_contract",
  "identity_map",
  "legal_instruments",
  "destruction_drill",
] as const;
export type ReadinessWorkstream = (typeof READINESS_WORKSTREAMS)[number];

export interface ReadinessRow {
  workstream: ReadinessWorkstream;
  complete: boolean;
  tested: boolean;
  signedOffBy: string | null;
  signedOffAt: string | null;
}

export interface ReadinessVerdict {
  live: boolean;
  outstanding: { workstream: string; missing: "complete" | "tested" | "signoff" }[];
  rows: ReadinessRow[];
}

/**
 * Phase-4 readiness. All six workstreams must be complete AND tested AND signed
 * off — "untested destruction is not destruction", so `complete` alone is not a
 * pass, and an unsigned row is nobody's responsibility.
 *
 * Missing rows count as outstanding rather than absent. A checklist that gets
 * shorter when a row is deleted is a checklist that can be passed by deletion.
 */
export function evaluateReadiness(rows: ReadinessRow[]): ReadinessVerdict {
  const byKey = new Map(rows.map((r) => [r.workstream, r]));
  const outstanding: ReadinessVerdict["outstanding"] = [];
  for (const w of READINESS_WORKSTREAMS) {
    const row = byKey.get(w);
    if (!row || !row.complete) outstanding.push({ workstream: w, missing: "complete" });
    else if (!row.tested) outstanding.push({ workstream: w, missing: "tested" });
    else if (!row.signedOffBy) outstanding.push({ workstream: w, missing: "signoff" });
  }
  return { live: outstanding.length === 0, outstanding, rows };
}

/* ────────────────────────────────────────────────────────────────
 * Persistence
 * ──────────────────────────────────────────────────────────────── */

export interface QueueEntry {
  id: number;
  subjectRef: string;
  marketId: string | null;
  status: QueueStatus;
  lane: TriageLane;
  bar: EligibilityBar | null;
  evidence: string[];
  blockReason: BlockReason | null;
  submittedAt: string;
  slaDueAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

const iso = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString() : v == null ? null : String(v);

function mapEntry(r: Record<string, unknown>): QueueEntry {
  return {
    id: Number(r.id),
    subjectRef: String(r.subject_ref),
    marketId: (r.market_id as string | null) ?? null,
    status: (r.status as QueueStatus) ?? "pending",
    lane: (r.lane as TriageLane) ?? "classifier",
    bar: (r.bar as EligibilityBar | null) ?? null,
    evidence: Array.isArray(r.evidence) ? (r.evidence as unknown[]).map(String) : [],
    blockReason: (r.block_reason as BlockReason | null) ?? null,
    submittedAt: iso(r.submitted_at) ?? "",
    slaDueAt: iso(r.sla_due_at) ?? "",
    decidedAt: iso(r.decided_at),
    decidedBy: (r.decided_by as string | null) ?? null,
  };
}

export async function submitForListing(
  pool: Pool,
  input: { subjectRef: string; claim: EligibilityClaim; highestRiskCell?: boolean; nowMs?: number },
): Promise<{ entry: QueueEntry; triage: TriageResult; lane: TriageLane }> {
  const now = input.nowMs ?? Date.now();
  const triage = preScreen(input.claim);
  const lane = laneFor({ preScreen: triage, highestRiskCell: input.highestRiskCell });

  // A hard block is recorded as a decided denial immediately. Parking a blocked
  // subject in `pending` would put a categorical prohibition in a queue where it
  // could be approved by someone working through a backlog.
  const decided = triage.decision === "deny";

  const res = await pool.query(
    `INSERT INTO registrar_queue
       (subject_ref, status, lane, bar, evidence, block_reason, submitted_at, sla_due_at, decided_at, decided_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (subject_ref) DO UPDATE SET
       lane = EXCLUDED.lane,
       bar = EXCLUDED.bar,
       evidence = EXCLUDED.evidence,
       block_reason = EXCLUDED.block_reason,
       updated_at = now()
     RETURNING *`,
    [
      input.subjectRef,
      decided ? "denied" : "pending",
      lane,
      triage.bar,
      JSON.stringify(input.claim.evidence ?? []),
      triage.blockReason,
      new Date(now).toISOString(),
      new Date(slaDueAt("listing", false, now)).toISOString(),
      decided ? new Date(now).toISOString() : null,
      decided ? "classifier" : null,
    ],
  );
  return { entry: mapEntry(res.rows[0] as Record<string, unknown>), triage, lane };
}

export async function decideListing(
  pool: Pool,
  input: {
    subjectRef: string;
    decision: "approved" | "denied";
    lane: TriageLane;
    decidedBy: string;
    bar?: EligibilityBar | null;
    blockReason?: BlockReason | null;
    isAppeal?: boolean;
  },
): Promise<QueueEntry | null> {
  // §9.1: humans decide every appeal. Enforced rather than documented, because
  // this is the exact rule a busy queue quietly relaxes.
  if (input.isAppeal && input.lane !== "human") {
    throw new Error("every appeal must be decided by a human reviewer");
  }
  const res = await pool.query(
    `UPDATE registrar_queue
        SET status = $2, lane = $3, decided_by = $4, decided_at = now(),
            bar = COALESCE($5, bar), block_reason = $6, updated_at = now()
      WHERE subject_ref = $1
      RETURNING *`,
    [
      input.subjectRef,
      input.decision,
      input.lane,
      input.decidedBy,
      input.bar ?? null,
      input.blockReason ?? null,
    ],
  );
  return res.rows[0] ? mapEntry(res.rows[0] as Record<string, unknown>) : null;
}

export async function listQueue(
  pool: Pool,
  status: QueueStatus = "pending",
  limit = 100,
): Promise<QueueEntry[]> {
  const res = await pool.query(
    `SELECT * FROM registrar_queue WHERE status = $1 ORDER BY sla_due_at ASC LIMIT $2`,
    [status, limit],
  );
  return (res.rows as Record<string, unknown>[]).map(mapEntry);
}

/** Breaches, oldest first. Published as a moderation statistic, not an alert. */
export async function listSlaBreaches(pool: Pool, limit = 50): Promise<QueueEntry[]> {
  const res = await pool.query(
    `SELECT * FROM registrar_queue
      WHERE status = 'pending' AND sla_due_at < now()
      ORDER BY sla_due_at ASC LIMIT $1`,
    [limit],
  );
  return (res.rows as Record<string, unknown>[]).map(mapEntry);
}

export async function isSubjectApproved(pool: Pool, subjectRef: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM registrar_queue WHERE subject_ref = $1 AND status = 'approved' LIMIT 1`,
    [subjectRef],
  );
  return res.rows.length > 0;
}

export async function readReadiness(pool: Pool): Promise<ReadinessVerdict> {
  const res = await pool.query(`SELECT * FROM registry_readiness`);
  const rows: ReadinessRow[] = (res.rows as Record<string, unknown>[]).map((r) => ({
    workstream: String(r.workstream) as ReadinessWorkstream,
    complete: Boolean(r.complete),
    tested: Boolean(r.tested),
    signedOffBy: (r.signed_off_by as string | null) ?? null,
    signedOffAt: iso(r.signed_off_at),
  }));
  return evaluateReadiness(rows);
}

/* ────────────────────────────────────────────────────────────────
 * PAUSE_GUARDIAN (§9.1)
 * ──────────────────────────────────────────────────────────────── */

export interface PauseState {
  paused: boolean;
  reason: string | null;
  actor: string | null;
  changedAt: string;
}

export async function getPauseState(pool: Pool): Promise<PauseState> {
  const res = await pool.query(`SELECT * FROM pause_state WHERE id = TRUE`);
  const r = (res.rows[0] ?? {}) as Record<string, unknown>;
  return {
    paused: Boolean(r.paused),
    reason: (r.reason as string | null) ?? null,
    actor: (r.actor as string | null) ?? null,
    changedAt: iso(r.changed_at) ?? "",
  };
}

/**
 * Halt or resume new conviction platform-wide.
 *
 * NOT timelocked, on purpose. Timelocks delay parameter changes so the community
 * can react; an emergency stop must not be delayed for the same reason a fire
 * alarm is not on a timer. The `actor` is a separate guardian role with its own
 * key — not the owner key, which is both a single point of failure and the wrong
 * custody model for a control that can only stop things.
 *
 * The state row and the append-only log are written together, so a pause can
 * never be silently un-recorded.
 */
export async function setPaused(
  pool: Pool,
  paused: boolean,
  reason: string,
  actor: string,
): Promise<PauseState> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE pause_state SET paused = $1, reason = $2, actor = $3, changed_at = now() WHERE id = TRUE`,
      [paused, reason, actor],
    );
    await client.query(
      `INSERT INTO pause_events (paused, reason, actor) VALUES ($1,$2,$3)`,
      [paused, reason, actor],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return getPauseState(pool);
}

/* ────────────────────────────────────────────────────────────────
 * §9.1 right of reply and complaints
 * ──────────────────────────────────────────────────────────────── */

export interface SubjectReply {
  id: number;
  subjectRef: string;
  marketId: string | null;
  body: string;
  verification: string;
  postedAt: string;
  retractedAt: string | null;
}

/**
 * Post a reply. There is no moderation parameter and no approval step, by
 * design: a market that reads someone's character while filtering their answer
 * is the version of this product that gets sued.
 */
export async function postReply(
  pool: Pool,
  input: { subjectRef: string; marketId?: string | null; body: string; verification: string },
): Promise<SubjectReply> {
  const res = await pool.query(
    `INSERT INTO subject_replies (subject_ref, market_id, body, verification)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.subjectRef, input.marketId ?? null, input.body, input.verification],
  );
  const r = res.rows[0] as Record<string, unknown>;
  return {
    id: Number(r.id),
    subjectRef: String(r.subject_ref),
    marketId: (r.market_id as string | null) ?? null,
    body: String(r.body),
    verification: String(r.verification),
    postedAt: iso(r.posted_at) ?? "",
    retractedAt: iso(r.retracted_at),
  };
}

export async function listReplies(pool: Pool, subjectRef: string, limit = 50): Promise<SubjectReply[]> {
  const res = await pool.query(
    `SELECT * FROM subject_replies WHERE subject_ref = $1 AND retracted_at IS NULL
      ORDER BY posted_at DESC LIMIT $2`,
    [subjectRef, limit],
  );
  return (res.rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    subjectRef: String(r.subject_ref),
    marketId: (r.market_id as string | null) ?? null,
    body: String(r.body),
    verification: String(r.verification),
    postedAt: iso(r.posted_at) ?? "",
    retractedAt: iso(r.retracted_at),
  }));
}

export interface ComplaintInput {
  subjectRef: string;
  marketId?: string | null;
  kind: "delist_request" | "appeal" | "notice_and_action";
  grounds: string;
  trustedFlagger?: boolean;
  nowMs?: number;
}

export async function fileComplaint(pool: Pool, input: ComplaintInput): Promise<number> {
  const now = input.nowMs ?? Date.now();
  const res = await pool.query(
    `INSERT INTO subject_complaints
       (subject_ref, market_id, kind, trusted_flagger, grounds, filed_at, sla_due_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      input.subjectRef,
      input.marketId ?? null,
      input.kind,
      Boolean(input.trustedFlagger),
      input.grounds,
      new Date(now).toISOString(),
      new Date(slaDueAt("delisting", input.trustedFlagger, now)).toISOString(),
    ],
  );
  return Number(res.rows[0]?.id ?? 0);
}

/**
 * Substantiate a complaint: halt new conviction IMMEDIATELY and settle open
 * positions at the last Crowning price.
 *
 * SETTLE, NOT VOID. Voiding would refund the stake and erase the market, which
 * sounds generous and is actually the worse outcome — holders who were right
 * lose their gain, and the platform gains an incentive to void whenever a
 * market goes against it. Settling at the last Crowning pays the reading the
 * market actually produced.
 */
export async function substantiateComplaint(
  pool: Pool,
  input: { complaintId: number; settlePrice: number; settleLeg: number; note?: string },
): Promise<boolean> {
  const res = await pool.query(
    `UPDATE subject_complaints
        SET status = 'substantiated', halted_at = now(), resolved_at = now(),
            settle_price = $2, settle_leg = $3, outcome_note = $4
      WHERE id = $1 AND status = 'open'`,
    [input.complaintId, input.settlePrice, input.settleLeg, input.note ?? null],
  );
  return (res.rowCount ?? 0) > 0;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  denied: number;
  slaBreaches: number;
  byLane: Record<TriageLane, number>;
  complaintsOpen: number;
  complaintsSubstantiated: number;
  /** Substantiated complaints over decided listings — our own error rate. */
  errorRate: number;
}

/**
 * Published moderation statistics, INCLUDING the error rate.
 *
 * Publishing it is the point. A platform that can show its own error rate is in
 * a very different position from one that cannot, and the transparency report
 * doubles as the contemporaneous audit trail if a complaint ever escalates.
 */
export async function moderationStats(pool: Pool): Promise<ModerationStats> {
  const [queue, lanes, complaints, breaches] = await Promise.all([
    pool.query(`SELECT status, COUNT(*)::int AS n FROM registrar_queue GROUP BY status`),
    pool.query(`SELECT lane, COUNT(*)::int AS n FROM registrar_queue GROUP BY lane`),
    pool.query(`SELECT status, COUNT(*)::int AS n FROM subject_complaints GROUP BY status`),
    pool.query(
      `SELECT COUNT(*)::int AS n FROM registrar_queue WHERE status = 'pending' AND sla_due_at < now()`,
    ),
  ]);

  const q: Record<string, number> = {};
  for (const r of queue.rows) q[String(r.status)] = Number(r.n) || 0;
  const byLane = { classifier: 0, judge: 0, human: 0 } as Record<TriageLane, number>;
  for (const r of lanes.rows) {
    const lane = String(r.lane) as TriageLane;
    if (lane in byLane) byLane[lane] = Number(r.n) || 0;
  }
  const c: Record<string, number> = {};
  for (const r of complaints.rows) c[String(r.status)] = Number(r.n) || 0;

  const decided = (q.approved ?? 0) + (q.denied ?? 0);
  const substantiated = c.substantiated ?? 0;
  return {
    pending: q.pending ?? 0,
    approved: q.approved ?? 0,
    denied: q.denied ?? 0,
    slaBreaches: Number(breaches.rows[0]?.n) || 0,
    byLane,
    complaintsOpen: c.open ?? 0,
    complaintsSubstantiated: substantiated,
    errorRate: decided > 0 ? substantiated / decided : 0,
  };
}
