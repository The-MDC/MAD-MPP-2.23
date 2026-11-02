/**
 * Threat status — the security and anomaly monitor behind the MADHAT'r's colour.
 * ────────────────────────────────────────────────────────────────────────────
 *   green   nothing unusual
 *   yellow  automated or agentic SCANNING: injection probes, cross-origin scripts, honeypot hits, forged or replayed
 *           challenges, bring-your-own-agent attempts, sign-in guessing, scripted trading patterns
 *   red     UNDER ATTACK: the circuit breaker has escalated, clients are being banned, the prompt canary leaked, or
 *           scanning is arriving in volume (dupes, floods, brute force)
 *
 * Every defense layer reports here with `noteThreat`. Counts are per instance and in memory; escalations are also
 * written to the admin audit log (throttled), and `threatStatus` reads those back, so one instance under attack turns
 * every instance's concierge red. The public endpoint exposes the colour only, never what was seen or how it is caught.
 */
import { breakerLevel } from "@/lib/agent-defense";

export type ThreatKind = "scan" | "attack";
export type ThreatColour = "green" | "yellow" | "red";

const WINDOW_MS = 10 * 60_000;
export const YELLOW_SCANS = 3;
export const RED_SCANS = 40;
export const RED_ATTACKS = 2;

let events: { at: number; kind: ThreatKind; label: string }[] = [];
let lastPersist: Record<ThreatKind, number> = { scan: 0, attack: 0 };
let persister: ((kind: ThreatKind, label: string) => Promise<void>) | null = null;

/** Routes register a persister once (the audit log); kept injectable so this module has no database dependency. */
export function setThreatPersister(p: typeof persister) { persister = p; }

export function noteThreat(kind: ThreatKind, label: string, now = Date.now()): void {
  events.push({ at: now, kind, label: label.slice(0, 40) });
  if (events.length > 5000) events = events.slice(-2500);
  // At most one audit row per kind per minute per instance: enough to share state, never a write amplifier.
  if (persister && now - lastPersist[kind] > 60_000) {
    lastPersist[kind] = now;
    void persister(kind, label).catch(() => {});
  }
}

export interface ThreatSnapshot { colour: ThreatColour; scans: number; attacks: number; top: { label: string; n: number }[] }

export function threatStatus(opts: { now?: number; shared?: { scans: number; attacks: number } } = {}): ThreatSnapshot {
  const now = opts.now ?? Date.now();
  events = events.filter((e) => now - e.at <= WINDOW_MS);
  const scans = events.filter((e) => e.kind === "scan").length + (opts.shared?.scans ?? 0);
  const attacks = events.filter((e) => e.kind === "attack").length + (opts.shared?.attacks ?? 0);
  const breaker = breakerLevel(now);
  const colour: ThreatColour =
    breaker === "lockdown" || attacks >= RED_ATTACKS || scans >= RED_SCANS ? "red"
    : breaker === "defended" || attacks > 0 || scans >= YELLOW_SCANS ? "yellow"
    : "green";
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.label, (counts.get(e.label) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, n]) => ({ label, n }));
  return { colour, scans, attacks, top };
}

export const resetThreats = () => { events = []; lastPersist = { scan: 0, attack: 0 }; };
