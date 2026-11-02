/**
 * MAD Gambit — Satire/Meme Engine.
 * ------------------------------------------------------------------
 * Turns real news into a one-liner meme headline: hook, line, and sinker.
 *
 * Pipeline (each stage degrades rather than fails):
 *   1. SOURCE   — the canonical FEED_SOURCES list in lib/rss-feeds.ts
 *                 (tabloids · headlines · entertainment · celebrity · sports ·
 *                 crypto · satire · viral). Previously this route carried its
 *                 own hardcoded 3-URL list that drifted from the real one.
 *   2. RANK     — rankBySatire() picks the most meme-able candidate using the
 *                 repo's real Z-Liar + sentiment math, weighted by each
 *                 source's virality_weight. We no longer ask the model to
 *                 "pick the most ridiculous" — that was an unscored coin flip.
 *   3. INGEST   — fetch the winning article as plain .txt + up to 2 images, so
 *                 the roast is written against the actual story rather than ten
 *                 words of headline.
 *   4. ROAST    — MAD Magazine × South Park at the canonical +15% edge
 *                 (EDGE_THRESHOLD in lib/satire-headline.ts), parsed through
 *                 safeParseJSON with one stiffened retry. Three tiers, tried
 *                 in order, each degrading into the next:
 *                   a. OLLAMA — a model on the operator's own machine. Tried
 *                      FIRST when configured: it is free, it is private, and
 *                      the story text never leaves the box. Guarded by a ~1.5s
 *                      reachability probe so a configured-but-down Ollama
 *                      costs a probe rather than a full generation timeout.
 *                   b. GEMINI — the hosted tier, when GOOGLE_API_KEY is set.
 *                   c. DETERMINISTIC — see 5.
 *   5. FALLBACK — no model reachable, or every model fails: serve the
 *                 deterministic satirizeHeadline() rewrite. The route returns
 *                 200 with `engine: "deterministic"` instead of 500ing.
 *
 * BRAND SAFETY — CORRECTED. This route used to report `brand_safe` as
 * `sourceMetrics.brandSafe && outputMetrics.brandSafe` and describe it as
 * failing closed. It did not. `satireMetrics().brandSafe` was
 * `zLiarScore >= 60 && intensity >= 0.3` — and Z-Liar >= 60 is SERIAL
 * EMBELLISHER or TOTAL FABRICATION. The gate therefore PASSED wild
 * fabrications and FAILED measured, credible lines: a juiciness bar wearing a
 * safety bar's name, and the only gate standing over generated output.
 *
 * `brand_safe` now means what it says — `lowAssertionRisk` on both the source
 * and the roast, which fails closed on an empty or unscoreable line. The
 * juiciness bar still exists and is still useful; it is reported separately as
 * `entertainment_grade_*`.
 *
 * Be clear about what the safety gate is and isn't: `assertionRisk` is a
 * lexical tripwire for "does this make a checkable factual claim about a named
 * party". It is NOT a defamation classifier — it cannot tell "absurd
 * exaggeration" from "a false claim of fact about a real person". It is a
 * necessary condition and a review trigger, never a sufficient one. The real
 * control for anything user-facing is human review, the same posture
 * scandal-scraper.ts already takes with requireHumanReviewAbove.
 */
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { FEED_SOURCES, fetchFeed, type FeedItem } from "@/lib/rss-feeds";
import { satireMetrics } from "@/lib/satire-metrics";
import { satirizeHeadline, type NewsCategory } from "@/lib/satire-headline";
import { ingestArticle } from "@/lib/article-ingest";
import { parseWithRetry } from "@/lib/safe-json";
import { localSatireConfig, fitRoast } from "@/lib/local-satire";
import { modelRoast } from "@/lib/nim-satire";

export const dynamic = "force-dynamic";

/** How many ranked candidates to consider before ingesting the winner. */
const CANDIDATE_POOL = 12;

interface SatireTake {
  headline: string;
  satire_take: string;
  scandal_velocity: number;
  z_liar_index: number;
}

function isSatireTake(v: unknown): v is SatireTake {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.headline === "string" &&
    o.headline.trim().length > 0 &&
    typeof o.satire_take === "string" &&
    o.satire_take.trim().length > 0 &&
    Number.isFinite(Number(o.scandal_velocity)) &&
    Number.isFinite(Number(o.z_liar_index))
  );
}

const clamp100 = (n: number) => Math.min(100, Math.max(1, Number(n) || 1));

/** FeedSource.category → the 6 canonical hub categories satirizeHeadline speaks. */
function toNewsCategory(c: FeedItem["category"]): NewsCategory {
  switch (c) {
    case "entertainment":
    case "celebrity":
      return "entertainment";
    case "crypto":
      return "crypto";
    case "tabloid":
      return "tabloid";
    case "viral":
    case "satire":
      return "viraltech";
    case "political":
    case "news":
    case "macro":
    case "thesis":
    default:
      return "headlines";
  }
}

/** Pull the feeds and rank every item by satire-worthiness × source virality. */
async function rankedCandidates(): Promise<Array<{ item: FeedItem; score: number }>> {
  const settled = await Promise.allSettled(FEED_SOURCES.map((s) => fetchFeed(s)));
  const items = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return items
    .filter((i) => i.title && i.title.trim().length > 12)
    .map((item) => {
      const m = satireMetrics(item.title, { corroboration: item.trust_score / 10 });
      // A tabloid's nonsense is worth more to a meme engine than a wire report's
      // accuracy — virality_weight is what encodes that preference.
      return { item, score: m.satireScore * item.virality_weight };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, CANDIDATE_POOL);
}

function buildPrompt(headline: string, source: string, body: string, stiffen: boolean): string {
  const context = body
    ? `\n\nARTICLE TEXT (plain .txt, truncated):\n"""\n${body}\n"""`
    : "\n\n(No article body available — work from the headline alone.)";
  const stricter = stiffen
    ? "\n\nCRITICAL: your last response was not valid JSON. Reply with the raw JSON object ONLY. No markdown fences, no preamble, no trailing commentary. Start your reply with { and end it with }."
    : "";
  return `You are the MAD Gambit Satire Engine.

HEADLINE: ${headline}
SOURCE: ${source}${context}

Write ONE meme headline about this story. Voice: MAD Magazine crossed with South Park, pushed about 15% past MAD toward South Park — sharper, more absurd, a touch controversial. It must be a single line: hook, line, and sinker funny. The goal is to make someone stop scrolling, do a double take, and either laugh out loud or gasp.

Rules:
- ONE line. No setup, no second sentence. Punchline density over completeness.
- Aim the joke at the situation, the absurdity, the institution — never slurs, never a defamatory claim of fact about a real person.
- Absurd escalation and deadpan understatement both work. Explaining the joke does not.

Return a JSON object with exactly this structure:
{
  "headline": "the original headline, verbatim",
  "satire_take": "your one-liner meme headline",
  "scandal_velocity": <number 1.0-100.0, how fast this drama is spreading>,
  "z_liar_index": <number 1.0-100.0, how much BS is in the original headline>
}

Output strictly valid JSON. No markdown wrapping.${stricter}`;
}

export async function GET() {
  try {
    const candidates = await rankedCandidates();
    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No headlines could be fetched from any feed" },
        { status: 503 },
      );
    }

    const winner = candidates[0].item;
    const category = toNewsCategory(winner.category);

    // Stage 3 — article as .txt + images. Top the feed's images up to 2 from
    // the article page when the feed item was thin.
    const article = winner.link ? await ingestArticle(winner.link, { maxImages: 2 }) : null;
    const images = Array.from(
      new Set(((winner.images || []).concat(article?.images ?? [])).filter(Boolean)),
    ).slice(0, 2);

    const baseResponse = {
      success: true,
      headline: winner.title,
      source: winner.source,
      source_id: winner.sourceId,
      category,
      url: winner.link,
      published: winner.published,
      images,
      article_chars: article?.text.length ?? 0,
      alternates: candidates.slice(1, 6).map((c) => ({
        headline: c.item.title,
        source: c.item.source,
        url: c.item.link,
      })),
    };

    // Stage 4a — the local model, first refusal. Free, private, and the
    // ingested article text never leaves the operator's machine.
    const localCfg = localSatireConfig();
    const tier = await modelRoast(winner.title, category, article?.text ?? "");
    if (tier) {
      const local = tier.result;
      if (local.ok) {
        const localTake = fitRoast(local.value.satire_take);
        if (localTake) {
          const corr = winner.trust_score / 10;
          const srcM = satireMetrics(winner.title, { corroboration: corr });
          const outM = satireMetrics(localTake, { corroboration: corr });
          return NextResponse.json({
            ...baseResponse,
            satire_take: localTake,
            scandal_velocity: clamp100(local.value.scandal_velocity),
            z_liar_index: clamp100(local.value.z_liar_index),
            brand_safe: srcM.lowAssertionRisk && outM.lowAssertionRisk,
            brand_safe_source: srcM.lowAssertionRisk,
            brand_safe_output: outM.lowAssertionRisk,
            assertion_risk_source: srcM.assertionRisk,
            assertion_risk_output: outM.assertionRisk,
            needs_human_review: !outM.lowAssertionRisk,
            entertainment_grade_source: srcM.entertainmentGrade,
            entertainment_grade_output: outM.entertainmentGrade,
            satire_score: srcM.satireScore,
            output_satire_score: outM.satireScore,
            verdict: srcM.verdict,
            engine: tier.engine,
            model: tier.model,
            repaired: local.repaired,
          });
        }
      }
      console.warn(
        "satire-engine: local model unusable, trying next tier —",
        local.ok ? "empty take" : local.error,
      );
    }

    // Stage 5 — degrade gracefully instead of 500ing when unkeyed.
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        ...baseResponse,
        ...deterministicTake(winner.title, category),
        engine: "deterministic",
        note: localCfg.configured
          ? "No model reachable (local probe failed, GOOGLE_API_KEY unset) — served the deterministic satire engine."
          : "No model configured — served the deterministic satire engine.",
      });
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      temperature: 0.95,
      maxOutputTokens: 500,
    });

    // Stage 4 — one retry with a stiffened instruction before giving up.
    const parsed = await parseWithRetry<SatireTake>(
      async (attempt) => {
        const result = await llm.invoke([
          new SystemMessage(
            "You are a comedy writer that replies with raw JSON only. Never wrap output in markdown.",
          ),
          new HumanMessage(
            buildPrompt(winner.title, winner.source, article?.text ?? "", attempt > 0),
          ),
        ]);
        return result.content.toString();
      },
      isSatireTake,
      2,
    );

    if (!parsed.ok) {
      console.warn("satire-engine: LLM output unparseable, falling back —", parsed.error);
      return NextResponse.json({
        ...baseResponse,
        ...deterministicTake(winner.title, category),
        engine: "deterministic",
        note: `LLM output unparseable after retry (${parsed.error}) — served deterministic fallback.`,
      });
    }

    const take = parsed.value;
    const satireTake = take.satire_take.trim();
    const corroboration = winner.trust_score / 10;
    // Score BOTH sides — a clean headline can still yield an ugly one-liner,
    // and a gate that reads only the input is measuring the wrong thing.
    const sourceMetrics = satireMetrics(winner.title, { corroboration });
    const outputMetrics = satireMetrics(satireTake, { corroboration });

    return NextResponse.json({
      ...baseResponse,
      satire_take: satireTake,
      scandal_velocity: clamp100(take.scandal_velocity),
      z_liar_index: clamp100(take.z_liar_index),
      brand_safe: sourceMetrics.lowAssertionRisk && outputMetrics.lowAssertionRisk,
      brand_safe_source: sourceMetrics.lowAssertionRisk,
      brand_safe_output: outputMetrics.lowAssertionRisk,
      assertion_risk_source: sourceMetrics.assertionRisk,
      assertion_risk_output: outputMetrics.assertionRisk,
      needs_human_review: !outputMetrics.lowAssertionRisk,
      entertainment_grade_source: sourceMetrics.entertainmentGrade,
      entertainment_grade_output: outputMetrics.entertainmentGrade,
      satire_score: sourceMetrics.satireScore,
      output_satire_score: outputMetrics.satireScore,
      verdict: sourceMetrics.verdict,
      engine: "gemini",
      repaired: parsed.repaired,
    });
  } catch (error) {
    // Last-resort guard: the route should be extremely hard to 500.
    console.error("Satire Engine Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}

/** Deterministic roast + real scoring — the always-available path. */
function deterministicTake(headline: string, category: NewsCategory) {
  const satireTake = satirizeHeadline(headline, category);
  const sourceMetrics = satireMetrics(headline);
  const outputMetrics = satireMetrics(satireTake);
  return {
    satire_take: satireTake,
    scandal_velocity: clamp100(sourceMetrics.satireScore),
    z_liar_index: clamp100(sourceMetrics.zLiarScore),
    brand_safe: sourceMetrics.lowAssertionRisk && outputMetrics.lowAssertionRisk,
    brand_safe_source: sourceMetrics.lowAssertionRisk,
    brand_safe_output: outputMetrics.lowAssertionRisk,
    assertion_risk_source: sourceMetrics.assertionRisk,
    assertion_risk_output: outputMetrics.assertionRisk,
    needs_human_review: !outputMetrics.lowAssertionRisk,
    entertainment_grade_source: sourceMetrics.entertainmentGrade,
    entertainment_grade_output: outputMetrics.entertainmentGrade,
    satire_score: sourceMetrics.satireScore,
    output_satire_score: outputMetrics.satireScore,
    verdict: sourceMetrics.verdict,
  };
}
