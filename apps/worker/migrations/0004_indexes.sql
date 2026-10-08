CREATE INDEX IF NOT EXISTS sites_qualified_status ON sites(qualified, status, audited_at);
CREATE INDEX IF NOT EXISTS sites_style ON sites(styled_at) WHERE style IS NOT NULL;
CREATE INDEX IF NOT EXISTS sites_sync ON sites(qualified, sheet_synced);
CREATE INDEX IF NOT EXISTS ai_pages_lead ON ai_pages(lead_id);
CREATE INDEX IF NOT EXISTS redesign_jobs_lead ON redesign_jobs(lead_id, id);
