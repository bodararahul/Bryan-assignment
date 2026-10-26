export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Closed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  status: LeadStatus;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDTO {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  tenant_id?: string;
}

export interface UpdateLeadStatusDTO {
  status: LeadStatus;
}

export interface UpdateLeadDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  notes?: string | null;
  status?: LeadStatus;
}

export interface LeadQueryParams {
  search?: string;
  status?: LeadStatus;
  page?: number;
  limit?: number;
}

export interface LeadStatusCounts {
  New: number;
  Contacted: number;
  Qualified: number;
  Closed: number;
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: LeadStatusCounts;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}
