import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  atsScore?: number | null;
  interviewScore?: number | null;
  codingScore?: number | null;
  communicationScore?: number | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ otp: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = 'http://localhost:8080/api/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('igpt_token'));
  const [isLoading, setIsLoading] = useState(true);

  const authFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
    const storedToken = localStorage.getItem('igpt_token');
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
    const res = await fetch(`${API_BASE}${path}`, {
  ...options,
  headers,
});

const text = await res.text();

let data = {};
try {
  data = text ? JSON.parse(text) : {};
} catch {
  data = {};
}

if (!res.ok) {
  throw new Error((data as any).error || `HTTP ${res.status}`);
}

return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('igpt_token');
    if (!storedToken) { setIsLoading(false); return; }
    try {
      const data = await authFetch('/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('igpt_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('igpt_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, [authFetch]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await authFetch('/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    localStorage.setItem('igpt_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return { otp: data.otp };
  }, [authFetch]);

  const logout = useCallback(() => {
    localStorage.removeItem('igpt_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<AuthUser>) => {
    const data = await authFetch('/profile', { method: 'PUT', body: JSON.stringify(profileData) });
    setUser(data.user);
  }, [authFetch]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
