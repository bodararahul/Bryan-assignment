import { query } from '../db/connection';
import { hashPassword } from '../utils/password';

export interface User {
  id: string;
  tenant_id: string;
  org_name: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface CreateUserDTO {
  name: string;
  orgName: string;
  email: string;
  password: string;
  role?: string;
}

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const res = await query<User>('SELECT * FROM users WHERE email = $1;', [
    email.toLowerCase().trim(),
  ]);
  return res.rows[0] || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const res = await query<User>('SELECT * FROM users WHERE id = $1;', [id]);
  return res.rows[0] || null;
};

export const createUser = async (dto: CreateUserDTO): Promise<User> => {
  const { name, orgName, email, password, role = 'admin' } = dto;
  const passwordHash = hashPassword(password);

  // Generate distinct tenant_id for customer data isolation
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const orgSlug =
    orgName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10) || 'org';
  const tenantId = `tenant_${orgSlug}_${randomSuffix}`;

  const sql = `
    INSERT INTO users (tenant_id, org_name, name, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    tenantId,
    orgName.trim(),
    name.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    role,
  ];

  const res = await query<User>(sql, values);
  return res.rows[0];
};

/**
 * Seeds a few starter leads for a newly registered tenant
 * so their CRM dashboard and metrics are immediately populated with sample data.
 */
export const seedStarterLeads = async (tenantId: string, orgName: string): Promise<void> => {
  const starterLeads = [
    {
      name: 'Sarah Connor',
      email: 's.connor@cyberdyne-systems.com',
      phone: '+1 415 555 0192',
      notes: `Inbound inquiry via ${orgName} portal. Interested in enterprise CRM solution.`,
      status: 'New',
    },
    {
      name: 'David Miller',
      email: 'david.m@nexusenterprises.io',
      phone: '+1 312 555 0147',
      notes: 'Initial discovery call complete. Product demo scheduled for next Tuesday.',
      status: 'Contacted',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@vanguardlogistics.eu',
      phone: '+44 20 7946 0912',
      notes: 'Budget approved for 25 seats. Reviewing final security checklist.',
      status: 'Qualified',
    },
  ];

  for (const lead of starterLeads) {
    await query(
      `INSERT INTO leads (name, email, phone, notes, status, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [lead.name, lead.email, lead.phone, lead.notes, lead.status, tenantId]
    );
  }
};
