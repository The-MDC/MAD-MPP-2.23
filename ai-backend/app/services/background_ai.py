"""
MAD Gambit AI Backend — Background Tasks Service (Gemma)
════════════════════════════════════════════════════════════════════
Routes high-volume, latency-sensitive calls to self-hosted Gemma
instead of hosted Gemini. Two real use cases in the existing codebase:

  1. live-ticker.tsx satirize() — rewrites RSS headlines in the
     MADHAT'r voice for the scrolling ticker. Runs on every feed poll
     (every 5 min per app/api/v1/feeds/route.ts ISR config) across
     however many headlines are in the feed. Cheap model, short output,
     high call volume — exactly Gemma's use case.
  2. Z-Liar BS-Index scoring (app/api/v1/madhatr/zliar/route.ts) —
     sentiment/plausibility scoring on user-submitted statements.
     Structured numeric output, doesn't need Gemini-tier reasoning.

Falls back to Gemini if GEMMA_ENDPOINT_URL isn't configured yet
(local dev / before the Vertex AI Model Garden deployment exists) —
see config.py for the placeholder note.
════════════════════════════════════════════════════════════════════
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from app.core.config import get_settings


class BsIndexResult(BaseModel):
    bs_index: float = Field(ge=0, le=100, description="0=fully credible, 100=total fabrication")
    verdict: str = Field(description="One of: CREDIBLE, SUSPECT, LIKELY_FALSE, FABRICATED")
    reasoning: str = Field(description="One sentence, MADHAT'r voice")


SATIRIZE_SYSTEM = (
    "You are The MADHAT'r, MAD Gambit's Jersey-accented satirical news host. "
    "Rewrite the given headline in one short, punchy sentence in your voice — "
    "MAD Magazine meets South Park. Keep it under 20 words. Do not add commentary "
    "outside the rewritten headline itself."
)

ZLIAR_SYSTEM = (
    "You are the Sentinel — MAD Gambit's BS-Index scoring agent. Given a user "
    "statement, score its plausibility from 0 (fully credible) to 100 (total "
    "fabrication). Respond ONLY with JSON matching this schema: "
    '{"bs_index": <float 0-100>, "verdict": "CREDIBLE|SUSPECT|LIKELY_FALSE|FABRICATED", '
    '"reasoning": "<one sentence, MADHAT\'r Jersey voice>"}'
)


class BackgroundAiService:
    """Gemma-first background task router. Falls back to Gemini flash
    if no Gemma endpoint is configured (keeps local dev working before
    infra is provisioned)."""

    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._using_gemma = bool(settings.gemma_endpoint_url)

        if self._using_gemma:
            url = settings.gemma_endpoint_url
            is_local = any(x in url for x in ["localhost", "127.0.0.1", "host.docker.internal", "11434"])
            if is_local:
                from langchain_community.chat_models import ChatOllama
                model_name = settings.gemma_model if settings.gemma_model else "gemma2:9b"
                self._llm = ChatOllama(
                    base_url=url,
                    model=model_name,
                    temperature=0.7,
                )
            else:
                self._llm = ChatGoogleGenerativeAI(
                    model=settings.gemma_model,
                    google_api_key=settings.google_api_key or None,
                    temperature=0.7,
                )
        else:
            # Fallback: Gemini flash, same interface, until Gemma is deployed.
            self._llm = ChatGoogleGenerativeAI(
                model=settings.gemini_model,
                google_api_key=settings.google_api_key or None,
                temperature=0.7,
            )

    async def satirize_headline(self, headline: str) -> str:
        messages = [
            SystemMessage(content=SATIRIZE_SYSTEM),
            HumanMessage(content=headline),
        ]
        result = await self._llm.ainvoke(messages)
        return result.content.strip()

    async def score_bs_index(self, statement: str) -> BsIndexResult:
        parser = JsonOutputParser(pydantic_object=BsIndexResult)
        messages = [
            SystemMessage(content=ZLIAR_SYSTEM),
            HumanMessage(content=statement),
        ]
        raw = await self._llm.ainvoke(messages)
        parsed = parser.parse(raw.content)
        return BsIndexResult(**parsed)


_bg_service: BackgroundAiService | None = None


def get_background_service() -> BackgroundAiService:
    global _bg_service
    if _bg_service is None:
        _bg_service = BackgroundAiService()
    return _bg_service
