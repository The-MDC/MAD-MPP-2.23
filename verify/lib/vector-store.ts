/**
 * MAD Gambit — Vector Intelligence store (Part R build).
 *
 * Real semantic search over `market_intelligence` (sql/0004_vector.sql):
 * Gemini `text-embedding-004` (768-dim) embeddings + pgvector HNSW cosine
 * recall. Powers concierge RAG / market-pattern / satire-style lookup.
 *
 * Honesty note: this is a genuine pgvector HNSW ANN index — NOT the
 * IVF-PQ/residual-PQ/DiskANN "hybrid" some handoffs claimed. pgvector
 * implements HNSW (and IVFFlat); the FAISS-style quantization stack does not
 * exist here and is not needed at this scale.
 *
 * Untyped `pool.query()` + typed mappers (pg generic constraint avoidance).
 */
import type { Pool } from "pg";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const EMBED_MODEL = "text-embedding-004"; // 768-dim → matches market_intelligence.embedding

let embedder: GoogleGenerativeAIEmbeddings | null = null;
function getEmbedder(): GoogleGenerativeAIEmbeddings {
  if (!embedder) {
    embedder = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: EMBED_MODEL,
    });
  }
  return embedder;
}

/** True when both the DB and the embedding key are configured. */
export function vectorSearchAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL) && Boolean(process.env.GOOGLE_API_KEY);
}

/** Embed a single string into a 768-dim vector via Gemini. */
export async function embedText(text: string): Promise<number[]> {
  return getEmbedder().embedQuery(text);
}

/** pgvector literal: [a,b,c] */
function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

export interface IntelDoc {
  id: number;
  title: string;
  content: string;
  url: string | null;
  metadata: Record<string, unknown>;
  score: number; // cosine similarity 0..1 (1 = identical)
}

interface RawIntelRow {
  id: string | number;
  title: string;
  content: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
  score: string | number | null;
}

function mapRow(r: RawIntelRow): IntelDoc {
  return {
    id: Number(r.id),
    title: r.title,
    content: r.content,
    url: r.url,
    metadata: r.metadata ?? {},
    score: r.score == null ? 0 : Number(r.score),
  };
}

export interface UpsertIntelInput {
  title: string;
  content: string;
  url?: string | null;
  metadata?: Record<string, unknown>;
}

/** Embed + store one intelligence document. Returns its id. */
export async function upsertIntel(pool: Pool, doc: UpsertIntelInput): Promise<number> {
  const embedding = await embedText(`${doc.title}\n\n${doc.content}`);
  const res = await pool.query(
    `INSERT INTO market_intelligence (title, content, url, metadata, embedding)
     VALUES ($1, $2, $3, $4, $5::vector)
     RETURNING id`,
    [doc.title, doc.content, doc.url ?? null, doc.metadata ?? {}, toVectorLiteral(embedding)],
  );
  return Number((res.rows[0] as { id: string | number }).id);
}

/** Semantic nearest-neighbour search. Returns top-k by cosine similarity. */
export async function searchIntel(pool: Pool, query: string, k = 5): Promise<IntelDoc[]> {
  const embedding = await embedText(query);
  const vec = toVectorLiteral(embedding);
  const res = await pool.query(
    `SELECT id, title, content, url, metadata,
            1 - (embedding <=> $1::vector) AS score
     FROM market_intelligence
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vec, Math.max(1, Math.min(20, k))],
  );
  return (res.rows as RawIntelRow[]).map(mapRow);
}
