import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthToken, pinLogin as apiPinLogin, emailLogin as apiEmailLogin } from './api-client';

interface AuthUser {
  token: string;
  role: 'OWNER' | 'CASHIER';
  email: string;
  userId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithPin: (pin: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwt(token: string): { sub: string; email: string; role: string } {
  const base64 = token.split('.')[1];
  const json = atob(base64);
  return JSON.parse(json);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('openpos_token');
    if (stored) {
      try {
        const payload = parseJwt(stored);
        setAuthToken(stored);
        setUser({ token: stored, role: payload.role as AuthUser['role'], email: payload.email, userId: payload.sub });
      } catch { localStorage.removeItem('openpos_token'); }
    }
  }, []);

  const loginWithPin = useCallback(async (pin: string) => {
    const { token } = await apiPinLogin(pin);
    const payload = parseJwt(token);
    setAuthToken(token);
    localStorage.setItem('openpos_token', token);
    setUser({ token, role: payload.role as AuthUser['role'], email: payload.email, userId: payload.sub });
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const { token } = await apiEmailLogin(email, password);
    const payload = parseJwt(token);
    setAuthToken(token);
    localStorage.setItem('openpos_token', token);
    setUser({ token, role: payload.role as AuthUser['role'], email: payload.email, userId: payload.sub });
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem('openpos_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginWithPin, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
