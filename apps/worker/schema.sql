CREATE TABLE IF NOT EXISTS sites (
  id            TEXT PRIMARY KEY,           -- normalized host
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL,
  region        TEXT NOT NULL,
  website       TEXT NOT NULL,
  candidate     TEXT NOT NULL,              -- JSON Candidate
  state         TEXT NOT NULL DEFAULT 'pending', -- pending | audited | failed
  score         INTEGER,
  qualified     INTEGER NOT NULL DEFAULT 0,
  lead          TEXT,                       -- JSON Lead once audited
  status        TEXT NOT NULL DEFAULT 'new',-- new | contacted | replied | won | lost | ignored
  sheet_synced  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  audited_at    TEXT,
  email         TEXT,                       -- first public email address
  active        INTEGER,                    -- activity found inside the window (1/0), NULL when not checked
  last_activity TEXT,                       -- latest dated activity evidence (ISO date)
  reject_reason TEXT                        -- why an audited site did not qualify
);
CREATE INDEX IF NOT EXISTS sites_state ON sites(state, created_at);
CREATE INDEX IF NOT EXISTS sites_qualified ON sites(qualified, audited_at);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
