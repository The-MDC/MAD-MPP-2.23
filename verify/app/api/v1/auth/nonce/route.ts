import { NextResponse } from "next/server";
import { issueNonce } from "@/lib/siwe-verify";

export async function GET() {
  return NextResponse.json({ nonce: issueNonce() });
}
