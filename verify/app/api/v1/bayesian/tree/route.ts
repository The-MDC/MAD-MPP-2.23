import { NextResponse } from "next/server";
import { propagateTree, type TreeNode } from "@/lib/bayesian-conviction";
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
    const value = propagateTree(body.tree as TreeNode);
    return NextResponse.json({ success: true, value });
  } catch (e) {
    console.error("bayesian/tree error:", e);
    return NextResponse.json({ success: false, error: "invalid tree structure" }, { status: 400 });
  }
}
