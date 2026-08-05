import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { listEpiphanyModels } from "@/lib/perp-store";
import {
  MENTAL_MODELS,
  crossCulturalShare,
  modelsByRegion,
  searchModels,
  type ModelRegion,
} from "@/lib/mental-model-catalog";

const REGIONS: readonly ModelRegion[] = ["west", "east", "mena", "europe", "global"];

/**
 * GET /api/v1/epiphany/models?region=&q=&limit= — the mental-model catalog.
 *
 * `crossCulturalShare` is reported alongside the list because it is the number
 * the catalog is accountable to: a "mental models" product that turns out to be
 * fourteen Western aphorisms is a different, worse product, and the share makes
 * that visible instead of arguable.
 *
 * Persistence readings come from the database when there is one — those are live
 * market prices, not catalog metadata, so the static catalog reports its priors
 * and says so via `source`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const regionParam = url.searchParams.get("region");
  const region = REGIONS.includes(regionParam as ModelRegion) ? (regionParam as ModelRegion) : undefined;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  // One wire shape for both paths. The catalog carries `persistencePrior` and
  // the database carries the live `persistence` reading; a client that had to
  // know which field to read would be a client that renders a blank number the
  // first time a market goes live.
  const staticModels = () => {
    let models = q ? searchModels(q) : region ? modelsByRegion(region) : [...MENTAL_MODELS];
    if (q && region) models = models.filter((m) => m.region === region);
    return models.slice(0, limit).map((m) => ({
      id: m.id,
      name: m.name,
      statement: m.statement,
      region: m.region,
      original: m.original ?? null,
      persistence: m.persistencePrior,
      domains: [...m.domains],
    }));
  };

  const catalog = () =>
    NextResponse.json({
      success: true,
      source: "catalog",
      region: region ?? null,
      crossCulturalShare: Number(crossCulturalShare().toFixed(4)),
      models: staticModels(),
    });

  if (!hasDatabaseUrl()) return catalog();

  try {
    const rows = await listEpiphanyModels(getDbPool(), region, limit);
    if (rows.length === 0) return catalog();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            r.statement.toLowerCase().includes(q.toLowerCase()),
        )
      : rows;
    return NextResponse.json({
      success: true,
      source: "live",
      region: region ?? null,
      crossCulturalShare: Number(crossCulturalShare().toFixed(4)),
      models: filtered,
    });
  } catch (e) {
    console.error("epiphany/models error:", e);
    return catalog();
  }
}
