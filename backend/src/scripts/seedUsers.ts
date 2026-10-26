import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db/connection';
import { hashPassword } from '../utils/password';

export const seedTwoTenants = async () => {
  console.log('🔄 Cleaning old leads and users for clean multi-tenant isolation demonstration...');

  // Clean old data
  await query('DELETE FROM leads;');
  await query('DELETE FROM users;');

  const passwordHash = hashPassword('password123');
  const adminHash = hashPassword('admin123');

  // 1. Create User 1: Alex Rivera (Acme Corporation)
  const u1 = await query(
    `INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [
      'tenant_acme_corp',
      'Acme Corporation',
      'Alex Rivera',
      'alex@acme.com',
      passwordHash,
      'admin',
    ]
  );
  console.log('✅ Created User 1 (Acme Corp): alex@acme.com / password123');

  // 2. Create User 2: Sophia Chen (Globex Global)
  const u2 = await query(
    `INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [
      'tenant_globex_global',
      'Globex Global',
      'Sophia Chen',
      'sophia@globex.com',
      passwordHash,
      'admin',
    ]
  );
  console.log('✅ Created User 2 (Globex Global): sophia@globex.com / password123');

  // 3. Keep default admin for backup
  await query(
    `INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6);`,
    [
      'tenant_default',
      'LeadManager Enterprise',
      'LeadManager Admin',
      'admin@leadmanager.com',
      adminHash,
      'admin',
    ]
  );
  console.log('✅ Created Backup Admin: admin@leadmanager.com / admin123');

  // 4. Seed isolated leads for User 1 (Acme Corporation)
  const acmeLeads = [
    {
      name: 'Sarah Connor',
      email: 'sarah.c@skytech-enterprises.com',
      phone: '+1 415 555 0192',
      notes: 'Inbound inquiry via Acme Corp website. Interested in 50 enterprise CRM licenses.',
      status: 'New',
      tenant_id: 'tenant_acme_corp',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@apexlogistics.io',
      phone: '+1 312 555 0147',
      notes: 'Initial discovery call completed by Acme sales team. Demo scheduled for Friday.',
      status: 'Contacted',
      tenant_id: 'tenant_acme_corp',
    },
    {
      name: 'Rachel Adams',
      email: 'rachel@vanguardhealth.org',
      phone: '+1 617 555 0188',
      notes: 'Budget approved for Acme Enterprise plan. Reviewing SLA and security compliance.',
      status: 'Qualified',
      tenant_id: 'tenant_acme_corp',
    },
    {
      name: 'Kevin Wright',
      email: 'kevin.w@summitretail.com',
      phone: '+1 206 555 0134',
      notes: 'Contract signed. Onboarding kickoff scheduled with Acme customer success team.',
      status: 'Closed',
      tenant_id: 'tenant_acme_corp',
    },
  ];

  for (const l of acmeLeads) {
    await query(
      `INSERT INTO leads (name, email, phone, notes, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [l.name, l.email, l.phone, l.notes, l.status, l.tenant_id]
    );
  }
  console.log('✅ Seeded 4 private leads for Acme Corporation (tenant_acme_corp)');

  // 5. Seed isolated leads for User 2 (Globex Global)
  const globexLeads = [
    {
      name: 'Liam Gallagher',
      email: 'liam.g@oasispayments.co.uk',
      phone: '+44 20 7946 0912',
      notes: 'Inbound inquiry via Globex Global UK. Looking for cross-border payment integration.',
      status: 'New',
      tenant_id: 'tenant_globex_global',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@indicodesolutions.in',
      phone: '+91 98200 54321',
      notes: 'Product demo completed by Globex APAC team. Comparing tier pricing.',
      status: 'Contacted',
      tenant_id: 'tenant_globex_global',
    },
    {
      name: 'Carlos Mendez',
      email: 'carlos@latamventures.co',
      phone: '+52 55 5234 5678',
      notes: 'Globex expansion partner. Pilot program agreed for Q4 rollout.',
      status: 'Qualified',
      tenant_id: 'tenant_globex_global',
    },
    {
      name: 'Hanna Lindqvist',
      email: 'hanna.l@nordicfintech.se',
      phone: '+46 8 123 4567',
      notes: 'Annual enterprise subscription finalized with Globex Global EMEA.',
      status: 'Closed',
      tenant_id: 'tenant_globex_global',
    },
  ];

  for (const l of globexLeads) {
    await query(
      `INSERT INTO leads (name, email, phone, notes, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [l.name, l.email, l.phone, l.notes, l.status, l.tenant_id]
    );
  }
  console.log('✅ Seeded 4 private leads for Globex Global (tenant_globex_global)');

  console.log('🎉 Multi-tenant database seed completed successfully!');
};

// Execute if run directly
if (require.main === module) {
  seedTwoTenants()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
