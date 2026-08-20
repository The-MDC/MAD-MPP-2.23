/**
 * MAD Gambit — the lunar leg calendar.
 * ────────────────────────────────────────────────────────────────
 * Every custom perpetual (FIVE FACES · ZEITGEIST · EPIPHANY) rolls on a LEG,
 * not an expiry. A leg is two synodic months; six legs are THE TURNING, which
 * is exactly one lunar year.
 *
 *   1 leg      = 2 × 29.530588853d = 59.061177706d
 *   1 turning  = 6 legs            = 354.367066236d  (one lunar year)
 *
 * WHY THE GRID IS GLOBAL. Leg boundaries are anchored to the same epoch as the
 * lunar conviction multiplier (1979-12-08), not to each market's creation time.
 * If every market rolled on its own anniversary, THE TURNING would be a
 * different date for every slate and the ZEITGEIST succession matrix — which
 * transmigrates conviction between slates simultaneously — would have nothing
 * to synchronise against. So: a market's `legIndex` counts its own legs from 0,
 * but the open/close timestamps of each of those legs are snapped to the shared
 * grid. A market created mid-leg gets a short first leg rather than a private
 * calendar.
 *
 * Source: MASTER_MATHS §4 (lunar alignment), FIVE FACES §3, ZEITGEIST §5.
 */
import { IMMACULATE_CONCEPTION_EPOCH_MS, LUNAR_CYCLE_MS } from "@/lib/gambit-game-math";

const DAY_MS = 86_400_000;

/** One leg — two synodic months. */
export const LEG_MS = LUNAR_CYCLE_MS * 2; // 5_102_885_754
export const LEG_DAYS = LEG_MS / DAY_MS; // 59.061177706…

/** Six legs make THE TURNING. */
export const LEGS_PER_TURNING = 6;
export const TURNING_MS = LEG_MS * LEGS_PER_TURNING;
export const TURNING_DAYS = TURNING_MS / DAY_MS; // 354.367…

export interface LegWindow {
  /** Position on the shared grid, counted from the lunar epoch. */
  globalLeg: number;
  openedAt: number;
  closesAt: number;
  /** 0 → just opened, 1 → closing. */
  progress: number;
  /** Which turning this leg belongs to, and its 0..5 slot inside it. */
  turning: number;
  slotInTurning: number;
  /** True on the last leg of a turning — the slate reseeds at its close. */
  isTurningLeg: boolean;
}

/** Index on the shared grid. Floors, so a timestamp mid-leg returns that leg. */
export function globalLegIndex(atMs: number = Date.now()): number {
  return Math.floor((atMs - IMMACULATE_CONCEPTION_EPOCH_MS) / LEG_MS);
}

/** The full window for a global leg index. */
export function legWindowFor(globalLeg: number, atMs: number = Date.now()): LegWindow {
  const openedAt = IMMACULATE_CONCEPTION_EPOCH_MS + globalLeg * LEG_MS;
  const closesAt = openedAt + LEG_MS;
  const raw = (atMs - openedAt) / LEG_MS;
  const turning = Math.floor(globalLeg / LEGS_PER_TURNING);
  const slotInTurning = ((globalLeg % LEGS_PER_TURNING) + LEGS_PER_TURNING) % LEGS_PER_TURNING;
  return {
    globalLeg,
    openedAt,
    closesAt,
    progress: Math.min(1, Math.max(0, raw)),
    turning,
    slotInTurning,
    isTurningLeg: slotInTurning === LEGS_PER_TURNING - 1,
  };
}

/** The leg currently open on the shared grid. */
export function currentLeg(atMs: number = Date.now()): LegWindow {
  return legWindowFor(globalLegIndex(atMs), atMs);
}

/**
 * When a market's next leg closes, given when its current leg opened.
 *
 * Snaps forward to the next grid boundary strictly after `openedAtMs`. A market
 * created mid-leg therefore closes its first leg early, at the same instant as
 * every other market on the grid, and runs full legs from then on.
 */
export function nextLegClose(openedAtMs: number): number {
  const idx = globalLegIndex(openedAtMs);
  const boundary = IMMACULATE_CONCEPTION_EPOCH_MS + (idx + 1) * LEG_MS;
  // Guard the exact-boundary case: a market opened precisely on a boundary gets
  // the whole leg ahead of it, not a zero-length one.
  return boundary > openedAtMs ? boundary : boundary + LEG_MS;
}

/** Has this leg matured? Used by the roll scheduler and by exit settlement. */
export function isLegClosed(closesAtMs: number, atMs: number = Date.now()): boolean {
  return atMs >= closesAtMs;
}

/** Legs left before the next Turning, counting the one now open. */
export function legsToTurning(atMs: number = Date.now()): number {
  return LEGS_PER_TURNING - currentLeg(atMs).slotInTurning;
}

/**
 * The lunar year a slate belongs to. ZEITGEIST vintages are numbered by turning,
 * not by Gregorian year — a slate reseeded at a Turning keeps its vintage even
 * though the Turning drifts ~11 days earlier each Gregorian year.
 */
export function vintageAt(atMs: number = Date.now()): number {
  return currentLeg(atMs).turning;
}

/** Human-readable countdown to leg close, matching the Shield's copy style. */
export function legCountdown(closesAtMs: number, atMs: number = Date.now()): string {
  const msLeft = closesAtMs - atMs;
  if (msLeft <= 0) return "Leg closed — rolling";
  const d = Math.floor(msLeft / DAY_MS);
  const h = Math.floor((msLeft % DAY_MS) / 3_600_000);
  if (d > 0) return `${d}d ${h}h to leg close`;
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return `${h}h ${m}m to leg close`;
}
