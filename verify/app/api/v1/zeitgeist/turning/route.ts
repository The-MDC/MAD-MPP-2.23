import { NextResponse } from "next/server";
import {
  LEGS_PER_TURNING,
  LEG_DAYS,
  TURNING_DAYS,
  currentLeg,
  legCountdown,
  legsToTurning,
  vintageAt,
} from "@/lib/lunar-legs";
import { getLunarIllumination } from "@/lib/gambit-game-math";

/**
 * GET /api/v1/zeitgeist/turning — where we are in the lunar year.
 *
 * The drift is reported honestly (§11.3): a lunar year is 354.367 days, so THE
 * TURNING walks ~10.9 days earlier against the Gregorian calendar every year.
 * Hiding that would make the countdown feel broken once a year; stating it makes
 * the cadence a feature.
 */
export function GET() {
  const now = Date.now();
  const leg = currentLeg(now);
  const legsLeft = legsToTurning(now);
  const turningAt = leg.openedAt + legsLeft * (TURNING_DAYS / LEGS_PER_TURNING) * 86_400_000;
  const GREGORIAN_YEAR_DAYS = 365.2425;

  return NextResponse.json({
    success: true,
    vintage: vintageAt(now),
    leg: {
      globalIndex: leg.globalLeg,
      slotInTurning: leg.slotInTurning,
      opensAt: new Date(leg.openedAt).toISOString(),
      closesAt: new Date(leg.closesAt).toISOString(),
      progress: Number(leg.progress.toFixed(4)),
      countdown: legCountdown(leg.closesAt, now),
      isTurningLeg: leg.isTurningLeg,
    },
    turning: {
      legsRemaining: legsLeft,
      at: new Date(turningAt).toISOString(),
      legsPerTurning: LEGS_PER_TURNING,
      legDays: Number(LEG_DAYS.toFixed(3)),
      turningDays: Number(TURNING_DAYS.toFixed(3)),
      gregorianDriftDays: Number((GREGORIAN_YEAR_DAYS - TURNING_DAYS).toFixed(3)),
    },
    moon: { illumination: Number(getLunarIllumination(now).toFixed(4)) },
  });
}
