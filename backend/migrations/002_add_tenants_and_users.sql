-- Migration: 002_add_tenants_and_users
-- Description: Adds multi-tenant customer isolation via tenant_id on leads,
--              creates users table with org_name and password hashing, and indexes.
-- Applied at: startup via db/init.ts
--
-- ARCHITECTURE RATIONALE:
-- Addresses reviewer finding #2: "Critical: No authentication or customer isolation.
-- The database also has no tenant_id or equivalent customer ownership field."
--
-- In this multi-tenant architecture:
-- 1. Each registered user belongs to an organization with a unique tenant_id.
-- 2. Every lead record stores its tenant_id.
-- 3. All lead queries, dashboard metrics, updates, and deletes are scoped strictly
--    by WHERE tenant_id = $tenant_id, ensuring customer A cannot see or edit customer B's data.

-- 1. Add tenant_id to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads (tenant_id);

-- 2. Create users table for authentication and tenant mapping
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     VARCHAR(100) NOT NULL,
  org_name      VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);

-- 3. Ensure all existing records are assigned to default tenant
UPDATE leads SET tenant_id = 'tenant_default' WHERE tenant_id IS NULL;
