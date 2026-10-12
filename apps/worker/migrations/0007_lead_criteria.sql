-- Lead criteria (email, outdated, US/EU, active) and the collected site profile. The full profile is in `lead` (JSON);
-- these columns make the criteria queryable.
ALTER TABLE sites ADD COLUMN email TEXT;              -- first public email address
ALTER TABLE sites ADD COLUMN active INTEGER;          -- 1: activity found inside the window, 0: not, NULL: not checked
ALTER TABLE sites ADD COLUMN last_activity TEXT;      -- latest dated activity evidence (ISO date)
ALTER TABLE sites ADD COLUMN reject_reason TEXT;      -- why an audited site did not qualify ("; "-joined)
CREATE INDEX IF NOT EXISTS sites_active ON sites(qualified, active, last_activity);
