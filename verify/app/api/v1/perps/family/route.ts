import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { proposalsForToday, type MarketType, type Signal } from "@/lib/market-classifier";
import { satirizeHeadline } from "@/lib/satire-headline";
import { hasDatabaseUrl } from "@/lib/database-url";
import {
  CLASSIFIER_TYPE,
  SIGNAL_ONLY_NOTE,
  TRADEABLE,
  familyLabel,
  marketFromProposal,
  type PerpFamily6,
} from "@/lib/perp-family-markets";

/**
 * GET /api/v1/perps/family?family=<key>&limit=<n>
 *
 * Every market in one perp family, fed by the scraper and carrying a satirical
 * one-liner per market.
 *
 * ── Why this route exists ─────────────────────────────────────────────
 * The family books shipped in the previous commit with hand-written seeds —
 * subjects and claims I authored. That was wrong twice over: the platform
 * already scrapes real signals, and there is no product sheet for two of the
 * families (only FIVE_FACES, ZEITGEIST and MAD_FORGE exist under docs/), so
 * the Epiphany and Gossip-Cop entries were invention presented as content.
 *
 * The chain that should feed them was already built and simply not connected:
 *
 *   gdelt_signals            ← the GDELT scrape (/api/v1/ingest/gdelt)
 *     → proposalsForToday()  ← the real classifier, which already types every
 *                              signal as zliar | gossipcop | faces | zeitgeist
 *                              | epiphany | perp | progression | saga
 *     → satirizeHeadline()   ← the one-liner engine the News Flow already uses
 *     → engine odds          ← garchUpdate + getLunarPhaseMultiplier
 *
 * Nothing here is new machinery. It is the four existing pieces wired end to
 * end, which is what "connected or fed by the scraper" means.
 *
 * ── Demo data, real maths ─────────────────────────────────────────────
 * Without DATABASE_URL — or when the signals table is empty — this runs the
 * same demo headlines through the SAME classifier, exactly as
 * /api/v1/markets/proposals does. `source` says which happened, so the caller
 * can label it honestly rather than presenting demo output as a live book.
 */

// PUBLIC-ROUTE: a read of classified public signals, same exposure as
// /api/v1/markets/proposals. Rate-limited, because open still needs a ceiling.
export const dynamic = "force-dynamic";

/** Mirrors markets/proposals, so the two surfaces degrade identically. */
const DEMO_HEADLINES = [
  "Breaking: pop star couple's public spat sparks breakup rumors, statement expected soon",
  "Long-running influencer empire braces for multi-year regulatory scrutiny",
  "Exclusive: tech CEO scandal could trigger board shakeup within days",
  "Rumor: reality star feud might escalate into a lawsuit this month",
  "Ongoing cancellation wave engulfs another streamer as drama keeps developing",
  "Analysts revisit the efficiency paradox as consumption climbs with every gain",
  "Succession slate narrows as the named heir consolidates the cultural moment",
];

const FAMILIES = ["scandal", "zliar", "gossip", "epiphany", "faces", "zeitgeist"] as const;

function isFamily(v: string): v is PerpFamily6 {
  return (FAMILIES as readonly string[]).includes(v);
}

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "perps-family", 60, 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const raw = String(url.searchParams.get("family") ?? "");
  if (!isFamily(raw)) {
    return NextResponse.json(
      { success: false, error: `family must be one of: ${FAMILIES.join(", ")}` },
      { status: 400 },
    );
  }
  const family: PerpFamily6 = raw;
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 8));

  // Signal-only families are answered without touching the database. Scandal,
  // Z-Liar and Gossip-Cop have no perp_markets row behind them — market-view.ts
  // is explicit that "The other three are signal-only" — so returning an empty
  // book plus the reason is the correct answer, not a degraded one.
  if (!TRADEABLE.has(family)) {
    return NextResponse.json({
      success: true,
      family,
      label: familyLabel(family),
      tradeable: false,
      source: "n/a",
      markets: [],
      note: SIGNAL_ONLY_NOTE[family] ?? "Signal-only: this family has no perp book.",
    });
  }

  const wanted: MarketType = CLASSIFIER_TYPE[family];
  const nowMs = Date.now();

  const build = (signals: Signal[], source: "live" | "demo") => {
    // Classify a wide pool, then keep this family's share of it. The pool is
    // deliberately larger than `limit`: the classifier assigns a type per
    // signal, so filtering after ranking is what makes a family's list reflect
    // the actual mix of the day rather than the first N rows.
    const proposals = proposalsForToday(signals, 120).filter((p) => p.type === wanted);
    const markets = proposals.slice(0, limit).map((p) => ({
      ...marketFromProposal(p, nowMs),
      // The satirical one-liner, from the same engine the News Flow uses. The
      // real headline travels alongside it — a rewrite shown without the thing
      // it rewrites is the attribution problem the ticker already had.
      oneLiner: satirizeHeadline(p.headline, "headlines"),
      realHeadline: p.headline,
    }));
    return NextResponse.json({
      success: true,
      family,
      label: familyLabel(family),
      tradeable: true,
      source,
      markets,
      note:
        markets.length === 0
          ? "No signal classified into this family in the current scrape window."
          : `${markets.length} market${markets.length === 1 ? "" : "s"} from the latest scrape · readings from GARCH(1,1) · legs paced by lunar phase`,
    });
  };

  const demo = () => build(DEMO_HEADLINES.map((headline) => ({ headline })), "demo");

  if (!hasDatabaseUrl()) return demo();

  try {
    const pool = getDbPool();
    const res = await pool.query(
      `SELECT headline, scandal_velocity::float8 AS sv, perp_probability::float8 AS perp
       FROM gdelt_signals ORDER BY created_at DESC LIMIT 200`,
    );
    const signals: Signal[] = res.rows.map((r) => ({
      headline: String(r.headline ?? ""),
      scandalVelocity: Number(r.sv) || 0,
      perpProbability: Number.isFinite(Number(r.perp)) ? Number(r.perp) : undefined,
    }));
    return signals.length ? build(signals, "live") : demo();
  } catch (e) {
    console.error("perps/family error:", e);
    return demo();
  }
}
