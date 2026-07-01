"""
MAD Gambit AI Backend — App Entrypoint
════════════════════════════════════════════════════════════════════
Run locally:  uvicorn app.main:app --reload --port 8001
Run in Docker: see Dockerfile + docker-compose.yml at repo root.
════════════════════════════════════════════════════════════════════
"""

import logging
import time
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routes.ai import router as ai_router
from app.routes.auth import router as auth_router

settings = get_settings()

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger("madgambit")

app = FastAPI(title="MAD Gambit AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Simple in-memory rate limiter (per backend-patterns skill) ────
# PLACEHOLDER-adjacent: fine for single-instance dev/staging. Prod on
# Cloud Run with >1 instance needs a shared store (Cloud Memorystore/
# Redis) since this dict doesn't share state across instances.
_request_log: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        now = time.monotonic()
        window_start = now - 60
        _request_log[client_ip] = [t for t in _request_log[client_ip] if t > window_start]
        if len(_request_log[client_ip]) >= settings.rate_limit_per_minute:
            return JSONResponse(status_code=429, content={"error": "rate_limited", "message": "Too many requests. Slow down, kid."})
        _request_log[client_ip].append(now)
    return await call_next(request)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.status_code, "message": exc.detail}})


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "gemini_model": settings.gemini_model,
        "gemma_configured": bool(settings.gemma_endpoint_url),
    }


app.include_router(ai_router)
app.include_router(auth_router)
