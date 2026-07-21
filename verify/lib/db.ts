import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

let pool: Pool | undefined;

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Neon pooled connection cap
      max: 10,
    });
  }
  return pool;
}

/**
 * Drizzle ORM client over the Neon Postgres pool, typed against ./schema.
 * When DATABASE_URL is unset the pool is still constructed (pg connects
 * lazily); queries throw on first use so callers can fall back to demo data.
 */
export const db = drizzle(getDbPool(), { schema });
