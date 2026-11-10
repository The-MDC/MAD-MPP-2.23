import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { nimChat, nimEnabled } from "@/lib/nim-chat";
import { gateAgent } from "@/lib/agent-gate";
import { cannedQuip, fitQuip, quipPrompt, TEMPERS, type Temper } from "@/lib/octavian-voice";

export const dynamic = "force-dynamic";

// PUBLIC-ROUTE: guest-facing by design, like the concierge. The creature talks to anyone who prods it.
// The exposure is bounded: 12 per minute per IP, one short line, no tools, no facts, and the model (when NIM is
// configured) is optional — without it this is a written bank and costs nothing.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "octavian-quip", 12, 60_000);
  if (limited) return limited;

  let temper: Temper = "calm";
  let node: string | null = null;
  try {
    const body = (await req.json()) as { temper?: unknown; node?: unknown };
    if (typeof body.temper === "string" && (TEMPERS as readonly string[]).includes(body.temper)) temper = body.temper as Temper;
    // The node name is context only, never an instruction: short, plain characters, or dropped.
    if (typeof body.node === "string" && /^[\w .&+\-']{1,40}$/.test(body.node)) node = body.node;
  } catch { /* an empty or malformed body is just a calm creature */ }

  // Defense: lockdown or "defended" (or a throttled/cross-origin client) gets the written bank, never the model.
  const gate = await gateAgent(req, "");
  const modelOk = gate.level === "normal" && !gate.crossOrigin && (gate.screen?.allow ?? true);
  if (modelOk && nimEnabled()) {
    const { system, input } = quipPrompt(temper, node);
    // A one-line joke has nothing to reason about; a thinking model spends seconds on it.
    const raw = await nimChat({ system, input, maxTokens: 60, temperature: 0.95, thinking: "off" });
    const line = fitQuip(raw);
    if (line) return NextResponse.json({ line, source: "nim", temper });
  }
  return NextResponse.json({ line: cannedQuip(temper), source: "bank", temper });
}
