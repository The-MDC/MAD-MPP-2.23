import { NextResponse } from "next/server";
import { propagateTree, treeConservationError, type TreeNode } from "@/lib/bayesian-conviction";
import { enforceRateLimit } from "@/lib/rate-limit";

interface TreeBody {
  tree?: unknown;
}

/**
 * POST /api/v1/bayesian/tree — backward-induction value of a decision/probability
 * tree with conviction bonuses (Part T, pure). Depth-bounded (64) and tolerant
 * of malformed nodes. No DB.
 */
// PUBLIC-ROUTE: Decision-tree evaluation — pure maths, no DB, no external call.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "bayesian-tree", 60, 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => null)) as TreeBody | null;
  if (!body || !body.tree || typeof body.tree !== "object") {
    return NextResponse.json({ success: false, error: "`tree` object required" }, { status: 400 });
  }

  try {
    // The tree arrives from the request body, so its edges are not conserved
    // by construction. A node whose children sum to 0.8 or 1.3 does not fail
    // here — it returns a confident number that means nothing. Reject it.
    const violation = treeConservationError(body.tree as TreeNode);
    if (violation) {
      return NextResponse.json(
        { success: false, error: `tree does not conserve probability — ${violation}` },
        { status: 400 },
      );
    }
    const value = propagateTree(body.tree as TreeNode);
    return NextResponse.json({ success: true, value });
  } catch (e) {
    console.error("bayesian/tree error:", e);
    return NextResponse.json({ success: false, error: "invalid tree structure" }, { status: 400 });
  }
}
