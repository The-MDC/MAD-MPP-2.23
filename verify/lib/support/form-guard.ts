/**
 * One guard for every public form that creates something (waitlist, open-beta admission, invite redemption, support
 * tickets): same-origin, the agent-defense client score, the honeypot and the proof-of-work challenge. Each route
 * applies its own `enforceRateLimit` first, where the route-guard check can see it.
 */
import { NextResponse } from "next/server";
import { gateAgent } from "@/lib/agent-gate";
import { honeypotTripped, verifyChallenge } from "@/lib/signup-shield";
import { noteThreat } from "@/lib/threat-status";

export type FormGuard = { kind: "ok" } | { kind: "honeypot" } | { kind: "deny"; response: Response };

const deny = (status: number, error: string, extra: Record<string, string> = {}) =>
  ({ kind: "deny" as const, response: NextResponse.json({ success: false, error }, { status, headers: { "cache-control": "no-store", ...extra } }) });

export async function guardPublicForm(req: Request, body: unknown): Promise<FormGuard> {
  const gate = await gateAgent(req, "");
  if (gate.crossOrigin) return deny(403, "forbidden");
  if (gate.screen && !gate.screen.allow) return deny(429, "Too many attempts. Try again later.", { "retry-after": String(gate.screen.retryAfterS ?? 300) });

  // A filled honeypot gets a quiet fake success: the bot learns nothing, and nothing is stored.
  if (honeypotTripped(body)) { noteThreat("scan", "honeypot"); return { kind: "honeypot" }; }

  const challenge = body && typeof body === "object" ? (body as Record<string, unknown>).challenge : undefined;
  const v = verifyChallenge(challenge);
  if (!v.ok) noteThreat(v.reason === "replayed" || v.reason === "bad-signature" ? "attack" : "scan", `challenge-${v.reason}`);
  if (!v.ok) return deny(v.reason === "too-fast" ? 429 : 400, v.reason === "too-fast" ? "That was quick. Give it a second and try again." : "Please refresh the page and try again.");
  return { kind: "ok" };
}

/** What a tripped honeypot is told: exactly what a real success looks like. */
export const FAKE_SUCCESS = () => NextResponse.json({ success: true }, { headers: { "cache-control": "no-store" } });
