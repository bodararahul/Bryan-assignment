import { query } from './connection';
import { hashPassword } from '../utils/password';

export const initializeDatabase = async (): Promise<void> => {
  // 1. Create leads table with UUID primary key
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(255) NOT NULL,
      email       VARCHAR(255) NOT NULL,
      phone       VARCHAR(50),
      notes       TEXT,
      status      VARCHAR(50) NOT NULL DEFAULT 'New',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Multi-tenancy & Customer Isolation: Add tenant_id column to leads if not exists
  await query(`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'tenant_default';
  `);

  // 3. Create indexes for optimal lookup & ordering (including tenant isolation index)
  await query(`
    CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
    CREATE INDEX IF NOT EXISTS idx_leads_name ON leads (name);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
  `);

  // 4. Create users table for multi-tenant customer accounts & authentication
  await query(`
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
  `);

  // 5. Auto-update updated_at timestamp trigger function
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await query(`
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
  `);

  // 6. Seed default admin user in users table if not exists
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@leadmanager.com').toLowerCase().trim();
  const existingAdmin = await query('SELECT id FROM users WHERE email = $1;', [adminEmail]);
  if (existingAdmin.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminHash = hashPassword(adminPassword);
    await query(
      `INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [
        'tenant_default',
        'LeadManager Enterprise',
        'LeadManager Admin',
        adminEmail,
        adminHash,
        'admin',
      ]
    );
    console.log('Default admin user created:', adminEmail);
  }

  // Ensure any legacy leads without tenant_id have 'tenant_default'
  await query(`UPDATE leads SET tenant_id = 'tenant_default' WHERE tenant_id IS NULL;`);

  console.log('Supabase PostgreSQL initialized — leads & multi-tenant users tables ready');
};
