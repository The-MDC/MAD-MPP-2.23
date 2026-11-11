-- 0026b — close the function-execute hole in schema public (Supabase).
--
-- Applied to the Supabase project MADGambit-MMP on 2026-11-02 as migration
-- `mad_0026b_revoke_public_function_execute` and never committed here; this file is that exact
-- statement set, so the repository and the database agree. Idempotent: every statement is a
-- REVOKE or a guarded DO block, so re-running it (or running it on a database that has no
-- `anon`/`authenticated` roles, such as Neon) changes nothing.
--
-- Why: Postgres grants EXECUTE on new functions to PUBLIC by default, and Supabase exposes
-- schema `public` over its Data API. Nothing in this app is meant to be callable that way —
-- the server connects as the owner — so revoke it, and make that the default for new functions.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon'; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE 'REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated'; END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
