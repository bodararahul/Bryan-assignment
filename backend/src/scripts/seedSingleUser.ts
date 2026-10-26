import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db/connection';
import { hashPassword } from '../utils/password';

export const seedSingleDemoUser = async () => {
  console.log('🔄 Cleaning extra users and data to retain only ONE demo user...');

  const demoEmail = (process.env.ADMIN_EMAIL || 'admin@leadmanager.com').toLowerCase().trim();
  const demoPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const demoName = process.env.ADMIN_NAME || 'Alex Rivera';
  const demoOrg = process.env.ADMIN_ORG || 'Acme Corporation';
  const demoTenantId = 'tenant_default';

  // 1. Delete all existing leads and users
  await query('DELETE FROM leads;');
  await query('DELETE FROM users;');

  // 2. Create the SINGLE demo user
  const passwordHash = hashPassword(demoPassword);
  await query(
    `INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [demoTenantId, demoOrg, demoName, demoEmail, passwordHash, 'admin']
  );
  console.log(`✅ Created Single Demo User: ${demoEmail} / ${demoPassword} (${demoOrg})`);

  // 3. Seed clean leads for this single user
  const demoLeads = [
    {
      name: 'Sarah Connor',
      email: 'sarah.c@skytech-enterprises.com',
      phone: '+1 415 555 0192',
      notes: 'Inbound inquiry via website. Interested in enterprise CRM licenses.',
      status: 'New',
      tenant_id: demoTenantId,
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@apexlogistics.io',
      phone: '+1 312 555 0147',
      notes: 'Discovery call completed. Technical demo scheduled for Friday.',
      status: 'Contacted',
      tenant_id: demoTenantId,
    },
    {
      name: 'Rachel Adams',
      email: 'rachel@vanguardhealth.org',
      phone: '+1 617 555 0188',
      notes: 'Budget approved for annual plan. Reviewing SLA and data compliance.',
      status: 'Qualified',
      tenant_id: demoTenantId,
    },
    {
      name: 'Kevin Wright',
      email: 'kevin.w@summitretail.com',
      phone: '+1 206 555 0134',
      notes: 'Contract signed. Onboarding kickoff scheduled with customer success team.',
      status: 'Closed',
      tenant_id: demoTenantId,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@indicodesolutions.in',
      phone: '+91 98200 54321',
      notes: 'Evaluating cloud deployment options for regional sales team.',
      status: 'Contacted',
      tenant_id: demoTenantId,
    },
  ];

  for (const l of demoLeads) {
    await query(
      `INSERT INTO leads (name, email, phone, notes, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [l.name, l.email, l.phone, l.notes, l.status, l.tenant_id]
    );
  }
  console.log(`✅ Seeded ${demoLeads.length} leads for single demo user (${demoTenantId})`);
  console.log('🎉 Single user database cleanup & seed completed successfully!');
};

if (require.main === module) {
  seedSingleDemoUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
