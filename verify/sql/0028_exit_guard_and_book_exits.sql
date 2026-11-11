-- 0028 — the exit ticket guard, and the ledger the sell path writes to.
--
-- 1. TICKET GUARD (do this before the sell path, or the free option comes back through the other side).
--    An exit is one column on the position row (`perp_positions.exit_status`), and the application moves it with a
--    compare-and-set (`WHERE exit_status = 'active'`). That already allows at most one live exit per position. This
--    migration makes the DATABASE enforce it too, so a new code path cannot get around the handler:
--      * exit_status may only be 'active', 'cooling' or 'redeemed';
--      * it only moves forward: active -> cooling -> redeemed. There is no cancel, so there is no
--        request / cancel / re-request loop to farm, and a redeemed position can never be redeemed again.
--
-- 2. BOOK EXITS. Selling shares back to the book (lib/lmsr-sell.ts) is recorded here, append-only, one row per sale:
--    the proceeds are not a promise made at some earlier price, they are what the book returned at the moment of the sale.
--    A holding is Σ(bets.shares) − Σ(book_exits.shares) per wallet and outcome, computed under the book's row lock.
--    `idem_key` makes a retried request a no-op instead of a second sale.
--
-- Additive and idempotent. Needs 0027 (forbid_mutation()).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perp_positions_exit_status_chk') THEN
    ALTER TABLE perp_positions
      ADD CONSTRAINT perp_positions_exit_status_chk CHECK (exit_status IN ('active', 'cooling', 'redeemed')) NOT VALID;
  END IF;
END $$;
ALTER TABLE perp_positions VALIDATE CONSTRAINT perp_positions_exit_status_chk;

CREATE OR REPLACE FUNCTION perp_positions_exit_forward_only() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.exit_status IS DISTINCT FROM OLD.exit_status THEN
    IF NOT ((OLD.exit_status = 'active' AND NEW.exit_status = 'cooling')
         OR (OLD.exit_status = 'cooling' AND NEW.exit_status = 'redeemed')) THEN
      RAISE EXCEPTION 'exit_status may only move active -> cooling -> redeemed (tried % -> %)', OLD.exit_status, NEW.exit_status
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS perp_positions_exit_forward_only ON perp_positions;
CREATE TRIGGER perp_positions_exit_forward_only BEFORE UPDATE ON perp_positions
  FOR EACH ROW EXECUTE FUNCTION perp_positions_exit_forward_only();

CREATE TABLE IF NOT EXISTS book_exits (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  side           TEXT NOT NULL,                       -- the outcome label sold
  shares         NUMERIC NOT NULL CHECK (shares > 0),
  gross_proceeds NUMERIC NOT NULL CHECK (gross_proceeds > 0),
  fee            NUMERIC NOT NULL CHECK (fee >= 0),
  net_proceeds   NUMERIC NOT NULL CHECK (net_proceeds > 0),
  alpha          NUMERIC NOT NULL CHECK (alpha >= 1), -- the α used (never above the α the position was bought at)
  price_before   NUMERIC NOT NULL,
  price_after    NUMERIC NOT NULL,
  idem_key       TEXT NOT NULL,                       -- a retried request must not sell twice
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT book_exits_net_matches CHECK (abs(net_proceeds - (gross_proceeds - fee)) < 0.000001),
  CONSTRAINT book_exits_idem UNIQUE (market_id, wallet_address, idem_key)
);
CREATE INDEX IF NOT EXISTS idx_book_exits_holding ON book_exits (market_id, wallet_address, side);

DO $$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS book_exits_append_only ON book_exits';
  EXECUTE 'CREATE TRIGGER book_exits_append_only BEFORE UPDATE OR DELETE ON book_exits FOR EACH ROW EXECUTE FUNCTION forbid_mutation()';
  EXECUTE 'DROP TRIGGER IF EXISTS book_exits_no_truncate ON book_exits';
  EXECUTE 'CREATE TRIGGER book_exits_no_truncate BEFORE TRUNCATE ON book_exits FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation()';
  EXECUTE 'ALTER TABLE book_exits ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON book_exits FROM anon';
    EXECUTE 'REVOKE ALL ON SEQUENCE book_exits_id_seq FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON book_exits FROM authenticated';
    EXECUTE 'REVOKE ALL ON SEQUENCE book_exits_id_seq FROM authenticated';
  END IF;
END $$;
