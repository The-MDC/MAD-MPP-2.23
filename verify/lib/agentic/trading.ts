/**
 * Agentic trading — intents, the gauntlet every intent runs, and the (stubbed) executor.
 *
 * An INTENT is what an agent wants to do: buy a side of a market for an amount, with a rationale. It is only ever
 * created by an onboard agent and is SIGNED by the onboard executor (HMAC, AGENT_SIGNING_SECRET), so an outside bot
 * using a stolen session cannot fabricate one. `evaluateIntent` runs every check in order and returns all reasons.
 *
 * WIRING CHECKLIST for `executeIntent` (do these, in this order, when the subscription goes live):
 *   1. Persist the intent (sql/0021 agent_intents) with status "approved" (Co-pilot: after the user's tap; Autopilot:
 *      straight from evaluation) inside the same transaction as the fill.
 *   2. Re-run `evaluateIntent` inside that transaction against fresh daily spend (the evaluation here is advisory).
 *   3. Call the existing book: `ensureBook` + `fill` from lib/market-book.ts — the same path /api/v1/markets/[id]/swap
 *      uses, so pricing, balance checks and the pause guardian apply unchanged.
 *   4. Record the outcome on the intent row and write an events_stream event (agent_trade) for the CDP and reports.
 *   5. Notify the user (their assistant feed) with the rationale and the fill. Keep the instant revoke one tap away.
 * Until then it returns { status: "not-enabled" } and moves nothing.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isOnboardAgent, ONBOARD_AGENTS, type AgentId } from "@/lib/agentic/onboard";
import { TIERS, tierAllows, type TierId } from "@/lib/agentic/tiers";
import { mandateActive, type Mandate } from "@/lib/agentic/mandate";
import { checkTrade } from "@/lib/trade-guard";
import type { Level } from "@/lib/agent-defense";

export interface TradeIntent {
  agentId: AgentId;
  wallet: string;
  marketId: string;
  marketKind: "binary" | "perp";
  category: string;
  side: string;
  amount: number;
  rationale: string;
  nonce: string;
  createdAt: number;
}

export type IntentDecision = { allowed: true; mode: "propose" | "auto" } | { allowed: false; reasons: string[] };

export const tradingEnabled = (env: Record<string, string | undefined> = process.env): boolean => env.AGENTIC_TRADING_ENABLED === "1";

function signingSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.AGENT_SIGNING_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

const canonical = (i: TradeIntent) => JSON.stringify([i.agentId, i.wallet.toLowerCase(), i.marketId, i.marketKind, i.category, i.side, i.amount, i.nonce, i.createdAt]);

export function newIntent(p: Omit<TradeIntent, "nonce" | "createdAt">, now = Date.now()): TradeIntent {
  return { ...p, rationale: p.rationale.slice(0, 400), nonce: randomBytes(12).toString("hex"), createdAt: now };
}

/** Only the onboard executor holds the secret, so only it can sign. Null when not configured (nothing can be signed). */
export function signIntent(i: TradeIntent, env?: Record<string, string | undefined>): string | null {
  const s = signingSecret(env);
  if (!s || !isOnboardAgent(i.agentId)) return null;
  return createHmac("sha256", s).update(canonical(i)).digest("base64url");
}

export function verifyIntent(i: TradeIntent, sig: string | null | undefined, env?: Record<string, string | undefined>, now = Date.now()): boolean {
  const s = signingSecret(env);
  if (!s || !sig || !isOnboardAgent(i.agentId)) return false;
  if (now - i.createdAt > 5 * 60_000 || i.createdAt - now > 30_000) return false; // intents are short-lived
  const want = Buffer.from(createHmac("sha256", s).update(canonical(i)).digest("base64url"));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Every check, in order. Returns all failing reasons so the user sees exactly why. */
export function evaluateIntent(i: TradeIntent, ctx: {
  sig: string | null;
  tier: TierId;
  mandate: Mandate | null;
  spentToday: number;
  tradesToday: number;
  openPositions: number;
  agentLevel: Level;
  paused: boolean;
  env?: Record<string, string | undefined>;
  now?: number;
  /** Tests pass false to skip the shared in-memory trade guard. */
  useTradeGuard?: boolean;
}): IntentDecision {
  const now = ctx.now ?? Date.now();
  const reasons: string[] = [];
  const tier = TIERS[ctx.tier];
  if (!tradingEnabled(ctx.env)) reasons.push("agentic trading is not enabled on this platform yet");
  if (!isOnboardAgent(i.agentId) || !ONBOARD_AGENTS[i.agentId].capabilities.includes("propose-trades")) reasons.push("only an onboard trading agent may trade");
  if (!verifyIntent(i, ctx.sig, ctx.env, now)) reasons.push("intent is not signed by the onboard executor (or has expired)");
  if (!tierAllows(ctx.tier, "propose-trades")) reasons.push(`the ${tier.name} tier does not include trading`);
  if (ctx.agentLevel !== "normal") reasons.push("agent defense is active");
  if (ctx.paused) reasons.push("trading is paused platform-wide");
  if (!mandateActive(ctx.mandate, now)) reasons.push("no active mandate (set limits, or renew an expired one)");
  else {
    const m = ctx.mandate;
    if (!(i.amount > 0) || i.amount > Math.min(m.maxOrder, tier.caps.maxOrder)) reasons.push("order is above your per-order limit");
    if (ctx.spentToday + i.amount > Math.min(m.dailyBudget, tier.caps.dailyBudget)) reasons.push("order would exceed your daily budget");
    if (!m.marketKinds.includes(i.marketKind) || !(tier.marketKinds as readonly string[]).includes(i.marketKind)) reasons.push(`${i.marketKind} markets are not in your mandate`);
    if (m.categories.length && !m.categories.includes(i.category.toLowerCase())) reasons.push(`the ${i.category} category is not in your mandate`);
  }
  if (ctx.tradesToday >= tier.caps.tradesPerDay) reasons.push("daily trade count reached");
  if (ctx.openPositions >= tier.caps.maxOpenPositions) reasons.push("open-position limit reached");
  if (reasons.length === 0 && ctx.useTradeGuard !== false) {
    const v = checkTrade(i.wallet, i.marketId, i.side, i.amount, now);
    if (!v.ok) reasons.push(`trade guard: ${v.reason}`);
  }
  if (reasons.length) return { allowed: false, reasons };
  return { allowed: true, mode: tier.autoExecute && tierAllows(ctx.tier, "execute-trades") ? "auto" : "propose" };
}

/** STUB. See the wiring checklist at the top of this file. Never moves funds until it is implemented and enabled. */
export async function executeIntent(intent: TradeIntent, sig: string): Promise<{ status: "not-enabled" }> {
  void intent; void sig; // wired later: see the checklist above
  return { status: "not-enabled" };
}
