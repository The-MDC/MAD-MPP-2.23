import { Pool } from 'pg';
import { ensureDatabaseUrlEnv } from '@/lib/database-url';

let pool: Pool | undefined;

export function getDbPool() {
  if (!pool) {
    const connectionString = ensureDatabaseUrlEnv();

    // Neon requires TLS, and we pin CERTIFICATE VERIFICATION here explicitly
    // rather than letting the connection string's `sslmode` decide it.
    //
    // Why this is not redundant with `sslmode=require` (which Neon's injected
    // DATABASE_URL carries): production build logs currently emit
    //
    //   SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca'
    //   are treated as aliases for 'verify-full'. In the next major version
    //   (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt
    //   standard libpq semantics, which have weaker security guarantees.
    //
    // Today `require` happens to mean verify-full. Under libpq semantics it
    // means "encrypt, but do not verify the certificate" — which silently
    // opens a MITM window on a dependency bump, with no code change and no
    // error to notice. An explicit `ssl` object on the Pool config takes
    // precedence over the connection string, so verification stays on across
    // that upgrade regardless of which sslmode the platform injects.
    //
    // Deliberately NOT `rejectUnauthorized: false` (as some Neon quickstarts
    // suggest) — Neon presents valid publicly-trusted certs, so verification
    // costs nothing and disabling it is the exact weakening warned about above.
    pool = new Pool({
      connectionString,
      max: 10, // Neon pooled connection cap
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: true },
    });

    // A background error on an idle client (e.g. Neon closing an idle
    // connection) must not crash the process — log it and let the pool recycle.
    pool.on('error', (err) => {
      console.error('[db] unexpected idle client error', err);
    });
  }
  return pool;
}
