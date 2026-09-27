'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';

export type UserRole = 'PATIENT' | 'THERAPIST';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PATIENT: User = {
  id: 'patient-1',
  email: 'patient@rehabsense.demo',
  name: 'Aarav Mehta',
  role: 'PATIENT',
};

const DEMO_THERAPIST: User = {
  id: 'therapist-1',
  email: 'therapist@rehabsense.demo',
  name: 'Dr. Ananya Sharma',
  role: 'THERAPIST',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [user, setUser] = useState<User | null>(DEMO_PATIENT);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage or demo default
  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('rehab_role') as UserRole | null;
      const storedToken = localStorage.getItem('rehab_token');
      const storedUser = localStorage.getItem('rehab_user');

      if (storedRole === 'THERAPIST' || storedRole === 'PATIENT') {
        setRole(storedRole);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(storedRole === 'THERAPIST' ? DEMO_THERAPIST : DEMO_PATIENT);
        }
      } else {
        setRole('PATIENT');
        setUser(DEMO_PATIENT);
      }

      if (storedToken) {
        setToken(storedToken);
      }
    } catch {
      // Storage access blocked or SSR
      setRole('PATIENT');
      setUser(DEMO_PATIENT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback(async (newRole: UserRole) => {
    setRole(newRole);
    try {
      localStorage.setItem('rehab_role', newRole);
    } catch {}

    try {
      const res = await api.demoSwitch(newRole);
      if (res && res.access_token) {
        const newUser: User = {
          id: res.user_id || (newRole === 'THERAPIST' ? 'therapist-1' : 'patient-1'),
          email: res.email || (newRole === 'THERAPIST' ? 'therapist@rehabsense.demo' : 'patient@rehabsense.demo'),
          name: res.name || (newRole === 'THERAPIST' ? 'Dr. Ananya Sharma' : 'Aarav Mehta'),
          role: newRole,
        };
        setToken(res.access_token);
        setUser(newUser);
        try {
          localStorage.setItem('rehab_token', res.access_token);
          localStorage.setItem('rehab_user', JSON.stringify(newUser));
        } catch {}
        return;
      }
    } catch {
      // If backend is unreachable or responds with error, fallback to offline demo mock
    }

    const fallbackUser = newRole === 'THERAPIST' ? DEMO_THERAPIST : DEMO_PATIENT;
    setUser(fallbackUser);
    try {
      localStorage.setItem('rehab_user', JSON.stringify(fallbackUser));
    } catch {}
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      const userRole = (res.role as UserRole) || 'PATIENT';
      const loggedUser: User = {
        id: res.user_id,
        email: res.email,
        name: res.name,
        role: userRole,
      };
      setRole(userRole);
      setUser(loggedUser);
      setToken(res.access_token);
      try {
        localStorage.setItem('rehab_token', res.access_token);
        localStorage.setItem('rehab_role', userRole);
        localStorage.setItem('rehab_user', JSON.stringify(loggedUser));
      } catch {}
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole('PATIENT');
    try {
      localStorage.removeItem('rehab_token');
      localStorage.removeItem('rehab_role');
      localStorage.removeItem('rehab_user');
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
