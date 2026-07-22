import { Pool } from 'pg';

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
