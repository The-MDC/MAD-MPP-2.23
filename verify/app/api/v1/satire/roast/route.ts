/**
 * MAD Gambit — POST /api/v1/satire/roast
 * ------------------------------------------------------------------
 * Headline in, one-liner out. The reusable form of the roast engine: the
 * existing `/api/satire-engine` route picks its own winner from RSS, which is
 * useless when you already have the headline — the perp family book, the news
 * carousel and the market-proposal path all do.
 *
 * TIER ORDER — local model, then the deterministic writer.
 *   1. OLLAMA      a model on the operator's own machine (lib/local-satire.ts)
 *   2. DETERMINISTIC  satirizeHeadline(), always available, never fails
 *
 * GEMINI IS DELIBERATELY ABSENT HERE. This endpoint is PUBLIC-ROUTE, and a
 * public endpoint that can reach a metered API is a public endpoint that can
 * spend money on command. Ollama is free and local; `satirizeHeadline` is
 * pure. Neither can run up a bill, so neither needs an account behind it. The
 * hosted tier stays on `/api/satire-engine`, which does not take a body.
 *
 * PUBLIC-ROUTE: no auth by design — content generation with no account state.
 * Rate-limited hard because a model call, even a free one, is a compute cost.
 */
import { NextResponse } from "next/server";
import { withRouteGuard } from "@/lib/with-route-guard";
import { satirizeHeadline, type NewsCategory } from "@/lib/satire-headline";
import { satireMetrics } from "@/lib/satire-metrics";
import { fitRoast, localSatireConfig } from "@/lib/local-satire";
import { modelRoast } from "@/lib/nim-satire";

export const dynamic = "force-dynamic";

const CATEGORIES: NewsCategory[] = [
  "headlines", "entertainment", "sports", "viraltech", "crypto", "tabloid",
];

function isCategory(v: unknown): v is NewsCategory {
  return typeof v === "string" && CATEGORIES.indexOf(v as NewsCategory) !== -1;
}

const clamp100 = (n: number) => Math.min(100, Math.max(1, Number(n) || 1));

/** Score a line and attach the corrected safety fields. */
function scored(headline: string, take: string) {
  const source = satireMetrics(headline);
  const output = satireMetrics(take);
  return {
    satire_take: take,
    // `brand_safe` is the assertion-risk gate, NOT the juiciness bar that used
    // to wear this name. See lib/satire-metrics.ts.
    brand_safe: source.lowAssertionRisk && output.lowAssertionRisk,
    assertion_risk_source: source.assertionRisk,
    assertion_risk_output: output.assertionRisk,
    needs_human_review: !output.lowAssertionRisk,
    entertainment_grade_output: output.entertainmentGrade,
    satire_score: output.satireScore,
    z_liar_index: clamp100(output.zLiarScore),
    scandal_velocity: clamp100(output.satireScore),
    verdict: output.verdict,
  };
}

export const POST = withRouteGuard(
  { mode: "public", bucket: "satire-roast", limit: 20, windowMs: 60_000 },
  async (req: Request): Promise<Response> => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "invalid JSON body" }, { status: 400 });
    }
    const o = (body ?? {}) as Record<string, unknown>;
    const headline = typeof o.headline === "string" ? o.headline.replace(/\s+/g, " ").trim() : "";
    if (!headline) {
      return NextResponse.json({ success: false, error: "headline required" }, { status: 400 });
    }
    if (headline.length > 400) {
      return NextResponse.json({ success: false, error: "headline too long" }, { status: 400 });
    }
    const category: NewsCategory = isCategory(o.category) ? o.category : "headlines";
    const article = typeof o.article === "string" ? o.article : "";

    // Probe before calling. An unconfigured or unreachable Ollama would
    // otherwise cost every request the full generation timeout before it could
    // fall through; the probe caps that at ~1.5s.
    const cfg = localSatireConfig();
    const tier = await modelRoast(headline, category, article);
    if (tier) {
      const roast = tier.result;
      if (roast.ok) {
        const take = fitRoast(roast.value.satire_take);
        if (take) {
          const s = scored(headline, take);
          return NextResponse.json({
            success: true,
            headline,
            category,
            ...s,
            // The model's own read, kept alongside the engine's scoring rather
            // than replacing it — the engine's numbers are reproducible.
            model_scandal_velocity: clamp100(roast.value.scandal_velocity),
            model_z_liar_index: clamp100(roast.value.z_liar_index),
            engine: tier.engine,
            model: tier.model,
          });
        }
      }
      console.warn("satire/roast: local model unusable, falling back —", roast.ok ? "empty take" : roast.error);
    }

    const take = satirizeHeadline(headline, category);
    return NextResponse.json({
      success: true,
      headline,
      category,
      ...scored(headline, take),
      engine: "deterministic",
      note: cfg.configured
        ? "Local model unreachable or unusable — served the deterministic writer."
        : "OLLAMA_BASE_URL / OLLAMA_MODEL not configured — served the deterministic writer.",
    });
  },
);
