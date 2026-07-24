-- MAD Gambit — GDELT ingest idempotency (Phase 1 of the dual-ingestion engine).
-- A partial-unique index on url so the live scandal-scraper can upsert with
-- ON CONFLICT (url) DO NOTHING and never double-count the same juicy headline.
-- Partial (WHERE url IS NOT NULL) because historical/manual rows may carry NULL
-- urls, and Postgres treats NULLs as distinct anyway. Idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_gdelt_signals_url_uniq
  ON gdelt_signals (url) WHERE url IS NOT NULL;
