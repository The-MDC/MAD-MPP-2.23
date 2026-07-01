"""
MAD Gambit AI Backend — MADHAT'r Persona Service
════════════════════════════════════════════════════════════════════
Real LangChain orchestration for the concierge. Replaces the frontend's
canned local reply banks (components/madhatr-concierge.tsx REPLIES
constant) — that file's local logic becomes the offline/dev fallback,
this service is the production path.

GEMINI_SYSTEM_INSTRUCTION is the verbatim string recovered from
MAD-MPP-2.23/GEMINI.md this session — injected unmodified. Tone and
risk parameters are appended as a runtime directive, NOT baked into
the base system prompt, so the core persona never drifts between
requests regardless of which tone/risk the user has dialed in.
════════════════════════════════════════════════════════════════════
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import get_settings

# Verbatim from MAD-MPP-2.23/GEMINI.md — do not edit for tone, do not shorten.
GEMINI_SYSTEM_INSTRUCTION = (
    "You are the MAD Gambit Concierge and Host, known as 'The MADHAT'r'. You have a "
    "distinct Jersey accent and a husky voice. You are always cracking a joke, poking "
    "fun at the status quo, utilizing a humor style that mixes MAD Magazine and South "
    "Park. You are always on time, willing to help, and neuroscience the right "
    "questions as a polymath, master deductive reasoner, and the best listener "
    "around! You are knowledgeable in all things conviction, prediction, impact and "
    "betting markets, compliance, stats, trading, copy trading, perpetuals (perps), "
    "digital assets, NFTs, and tokenization. You have a big softy side for love "
    "stories, power ballads, battle rap, philosophy and the greats, Fine Art, all pop "
    "culture, and Hats (some Fedoras or your absolute favorite: Top-Hats!). You "
    "dislike lying politicians, and woke/wokie/woketurds equally. You are up to date "
    "on competitors like Kalshi, PolyMarket, Limitless, and copycat prediction "
    "markets. You are an avid follower of Outliers and Jamie Burke!"
    "\n\n"
    "While the app's visual theme is a polished, minimalist, gold-cased instrument "
    "panel, this persona must remain perfectly intact. The contrast between the "
    "sophisticated UI and your unhinged, Jersey-accented, cynical voice is a core "
    "feature of the application's identity. Do not polish or neuter your language "
    "to match the UI."
)

TONE_DIRECTIVES = {
    "Satirical": "Stay in your default satirical, joking voice — MAD Magazine meets South Park.",
    "Controversial": "Lean harder into controversial, no-filter takes — say the thing everyone's thinking.",
    "Analytical": "Drop the jokes for this response. Give a precise, data-grounded, analytical answer — still in your voice, but focused.",
}


def _risk_directive(risk: float) -> str:
    if risk < 0.25:
        return "Risk posture: ANALYTICAL AND COMPLIANT. Favor caution, mention the MAD Shield, avoid egging on big bets."
    if risk < 0.5:
        return "Risk posture: LOW RISK. Measured takes, no hype."
    if risk < 0.75:
        return "Risk posture: MEDIUM RISK. Normal degen energy."
    if risk < 0.9:
        return "Risk posture: HIGH-VOLATILITY BIAS. Lean into the upside, less hand-wringing about downside."
    return "Risk posture: MAX DEGEN. Full send energy — no caution, all conviction."


class MadhatrPersonaService:
    """Orchestrates a single MADHAT'r turn via Gemini, with tone/risk
    injected as a per-request directive layered on top of the fixed
    system instruction."""

    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key or None,
            temperature=0.85,  # high — the persona is explicitly "unhinged", not a compliance bot
            max_output_tokens=300,
        )

    def _build_prompt(self, tone: str, risk: float) -> ChatPromptTemplate:
        tone_line = TONE_DIRECTIVES.get(tone, TONE_DIRECTIVES["Satirical"])
        risk_line = _risk_directive(risk)
        directive = f"{GEMINI_SYSTEM_INSTRUCTION}\n\n{tone_line}\n{risk_line}"
        return ChatPromptTemplate.from_messages([
            SystemMessage(content=directive),
            MessagesPlaceholder(variable_name="history"),
            HumanMessage(content="{input}"),
        ])

    async def reply(
        self,
        user_text: str,
        history: list[dict[str, str]],
        tone: str = "Satirical",
        risk: float = 0.75,
        regen_count: int = 0,
    ) -> str:
        """Generate one MADHAT'r reply. `history` is a list of
        {"role": "user"|"assistant", "content": str} in chronological
        order. `regen_count` > 0 nudges the model to escalate intensity,
        matching the frontend's REGEN (SP-LEVEL) mechanic."""
        prompt = self._build_prompt(tone, risk)

        lc_history = []
        for turn in history[-10:]:  # cap context — last 10 turns
            if turn["role"] == "user":
                lc_history.append(HumanMessage(content=turn["content"]))
            else:
                lc_history.append(AIMessage(content=turn["content"]))

        chain = prompt | self._llm

        input_text = user_text
        if regen_count >= 1:
            input_text = (
                f"{user_text}\n\n[The user asked you to regenerate this response — "
                f"{regen_count} time(s). Escalate your intensity. Be sharper, funnier, "
                f"more unhinged than your first take.]"
            )

        result = await chain.ainvoke({"history": lc_history, "input": input_text})
        return result.content


_service: MadhatrPersonaService | None = None


def get_madhatr_service() -> MadhatrPersonaService:
    global _service
    if _service is None:
        _service = MadhatrPersonaService()
    return _service
