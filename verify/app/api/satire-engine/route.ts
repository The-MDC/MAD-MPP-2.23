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
 *   4. ROAST    — Gemini, MAD Magazine × South Park at the canonical +15% edge
 *                 (EDGE_THRESHOLD in lib/satire-headline.ts), parsed through
 *                 safeParseJSON with one stiffened retry.
 *   5. FALLBACK — no GOOGLE_API_KEY, or the model fails twice: serve the
 *                 deterministic satirizeHeadline() rewrite. The route returns
 *                 200 with `engine: "deterministic"` instead of 500ing.
 *
 * Brand safety: satire lands on the situation, never slurs or real-person
 * defamation. Every output — LLM or deterministic — is re-scored by
 * satireMetrics() and carries its own brandSafe flag for the caller to gate on.
 */
import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { FEED_SOURCES, fetchFeed, type FeedItem } from "@/lib/rss-feeds";
import { satireMetrics } from "@/lib/satire-metrics";
import { satirizeHeadline, type NewsCategory } from "@/lib/satire-headline";
import { ingestArticle } from "@/lib/article-ingest";
import { parseWithRetry } from "@/lib/safe-json";

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

    // Stage 5 — degrade gracefully instead of 500ing when unkeyed.
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        ...baseResponse,
        ...deterministicTake(winner.title, category),
        engine: "deterministic",
        note: "GOOGLE_API_KEY not configured — served the deterministic satire engine.",
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
    const metrics = satireMetrics(winner.title, { corroboration: winner.trust_score / 10 });

    return NextResponse.json({
      ...baseResponse,
      satire_take: take.satire_take.trim(),
      scandal_velocity: clamp100(take.scandal_velocity),
      z_liar_index: clamp100(take.z_liar_index),
      brand_safe: metrics.brandSafe,
      satire_score: metrics.satireScore,
      verdict: metrics.verdict,
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
  const metrics = satireMetrics(headline);
  return {
    satire_take: satirizeHeadline(headline, category),
    scandal_velocity: clamp100(metrics.satireScore),
    z_liar_index: clamp100(metrics.zLiarScore),
    brand_safe: metrics.brandSafe,
    satire_score: metrics.satireScore,
    verdict: metrics.verdict,
  };
}
