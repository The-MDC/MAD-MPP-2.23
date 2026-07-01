"""
MAD Gambit AI Backend — API Routes
════════════════════════════════════════════════════════════════════
Replaces the placeholder local-reply logic in these frontend files:
  components/madhatr-concierge.tsx  → POST /api/v1/concierge/chat
  components/live-ticker.tsx        → POST /api/v1/ai/satirize
  app/api/v1/madhatr/zliar/route.ts → POST /api/v1/ai/zliar

Per backend-patterns skill: centralized error handling, rate limiting
applied at the app level (see main.py), structured logging on every
call — never log the full user message body at info level (PII-ish
in a financial-prediction context), only length + latency.
════════════════════════════════════════════════════════════════════
"""

import time
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ConciergeRequest, ConciergeResponse,
    SatirizeRequest, SatirizeResponse,
    ZLiarRequest, ZLiarResponse,
)
from app.services.madhatr_persona import get_madhatr_service
from app.services.background_ai import get_background_service

logger = logging.getLogger("madgambit.ai")
router = APIRouter(prefix="/api/v1", tags=["ai"])


@router.post("/concierge/chat", response_model=ConciergeResponse)
async def concierge_chat(req: ConciergeRequest) -> ConciergeResponse:
    start = time.monotonic()
    try:
        service = get_madhatr_service()
        reply = await service.reply(
            user_text=req.message,
            history=[t.model_dump() for t in req.history],
            tone=req.tone,
            risk=req.risk,
            regen_count=req.regen_count,
        )
        logger.info(
            "concierge_chat ok",
            extra={"latency_ms": round((time.monotonic() - start) * 1000), "tone": req.tone, "msg_len": len(req.message)},
        )
        return ConciergeResponse(reply=reply, tone=req.tone, risk=req.risk)
    except Exception as exc:  # noqa: BLE001 — convert to clean API error
        logger.error("concierge_chat failed", extra={"error": str(exc)})
        raise HTTPException(status_code=502, detail="MADHAT'r is temporarily offline. Try again in a moment.")


@router.post("/ai/satirize", response_model=SatirizeResponse)
async def satirize(req: SatirizeRequest) -> SatirizeResponse:
    try:
        service = get_background_service()
        result = await service.satirize_headline(req.headline)
        return SatirizeResponse(original=req.headline, satirized=result)
    except Exception as exc:  # noqa: BLE001
        logger.error("satirize failed", extra={"error": str(exc)})
        raise HTTPException(status_code=502, detail="Satirize pipeline unavailable")


@router.post("/ai/zliar", response_model=ZLiarResponse)
async def zliar_score(req: ZLiarRequest) -> ZLiarResponse:
    try:
        service = get_background_service()
        result = await service.score_bs_index(req.statement)
        return ZLiarResponse(bs_index=result.bs_index, verdict=result.verdict, reasoning=result.reasoning)
    except Exception as exc:  # noqa: BLE001
        logger.error("zliar_score failed", extra={"error": str(exc)})
        raise HTTPException(status_code=502, detail="Z-Liar scoring unavailable")
