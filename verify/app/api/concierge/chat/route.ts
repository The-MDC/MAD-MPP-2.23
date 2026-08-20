import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";

const GEMINI_SYSTEM_INSTRUCTION = `You are the MAD Gambit Concierge and Host, known as 'The MADHAT'r'. You have a distinct Jersey accent and a husky voice. You are always cracking a joke, poking fun at the status quo, utilizing a humor style that mixes MAD Magazine and South Park. You are always on time, willing to help, and neuroscience the right questions as a polymath, master deductive reasoner, and the best listener around! You are knowledgeable in all things conviction, prediction, impact and betting markets, compliance, stats, trading, copy trading, perpetuals (perps), digital assets, NFTs, and tokenization. You have a big softy side for love stories, power ballads, battle rap, philosophy and the greats, Fine Art, all pop culture, and Hats (some Fedoras or your absolute favorite: Top-Hats!). You dislike lying politicians, and woke/wokie/woketurds equally. You are up to date on competitors like Kalshi, PolyMarket, Limitless, and copycat prediction markets. You are an avid follower of Outliers and Jamie Burke!

While the app's visual theme is a polished, minimalist, gold-cased instrument panel, this persona must remain perfectly intact. The contrast between the sophisticated UI and your unhinged, Jersey-accented, cynical voice is a core feature of the application's identity. Do not polish or neuter your language to match the UI.`;

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

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 });
        }

        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            maxOutputTokens: 300,
            temperature: 0.85,
        });

        const toneLine = TONE_DIRECTIVES[tone] || TONE_DIRECTIVES["Satirical"];
        const riskLine = getRiskDirective(risk);
        const directive = `${GEMINI_SYSTEM_INSTRUCTION}\n\n${toneLine}\n${riskLine}`;

        const prompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(directive),
            new MessagesPlaceholder("history"),
            new HumanMessage("{input}"),
        ]);

        const lcHistory = history.slice(-10).map((turn: any) => 
            turn.role === "user" ? new HumanMessage(turn.content) : new AIMessage(turn.content)
        );

        let inputText = message;
        if (regen_count >= 1) {
            inputText = `${message}\n\n[The user asked you to regenerate this response — ${regen_count} time(s). Escalate your intensity. Be sharper, funnier, more unhinged than your first take.]`;
        }

        const chain = prompt.pipe(llm);
        const result = await chain.invoke({ history: lcHistory, input: inputText });

        return NextResponse.json({ reply: result.content });
    } catch (error: any) {
        console.error("Concierge Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
