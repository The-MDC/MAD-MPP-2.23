import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { nimChat, nimEnabled } from "@/lib/nim-chat";
import { isSensitiveQuery, looksLikeLeak, SENSITIVE_REPLY } from "@/lib/madhatr-guard";
import { MADHATR_SYSTEM_INSTRUCTION } from "@/lib/madhatr-persona";
import {
    greetingReply, isGreeting, knowledgePrompt, loadKnowledge, normalizeHistory,
    PAY_GRADE_MARKER, payGradeReply, retrieve, wantsOpinionOrAdvice,
} from "@/lib/madhatr-knowledge";

// The persona now lives in lib/madhatr-persona.ts so the Z-Liar Sentinel and
// any future LLM surface speak in the same voice instead of each carrying a
// drifting copy of ~15 lines of tone-critical prose.
const GEMINI_SYSTEM_INSTRUCTION = MADHATR_SYSTEM_INSTRUCTION;

const TONE_DIRECTIVES: Record<string, string> = {
    "Satirical": "Stay in your default satirical, joking voice — MAD Magazine meets South Park.",
    "Controversial": "Lean harder into controversial, no-filter takes — say the thing everyone's thinking.",
    "Analytical": "Drop the jokes for this response. Give a precise, data-grounded, analytical answer — still in your voice, but focused.",
};

function getRiskDirective(risk: number): string {
    if (risk < 0.25) return "Risk posture: ANALYTICAL AND COMPLIANT. Favor caution, mention the MAD Shield, avoid egging on big bets.";
    if (risk < 0.5) return "Risk posture: LOW RISK. Measured takes, no hype.";
    if (risk < 0.75) return "Risk posture: MEDIUM RISK. Normal degen energy.";
    if (risk < 0.9) return "Risk posture: HIGH-VOLATILITY BIAS. Lean into the upside, less hand-wringing about downside.";
    return "Risk posture: MAX DEGEN. Full send energy — no caution, all conviction.";
}

// PUBLIC-ROUTE: guest-facing by design — the concierge is a front-door
// feature and requiring a wallet to ask it a question would defeat the point.
// This is a decision that was already made and written down here; the audit
// flagged the route because the CI gate had no way to tell a deliberate
// exemption from a forgotten one, which is what this marker fixes.
//
// The exposure is real and bounded rather than absent: unbounded Gemini calls
// billed to GOOGLE_API_KEY, capped at 20/min/IP. If that bill ever bites, the
// answer is a session guard here and a signed-in-only concierge — a product
// decision, not a security one.
export async function POST(req: NextRequest) {
    // Guest-facing by design (no wallet/session required to talk to the
    // concierge) — but every paid-LLM route in this codebase rate-limits
    // itself, and this one didn't. 20/min/IP is generous for a real
    // conversation and cheap to abuse without it (unbounded Gemini calls
    // billed to GOOGLE_API_KEY).
    const limited = enforceRateLimit(req, "concierge-chat", 20, 60_000);
    if (limited) return limited;

    try {
        const body = await req.json();
        const { message, history = [], tone = "Satirical", risk = 0.75, regen_count = 0 } = body;
        const text = String(message ?? "").trim();
        const turns = normalizeHistory(history);
        const kb = loadKnowledge();

        // Anything asking for a secret, an internal, a private figure or a private person gets the normal
        // pay-grade line from CODE — before retrieval and before any model sees the question.
        if (isSensitiveQuery(text)) {
            return NextResponse.json({ reply: SENSITIVE_REPLY, quipSource: "sensitive" });
        }

        // A plain hello is copied straight back; every 5th one gets a brush-off.
        if (isGreeting(text, kb)) {
            return NextResponse.json({ reply: greetingReply(text, turns, kb), quipSource: "greeting" });
        }

        if (!text || (!nimEnabled() && !process.env.GOOGLE_API_KEY)) {
            // No model key on this deployment (neither NVIDIA NIM nor Gemini): answer from the knowledge base,
            // and walk the pay-grade ladder when it has nothing to say.
            const hit = text && !wantsOpinionOrAdvice(text) ? retrieve(text, turns, kb) : null;
            return NextResponse.json(
                hit
                    ? { reply: hit.reply, quipSource: "knowledge", topic: hit.topic }
                    : { reply: payGradeReply(turns, kb), quipSource: "pay-grade" },
            );
        }

        const toneLine = TONE_DIRECTIVES[tone] || TONE_DIRECTIVES["Satirical"];
        const riskLine = getRiskDirective(risk);
        const directive = `${GEMINI_SYSTEM_INSTRUCTION}\n\n${toneLine}\n${riskLine}\n\n${knowledgePrompt(kb)}`;

        let inputText = text;
        if (regen_count >= 1) {
            inputText = `${text}\n\n[The user asked you to regenerate this response — ${regen_count} time(s). Escalate your intensity. Be sharper, funnier, more unhinged than your first take.]`;
        }

        // Provider order: NVIDIA NIM (when NIM_API_KEY + NIM_MODEL are set), then Gemini, then — below — the
        // knowledge file. nimChat never throws, so an NIM outage just drops through to the next one.
        let reply = nimEnabled()
            ? (await nimChat({ system: directive, history: turns.slice(-10), input: inputText })) ?? ""
            : "";

        if (!reply && process.env.GOOGLE_API_KEY) {
            const llm = new ChatGoogleGenerativeAI({
                model: "gemini-flash-latest",
                maxOutputTokens: 300,
                temperature: 0.85,
            });
            const prompt = ChatPromptTemplate.fromMessages([
                new SystemMessage(directive),
                new MessagesPlaceholder("history"),
                new HumanMessage("{input}"),
            ]);
            const lcHistory = turns.slice(-10).map((turn) =>
                turn.role === "user" ? new HumanMessage(turn.content) : new AIMessage(turn.content)
            );
            const result = await prompt.pipe(llm).invoke({ history: lcHistory, input: inputText });
            reply = typeof result.content === "string" ? result.content.trim() : "";
        }

        // The model signals "not in my file" with a marker; the ladder decides the words. A reply that looks
        // like it contains a secret is never sent.
        if (reply && looksLikeLeak(reply)) {
            return NextResponse.json({ reply: SENSITIVE_REPLY, quipSource: "sensitive" });
        }
        if (!reply || reply.includes(PAY_GRADE_MARKER)) {
            return NextResponse.json({ reply: payGradeReply(turns, kb), quipSource: "pay-grade" });
        }
        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("Concierge Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
