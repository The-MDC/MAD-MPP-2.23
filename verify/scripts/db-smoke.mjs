/**
 * MAD Gambit — live DB smoke test.
 *
 * Proves the real backend path end-to-end against DATABASE_URL: it writes and
 * reads a row in every core table the API depends on, then ROLLS BACK so no test
 * data persists. If this passes in CI (against the ephemeral Neon branch), the
 * schema is genuinely applied and the app's live read/write path works — this is
 * the check that separates a real backend from a demo-only facade.
 *
 *   DATABASE_URL=postgres://... node scripts/db-smoke.mjs
 */
import pg from "pg";

const { Client } = pg;
const ZERO = "0x0000000000000000000000000000000000000000";

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ smoke assert failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set — cannot smoke-test.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO events_stream (event_type, wallet_address, payload)
       VALUES ('smoke_test', $1, '{"smoke":true}')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM events_stream WHERE event_type='smoke_test'`)).rows[0].n >= 1,
      "events_stream write+read",
    );

    await client.query(
      `INSERT INTO shield_positions (wallet_address, tier, stake_amount, premium_paid, status, return_window_hours)
       VALUES ($1, 'standard', 1000, 20, 'active', 2)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM shield_positions WHERE wallet_address=$1`, [ZERO])).rows[0].n >= 1,
      "shield_positions write+read",
    );

    await client.query(
      `INSERT INTO cards (wallet_address, card_uid, rarity) VALUES ($1, 'smoke_card', 'Common')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM cards WHERE card_uid='smoke_card'`)).rows[0].n >= 1,
      "cards write+read",
    );

    await client.query(`INSERT INTO celebrity_whitelist (name) VALUES ('smoke celeb') ON CONFLICT DO NOTHING`);
    await client.query(`INSERT INTO gdelt_signals (headline, perp_probability) VALUES ('smoke headline', 0.5)`);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM gdelt_signals WHERE headline='smoke headline'`)).rows[0].n >= 1,
      "gdelt_signals write+read",
    );

    await client.query(`INSERT INTO market_intelligence (title, content) VALUES ('smoke title', 'smoke content')`);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM market_intelligence WHERE title='smoke title'`)).rows[0].n >= 1,
      "market_intelligence write+read",
    );

    await client.query(
      `INSERT INTO card_stats (id, owner, evolution_level) VALUES ('smoke_card_stats', $1, 1)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM card_stats WHERE id='smoke_card_stats'`)).rows[0].n >= 1,
      "card_stats write+read",
    );

    await client.query(
      `INSERT INTO markets (id, title, creator_wallet) VALUES ('smoke_market', 'Smoke market?', $1)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM markets WHERE id='smoke_market'`)).rows[0].n >= 1,
      "markets write+read",
    );

    await client.query(
      `INSERT INTO bets (market_id, wallet_address, side, amount, odds_at_bet)
       VALUES ('smoke_market', $1, 'YES', 100, 2.0)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM bets WHERE market_id='smoke_market'`)).rows[0].n >= 1,
      "bets write+read",
    );

    await client.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, details) VALUES ('market','smoke_market','create','{"smoke":true}')`,
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM audit_log WHERE entity_id='smoke_market'`)).rows[0].n >= 1,
      "audit_log write+read",
    );

    console.log("✅ DB smoke passed — live read/write verified across all core tables");
  } catch (err) {
    console.error(`❌ smoke failed: ${err.message}`);
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
    process.exit(1);
  }

  await client.query("ROLLBACK"); // leave no test data
  await client.end();
}

main().catch((err) => {
  console.error("❌ smoke crashed:", err);
  process.exit(1);
});
