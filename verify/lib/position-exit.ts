/**
 * MAD Gambit — the exit valve (FIVE FACES §5.1).
 * ────────────────────────────────────────────────────────────────
 * A perpetual has no terminal date, so it needs a way out that is neither
 * "sell into whatever book exists at 3am" nor "locked forever". The valve
 * deliberately mirrors the MAD Shield unstake lifecycle: request → cooling →
 * redeemed, with a size-scaled cooldown and the price LOCKED at request time.
 *
 * WHY THE PRICE LOCKS AT REQUEST, NOT AT REDEMPTION. If it settled at
 * redemption, the cooldown would be a free option written by the house: exit
 * when the leg is going badly, and if it recovers during the cooldown you keep
 * the upside anyway. Locking at request makes the cooldown a cost to the
 * exiter, which is the only version that doesn't subsidise panic.
 *
 * WHY THE COOLDOWN SCALES WITH SIZE. Small holders are noise and should be able
 * to leave near-instantly; a position large enough to move the simplex on its
 * own has to telegraph its exit, or the last leg's crowned face is just whoever
 * had the biggest wallet at close.
 */
import { calculateShieldReturnWindow } from "@/lib/gambit-game-math";

export type ExitStatus = "active" | "cooling" | "redeemed";

/** Extra cooling for a position that is a large share of its own market. */
const DOMINANCE_KNEE = 0.05; // 5% of market conviction before the surcharge bites
const DOMINANCE_MAX_MULTIPLIER = 3;

export interface ExitRequestInput {
  /** Conviction being withdrawn. */
  conviction: number;
  /** Total conviction on the market, for the dominance surcharge. */
  marketConviction: number;
  /** Price of the face/slot at request time — this is what locks. */
  price: number;
  nowMs?: number;
}

export interface ExitTicket {
  status: ExitStatus;
  requestedAt: number;
  readyAt: number;
  /** Locked at request. Redemption pays this, whatever the book says later. */
  lockedPrice: number;
  cooldownHours: number;
  /** 1 for a small holder; up to 3 for a position that dominates its market. */
  dominanceMultiplier: number;
}

/**
 * Dominance surcharge. Flat below the knee, then linear to the cap — so a
 * holder at 4% pays nothing extra and a holder at 40% waits three times as long.
 */
export function dominanceMultiplier(conviction: number, marketConviction: number): number {
  if (!(marketConviction > 0) || !(conviction > 0)) return 1;
  const share = Math.min(1, conviction / marketConviction);
  if (share <= DOMINANCE_KNEE) return 1;
  const over = (share - DOMINANCE_KNEE) / (1 - DOMINANCE_KNEE);
  return 1 + over * (DOMINANCE_MAX_MULTIPLIER - 1);
}

/** Open the valve. Protection/price freeze from this instant. */
export function requestExit(input: ExitRequestInput): ExitTicket {
  const now = input.nowMs ?? Date.now();
  const conviction = Number.isFinite(input.conviction) ? Math.max(0, input.conviction) : 0;
  // Base window reuses the Shield's 2–24h curve so the two lifecycles feel like
  // one product rather than two teams' idea of "a cooldown".
  const base = calculateShieldReturnWindow(conviction);
  const mult = dominanceMultiplier(conviction, input.marketConviction);
  const cooldownHours = base * mult;
  return {
    status: "cooling",
    requestedAt: now,
    readyAt: now + cooldownHours * 3_600_000,
    lockedPrice: Number.isFinite(input.price) ? input.price : 0,
    cooldownHours,
    dominanceMultiplier: mult,
  };
}

export function isRedeemable(ticket: Pick<ExitTicket, "status" | "readyAt">, nowMs = Date.now()): boolean {
  return ticket.status === "cooling" && nowMs >= ticket.readyAt;
}

/** Countdown copy, same shape as the Shield's. */
export function exitCountdown(
  ticket: Pick<ExitTicket, "status" | "readyAt">,
  nowMs = Date.now(),
): string {
  if (ticket.status === "redeemed") return "Redeemed";
  if (ticket.status !== "cooling") return "";
  const msLeft = ticket.readyAt - nowMs;
  if (msLeft <= 0) return "Redeemable now";
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m to redemption` : `${m}m to redemption`;
}

/**
 * What the exiter actually receives. The locked price is the whole point, so
 * this is deliberately not a function of any later state.
 */
export function redemptionValue(ticket: Pick<ExitTicket, "lockedPrice">, conviction: number): number {
  const c = Number.isFinite(conviction) ? Math.max(0, conviction) : 0;
  return c * (Number.isFinite(ticket.lockedPrice) ? ticket.lockedPrice : 0);
}
