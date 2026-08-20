-- Pack-open counter: closes the open-pack fairness bug (grindable client nonce).
--
-- Same table, same pattern as customer_accounts.login_count (0011) — a
-- system-written, monotonic per-wallet counter. open-pack derives its pack
-- generation nonce from (wallet_address, pack_open_count) server-side instead
-- of trusting a client-supplied nonce, so retrying the request advances the
-- counter and gets a new, different roll rather than a free reroll of the
-- same one.
--
-- Idempotent: safe to re-run.

ALTER TABLE customer_accounts
  ADD COLUMN IF NOT EXISTS pack_open_count BIGINT NOT NULL DEFAULT 0;
