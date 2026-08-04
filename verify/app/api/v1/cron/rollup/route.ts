import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";

/**
 * Rollup cron — folds events_stream into the analytics aggregates
 * (agg_platform_hourly + agg_user_daily). Wire to a Vercel Cron; guarded by
 * CRON_SECRET (Bearer) when set. Idempotent (ON CONFLICT upserts).
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasDatabaseUrl())
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 503 });

  try {
    const pool = getDbPool();

    await pool.query(`
      INSERT INTO agg_platform_hourly (bucket, events, unique_wallets, by_type, updated_at)
      SELECT b.bucket, b.events, b.unique_wallets, COALESCE(t.by_type, '{}'::jsonb), now()
      FROM (
        SELECT date_trunc('hour', created_at) AS bucket,
               count(*) AS events,
               count(DISTINCT wallet_address) AS unique_wallets
        FROM events_stream
        WHERE created_at > now() - interval '48 hours'
        GROUP BY 1
      ) b
      LEFT JOIN (
        SELECT bucket, jsonb_object_agg(event_type, cnt) AS by_type FROM (
          SELECT date_trunc('hour', created_at) AS bucket, event_type, count(*) AS cnt
          FROM events_stream
          WHERE created_at > now() - interval '48 hours'
          GROUP BY 1, 2
        ) x GROUP BY bucket
      ) t ON t.bucket = b.bucket
      ON CONFLICT (bucket) DO UPDATE
        SET events = EXCLUDED.events, unique_wallets = EXCLUDED.unique_wallets,
            by_type = EXCLUDED.by_type, updated_at = now();
    `);

    await pool.query(`
      INSERT INTO agg_user_daily (wallet_address, day, events, by_type)
      SELECT d.wallet_address, d.day, d.events, COALESCE(t.by_type, '{}'::jsonb)
      FROM (
        SELECT wallet_address, date_trunc('day', created_at)::date AS day, count(*) AS events
        FROM events_stream
        WHERE created_at > now() - interval '7 days' AND wallet_address IS NOT NULL
        GROUP BY 1, 2
      ) d
      LEFT JOIN (
        SELECT wallet_address, day, jsonb_object_agg(event_type, cnt) AS by_type FROM (
          SELECT wallet_address, date_trunc('day', created_at)::date AS day, event_type, count(*) AS cnt
          FROM events_stream
          WHERE created_at > now() - interval '7 days' AND wallet_address IS NOT NULL
          GROUP BY 1, 2, 3
        ) x GROUP BY wallet_address, day
      ) t ON t.wallet_address = d.wallet_address AND t.day = d.day
      ON CONFLICT (wallet_address, day) DO UPDATE
        SET events = EXCLUDED.events, by_type = EXCLUDED.by_type;
    `);

    return NextResponse.json({ success: true, rolledAt: new Date().toISOString() });
  } catch (e) {
    console.error("cron/rollup error:", e);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
