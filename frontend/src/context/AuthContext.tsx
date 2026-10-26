import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { AuthUser } from '../api/authApi';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('lead_crm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('lead_crm_token');
  });

  const login = (newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('lead_crm_user', JSON.stringify(newUser));
    localStorage.setItem('lead_crm_token', newToken);
    toast.success(`Welcome back, ${newUser.name}!`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lead_crm_user');
    localStorage.removeItem('lead_crm_token');
    toast.success('Signed out successfully.');
  };

  // Listen for session expiry from API interceptor
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lead_crm_user');
      localStorage.removeItem('lead_crm_token');
      toast.error('Session expired. Please sign in again.');
    };
    window.addEventListener('crm:auth_expired', handleExpired);
    return () => window.removeEventListener('crm:auth_expired', handleExpired);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
