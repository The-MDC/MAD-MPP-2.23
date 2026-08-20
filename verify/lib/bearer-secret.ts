import { NextResponse } from "next/server";

export function requireBearerSecret(req: Request, envName: "CRON_SECRET" | "PAUSE_GUARDIAN_TOKEN"): Response | null {
  const expected = process.env[envName];
  if (!expected) {
    return NextResponse.json({ success: false, error: `${envName} not configured` }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}
