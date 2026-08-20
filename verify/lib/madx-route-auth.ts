import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest, type SessionPayload } from "@/lib/session";

export interface MadxRouteAuth {
  session: SessionPayload;
  owner: string;
}

export function requireMadxRouteAuth(
  req: Request,
  bucket: string,
  limit = 30,
  windowMs = 60_000,
): MadxRouteAuth | Response {
  const limited = enforceRateLimit(req, bucket, limit, windowMs);
  if (limited) return limited;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  return { session, owner: session.address.toLowerCase() };
}

export function isAuthResponse(value: MadxRouteAuth | Response): value is Response {
  return value instanceof Response;
}
