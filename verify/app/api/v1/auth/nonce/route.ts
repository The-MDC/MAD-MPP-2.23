import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/siwe-verify";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "auth-nonce", 30, 60_000); // 30/min/IP
  if (limited) return limited;
  return NextResponse.json({ nonce: await issueNonce() });
}
