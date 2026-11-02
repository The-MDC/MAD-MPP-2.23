/**
 * Agentic root — the one place agentic and automated trading plugs into MAD Gambit.
 * ──────────────────────────────────────────────────────────────────────────────────
 * Today this is a ROOT AND STUB: every type, tier, limit and check is real and tested, and nothing here can move a
 * balance. Automated execution is off until `AGENTIC_TRADING_ENABLED=1` AND `executeIntent` is wired (see the
 * checklist in ./trading.ts). Wiring it later is one function, because everything around it already exists:
 *
 *   ./onboard.ts   the ONLY agents allowed to act: a frozen registry of our own onboard agents (MADHAT'r, the
 *                  personal assistant, the trader), each bound to the operator-configured onboard model. No user-supplied
 *                  model, endpoint, key, tool, webhook or third-party agent is accepted anywhere.
 *   ./tiers.ts     the subscription ladder (Free → Analyst → Co-pilot → Autopilot) and the hard caps of each
 *   ./mandate.ts   the user's standing consent: per-order and daily caps, market kinds, expiry, instant revoke
 *   ./trading.ts   a trade INTENT, signed by the onboard executor, evaluated against tier, mandate, the trade guard, the
 *                  agent-defense level and the platform pause, then (later) executed
 */
export * from "@/lib/agentic/onboard";
export * from "@/lib/agentic/tiers";
export * from "@/lib/agentic/mandate";
export * from "@/lib/agentic/trading";
