/**
 * POST /api/v1/madhatr/zliar — Z-Liar / Sentinel audit.
 *
 * The MATHS was always real (`zLiarMeter`). The PERSONA was not, in two places
 * at once, and neither would have been fixed by wiring one to the other:
 *
 *   - this route returned a template string ending "[LLM persona pending]"
 *     with `_llm: "PLACEHOLDER"`;
 *   - components/zliar-meter.tsx never called this route at all. It rendered a
 *     five-entry lookup table keyed by verdict, under the on-screen words
 *     "🎩 The MADHAT'r reads it" — a line that ignored the user's statement
 *     entirely while implying something had read it.
 *
 * The quip is now a real Gemini call, through the same `ChatGoogleGenerativeAI`
 * path `app/api/concierge/chat` already uses, with the MADHAT'r system
 * instruction shared from lib/madhatr-persona.ts rather than copied.
 *
 * WHAT THE MODEL IS AND IS NOT ALLOWED TO DO. The reading is computed here,
 * server-side, and handed to the model as fact. The model voices the verdict; it
 * never produces the number. A persona layer that scored the claim itself would
 * put two different answers on the same panel, and the one with a decimal point
 * would win an argument it should not be in.
 *
 * FALLBACK IS LABELLED, NOT DISGUISED. Without GOOGLE_API_KEY — or if the call
 * fails or times out — the deterministic verdict-keyed line is returned with
 * `quipSource: "canned"`, and the UI badges it. A canned line presented as a
 * live read is the exact defect this route existed to demonstrate.
 */
import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { zLiarMeter, type ZLiarVerdict } from "@/lib/gambit-game-math";
import { enforceRateLimit } from "@/lib/rate-limit";
import { MADHATR_SYSTEM_INSTRUCTION, SENTINEL_BRIEF } from "@/lib/madhatr-persona";

/**
 * The deterministic fallback. Lifted from components/zliar-meter.tsx, where it
 * was the ONLY thing rendered — better copy than the old server template, so it
 * is kept as the offline voice rather than discarded.
 */
const CANNED: Record<ZLiarVerdict, string> = {
  "STRAIGHT SHOOTER": "Ayo, this one's legit, kid. Cleaner than my Sunday fedora.",
  "MOSTLY CANDID": "Mostly candid — a little spin, like meatballs, rolled just enough.",
  "SLIPPERY": "Slippery. Somethin' smells off, and it ain't the cannolis. Watch ya wallet.",
  "SERIAL EMBELLISHER": "A serial embellisher — every retelling gains a zero and loses a witness.",
  "TOTAL FABRICATION": "Fuhgeddaboudit. Total fabrication. Pure fan-fiction.",
};

/** A slow model must not hang the panel. The canned line is always ready. */
const LLM_TIMEOUT_MS = 6_000;

// PUBLIC-ROUTE: guest-facing by design — auditing a claim needs no wallet, same
// posture as the concierge. Rate-limited hard BECAUSE it is now a paid Gemini
// call: 12/min/IP, down from the 60/min it carried while it was pure maths.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "madhatr-zliar", 12, 60_000);
  if (limited) return limited;

  try {
    const {
      statement,
      narrativeVariance = 0.5,
      sourceCredibility = 0.5,
      corroboration = 0.3,
    } = await req.json();

    const reading = zLiarMeter({ narrativeVariance, sourceCredibility, corroboration });
    const canned = CANNED[reading.verdict] ?? CANNED["SLIPPERY"];

    const claim = typeof statement === "string" ? statement.slice(0, 600).trim() : "";
    if (!process.env.GOOGLE_API_KEY || !claim) {
      return NextResponse.json({
        success: true,
        statement,
        reading,
        quip: canned,
        quipSource: "canned",
      });
    }

    try {
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-flash-latest",
        maxOutputTokens: 120,
        temperature: 0.9,
      });

      const brief = [
        `CLAIM UNDER AUDIT: ${claim}`,
        ``,
        `INSTRUMENT READING (computed by the platform, treat as fact):`,
        `- Z-Liar score: ${Math.round(reading.score)} / 100`,
        `- Verdict: ${reading.verdict}`,
        `- BS index: ${Math.round(reading.bs)}%`,
        `- GARCH volatility: ${reading.volatility.toFixed(3)}`,
        ``,
        `Deliver the line.`,
      ].join("\n");

      const result = await Promise.race([
        llm.invoke([
          new SystemMessage(`${MADHATR_SYSTEM_INSTRUCTION}\n\n${SENTINEL_BRIEF}`),
          new HumanMessage(brief),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("llm-timeout")), LLM_TIMEOUT_MS),
        ),
      ]);

      const text = typeof result.content === "string" ? result.content.trim() : "";
      if (!text) throw new Error("empty-completion");

      return NextResponse.json({
        success: true,
        statement,
        reading,
        quip: text,
        quipSource: "llm",
      });
    } catch (llmError) {
      // A model outage degrades the VOICE, never the audit — the reading is
      // already computed and is the part that matters.
      console.error("madhatr/zliar llm error:", llmError);
      return NextResponse.json({
        success: true,
        statement,
        reading,
        quip: canned,
        quipSource: "canned",
      });
    }
  } catch (e) {
    console.error("madhatr/zliar error:", e);
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 400 });
  }
}
