import axios from 'axios';
import type { Lead, CreateLeadForm, PaginatedLeads, LeadStatus } from '../types/lead';

// Resolve API baseURL from environment variable (Vite) with fallback to proxy '/api'
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const getBaseUrl = (): string => {
  if (!rawApiUrl) return '/api';
  const trimmed = rawApiUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Dynamic request interceptor: attach Bearer token from localStorage or API key
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lead_crm_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else if (import.meta.env.VITE_API_KEY) {
    config.headers['X-API-Key'] = import.meta.env.VITE_API_KEY;
  }
  return config;
});

// Response interceptor for consistent error handling and 401 session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lead_crm_token');
      localStorage.removeItem('lead_crm_user');
      window.dispatchEvent(new CustomEvent('crm:auth_expired'));
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unknown error occurred';
    const details = error.response?.data?.details;
    const err = new Error(message) as Error & { details?: unknown; status?: number };
    err.details = details;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export interface GetLeadsParams {
  search?: string;
  status?: LeadStatus | '';
  page?: number;
  limit?: number;
}

export const leadsApi = {
  getLeads: async (params: GetLeadsParams = {}): Promise<PaginatedLeads> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
    );
    const res = await api.get('/leads', { params: filteredParams });
    return res.data.data;
  },

  createLead: async (form: CreateLeadForm): Promise<Lead> => {
    const res = await api.post('/leads', form);
    return res.data.data;
  },

  updateLeadStatus: async (id: string, status: LeadStatus): Promise<Lead> => {
    const res = await api.patch(`/leads/${id}/status`, { status });
    return res.data.data;
  },

  updateLead: async (id: string, form: Partial<CreateLeadForm> & { status?: LeadStatus }): Promise<Lead> => {
    const res = await api.put(`/leads/${id}`, form);
    return res.data.data;
  },

  deleteLead: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },
};
