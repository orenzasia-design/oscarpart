'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setAccessToken } from '@/lib/api-client';

// ── Cookie helpers for Next.js middleware route protection ──
function setAuthCookies(role: string, status: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `_role=${role}; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
  document.cookie = `_status=${status}; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
  // _at_role is a presence-only flag (not the real token) so middleware knows user is logged in
  document.cookie = `_at_role=1; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
}

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = '_role=; path=/; max-age=0';
  document.cookie = '_status=; path=/; max-age=0';
  document.cookie = '_at_role=; path=/; max-age=0';
}

export interface AuthUser {
  id:           string;
  email:        string;
  full_name:    string;
  role:         'public' | 'registered' | 'approved' | 'admin' | 'superadmin';
  status:       'pending' | 'approved' | 'rejected' | 'suspended';
  company_name: string | null;
}

interface AuthContextType {
  user:          AuthUser | null;
  loading:       boolean;
  login:         (email: string, password: string) => Promise<void>;
  logout:        () => Promise<void>;
  refreshUser:   () => Promise<void>;
  isAdmin:       boolean;
  isApproved:    boolean;
  isPending:     boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      const u = res.data.data;
      setUser(u);
      setAuthCookies(u.role, u.status);
    } catch {
      setUser(null);
      setAccessToken(null);
      clearAuthCookies();
    }
  }, []);

  // On mount: try to restore session via refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const res = await authApi.refresh();
        setAccessToken(res.data.data.accessToken);
        await refreshUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAccessToken(res.data.data.accessToken);
    const u = res.data.data.user;
    setUser(u);
    setAuthCookies(u.role, u.status);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
    clearAuthCookies();
    window.location.href = '/';
  }, []);

  const isAdmin    = user?.role === 'admin' || user?.role === 'superadmin';
  const isApproved = ['approved','admin','superadmin'].includes(user?.role || '');
  const isPending  = user?.status === 'pending';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin, isApproved, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
