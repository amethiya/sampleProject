-- Full-site crawl + Claude redesign jobs
ALTER TABLE sites ADD COLUMN site TEXT;  -- JSON SiteSnapshot (all crawled pages)

CREATE TABLE IF NOT EXISTS redesign_jobs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued',  -- queued | running | done | failed
  error       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  started_at  TEXT,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS redesign_jobs_status ON redesign_jobs(status, created_at);

CREATE TABLE IF NOT EXISTS ai_pages (
  lead_id    TEXT NOT NULL,
  slug       TEXT NOT NULL,
  html       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lead_id, slug)
);
