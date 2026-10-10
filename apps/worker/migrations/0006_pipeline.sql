-- Redesign pipeline: stages, heartbeats, retries with backoff, failure kinds, QA scorecards, cost, events.
-- Job status: queued | running | needs_review | done | failed | cancelled
-- Stage while running: researching | designing | building | qa | refining | uploading
ALTER TABLE redesign_jobs ADD COLUMN stage TEXT;
ALTER TABLE redesign_jobs ADD COLUMN progress TEXT;
ALTER TABLE redesign_jobs ADD COLUMN heartbeat_at TEXT;
ALTER TABLE redesign_jobs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE redesign_jobs ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE redesign_jobs ADD COLUMN run_after TEXT;
ALTER TABLE redesign_jobs ADD COLUMN failure_kind TEXT;           -- technical | unreachable | quality | cancelled
ALTER TABLE redesign_jobs ADD COLUMN direction TEXT;              -- creative direction id
ALTER TABLE redesign_jobs ADD COLUMN forced_theme TEXT;           -- theme the owner picked in the portal
ALTER TABLE redesign_jobs ADD COLUMN qa TEXT;                     -- JSON scorecard
ALTER TABLE redesign_jobs ADD COLUMN qa_score REAL;
ALTER TABLE redesign_jobs ADD COLUMN cost_usd REAL;
ALTER TABLE redesign_jobs ADD COLUMN duration_s INTEGER;
ALTER TABLE redesign_jobs ADD COLUMN runner TEXT;
ALTER TABLE redesign_jobs ADD COLUMN reviewed_at TEXT;

-- One active job per lead, enforced by the database (no duplicate processing even if two requests race).
CREATE UNIQUE INDEX IF NOT EXISTS redesign_jobs_one_active ON redesign_jobs(lead_id) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS redesign_jobs_claim ON redesign_jobs(status, run_after, created_at);
CREATE INDEX IF NOT EXISTS redesign_jobs_finished ON redesign_jobs(finished_at);

CREATE TABLE IF NOT EXISTS job_events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id  INTEGER NOT NULL,
  at      TEXT NOT NULL DEFAULT (datetime('now')),
  stage   TEXT,
  level   TEXT NOT NULL DEFAULT 'info',   -- info | warn | error
  message TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS job_events_job ON job_events(job_id, id);
