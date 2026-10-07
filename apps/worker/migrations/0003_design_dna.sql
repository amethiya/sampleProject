-- Every redesign gets its own design DNA (palette|fonts|hero|corners|concept)
ALTER TABLE sites ADD COLUMN style TEXT;
ALTER TABLE sites ADD COLUMN styled_at TEXT;
ALTER TABLE redesign_jobs ADD COLUMN style TEXT;
