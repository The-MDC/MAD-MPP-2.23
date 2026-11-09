/**
 * MAD Gambit — the ZEITGEIST slot auction's money path (T1 phase 2b).
 * ────────────────────────────────────────────────────────────────
 * `lib/slot-auction.ts` is the pure maths of the room: phases, the Dutch clock,
 * commit–reveal, `clearAuction`. It never touches a balance. This module is the
 * other half — the part that moves $MADx — and it exists for one reason: the
 * sealed-bid deposit was RECORDED and never CHARGED.
 *
 * `slot_bids.deposit` held 10% of every sealed bid (`requiredDeposit`), and the
 * maths promised that an unrevealed commit "forfeits" it. Nobody had paid it, so
 * there was nothing to forfeit and nothing to refund: the deterrent that keeps a
 * bidder from committing high to scare rivals and never revealing was a number in
 * a column. T1 (`docs/MAD_GAMBIT_MASTER.md`, PART 0 §5) closed the same hole in
 * perp conviction and the Shield premium; this closes the third.
 *
 * WHY THE WHOLE LIFECYCLE, OR NONE OF IT. Debiting the deposit alone would
 * STRAND money — a bidder charged at commit with no path back. So the three
 * terminal states ship together:
 *
 *   commit                → the deposit is debited (`spendWithin`, ledger `spend`)
 *   reveal, lose or win   → the deposit is refunded (`refundWithin`, ledger `refund`)
 *   never revealed        → the deposit is FORFEITED to the platform
 *
 * Forfeit moves nothing. Every `spend` in this ledger leaves the account and the
 * platform keeps it — there is no treasury account yet (that is CF1 in the MASTER
 * build queue, deliberately not decided here) — so the debit made at commit is
 * already the platform's. Forfeiting is therefore the ABSENCE of a refund, and
 * the record of it is `slot_bids.status = 'forfeited'` beside the original
 * `spend` row. When a treasury exists, this is the one place that changes.
 *
 * WINNERS GET THEIR DEPOSIT BACK TOO. It is a bond against not revealing, not a
 * part-payment: a winner revealed, so the bond has done its job. The CLEARING
 * PRICE a winner owes is a separate charge that is not collected anywhere yet and
 * is NOT started here — see PART 0 §5, T1 row ("2c"). Charging it needs a policy
 * for a winner who cannot cover it at clear time, which is a product decision, not
 * an engineering one.
 *
 * THE TWO TRANSACTIONS. `commitSealedBid` inserts the bid and debits the deposit
 * as one event. `clearAndSettle` locks the auction row, locks every bid, flips
 * `cleared_at`, and pays every refund as one event — the route used to run this as
 * four separate `pool.query` calls with no transaction, so a crash mid-loop could
 * refund some bidders and not others, and a second `clear` would then have no way
 * to tell. Shape copied from `lib/market-book.ts#fill()`.
 *
 * NO REFUND WITHOUT PROOF OF A DEBIT. Bids committed before this change carry a
 * `deposit` that was never charged; refunding one would mint money. So every
 * refund is looked up against the `spend` row written at commit
 * (`depositNote`), and the refund is the amount THAT ROW took — not whatever the
 * `deposit` column says. A bid with no matching `spend` settles its status and
 * moves no money.
 */
import type { Pool, PoolClient } from "pg";
import { refundWithin, round6, spendWithin } from "@/lib/madx-web2";
import {
  clearAuction,
  commitmentHash,
  requiredDeposit,
  type AuctionResult,
  type RevealedBid,
  type SealedBid,
} from "@/lib/slot-auction";

/** The deposit as the ledger will carry it: `requiredDeposit`, rounded the ledger's way. */
export function depositFor(amount: number): number {
  return round6(requiredDeposit(amount));
}

/**
 * The `note` on the `spend` row written at commit. It is the join key between a
 * bid and its debit, so it names the auction and the commitment — the commitment
 * already binds bidder, trend, amount and salt, which makes the note unique per
 * bid with no extra column and no migration.
 */
export function depositNote(auctionId: number | string, commitment: string): string {
  return `slot-deposit a${auctionId} ${commitment}`;
}

/** The `note` on the `refund` row written at clear. */
export function refundNote(auctionId: number | string, commitment: string): string {
  return `slot-deposit-refund a${auctionId} ${commitment}`;
}

/* ────────────────────────────────────────────────────────────────
 * Pure: who gets what at the end
 * ──────────────────────────────────────────────────────────────── */

/** A `slot_bids` row, in the shapes the maths uses (numbers and ms, not strings and Dates). */
export interface BidRow {
  id: number;
  bidder: string;
  trendKey: string;
  commitment: string;
  deposit: number;
  revealedAmount: number | null;
  revealedSalt: string | null;
  revealedAt: number | null;
}

/**
 * `won` and `refunded` both get the deposit back; they differ only in whether the
 * bid took a slot. `forfeited` does not.
 */
export type BidOutcome = "won" | "refunded" | "forfeited";

export interface BidSettlement {
  id: number;
  bidder: string;
  commitment: string;
  outcome: BidOutcome;
}

/**
 * A reveal that actually opens its commitment.
 *
 * The same test `clearAuction` applies (recompute the hash, compare to the
 * sealed one). Kept as a function here rather than reading `clearAuction`'s
 * `invalid` list because that list names bidders, not rows — and a bidder can
 * hold several sealed bids, one valid and one not.
 */
export function hasValidReveal(b: BidRow): boolean {
  if (b.revealedAt == null || b.revealedAmount == null) return false;
  return commitmentHash(b.bidder, b.trendKey, b.revealedAmount, b.revealedSalt ?? "") === b.commitment;
}

/**
 * Decide each bid's terminal state from the auction's result.
 *
 * `clearAuction` answers in bidders and trends (`winners`, `forfeited`) because
 * that is what the maths needs. Money moves per BID, and one bidder may hold
 * several — so this maps the result back onto rows.
 *
 *   • a row that opens its commitment and is the one `clearAuction` picked → won
 *   • a row that opens its commitment and is not (outbid, below the reserve, or a
 *     second bid by someone who already won that trend)               → refunded
 *   • a row that never opened its commitment                           → forfeited
 *
 * Throws if a winner cannot be matched to a row. That would be a defect in this
 * mapping, and the right response is to abort the clearing transaction rather
 * than settle an auction that disagrees with its own result.
 */
export function planSettlement(rows: readonly BidRow[], result: AuctionResult): BidSettlement[] {
  const wonIds = new Set<number>();
  for (const w of result.winners) {
    const match = rows
      .filter(
        (b) =>
          hasValidReveal(b) &&
          b.bidder.toLowerCase() === w.bidder.toLowerCase() &&
          b.trendKey === w.trendKey &&
          b.revealedAmount === w.amount &&
          !wonIds.has(b.id),
      )
      // Two identical reveals by one bidder are the same bid twice; the earlier one is the winner.
      .sort((a, b) => (a.revealedAt as number) - (b.revealedAt as number) || a.id - b.id)[0];
    if (!match) {
      throw new Error(`slot auction: winner ${w.bidder}/${w.trendKey} matches no revealed bid`);
    }
    wonIds.add(match.id);
  }

  return rows.map((b) => ({
    id: b.id,
    bidder: b.bidder,
    commitment: b.commitment,
    outcome: wonIds.has(b.id) ? "won" : hasValidReveal(b) ? "refunded" : "forfeited",
  }));
}

/* ────────────────────────────────────────────────────────────────
 * Commit — insert the sealed bid and take the deposit, or neither
 * ──────────────────────────────────────────────────────────────── */

export interface CommitInput {
  /** The slate this auction fills (`vintageAt(now) + 1`). */
  vintage: number;
  bidder: string;
  trendKey: string;
  commitment: string;
  /** Pre-rounded by `depositFor`. Debited exactly, and stored exactly. */
  deposit: number;
}

/**
 * Why a commit was refused.
 *   no-auction            → 404: nothing is open for this vintage.
 *   auction-cleared       → 409: the auction has already settled; a bid now would never be refunded.
 *   insufficient-balance  → 402: well-formed, but the wallet cannot cover the deposit.
 *   bad-deposit           → 400: the bid is so small its deposit rounds to nothing.
 */
export type CommitFailure = "no-auction" | "auction-cleared" | "insufficient-balance" | "bad-deposit";

export interface CommitSuccess {
  /** False when this exact commitment was already on file — nothing was charged again. */
  charged: boolean;
}

/**
 * Seal a bid and charge its deposit as one transaction.
 *
 * ORDER MATTERS. The insert goes FIRST and the debit second, so the unique index
 * on `(auction_id, commitment)` is what serialises a replay: a duplicate commit
 * inserts nothing, and a commit that inserted nothing never reaches the debit. With
 * the order reversed, two concurrent identical requests would both pass the balance
 * check and both be charged for one bid.
 */
export async function commitSealedBid(pool: Pool, input: CommitInput): Promise<CommitSuccess | CommitFailure> {
  const deposit = round6(input.deposit);
  if (!(deposit > 0)) return "bad-deposit";

  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    // FOR SHARE, and `cleared_at` is read under it. `clearAndSettle` takes this same row FOR UPDATE,
    // so the two exclude each other: a clear in flight makes this wait, and once the clear commits
    // this sees `cleared_at` and refuses. Without the lock a commit that reached here after the
    // clear had read the bid list would insert a bid and take its deposit INSIDE a transaction the
    // clear never saw — a debit with no refund and no forfeit, ever. The route's clock check
    // narrows that window; it cannot close it.
    const auction = await client.query(`SELECT id, cleared_at FROM slot_auctions WHERE vintage = $1 FOR SHARE`, [
      input.vintage,
    ]);
    const auctionId = auction.rows[0]?.id;
    if (auctionId == null) {
      await client.query("ROLLBACK");
      return "no-auction";
    }
    if (auction.rows[0]?.cleared_at) {
      await client.query("ROLLBACK");
      return "auction-cleared";
    }

    // The AMOUNT IS NOT STORED. Only the commitment reaches the database, so an
    // operator reading it learns nothing they could front-run.
    const inserted = await client.query(
      `INSERT INTO slot_bids (auction_id, bidder, trend_key, commitment, deposit)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (auction_id, commitment) DO NOTHING
       RETURNING id`,
      [auctionId, input.bidder, input.trendKey, input.commitment, deposit],
    );
    if ((inserted.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return { charged: false };
    }

    const paid = await spendWithin(client, input.bidder, deposit, depositNote(auctionId, input.commitment));
    if (!paid) {
      await client.query("ROLLBACK");
      return "insufficient-balance";
    }

    await client.query("COMMIT");
    return { charged: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/* ────────────────────────────────────────────────────────────────
 * Clear — decide the auction and settle every deposit, or nothing
 * ──────────────────────────────────────────────────────────────── */

/** Why a clear was refused. `closesAt` accompanies `still-open`. */
export type ClearRefusalReason = "no-auction" | "already-cleared" | "still-open";

export interface ClearRefusal {
  refused: ClearRefusalReason;
  closesAt?: string;
}

export interface SettlementSummary {
  won: number;
  refunded: number;
  forfeited: number;
  /** Total deposits handed back (winners' and losers'). */
  depositsReturned: number;
  /** Total deposits the platform kept — the sum of what each forfeited bid actually paid. */
  depositsForfeited: number;
  /**
   * Bids that settled with no matching debit on file (committed before deposits
   * were charged). Their status is set; no money moved either way.
   */
  undebited: number;
}

export interface ClearOutcome {
  /** The vintage of the auction that was actually cleared — read from its row, not assumed. */
  vintage: number;
  result: AuctionResult;
  settlement: SettlementSummary;
}

/**
 * Which auction to clear.
 *
 * THE VINTAGE CANNOT COME FROM THE LIVE CLOCK ALONE. The route used to clear
 * `vintageAt(now) + 1`. `vintageAt` is the TURNING number, and the auction for the next slate
 * runs in the last leg of a Turning and settles in that leg's tail (~5.9 days). Once the next
 * Turning begins, `vintageAt(now) + 1` names the FOLLOWING auction — so an auction nobody
 * cleared during its own tail could never be addressed again, and every deposit it had taken
 * stayed debited for good. That is the stranding the route's own comment says clearing from
 * the stored row prevents; it only prevented it for the current vintage.
 *
 *   • `vintage` given  → clear exactly that auction.
 *   • otherwise        → clear the OLDEST auction that has closed and not cleared, so a
 *     missed tail is picked up by the next call (repeat to drain a backlog, oldest first).
 *   • none is due      → answer about `currentVintage` — the auction the clock says is open —
 *     so a premature or repeated clear still gets the same 404/409 it always did.
 */
export interface ClearTarget {
  vintage?: number;
  currentVintage: number;
}

interface RawBidRow {
  id: string | number;
  bidder: string;
  trend_key: string;
  commitment: string;
  deposit: string | number;
  committed_at: Date | string;
  revealed_amount: string | number | null;
  revealed_salt: string | null;
  revealed_at: Date | string | null;
}

function toBidRow(r: RawBidRow): BidRow {
  const revealed = r.revealed_at != null;
  return {
    id: Number(r.id),
    bidder: String(r.bidder),
    trendKey: String(r.trend_key),
    commitment: String(r.commitment),
    deposit: Number(r.deposit) || 0,
    // The same coercions the route always applied before handing reveals to
    // `clearAuction` — `Number(x) || 0` and `String(x ?? "")` — so a stored row is
    // hashed here exactly as it is hashed there.
    revealedAmount: revealed ? Number(r.revealed_amount) || 0 : null,
    revealedSalt: revealed ? String(r.revealed_salt ?? "") : null,
    revealedAt: revealed ? new Date(r.revealed_at as Date | string).getTime() : null,
  };
}

/**
 * Clear one auction and settle every deposit, in ONE transaction.
 *
 * The auction row is locked `FOR UPDATE` first, so a second `clear` waits, then
 * sees `cleared_at` set and answers `already-cleared` — it cannot refund anyone
 * twice. The bids are locked too, so a `reveal` racing the clear cannot slip in
 * between reading the reveals and settling them.
 *
 * `clear` is gated on the STORED row (`closes_at`), never on the live clock — see
 * the route's comment: gating it on the clock would strand the deposits of any
 * auction nobody cleared during its own settlement tail.
 */
export async function clearAndSettle(
  pool: Pool,
  target: ClearTarget,
  nowMs: number,
): Promise<ClearOutcome | ClearRefusal> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");

    let row: Record<string, unknown> | undefined;
    if (target.vintage === undefined) {
      // `FOR UPDATE` re-checks the predicate after a wait, so of two simultaneous clears the second
      // finds the row no longer qualifies and falls through to the diagnostics below — it cannot
      // settle the same auction twice.
      const due = await client.query(
        `SELECT * FROM slot_auctions WHERE cleared_at IS NULL AND closes_at <= $1 ORDER BY closes_at, id LIMIT 1 FOR UPDATE`,
        [new Date(nowMs)],
      );
      row = due.rows[0];
    }
    if (!row) {
      const named = await client.query(`SELECT * FROM slot_auctions WHERE vintage = $1 FOR UPDATE`, [
        target.vintage ?? target.currentVintage,
      ]);
      row = named.rows[0];
    }
    if (!row) {
      await client.query("ROLLBACK");
      return { refused: "no-auction" };
    }
    if (row.cleared_at) {
      await client.query("ROLLBACK");
      return { refused: "already-cleared" };
    }
    const closesAt = new Date(row.closes_at as Date | string).getTime();
    if (nowMs < closesAt) {
      await client.query("ROLLBACK");
      return { refused: "still-open", closesAt: new Date(closesAt).toISOString() };
    }

    const auctionId = row.id as string | number;
    const bidRes = await client.query(`SELECT * FROM slot_bids WHERE auction_id = $1 ORDER BY id FOR UPDATE`, [auctionId]);
    const bids = (bidRes.rows as RawBidRow[]).map(toBidRow);

    const sealed: SealedBid[] = (bidRes.rows as RawBidRow[]).map((b) => ({
      bidder: String(b.bidder),
      trendKey: String(b.trend_key),
      commitment: String(b.commitment),
      committedAt: new Date(b.committed_at).getTime(),
      deposit: Number(b.deposit) || 0,
    }));
    const reveals: RevealedBid[] = bids
      .filter((b) => b.revealedAt != null)
      .map((b) => ({
        bidder: b.bidder,
        trendKey: b.trendKey,
        amount: b.revealedAmount as number,
        salt: b.revealedSalt as string,
        revealedAt: b.revealedAt as number,
      }));

    // The reserve at clear time is the clock's floor, read from the auction's
    // own row — not the CURRENT leg's window, which is wrong once a clear arrives late.
    const result = clearAuction({
      sealed,
      reveals,
      slots: Number(row.slots as string | number) || 3,
      reservePrice: Number(row.reserve_price as string | number) || 0,
    });
    const plan = planSettlement(bids, result);

    // What was actually debited, and what was already refunded. The refund is
    // looked up, never assumed — see the module header.
    const notes: string[] = [];
    for (const p of plan) {
      notes.push(depositNote(auctionId, p.commitment), refundNote(auctionId, p.commitment));
    }
    // Scoped by OWNER as well as note: the only index on `madx_ledger` is (owner, created_at), so a
    // bare `note = ANY(…)` is a sequential scan of the whole ledger — run here, while this
    // transaction holds FOR UPDATE on the auction and every bid. The ledger stores the owner
    // normalised (`spendWithin` / `refundWithin` lower-case and trim), so do the same.
    const owners = Array.from(new Set(plan.map((p) => p.bidder.trim().toLowerCase())));
    const ledger = notes.length
      ? await client.query(
          `SELECT kind, note, amount FROM madx_ledger WHERE owner = ANY($1::text[]) AND kind IN ('spend','refund') AND note = ANY($2::text[])`,
          [owners, notes],
        )
      : { rows: [] as Array<{ kind: string; note: string; amount: string | number }> };
    const debited = new Map<string, number>();
    const refunded = new Set<string>();
    for (const l of ledger.rows as Array<{ kind: string; note: string; amount: string | number }>) {
      if (l.kind === "spend") debited.set(l.note, round6(Number(l.amount)));
      else refunded.add(l.note);
    }

    await client.query(`UPDATE slot_auctions SET clearing_price = $2, cleared_at = now() WHERE id = $1`, [
      auctionId,
      result.clearingPrice,
    ]);

    const summary: SettlementSummary = {
      won: 0,
      refunded: 0,
      forfeited: 0,
      depositsReturned: 0,
      depositsForfeited: 0,
      undebited: 0,
    };

    for (const p of plan) {
      const paidIn = debited.get(depositNote(auctionId, p.commitment));
      if (p.outcome === "forfeited") {
        summary.forfeited += 1;
        if (paidIn === undefined) summary.undebited += 1;
        else summary.depositsForfeited = round6(summary.depositsForfeited + paidIn);
      } else {
        if (p.outcome === "won") summary.won += 1;
        else summary.refunded += 1;
        if (paidIn === undefined) {
          summary.undebited += 1;
        } else if (!refunded.has(refundNote(auctionId, p.commitment))) {
          await refundWithin(client, p.bidder, paidIn, refundNote(auctionId, p.commitment));
          summary.depositsReturned = round6(summary.depositsReturned + paidIn);
        }
      }
      // `refunded` is a new terminal value for a revealed bid that did not win.
      // `slot_bids.status` is free text (sql/0014 lists the values in a comment, with
      // no CHECK), so this needs no migration; before this change such a bid simply
      // stayed 'revealed' and there was nothing to tell it from one still awaiting clear.
      await client.query(`UPDATE slot_bids SET status = $2 WHERE id = $1`, [p.id, p.outcome]);
    }

    await client.query("COMMIT");
    return { vintage: Number(row.vintage), result, settlement: summary };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
