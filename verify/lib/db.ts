import { Pool } from 'pg';

let pool: Pool | undefined;

export function getDbPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    // Neon requires TLS. If the connection string doesn't already request an SSL
    // mode, enforce a verified TLS connection (Neon presents valid certs).
    const needsSsl = !!connectionString && !/sslmode=/.test(connectionString);

    pool = new Pool({
      connectionString,
      max: 10, // Neon pooled connection cap
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ...(needsSsl ? { ssl: { rejectUnauthorized: true } } : {}),
    });

    // A background error on an idle client (e.g. Neon closing an idle
    // connection) must not crash the process — log it and let the pool recycle.
    pool.on('error', (err) => {
      console.error('[db] unexpected idle client error', err);
    });
  }
  return pool;
}
