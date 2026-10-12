-- Website details shown on a lead's "Website" tab (live check, domain age, archive history, popularity, Google
-- PageSpeed and Chrome real-user data). Fetched on demand when the tab is opened and cached here (JSON).
ALTER TABLE sites ADD COLUMN insights TEXT;
ALTER TABLE sites ADD COLUMN insights_at TEXT;
