import { NextRequest, NextResponse } from "next/server";
import { verifySiwe } from "@/lib/siwe-verify";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json().catch(() => ({}));
  if (!message || !signature)
    return NextResponse.json({ error: "message and signature required" }, { status: 400 });

  const host = req.headers.get("host") ?? "";
  const result = await verifySiwe(message, signature, host);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

  const res = NextResponse.json({ ok: true, address: result.address });
  res.cookies.set("mg_session", result.address!, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 8, path: "/",
  });
  return res;
}
