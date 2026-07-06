import { Pool } from 'pg';

let pool: Pool | undefined;

export function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Vercel Postgres max connections
      max: 10,
    });
  }
  return pool;
}
