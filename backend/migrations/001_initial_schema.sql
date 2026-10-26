-- Migration: 001_initial_schema
-- Description: Creates the leads table, indexes, and the updated_at trigger.
-- Applied at: startup via db/init.ts (CREATE TABLE IF NOT EXISTS approach)
--
-- NOTE ON MIGRATION STRATEGY:
-- This project uses a simple "CREATE IF NOT EXISTS" approach in db/init.ts which
-- is appropriate for single-schema, single-developer projects.
--
-- For a production multi-tenant application the recommended approach is:
--   1. Use a proper migration tool such as node-pg-migrate, Flyway, or Liquibase.
--   2. Never ALTER or DROP tables at application startup — use versioned migration
--      files like this one, applied by a separate migration step in your CI/CD
--      pipeline before deploying application code.
--   3. Tag each migration with a timestamp or sequence number (this file is 001).
--   4. Store a migrations table in the database to track which scripts have run.

CREATE TABLE IF NOT EXISTS leads (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  notes       TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'New'
                CHECK (status IN ('New', 'Contacted', 'Qualified', 'Closed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_name       ON leads (name);
CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads (email);

-- Trigger to auto-update the updated_at column on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at'
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
