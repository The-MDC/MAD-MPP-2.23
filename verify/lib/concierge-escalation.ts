/**
 * Concierge repeat-question policy.
 * ─────────────────────────────────
 * The first sensitive question gets "That's above my pay grade." The second gets it again, a touch more pointedly.
 * From the THIRD sensitive question inside the window, the concierge stops stonewalling and offers the one thing it is
 * allowed to share: the public, high-level market and sentiment weather ("running hot, N markets open, the busiest
 * floor leans 62% YES"). Nothing private is ever added: not a wallet, an email, a fee internal, a key or a count of
 * users. Repetition buys the weather forecast, never the vault.
 *
 * Counters are per client (IP) and per server instance, in memory: a best-effort nudge, not a security boundary. The
 * boundary is that the escalated reply is built ONLY from the public ticker snapshot, which is aggregate-only.
 */
import type { TickerSnapshot } from "@/lib/ticker-feed";
import { SENSITIVE_REPLY } from "@/lib/madhatr-guard";

export const ESCALATE_AT = 3;
export const WINDOW_MS = 10 * 60_000;

const hits = new Map<string, { n: number; first: number }>();

/** Record one sensitive question from `key` and return how many that is inside the window. */
export function noteSensitive(key: string, now = Date.now()): number {
  const rec = hits.get(key);
  if (!rec || now - rec.first > WINDOW_MS) { hits.set(key, { n: 1, first: now }); return 1; }
  rec.n += 1;
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.first > WINDOW_MS) hits.delete(k);
  return rec.n;
}

export const resetEscalation = () => hits.clear();

/** High-level public weather only, built from the aggregate snapshot. */
export function weatherLine(s: Pick<TickerSnapshot, "analytics" | "markets" | "perps">): string {
  const mood = s.analytics.heat >= 70 ? "running hot" : s.analytics.heat >= 40 ? "moving at a steady pace" : "pretty quiet";
  const binary = s.markets.filter((m) => m.kind === "binary");
  const top = [...binary].sort((a, b) => b.volume - a.volume)[0];
  const lean = top ? ` The busiest floor, "${top.title}", leans ${top.yesPct}% YES.` : "";
  return `Still above my pay grade. But since you keep asking, here is the weather: the floor is ${mood}, with ${binary.length} open markets and ${s.perps.open} perpetuals on the board.${lean} That is as far as I go.`;
}

export function sensitiveReplyFor(count: number, snap: TickerSnapshot | null): { reply: string; escalated: boolean } {
  if (count >= ESCALATE_AT && snap) return { reply: weatherLine(snap), escalated: true };
  if (count === 2) return { reply: `${SENSITIVE_REPLY} Truly. Ask me about markets, cards or the Octavian instead.`, escalated: false };
  return { reply: SENSITIVE_REPLY, escalated: false };
}
