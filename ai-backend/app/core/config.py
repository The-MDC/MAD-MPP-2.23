"""
MAD Gambit AI Backend — Core Configuration
════════════════════════════════════════════════════════════════════
Stack: FastAPI + LangChain + Google Gemini (hosted API) / Gemma (self-hosted
open-weights, via Vertex AI or local inference) + Cloud SQL Postgres.

Model routing rationale:
  Gemini (gemini-1.5-flash / gemini-1.5-pro via Google AI Studio or
    Vertex AI) — used for the MADHAT'r concierge, Z-Liar meter analysis,
    and anything needing strong instruction-following + long context.
  Gemma (gemma-2-9b-it or similar, self-hosted via Vertex AI Model
    Garden or a local container) — used for cheap, high-volume, latency-
    sensitive tasks: live ticker satirize() calls, background sentiment
    scoring — anywhere cost-per-call matters more than top-tier reasoning.

This split is a real architecture decision, not a placeholder: hosted
Gemini for the "voice" the user directly talks to, self-hosted Gemma
for background/batch work that runs constantly and would be expensive
on a hosted API.
════════════════════════════════════════════════════════════════════
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ── Google Cloud / Vertex AI ──────────────────────────────────
    google_cloud_project: str = Field(default="", alias="GOOGLE_CLOUD_PROJECT")
    google_cloud_region: str = Field(default="us-central1", alias="GOOGLE_CLOUD_REGION")

    # PLACEHOLDER — real key required before deployment. Use Google AI
    # Studio key for gemini-*-flash/pro, or leave empty and use Vertex AI
    # application-default credentials instead (recommended for prod).
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")

    # ── Model selection ────────────────────────────────────────────
    gemini_model: str = Field(default="gemini-1.5-flash", alias="GEMINI_MODEL")
    gemma_model: str = Field(default="gemma-2-9b-it", alias="GEMMA_MODEL")
    # PLACEHOLDER — self-hosted Gemma endpoint (Vertex AI Model Garden
    # deployment, or a local Ollama/vLLM container). Empty = Gemma calls
    # fall back to Gemini until this is provisioned.
    gemma_endpoint_url: str = Field(default="", alias="GEMMA_ENDPOINT_URL")

    # ── Database — Cloud SQL Postgres (replaces Supabase) ─────────
    # PLACEHOLDER — real Cloud SQL connection string required before
    # deployment. Local dev uses the docker-compose Postgres container.
    database_url: str = Field(
        default="postgresql://madgambit:madgambit@localhost:5432/madgambit",
        alias="DATABASE_URL",
    )

    # ── App ──────────────────────────────────────────────────────
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    # ── Rate limiting (per backend-patterns skill) ─────────────────
    rate_limit_per_minute: int = Field(default=30, alias="RATE_LIMIT_PER_MINUTE")

    # ── Auth ───────────────────────────────────────────────────────
    jwt_secret: str = Field(default="super-secret-default-key-change-in-prod", alias="JWT_SECRET")

    class Config:
        env_file = ".env"
        populate_by_name = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
