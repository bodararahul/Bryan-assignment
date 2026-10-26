import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string;
  orgName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterDTO {
  name: string;
  orgName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// Resolve API baseURL from Vite env with fallback to proxy '/api'
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

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (dto: RegisterDTO): Promise<LoginResponse> => {
    const res = await api.post('/auth/register', dto);
    return res.data;
  },

  getMe: async (token: string): Promise<AuthUser> => {
    const res = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.user;
  },
};
