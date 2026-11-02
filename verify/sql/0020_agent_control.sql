-- MAD Gambit — live-agent defense control (lib/agent-control.ts).
--
-- One row. `mode` is the master admin's standing setting for every model-backed surface:
--   normal    the agents run as usual (the in-memory circuit breaker may still raise the level on its own)
--   defended  no model calls: the concierge answers from the knowledge file, the Octavian from its written bank
--   lockdown  the agents answer with one static line
-- The AGENT_MODE environment variable is a harder switch that wins over this row. Idempotent.

CREATE TABLE IF NOT EXISTS agent_control (
  id         SMALLINT PRIMARY KEY CHECK (id = 1),
  mode       TEXT NOT NULL DEFAULT 'normal' CHECK (mode IN ('normal','defended','lockdown')),
  reason     TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO agent_control (id, mode) VALUES (1, 'normal') ON CONFLICT (id) DO NOTHING;
