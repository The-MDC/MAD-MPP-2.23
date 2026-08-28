/**
 * MAD Gambit — GET /api/v1/paseome/frontier
 * ------------------------------------------------------------------
 * The live frontier for a Paseome tree: the sibling set hanging off the
 * current node, priced so the branch probabilities sum to exactly 1.
 *
 * Perp families 7 (FORESIGHT) and 8 (HINDSIGHT). See docs/product-sheets/PASEOME.md.
 *
 * WHY ONLY THE FRONTIER. Maintaining correct LMSR prices across a whole
 * combinatorial outcome space is intractable, so this never attempts it — it
 * prices the sibling set at the live node and nothing else, O(n) per node.
 * Depth is a property of the recorded path, never of the pricing problem.
 *
 * DEMO DATA, REAL MATH — the same posture as /api/v1/faces. Until the tree
 * store lands, the branch set is seeded deterministically, but every price
 * comes from the real `frontierPrices` and every invariant is enforced.
 *
 * PUBLIC-ROUTE: read-only pricing, no account state, no DB. Rate-limited
 * because open still needs a cost ceiling.
 */
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  FRONTIER_MIN, FRONTIER_MAX, FrontierError,
  frontierPrices, frontierSum, pathPrice,
  knifeEdgeDistance, rankByKnifeEdge,
  hasIrrealisMood, benignityAtDepth, mciScore, memeMultiplier,
  settleFrontier,
  type Branch, type PaseomeSide,
} from "@/lib/paseome";
import { currentLeg, legCountdown, LEG_DAYS, LEGS_PER_TURNING } from "@/lib/lunar-legs";

export const dynamic = "force-dynamic";

/** Deterministic stand-in branch sets. Real math, seeded data. */
const DEMO_TREES: Record<PaseomeSide, { root: string; branches: Branch[] }> = {
  foresight: {
    root: "The merger vote lands this leg",
    branches: [
      { id: "f1", claim: "What if the vote is postponed and the paperwork resigns in protest?", shares: 4_200 },
      { id: "f2", claim: "What if it passes and nobody notices for a month?", shares: 3_100 },
      { id: "f3", claim: "What if it fails and the building keeps holding meetings anyway?", shares: 2_400 },
      { id: "f4", claim: "What if the vote happens twice and both results stand?", shares: 900 },
    ],
  },
  hindsight: {
    root: "If the deal had collapsed in the first leg",
    branches: [
      { id: "h1", claim: "What if the committee had simply never been formed?", shares: 5_600 },
      { id: "h2", claim: "What if the memo had leaked one day earlier?", shares: 3_300 },
      { id: "h3", claim: "What if the quarterly review had achieved sentience and adjourned itself?", shares: 1_800 },
    ],
  },
};

function isSide(v: string | null): v is PaseomeSide {
  return v === "foresight" || v === "hindsight";
}

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "paseome-frontier", 60, 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const sideParam = url.searchParams.get("side");
  const side: PaseomeSide = isSide(sideParam) ? sideParam : "foresight";
  const depth = Math.max(0, Math.min(64, Number(url.searchParams.get("depth")) || 1));
  const now = Date.now();

  const tree = DEMO_TREES[side];

  let priced;
  try {
    priced = frontierPrices(tree.branches);
  } catch (e) {
    // A frontier outside 3..5 is a founder-bound violation, not a 500.
    if (e instanceof FrontierError) {
      return NextResponse.json({ success: false, error: e.message }, { status: 422 });
    }
    throw e;
  }

  const leg = currentLeg(now);
  const ranked = rankByKnifeEdge(priced);

  return NextResponse.json({
    success: true,
    source: "demo",
    side,
    root: tree.root,
    // The instrument's structural line — what kind of thing this is.
    structure: {
      legDays: Number(LEG_DAYS.toFixed(6)),
      legsPerTurning: LEGS_PER_TURNING,
      legSlot: `${leg.slotInTurning + 1} / ${LEGS_PER_TURNING}`,
      rollsIn: legCountdown(leg.closesAt, now),
      isTurningLeg: leg.isTurningLeg,
      settles: side === "foresight" ? "optimistic oracle at the leg boundary" : "never — prices belief persistence",
      untakenBranches: side === "foresight" ? "refunded" : "carried",
    },
    frontier: {
      width: priced.length,
      min: FRONTIER_MIN,
      max: FRONTIER_MAX,
      // Reported, not asserted — a client can check the invariant itself.
      sum: frontierSum(priced),
      branches: priced.map((b) => {
        const mci = mciScore(b.claim);
        return {
          id: b.id,
          claim: b.claim,
          price: b.price,
          shares: b.shares,
          knifeEdge: knifeEdgeDistance(b.price),
          // Path price for a two-hop path through this branch, as an example
          // of the multiplicative discount depth creates.
          pathPriceAtDepth2: pathPrice([b.price, b.price]),
          mciViolations: mci.violations,
          mciFitness: mci.fitness,
          memeMultiplier: memeMultiplier(b.claim),
          // Hindsight titles MUST carry the counterfactual mood. Reported per
          // branch so a client can refuse to render one that does not.
          irrealis: hasIrrealisMood(b.claim),
          benignity: benignityAtDepth(depth),
        };
      }),
    },
    // The Knife Edge ordering: |p − 0.5| ascending, not volume. This is the
    // ranking the deck sorts by.
    knifeEdgeOrder: ranked.map((b) => b.id),
    // What a roll would do right now, without performing one.
    settlementPreview: settleFrontier(side, priced, ranked[0]?.id ?? null),
  });
}
