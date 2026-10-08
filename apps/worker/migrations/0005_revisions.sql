-- What the owner asked for on each Claude redesign, and whether it revises the previous version or starts fresh.
ALTER TABLE redesign_jobs ADD COLUMN notes TEXT;
ALTER TABLE redesign_jobs ADD COLUMN mode TEXT NOT NULL DEFAULT 'fresh';
