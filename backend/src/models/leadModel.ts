import { query } from '../db/connection';
import type {
  Lead,
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadStatus,
  LeadQueryParams,
  PaginatedLeads,
  LeadStatusCounts,
} from '../types/lead';

/**
 * Creates a new lead scoped strictly to the authenticated tenant.
 */
export const createLead = async (
  dto: CreateLeadDTO,
  tenantId: string = 'tenant_default'
): Promise<Lead> => {
  const { name, email, phone, notes } = dto;
  const sql = `
    INSERT INTO leads (name, email, phone, notes, tenant_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [
    name.trim(),
    email.trim().toLowerCase(),
    phone?.trim() || null,
    notes?.trim() || null,
    tenantId,
  ];

  const result = await query<Lead>(sql, values);
  return result.rows[0];
};

/**
 * Returns paginated leads filtered strictly by the tenant_id for customer data isolation.
 */
export const getLeads = async (
  params: LeadQueryParams,
  tenantId: string = 'tenant_default'
): Promise<PaginatedLeads> => {
  const { search, status, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // Enforce customer data isolation: always filter by tenant_id
  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIdx = 2;

  if (search) {
    conditions.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
    values.push(`%${search}%`);
    paramIdx++;
  }

  if (status) {
    conditions.push(`status = $${paramIdx}`);
    values.push(status);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Count query scoped to tenant
  const countSql = `SELECT COUNT(*) as count FROM leads ${whereClause};`;
  const countResult = await query<{ count: string }>(countSql, values);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Paginated query scoped to tenant
  const dataValues = [...values, limit, offset];
  const dataSql = `
    SELECT * FROM leads
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
  `;
  const dataResult = await query<Lead>(dataSql, dataValues);

  // Status counts scoped to this tenant (for accurate dashboard metrics)
  const statsSql = `
    SELECT status, COUNT(*) AS count
    FROM leads
    WHERE tenant_id = $1
    GROUP BY status;
  `;
  const statsResult = await query<{ status: LeadStatus; count: string }>(statsSql, [tenantId]);
  const statusCounts: LeadStatusCounts = { New: 0, Contacted: 0, Qualified: 0, Closed: 0 };
  for (const row of statsResult.rows) {
    statusCounts[row.status] = parseInt(row.count, 10);
  }

  return {
    leads: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    statusCounts,
  };
};

/**
 * Gets a single lead by ID, enforcing tenant ownership.
 */
export const getLeadById = async (
  id: string,
  tenantId: string = 'tenant_default'
): Promise<Lead | null> => {
  const result = await query<Lead>(
    'SELECT * FROM leads WHERE id = $1 AND tenant_id = $2;',
    [id, tenantId]
  );
  return result.rows[0] || null;
};

/**
 * Updates lead status, enforcing tenant ownership.
 */
export const updateLeadStatus = async (
  id: string,
  status: LeadStatus,
  tenantId: string = 'tenant_default'
): Promise<Lead | null> => {
  const result = await query<Lead>(
    `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *;`,
    [status, id, tenantId]
  );
  return result.rows[0] || null;
};

/**
 * Updates lead details, enforcing tenant ownership.
 */
export const updateLead = async (
  id: string,
  dto: UpdateLeadDTO,
  tenantId: string = 'tenant_default'
): Promise<Lead | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (dto.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    values.push(dto.name.trim());
  }
  if (dto.email !== undefined) {
    fields.push(`email = $${paramIdx++}`);
    values.push(dto.email.trim().toLowerCase());
  }
  if (dto.phone !== undefined) {
    fields.push(`phone = $${paramIdx++}`);
    values.push(dto.phone ? dto.phone.trim() : null);
  }
  if (dto.notes !== undefined) {
    fields.push(`notes = $${paramIdx++}`);
    values.push(dto.notes ? dto.notes.trim() : null);
  }
  if (dto.status !== undefined) {
    fields.push(`status = $${paramIdx++}`);
    values.push(dto.status);
  }

  if (fields.length === 0) {
    return getLeadById(id, tenantId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);
  values.push(tenantId);

  const sql = `
    UPDATE leads
    SET ${fields.join(', ')}
    WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}
    RETURNING *;
  `;

  const result = await query<Lead>(sql, values);
  return result.rows[0] || null;
};

/**
 * Deletes a lead, enforcing tenant ownership so users can never delete other tenants' leads.
 */
export const deleteLead = async (
  id: string,
  tenantId: string = 'tenant_default'
): Promise<boolean> => {
  const result = await query(
    'DELETE FROM leads WHERE id = $1 AND tenant_id = $2;',
    [id, tenantId]
  );
  return (result.rowCount ?? 0) > 0;
};
