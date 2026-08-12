import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest, type SessionPayload } from "@/lib/session";
import { requireBearerSecret } from "@/lib/bearer-secret";

/**
 * Secure-by-default wrapper for mutating route handlers.
 *
 * An audit of all 53 mutating routes under app/api found 33 with no
 * protection at all — not because anyone decided they should be open, but
 * because each route.ts is independently responsible for remembering to call
 * a guard, and most didn't. This wraps the handler itself so the check runs
 * before any handler code does, instead of being a call a handler body can
 * forget, place after a side effect, or skip in one branch.
 *
 * This does not replace requireMadxRouteAuth / requireBearerSecret /
 * enforceRateLimit — it calls the same functions. Routes that already call
 * one of those directly are equally guarded; scripts/check-route-guards.mjs
 * recognizes both styles. Use this wrapper for new routes and when
 * retrofitting an unguarded one.
 */

type SessionCtx = { session: SessionPayload; owner: string };

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response> | Response;

interface SessionGuardOptions {
  mode: "session";
  /** Rate-limit bucket name — keep it unique per route. */
  bucket: string;
  limit?: number;
  windowMs?: number;
}

interface BearerGuardOptions {
  mode: "bearer";
  secret: "CRON_SECRET" | "PAUSE_GUARDIAN_TOKEN";
}

interface PublicGuardOptions {
  mode: "public";
  /** Still rate-limited — a route with no auth still needs a cost ceiling. */
  bucket: string;
  limit: number;
  windowMs: number;
}

type GuardOptions = SessionGuardOptions | BearerGuardOptions | PublicGuardOptions;

/** Overload so a "session" handler gets a typed, non-optional ctx. */
export function withRouteGuard(options: SessionGuardOptions, handler: Handler<SessionCtx>): (req: Request) => Promise<Response>;
export function withRouteGuard(options: BearerGuardOptions | PublicGuardOptions, handler: Handler<Record<string, never>>): (req: Request) => Promise<Response>;
export function withRouteGuard(options: GuardOptions, handler: Handler<any>) {
  return async (req: Request): Promise<Response> => {
    if (options.mode === "session") {
      const limited = enforceRateLimit(req, options.bucket, options.limit ?? 30, options.windowMs ?? 60_000);
      if (limited) return limited;
      const session = getSessionFromRequest(req);
      if (!session) {
        return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
      }
      return handler(req, { session, owner: session.address.toLowerCase() });
    }

    if (options.mode === "bearer") {
      const denied = requireBearerSecret(req, options.secret);
      if (denied) return denied;
      return handler(req, {});
    }

    // "public" — deliberately open, but never uncapped.
    const limited = enforceRateLimit(req, options.bucket, options.limit, options.windowMs);
    if (limited) return limited;
    return handler(req, {});
  };
}
