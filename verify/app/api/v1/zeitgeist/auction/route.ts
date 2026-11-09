import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isAuthResponse, requireMadxRouteAuth } from "@/lib/madx-route-auth";
import {
  auctionWindow,
  clockPriceAt,
  commitmentHash,
  phaseAt,
  poolNominations,
  REVEAL_DEPOSIT_SHARE,
  type Nomination,
} from "@/lib/slot-auction";
import { clearAndSettle, commitSealedBid, depositFor } from "@/lib/slot-auction-store";
import { currentLeg, vintageAt } from "@/lib/lunar-legs";
import { SEED_SLATE } from "@/lib/trend-slate";
import { calculateEigenTrustScore, type Engagement } from "@/lib/gambit-game-math";

/**
 * The ZEITGEIST slot auction room (§11.3).
 *
 * GET  /api/v1/zeitgeist/auction            → phase, Dutch clock, nomination pool
 * POST /api/v1/zeitgeist/auction            → { action: nominate | commit | reveal | clear }
 *
 * PHASE IS DERIVED FROM TIME, NEVER FROM A STORED FLAG. A flag has to be
 * advanced by something, and the something is a scheduler that can be down —
 * at which point the commit phase silently stays open into the reveal window
 * and the seal is worthless. Deriving it means the auction cannot be stuck open.
 */
interface Body {
  action?: string;
  trendKey?: string;
  trendName?: string;
  corpus?: string[];
  engagements?: Engagement[];
  commitment?: string;
  amount?: number;
  salt?: string;
  deposit?: number;
}

const DEFAULT_START = 25_000;
const DEFAULT_RESERVE = 2_500;

/** The auction opens at the start of the last leg before the Turning. */
function windowForNow(nowMs: number) {
  return auctionWindow(currentLeg(nowMs).openedAt);
}

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "zg-auction-read", 60, 60_000);
  if (limited) return limited;

  const now = Date.now();
  const w = windowForNow(now);
  const phase = phaseAt(w, now);
  const clock = { startPrice: DEFAULT_START, reservePrice: DEFAULT_RESERVE };
  const reserveNow = clockPriceAt(w, clock, now);

  const shell = {
    success: true,
    vintage: vintageAt(now) + 1, // the auction fills the NEXT slate
    phase,
    window: {
      opensAt: new Date(w.opensAt).toISOString(),
      commitOpensAt: new Date(w.commitOpensAt).toISOString(),
      revealOpensAt: new Date(w.revealOpensAt).toISOString(),
      closesAt: new Date(w.closesAt).toISOString(),
    },
    clock: { ...clock, priceNow: Math.round(reserveNow), shape: "exponential" as const },
    depositShare: REVEAL_DEPOSIT_SHARE,
  };

  if (!hasDatabaseUrl()) {
    // Demo pool: the seed slate re-nominated, so the room renders and the
    // clock is live even with no database behind it.
    const pool = poolNominations(
      SEED_SLATE.map((s) => ({
        trendKey: s.key,
        trendName: s.name,
        nominator: "0x0",
        corpus: s.corpus,
        engagements: [{ impact: 40, trustScore: 0.8 }],
      })),
    );
    return NextResponse.json({ ...shell, source: "demo", nominations: pool, sealedCount: 0, result: null });
  }

  try {
    const pool = getDbPool();
    const auction = await pool.query(
      `SELECT * FROM slot_auctions WHERE vintage = $1 LIMIT 1`,
      [shell.vintage],
    );
    const auctionId = auction.rows[0]?.id ?? null;
    if (!auctionId) {
      return NextResponse.json({ ...shell, source: "live", nominations: [], sealedCount: 0, result: null });
    }
    const [noms, bids] = await Promise.all([
      pool.query(
        `SELECT trend_key, trend_name, SUM(trust_weight)::float8 AS weight, COUNT(*)::int AS nominators
           FROM slot_nominations WHERE auction_id = $1
          GROUP BY trend_key, trend_name ORDER BY weight DESC`,
        [auctionId],
      ),
      pool.query(`SELECT COUNT(*)::int AS n FROM slot_bids WHERE auction_id = $1`, [auctionId]),
    ]);
    return NextResponse.json({
      ...shell,
      source: "live",
      nominations: noms.rows.map((r) => ({
        trendKey: String(r.trend_key),
        trendName: String(r.trend_name),
        weight: Number(r.weight) || 0,
        nominators: Number(r.nominators) || 0,
        corpus: [],
      })),
      sealedCount: Number(bids.rows[0]?.n) || 0,
      result: auction.rows[0]?.clearing_price == null
        ? null
        : { clearingPrice: Number(auction.rows[0].clearing_price) },
    });
  } catch (e) {
    console.error("zeitgeist/auction GET error:", e);
    return NextResponse.json({ ...shell, source: "demo", nominations: [], sealedCount: 0, result: null });
  }
}

export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "zg-auction-write", 20, 60_000);
  if (isAuthResponse(auth)) return auth;

  const now = Date.now();
  const w = windowForNow(now);
  const phase = phaseAt(w, now);

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const action = String(body.action ?? "");

    // Phase gating for the three ACTIVE actions, derived from the clock rather
    // than trusted from the client.
    //
    // `clear` is deliberately NOT gated this way. Clearing is a fact about one
    // auction — its window has closed and it has not settled — not a fact about
    // where the current leg happens to be. Gating it on the live clock would
    // mean an auction that nobody cleared during its own settlement tail could
    // never be cleared at all, stranding every bidder's deposit permanently.
    // So `clear` is gated on the stored row, further down.
    const ACTIVE_PHASE: Record<string, string> = {
      nominate: "nomination",
      commit: "commit",
      reveal: "reveal",
    };
    if (action !== "clear" && !(action in ACTIVE_PHASE)) {
      return NextResponse.json({ success: false, error: "unknown action" }, { status: 400 });
    }
    if (action !== "clear" && phase !== ACTIVE_PHASE[action]) {
      return NextResponse.json(
        { success: false, error: `${action} is only open in the ${ACTIVE_PHASE[action]} phase`, phase },
        { status: 409 },
      );
    }

    // The maths runs regardless of persistence, so the room is inspectable.
    if (action === "commit") {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ success: false, error: "positive amount required" }, { status: 400 });
      }
      const salt = String(body.salt ?? "");
      const trendKey = String(body.trendKey ?? "");
      if (!salt || !trendKey) {
        return NextResponse.json({ success: false, error: "trendKey and salt required" }, { status: 400 });
      }
      const commitment = commitmentHash(auth.owner, trendKey, amount, salt);
      // Rounded the ledger's way, so the number stored, the number debited and the
      // number refunded at clear are one number.
      const deposit = depositFor(amount);

      if (!hasDatabaseUrl()) {
        return NextResponse.json({ success: true, source: "demo", commitment, deposit });
      }
      // The deposit is CHARGED here, in the same transaction that seals the bid.
      // It used to be recorded and never debited, which left the forfeit-on-no-reveal
      // rule with nothing to forfeit. See lib/slot-auction-store.ts.
      const committed = await commitSealedBid(getDbPool(), {
        vintage: vintageAt(now) + 1,
        bidder: auth.owner,
        trendKey,
        commitment,
        deposit,
      });
      if (committed === "no-auction") {
        return NextResponse.json({ success: false, error: "no auction open" }, { status: 404 });
      }
      if (committed === "bad-deposit") {
        return NextResponse.json({ success: false, error: "bid is too small to carry a deposit" }, { status: 400 });
      }
      if (committed === "insufficient-balance") {
        // 402, not 400: the request was well-formed — the wallet cannot cover the deposit.
        return NextResponse.json(
          { success: false, error: "insufficient $MADx balance for the sealed-bid deposit", depositDue: deposit },
          { status: 402 },
        );
      }
      return NextResponse.json({ success: true, source: "live", commitment, deposit, charged: committed.charged });
    }

    if (action === "nominate") {
      const trendKey = String(body.trendKey ?? "");
      const trendName = String(body.trendName ?? "");
      if (!trendKey || !trendName) {
        return NextResponse.json({ success: false, error: "trendKey and trendName required" }, { status: 400 });
      }
      const weight = calculateEigenTrustScore(body.engagements ?? []);
      const nomination: Nomination = {
        trendKey,
        trendName,
        nominator: auth.owner,
        engagements: body.engagements,
        corpus: body.corpus,
      };

      if (!hasDatabaseUrl()) {
        return NextResponse.json({ success: true, source: "demo", pooled: poolNominations([nomination]) });
      }
      const pool = getDbPool();
      const auction = await pool.query(`SELECT id FROM slot_auctions WHERE vintage = $1`, [vintageAt(now) + 1]);
      const auctionId = auction.rows[0]?.id;
      if (!auctionId) {
        return NextResponse.json({ success: false, error: "no auction open" }, { status: 404 });
      }
      await pool.query(
        `INSERT INTO slot_nominations (auction_id, trend_key, trend_name, nominator, trust_weight, corpus)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (auction_id, trend_key, nominator) DO UPDATE SET
           trust_weight = EXCLUDED.trust_weight, corpus = EXCLUDED.corpus`,
        [auctionId, trendKey, trendName, auth.owner, weight, JSON.stringify(body.corpus ?? [])],
      );
      return NextResponse.json({ success: true, source: "live", trendKey, weight });
    }

    if (action === "reveal") {
      const amount = Number(body.amount);
      const salt = String(body.salt ?? "");
      const trendKey = String(body.trendKey ?? "");
      if (!Number.isFinite(amount) || !salt || !trendKey) {
        return NextResponse.json({ success: false, error: "amount, salt and trendKey required" }, { status: 400 });
      }
      const commitment = commitmentHash(auth.owner, trendKey, amount, salt);

      if (!hasDatabaseUrl()) {
        return NextResponse.json({ success: true, source: "demo", commitment, matched: true });
      }
      const pool = getDbPool();
      const auction = await pool.query(`SELECT id FROM slot_auctions WHERE vintage = $1`, [vintageAt(now) + 1]);
      const auctionId = auction.rows[0]?.id;
      if (!auctionId) {
        return NextResponse.json({ success: false, error: "no auction open" }, { status: 404 });
      }
      // Matching on the recomputed commitment IS the verification — a reveal
      // that does not hash to a sealed bid updates nothing.
      const res = await pool.query(
        `UPDATE slot_bids
            SET revealed_amount = $3, revealed_salt = $4, revealed_at = now(), status = 'revealed'
          WHERE auction_id = $1 AND commitment = $2 AND status = 'sealed'
          RETURNING id`,
        [auctionId, commitment, amount, salt],
      );
      return NextResponse.json({ success: true, source: "live", matched: (res.rowCount ?? 0) > 0 });
    }

    // action === "clear"
    if (!hasDatabaseUrl()) {
      return NextResponse.json({ success: false, error: "clearing needs DATABASE_URL" }, { status: 503 });
    }
    const vintage = vintageAt(now) + 1;

    // One transaction: lock the auction, decide it, and pay every refund — or
    // none of it. This used to be four separate pool.query calls, so a crash
    // between them could settle some bidders and not others.
    //
    // The gate is the auction's OWN closing time, read from its row inside the
    // transaction — not the live clock. That is what lets a late clear succeed
    // instead of leaving deposits locked behind a missed deadline.
    const cleared = await clearAndSettle(getDbPool(), vintage, now);
    if ("refused" in cleared) {
      if (cleared.refused === "no-auction") {
        return NextResponse.json({ success: false, error: "no auction open" }, { status: 404 });
      }
      if (cleared.refused === "already-cleared") {
        return NextResponse.json({ success: false, error: "already cleared" }, { status: 409 });
      }
      return NextResponse.json(
        {
          success: false,
          error: "auction is still open — clearing begins when reveal closes",
          closesAt: cleared.closesAt,
          phase,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      source: "live",
      vintage,
      result: cleared.result,
      settlement: cleared.settlement,
    });
  } catch (e) {
    console.error("zeitgeist/auction POST error:", e);
    return NextResponse.json({ success: false, error: "auction action failed" }, { status: 500 });
  }
}
