import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load the local environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initDB() {
  console.log("Connecting to Postgres...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    console.log("Initializing pgvector database schema...");

    // 1. Enable pgvector
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log("✅ Extension 'vector' enabled.");

    // 2. Create the intelligence table
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_intelligence (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        metadata JSONB,
        embedding vector(768),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'market_intelligence' created or verified.");

    // 3. Create the HNSW index for fast vector search
    // Using vector_cosine_ops which is ideal for text embeddings
    await client.query(`
      CREATE INDEX IF NOT EXISTS market_intelligence_embedding_idx 
      ON market_intelligence 
      USING hnsw (embedding vector_cosine_ops);
    `);
    console.log("✅ HNSW index created on embedding column.");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  } finally {
    await client.end();
  }
}

initDB();
