import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  confirmKeyDestroyed,
  listLapsedKeys,
  renewPortraitKey,
  requestKeyDestruction,
} from "@/lib/perp-store";
import { eraseIdentity } from "@/lib/subject-identity-map";
import { createLocalKmsAdapter, createLocalObjectStore, erasureSlaCopy } from "@/lib/portrait-vault";
import { isSubjectApproved } from "@/lib/registrar-queue";
import { LEG_MS, globalLegIndex } from "@/lib/lunar-legs";

/**
 * THE LAPSE (§6.2.3) — the hold-then-release failsafe.
 *
 * POST /api/v1/registrar/lapse
 *
 * The governing principle inverts the usual default: SILENCE DESTROYS. Most
 * retention systems fail open — data lingers because nobody remembered to
 * delete it. This fails closed, so the failure mode of neglect is erasure.
 *
 * Each run does two things, in this order:
 *
 *   HOLD   — renew the TTL of every held key whose subject STILL clears the
 *            §9.1 bar. Renewal is an action something must take; a key that
 *            stops being renewed dies on schedule.
 *   RELEASE — destroy every held key already past its TTL, and erase the
 *            identity binding in the same pass.
 *
 * BOTH SIDES OF THE ERASURE, ALWAYS. §6.2.2 workstream 4 calls the identity map
 * "easy to miss and fatal if missed": destroying the payload key while
 * retaining the map still leaves personal data on the books. So there is no
 * code path here that destroys one without the other.
 *
 * THE ABANDONMENT CASE is why this endpoint is boring by design. If MAD Gambit
 * stops operating and nobody ever calls this again, no renewals happen and
 * every payload lapses on its own schedule. A retention design that only works
 * while the company is healthy is not a retention design.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "registrar-lapse", 12, 60_000);
  if (limited) return limited;

  // The local adapter is fine for the scheduler's bookkeeping and the staging
  // destruction drill. A production deployment injects a real KMS; the
  // readiness checklist is what asserts one is present before Phase 4.
  const kms = createLocalKmsAdapter();
  const store = createLocalObjectStore();

  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      success: false,
      error: "the lapse scheduler needs DATABASE_URL",
      sla: erasureSlaCopy(kms),
    });
  }

  try {
    const pool = getDbPool();
    const now = Date.now();
    const leg = globalLegIndex(now);

    const lapsed = await listLapsedKeys(pool, 200);
    const released: { subjectRef: string; reason: string }[] = [];
    const held: { subjectRef: string; ttlExpiresAt: string }[] = [];

    for (const key of lapsed) {
      // HOLD — renewal requires an affirmative condition that still holds.
      const stillEligible = await isSubjectApproved(pool, key.subjectRef);
      if (stillEligible) {
        // Renewal is per leg, so a subject who drops out of eligibility has
        // their key expire within at most one leg (59.061 days).
        const ttl = new Date(now + LEG_MS).toISOString();
        const renewed = await renewPortraitKey(pool, key.subjectRef, ttl, leg);
        if (renewed) {
          held.push({ subjectRef: renewed.subjectRef, ttlExpiresAt: renewed.ttlExpiresAt });
          continue;
        }
      }

      // RELEASE — request destruction, erase the identity binding, then record
      // the irreversible-destruction time when the provider confirms it.
      const reason = stillEligible ? "renewal_failure" : "ttl_lapse";
      await requestKeyDestruction(pool, key.subjectRef, reason, "lapse_scheduler", now);
      await eraseIdentity(pool, store, key.subjectRef);
      const destroyed = await kms.destroyKey(key.keyRef);
      if (destroyed.irreversibleFrom <= Date.now()) {
        await confirmKeyDestroyed(pool, key.subjectRef, destroyed.irreversibleFrom);
      }
      released.push({ subjectRef: key.subjectRef, reason });
    }

    return NextResponse.json({
      success: true,
      leg,
      scanned: lapsed.length,
      held,
      released,
      sla: erasureSlaCopy(kms),
    });
  } catch (e) {
    console.error("registrar/lapse error:", e);
    return NextResponse.json({ success: false, error: "lapse run failed" }, { status: 500 });
  }
}
