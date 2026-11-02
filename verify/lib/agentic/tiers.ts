/**
 * Agent subscription tiers. Prices are deliberately absent: pricing is a product decision, and nothing here bills.
 * The caps are hard ceilings a user's own mandate can only tighten, never loosen.
 */
import type { AgentCapability } from "@/lib/agentic/onboard";

export type TierId = "free" | "analyst" | "copilot" | "autopilot";

export interface Tier {
  id: TierId;
  name: string;
  pitch: string;
  capabilities: readonly AgentCapability[];
  /** Automated execution without a per-trade tap. Only Autopilot, and only once the platform switch is on. */
  autoExecute: boolean;
  caps: { maxOrder: number; dailyBudget: number; maxOpenPositions: number; tradesPerDay: number };
  marketKinds: readonly ("binary" | "perp")[];
}

export const TIERS: Readonly<Record<TierId, Readonly<Tier>>> = Object.freeze({
  free: { id: "free", name: "Free", pitch: "Chat with your agent and get market explainers.", capabilities: ["chat"], autoExecute: false, caps: { maxOrder: 0, dailyBudget: 0, maxOpenPositions: 0, tradesPerDay: 0 }, marketKinds: [] },
  analyst: { id: "analyst", name: "Analyst", pitch: "Watchlists, alerts and market ideas from your agent.", capabilities: ["chat", "alerts", "suggest-markets"], autoExecute: false, caps: { maxOrder: 0, dailyBudget: 0, maxOpenPositions: 0, tradesPerDay: 0 }, marketKinds: [] },
  copilot: { id: "copilot", name: "Co-pilot", pitch: "Your agent proposes trades inside your limits; you approve each one with a tap.", capabilities: ["chat", "alerts", "suggest-markets", "propose-trades"], autoExecute: false, caps: { maxOrder: 250, dailyBudget: 1_000, maxOpenPositions: 10, tradesPerDay: 20 }, marketKinds: ["binary"] },
  autopilot: { id: "autopilot", name: "Autopilot", pitch: "Your agent trades for you inside a strict mandate, with a full log and an instant off switch.", capabilities: ["chat", "alerts", "suggest-markets", "propose-trades", "execute-trades"], autoExecute: true, caps: { maxOrder: 1_000, dailyBudget: 5_000, maxOpenPositions: 25, tradesPerDay: 60 }, marketKinds: ["binary", "perp"] },
} as Record<TierId, Tier>);

export const TIER_ORDER: readonly TierId[] = ["free", "analyst", "copilot", "autopilot"];
export const isTierId = (v: unknown): v is TierId => typeof v === "string" && (TIER_ORDER as readonly string[]).includes(v);
export const tierAllows = (t: TierId, cap: AgentCapability): boolean => TIERS[t].capabilities.includes(cap);
