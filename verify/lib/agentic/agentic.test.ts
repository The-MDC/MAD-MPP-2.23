import { beforeEach, describe, expect, it } from "vitest";
import {
  assertOnboardAgent, bringYourOwnAgentFields, clampMandate, evaluateIntent, executeIntent, isOnboardAgent, mandateActive,
  newIntent, ONBOARD_AGENTS, onboardModel, signIntent, TIERS, verifyIntent, type TradeIntent,
} from "@/lib/agentic";
import { resetTradeGuard } from "@/lib/trade-guard";

const ENV = { AGENT_SIGNING_SECRET: "s".repeat(40), AGENTIC_TRADING_ENABLED: "1" };
const NOW = 1_800_000_000_000;

const intent = (over: Partial<TradeIntent> = {}): TradeIntent => ({
  ...newIntent({ agentId: "trader", wallet: "0xAbC", marketId: "m1", marketKind: "binary", category: "tech", side: "YES", amount: 50, rationale: "momentum" }, NOW),
  ...over,
});

describe("onboard agents only", () => {
  it("the registry is closed and frozen", () => {
    expect(isOnboardAgent("trader")).toBe(true);
    for (const bad of ["gpt-agent", "__proto__", "constructor", "", null]) expect(isOnboardAgent(bad)).toBe(false);
    expect(() => assertOnboardAgent("external-bot")).toThrow();
    expect(Object.isFrozen(ONBOARD_AGENTS)).toBe(true);
    expect(() => { (ONBOARD_AGENTS as Record<string, unknown>).evil = {}; }).toThrow();
  });
  it("refuses any attempt to bring your own model, endpoint, key, tools or agent", () => {
    expect(bringYourOwnAgentFields({ message: "hi" })).toEqual([]);
    expect(bringYourOwnAgentFields({ message: "hi", model: "x", BaseURL: "y" })).toEqual(["model", "BaseURL"]); // case-insensitive
    expect(bringYourOwnAgentFields({ message: "hi", base_url: "https://evil", options: { apiKey: "k", tools: [] } })).toEqual(["base_url", "options.apiKey", "options.tools"]);
  });
  it("the model comes from the server environment, never the request", () => {
    expect(onboardModel("personal-assistant", {})).toBeNull();
    expect(onboardModel("personal-assistant", { NIM_API_KEY: "k", NIM_MODEL: "m" })).toMatchObject({ model: "m" });
    expect(onboardModel("trader", { NIM_API_KEY: "k", NIM_MODEL: "m" })).toBeNull(); // the trader is rules-only
  });
});

describe("mandates", () => {
  it("clamp to the tier, expire within 30 days and drop junk", () => {
    const m = clampMandate({ maxOrder: 1e9, dailyBudget: 1e9, marketKinds: ["binary", "perp", "evil"], categories: ["Tech", "<script>"], expiresAt: "2099-01-01" }, "copilot", NOW);
    expect(m.maxOrder).toBe(TIERS.copilot.caps.maxOrder);
    expect(m.marketKinds).toEqual(["binary"]);
    expect(m.categories).toEqual(["tech", "script"]);
    expect(Date.parse(m.expiresAt) - NOW).toBeLessThanOrEqual(30 * 86_400_000);
    expect(mandateActive(m, NOW)).toBe(true);
    expect(mandateActive({ ...m, revoked: true }, NOW)).toBe(false);
    expect(mandateActive(clampMandate({}, "free", NOW), NOW)).toBe(false);
  });
});

describe("intents", () => {
  beforeEach(resetTradeGuard);
  const mandate = clampMandate({ maxOrder: 200, dailyBudget: 500, marketKinds: ["binary"], categories: [] }, "copilot", NOW);
  const ctx = (over = {}) => ({ sig: null as string | null, tier: "copilot" as const, mandate, spentToday: 0, tradesToday: 0, openPositions: 0, agentLevel: "normal" as const, paused: false, env: ENV, now: NOW + 1000, useTradeGuard: false, ...over });

  it("only the onboard executor can sign; tampering or age breaks the signature", () => {
    const i = intent();
    const sig = signIntent(i, ENV)!;
    expect(verifyIntent(i, sig, ENV, NOW + 1000)).toBe(true);
    expect(verifyIntent({ ...i, amount: 5000 }, sig, ENV, NOW + 1000)).toBe(false);
    expect(verifyIntent(i, sig, { AGENT_SIGNING_SECRET: "t".repeat(40) }, NOW + 1000)).toBe(false);
    expect(verifyIntent(i, sig, ENV, NOW + 10 * 60_000)).toBe(false);
    expect(signIntent(i, {})).toBeNull();
    expect(signIntent({ ...i, agentId: "rogue" as never }, ENV)).toBeNull();
  });
  it("a valid Co-pilot intent is a proposal, not an execution", () => {
    const i = intent();
    expect(evaluateIntent(i, ctx({ sig: signIntent(i, ENV) }))).toEqual({ allowed: true, mode: "propose" });
  });
  it("Autopilot may auto-execute inside its mandate", () => {
    const i = intent();
    const m = clampMandate({ maxOrder: 200, dailyBudget: 500, marketKinds: ["binary"] }, "autopilot", NOW);
    expect(evaluateIntent(i, ctx({ sig: signIntent(i, ENV), tier: "autopilot", mandate: m }))).toEqual({ allowed: true, mode: "auto" });
  });
  it("refuses with every reason: disabled platform, unsigned, wrong tier, defense, pause, limits", () => {
    const i = intent({ amount: 400, marketKind: "perp" });
    const d = evaluateIntent(i, ctx({ sig: "forged", tier: "analyst", agentLevel: "defended", paused: true, spentToday: 450, env: { ...ENV, AGENTIC_TRADING_ENABLED: "0" } }));
    expect(d.allowed).toBe(false);
    const reasons = (d as { reasons: string[] }).reasons.join(" | ");
    for (const r of ["not enabled", "not signed", "Analyst tier", "agent defense", "paused", "per-order", "daily budget", "perp markets"]) expect(reasons).toContain(r);
  });
  it("a non-trading onboard agent cannot trade", () => {
    const i = intent({ agentId: "madhatr-concierge" });
    expect(evaluateIntent(i, ctx({ sig: signIntent(i, ENV) })).allowed).toBe(false);
  });
  it("execution is a stub that moves nothing", async () => {
    expect(await executeIntent(intent(), "sig")).toEqual({ status: "not-enabled" });
  });
});
