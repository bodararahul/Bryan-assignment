export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Closed';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface UpdateLeadForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: LeadStatus;
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

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}
