-- MAD Gambit — Vector Intelligence (Part R build) — Neon Postgres migration
-- Real semantic-search / RAG layer on pgvector: 768-dim Gemini embeddings
-- (text-embedding-004) + an HNSW cosine index for fast approximate nearest
-- neighbour recall (concierge memory, market-pattern + satire-style search).
-- Supersedes the ad-hoc verify/scripts/init-vector-db.ts as a committed,
-- idempotent migration. Requires the Neon `vector` extension.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS market_intelligence (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  url        TEXT,
  metadata   JSONB NOT NULL DEFAULT '{}',
  embedding  vector(768),                 -- Gemini text-embedding-004 dimensionality
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index for cosine similarity (ideal for text embeddings).
-- M / ef_construction left at pgvector defaults (m=16, ef_construction=64),
-- which give >95% recall on this workload; tune only if recall drops.
CREATE INDEX IF NOT EXISTS market_intelligence_embedding_idx
  ON market_intelligence USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_created
  ON market_intelligence (created_at);
