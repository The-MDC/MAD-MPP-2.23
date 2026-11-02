/**
 * Onboard agents — the closed list of agents that may act on MAD Gambit.
 *
 * Hardening, by construction:
 *   - The registry is frozen. An agent id not in it is refused everywhere (`assertOnboardAgent`).
 *   - Every agent runs on the ONBOARD model: the operator's NIM configuration from the server environment, or the
 *     deterministic rules engine. Nothing a user sends can change the model, the endpoint, the key or the tools.
 *   - Requests that try to (any of FORBIDDEN_FIELDS present) are rejected outright, not silently ignored, so a
 *     probing client learns nothing useful and the attempt is visible.
 *   - Agent actions that touch money are signed by the onboard executor (./trading.ts); an outside bot that merely
 *     claims to be an agent cannot produce that signature.
 */
import { nimConfig, type NimConfig } from "@/lib/nim-chat";

export type AgentId = "madhatr-concierge" | "personal-assistant" | "octavian" | "ops-assistant" | "trader";
export type AgentCapability = "chat" | "suggest-markets" | "alerts" | "propose-trades" | "execute-trades" | "reports";

export interface OnboardAgent {
  id: AgentId;
  name: string;
  runsOn: "onboard-model" | "rules";
  capabilities: readonly AgentCapability[];
  /** Agents that can touch money are executor-signed and tier-gated. */
  touchesFunds: boolean;
}

export const ONBOARD_AGENTS: Readonly<Record<AgentId, Readonly<OnboardAgent>>> = Object.freeze({
  "madhatr-concierge": Object.freeze({ id: "madhatr-concierge", name: "The MADHAT'r", runsOn: "onboard-model", capabilities: Object.freeze(["chat", "suggest-markets"] as const), touchesFunds: false }),
  "personal-assistant": Object.freeze({ id: "personal-assistant", name: "Your MAD agent", runsOn: "onboard-model", capabilities: Object.freeze(["chat", "alerts", "propose-trades"] as const), touchesFunds: false }),
  octavian: Object.freeze({ id: "octavian", name: "Octavian", runsOn: "onboard-model", capabilities: Object.freeze(["chat"] as const), touchesFunds: false }),
  "ops-assistant": Object.freeze({ id: "ops-assistant", name: "Operations assistant", runsOn: "onboard-model", capabilities: Object.freeze(["reports"] as const), touchesFunds: false }),
  trader: Object.freeze({ id: "trader", name: "MAD trader (automated)", runsOn: "rules", capabilities: Object.freeze(["propose-trades", "execute-trades"] as const), touchesFunds: true }),
}) as Readonly<Record<AgentId, Readonly<OnboardAgent>>>;

export function isOnboardAgent(id: unknown): id is AgentId {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(ONBOARD_AGENTS, id);
}

export function assertOnboardAgent(id: unknown): OnboardAgent {
  if (!isOnboardAgent(id)) throw new Error("not an onboard agent");
  return ONBOARD_AGENTS[id];
}

export const agentCan = (id: AgentId, cap: AgentCapability): boolean => ONBOARD_AGENTS[id].capabilities.includes(cap);

/**
 * Fields that would let a caller bring their own model, endpoint, key, tools or agent. Their presence anywhere in a
 * request body to an agent route is a refusal.
 */
export const FORBIDDEN_FIELDS = [
  "model", "baseUrl", "base_url", "endpoint", "apiKey", "api_key", "key", "token", "provider", "tools", "functions",
  "tool_choice", "webhook", "callback", "callbackUrl", "agent", "agentUrl", "system", "systemPrompt", "temperature", "plugins", "mcp",
] as const;

/** Returns the offending field names (case-insensitive, top level and one level down). */
export function bringYourOwnAgentFields(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const banned = new Set(FORBIDDEN_FIELDS.map((f) => f.toLowerCase()));
  const hits: string[] = [];
  const scan = (o: Record<string, unknown>, prefix: string, depth: number) => {
    for (const [k, v] of Object.entries(o)) {
      if (banned.has(k.toLowerCase())) hits.push(prefix + k);
      if (depth < 1 && v && typeof v === "object" && !Array.isArray(v)) scan(v as Record<string, unknown>, `${prefix}${k}.`, depth + 1);
    }
  };
  scan(body as Record<string, unknown>, "", 0);
  return hits;
}

/** The onboard model for an agent: the operator's server-side NIM config, never anything from a request. */
export function onboardModel(id: AgentId, env: Record<string, string | undefined> = process.env): NimConfig | null {
  const agent = ONBOARD_AGENTS[id];
  if (!agent || agent.runsOn !== "onboard-model") return null;
  return nimConfig(env);
}
