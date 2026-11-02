/**
 * A user's mandate: their standing, revocable consent for what their agent may do. Always clamped to the tier's caps;
 * expired or revoked means nothing may be proposed or executed.
 */
import { TIERS, type TierId } from "@/lib/agentic/tiers";

export interface Mandate {
  maxOrder: number;
  dailyBudget: number;
  marketKinds: ("binary" | "perp")[];
  /** Categories the agent may trade; empty = none. */
  categories: string[];
  expiresAt: string; // ISO; mandates always expire (at most 30 days) so consent is renewed, not forgotten
  revoked: boolean;
}

export const MAX_MANDATE_DAYS = 30;

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };

/** Build a safe mandate from user input, clamped to the tier. Unknown fields are ignored. */
export function clampMandate(raw: unknown, tier: TierId, now = Date.now()): Mandate {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const caps = TIERS[tier].caps;
  const kinds = Array.isArray(r.marketKinds) ? r.marketKinds.filter((k): k is "binary" | "perp" => (TIERS[tier].marketKinds as readonly string[]).includes(String(k))) : [];
  const cats = Array.isArray(r.categories) ? r.categories.map((c) => String(c).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24)).filter(Boolean).slice(0, 12) : [];
  const want = Date.parse(String(r.expiresAt ?? ""));
  const latest = now + MAX_MANDATE_DAYS * 86_400_000;
  return {
    maxOrder: Math.min(num(r.maxOrder), caps.maxOrder),
    dailyBudget: Math.min(num(r.dailyBudget), caps.dailyBudget),
    marketKinds: [...new Set(kinds)],
    categories: [...new Set(cats)],
    expiresAt: new Date(Number.isFinite(want) ? Math.min(Math.max(want, now), latest) : latest).toISOString(),
    revoked: r.revoked === true,
  };
}

export const mandateActive = (m: Mandate | null, now = Date.now()): m is Mandate =>
  !!m && !m.revoked && Date.parse(m.expiresAt) > now && m.maxOrder > 0 && m.dailyBudget > 0;
