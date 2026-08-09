/**
 * MAD Gambit — MENTAL MODEL CATALOG (Perpetual Epiphanies §3)
 * ------------------------------------------------------------------
 * Continuous conviction on mental models, adages, laws of life, urban legends
 * and wives' tales. No fixed expiry; positions roll on the CULTURAL PERSISTENCE
 * of the model rather than on any event resolving.
 *
 * Distinct from Gossip-Cop (tabloid/hearsay) and from FIVE FACES (persona): the
 * subject here is an abstract pattern, which is why this family has effectively
 * no defamation surface — you cannot libel Murphy's Law.
 *
 * Cross-cultural coverage is a product requirement, not decoration: the sheet
 * targets >= 30% of Epiphany volume from non-Western models, so the catalog is
 * built with region as a first-class field rather than an afterthought.
 */

export type ModelRegion = "west" | "east" | "mena" | "europe" | "global";

export interface MentalModel {
  id: string;
  name: string;
  /** The model in one line, as it would render on a market card. */
  statement: string;
  region: ModelRegion;
  /** Native-script or transliterated original, where one exists. */
  original?: string;
  /**
   * α — conviction accrual rate for C(t) = C_max·(1 − e^(−αt)).
   * Models with heavy everyday usage accrue faster.
   */
  alpha: number;
  /**
   * Cultural persistence prior in [0, 1] — how entrenched the model already is.
   * Seeds the starting conviction; the market discovers the rest.
   */
  persistencePrior: number;
  /** Surfaces this model is a natural fit for. */
  domains: readonly string[];
}

export const MENTAL_MODELS: readonly MentalModel[] = [
  // ── 3.1 Core Western models ─────────────────────────────────────────
  {
    id: "murphys_law",
    name: "Murphy's Law",
    statement: "If anything can go wrong, it will.",
    region: "west",
    alpha: 0.075,
    persistencePrior: 0.93,
    domains: ["software delivery", "infrastructure", "operations"],
  },
  {
    id: "peter_principle",
    name: "Peter Principle",
    statement: "People rise to their level of incompetence.",
    region: "west",
    alpha: 0.06,
    persistencePrior: 0.85,
    domains: ["management hierarchies", "promotion", "org design"],
  },
  {
    id: "johnsons_law",
    name: "Johnson's Law",
    statement: "Murphy's Law is understated.",
    region: "west",
    alpha: 0.04,
    persistencePrior: 0.55,
    domains: ["operations", "risk"],
  },
  {
    id: "finagles_law",
    name: "Finagle's Law",
    statement: "Anything that can go wrong will — at the worst possible moment.",
    region: "west",
    alpha: 0.05,
    persistencePrior: 0.68,
    domains: ["incident response", "launches", "live events"],
  },
  {
    id: "hofstadters_law",
    name: "Hofstadter's Law",
    statement:
      "It always takes longer than you expect, even when you take Hofstadter's Law into account.",
    region: "west",
    alpha: 0.065,
    persistencePrior: 0.8,
    domains: ["public infrastructure", "software estimates", "megaprojects"],
  },
  {
    id: "littlewoods_law",
    name: "Littlewood's Law",
    statement: "A person can expect a one-in-a-million miracle about once a month.",
    region: "west",
    alpha: 0.045,
    persistencePrior: 0.6,
    domains: ["social media virality", "coincidence", "statistics"],
  },
  {
    id: "urban_legend",
    name: "Urban Legends & Wives' Tales",
    statement:
      "Cautionary folklore that survives retelling regardless of whether it was ever true.",
    region: "global",
    alpha: 0.055,
    persistencePrior: 0.72,
    domains: ["medical folklore", "cautionary tales", "misinformation"],
  },

  // ── 3.2 Cross-cultural additions ────────────────────────────────────
  {
    id: "sai_weng_shi_ma",
    name: "Sai Weng Shi Ma",
    statement: "Misfortune may turn out to be a blessing in disguise.",
    original: "塞翁失马",
    region: "east",
    alpha: 0.07,
    persistencePrior: 0.9,
    domains: ["reversal narratives", "founder setbacks", "geopolitics"],
  },
  {
    id: "nana_korobi_ya_oki",
    name: "Nana korobi ya oki",
    statement: "Fall seven times, stand up eight.",
    original: "七転び八起き",
    region: "east",
    alpha: 0.068,
    persistencePrior: 0.88,
    domains: ["resilience", "founder failure-recovery", "sport"],
  },
  {
    id: "no_smoke_without_fire",
    name: "No smoke without fire",
    statement: "Where there is rumour, there is usually something behind it.",
    region: "mena",
    alpha: 0.062,
    persistencePrior: 0.82,
    domains: ["claim verification", "rumour cycles", "reputation"],
  },
  {
    id: "lucky_man_and_the_sea",
    name: "Throw a lucky man in the sea",
    statement: "Throw a lucky man in the sea and he will come up with a fish in his mouth.",
    region: "mena",
    alpha: 0.042,
    persistencePrior: 0.58,
    domains: ["luck", "survivorship", "fortune"],
  },
  {
    id: "was_schiefgehen_kann",
    name: "Was schiefgehen kann, geht schief",
    statement: "What can go wrong, goes wrong — the German reading of Murphy.",
    region: "europe",
    alpha: 0.05,
    persistencePrior: 0.7,
    domains: ["engineering", "process", "manufacturing"],
  },
  {
    id: "in_der_not_frisst_der_teufel_fliegen",
    name: "In der Not frisst der Teufel Fliegen",
    statement: "In desperation, the devil eats flies — need lowers every standard.",
    region: "europe",
    alpha: 0.038,
    persistencePrior: 0.52,
    domains: ["scarcity", "compromise", "negotiation"],
  },
  {
    id: "mieux_vaut_prevenir",
    name: "Mieux vaut prévenir que guérir",
    statement: "Better to prevent than to cure.",
    region: "europe",
    alpha: 0.048,
    persistencePrior: 0.76,
    domains: ["risk management", "public health", "maintenance"],
  },
] as const;

/** Lookup by id. */
export function getModel(id: string): MentalModel | null {
  return MENTAL_MODELS.find((m) => m.id === id) ?? null;
}

/** Filter by region — backs the East / West / MENA UI filter. */
export function modelsByRegion(region: ModelRegion): MentalModel[] {
  return MENTAL_MODELS.filter((m) => m.region === region);
}

/** Free-text search across name, statement, original script and domains. */
export function searchModels(query: string): MentalModel[] {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [...MENTAL_MODELS];
  return MENTAL_MODELS.filter((m) =>
    [m.name, m.statement, m.original ?? "", ...m.domains].some((f) =>
      f.toLowerCase().includes(q),
    ),
  );
}

/**
 * Share of the catalog that is non-Western — the sheet targets >= 30% of
 * Epiphany volume from cross-cultural models, and a catalog that cannot supply
 * them makes that target unreachable regardless of demand.
 */
export function crossCulturalShare(): number {
  const nonWest = MENTAL_MODELS.filter((m) => m.region !== "west").length;
  return nonWest / MENTAL_MODELS.length;
}
