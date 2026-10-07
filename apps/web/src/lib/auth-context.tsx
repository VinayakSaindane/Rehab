'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { mockStorage } from './mock-storage';

export type UserRole = 'PATIENT' | 'THERAPIST' | 'HOSPITAL';

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
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
  login: (email: string, password: string, preferredRole?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PATIENT: User = {
  id: 'patient-001',
  email: 'patient@demo.com',
  name: 'Demo Patient',
  role: 'PATIENT',
};

export const DEMO_THERAPIST: User = {
  id: 'therapist-001',
  email: 'doctor@demo.com',
  name: 'Dr. Demo',
  role: 'THERAPIST',
};

export const DEMO_HOSPITAL: User = {
  id: 'hospital-001',
  email: 'hospital@demo.com',
  name: 'Demo Hospital',
  role: 'HOSPITAL',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(true);

  // Initialize auth state and mock storage on client mount
  useEffect(() => {
    try {
      mockStorage.init();

      const storedUser = localStorage.getItem('rehab_user');
      const storedRole = localStorage.getItem('rehab_role') as UserRole | null;
      const storedToken = localStorage.getItem('rehab_token');

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Normalize role to uppercase
        const normalizedRole: UserRole = (parsed.role?.toUpperCase() as UserRole) || storedRole || 'PATIENT';
        setUser({ ...parsed, role: normalizedRole });
        setRole(normalizedRole);
        if (storedToken) setToken(storedToken);
      } else {
        // Logged out by default
        setUser(null);
        setRole('PATIENT');
        setToken(null);
      }

      const onboardingDone = localStorage.getItem('rehab_onboarding_complete');
      setIsOnboardingComplete(!!onboardingDone);
    } catch {
      setUser(null);
      setRole('PATIENT');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for token expiry events
  useEffect(() => {
    const handleTokenExpired = () => {
      setToken(null);
      setUser(null);
      setRole('PATIENT');
      try {
        localStorage.removeItem('rehab_user');
        localStorage.removeItem('rehab_role');
        localStorage.removeItem('rehab_token');
      } catch {}
    };
    window.addEventListener('rehabsense:token-expired', handleTokenExpired);
    return () => window.removeEventListener('rehabsense:token-expired', handleTokenExpired);
  }, []);

  // Backward compatible quick role switch
  const switchRole = useCallback(async (newRole: UserRole) => {
    const normalizedRole = newRole.toUpperCase() as UserRole;
    setRole(normalizedRole);
    try {
      localStorage.setItem('rehab_role', normalizedRole);
    } catch {}

    let fallbackUser: User = DEMO_PATIENT;
    if (normalizedRole === 'THERAPIST') fallbackUser = DEMO_THERAPIST;
    else if (normalizedRole === 'HOSPITAL') fallbackUser = DEMO_HOSPITAL;

    setUser(fallbackUser);
    const mockToken = `mock-token-${normalizedRole.toLowerCase()}-${Date.now()}`;
    setToken(mockToken);
    try {
      localStorage.setItem('rehab_user', JSON.stringify(fallbackUser));
      localStorage.setItem('rehab_token', mockToken);
    } catch {}

    // Optionally call backend if available
    try {
      if (normalizedRole === 'PATIENT' || normalizedRole === 'THERAPIST') {
        const res = await api.demoSwitch(normalizedRole);
        if (res && res.access_token) {
          const apiUser: User = {
            id: res.user_id || fallbackUser.id,
            email: res.email || fallbackUser.email,
            name: res.name || fallbackUser.name,
            role: normalizedRole,
          };
          setToken(res.access_token);
          setUser(apiUser);
          localStorage.setItem('rehab_token', res.access_token);
          localStorage.setItem('rehab_user', JSON.stringify(apiUser));
        }
      }
    } catch {
      // Backend unavailable; offline local mock is already set
    }
  }, []);

  // Direct 1-Click Demo Login (Hackathons / Demos)
  const demoLogin = useCallback(async (targetRole: UserRole) => {
    setIsLoading(true);
    const normalizedRole = targetRole.toUpperCase() as UserRole;
    let demoAcc: User = DEMO_PATIENT;
    if (normalizedRole === 'THERAPIST') demoAcc = DEMO_THERAPIST;
    else if (normalizedRole === 'HOSPITAL') demoAcc = DEMO_HOSPITAL;

    const mockToken = `demo-token-${normalizedRole.toLowerCase()}-${Date.now()}`;
    setUser(demoAcc);
    setRole(normalizedRole);
    setToken(mockToken);

    try {
      localStorage.setItem('rehab_user', JSON.stringify(demoAcc));
      localStorage.setItem('rehab_role', normalizedRole);
      localStorage.setItem('rehab_token', mockToken);
    } catch {}

    // Synchronize with backend API if available to obtain real JWT
    try {
      if (normalizedRole === 'PATIENT' || normalizedRole === 'THERAPIST') {
        const res = await api.demoSwitch(normalizedRole);
        if (res && res.access_token) {
          const apiUser: User = {
            id: res.user_id || demoAcc.id,
            email: res.email || demoAcc.email,
            name: res.name || demoAcc.name,
            role: normalizedRole,
          };
          setUser(apiUser);
          setToken(res.access_token);
          localStorage.setItem('rehab_token', res.access_token);
          localStorage.setItem('rehab_user', JSON.stringify(apiUser));
        }
      }
    } catch {
      // Offline fallback: keep demoAcc and mockToken
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Universal Login Handler
  const login = useCallback(async (email: string, password: string, preferredRole?: UserRole) => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check pre-seeded demo accounts (fetch real JWT from backend if available)
    if (trimmedEmail === 'patient@demo.com' || trimmedEmail === 'patient@rehabsense.demo') {
      let activeUser: User = DEMO_PATIENT;
      let activeToken = `demo-token-patient-${Date.now()}`;
      try {
        const res = await api.demoSwitch('PATIENT');
        if (res && res.access_token) {
          activeUser = {
            id: res.user_id || DEMO_PATIENT.id,
            email: res.email || DEMO_PATIENT.email,
            name: res.name || DEMO_PATIENT.name,
            role: 'PATIENT',
          };
          activeToken = res.access_token;
        }
      } catch {}
      setUser(activeUser);
      setRole('PATIENT');
      setToken(activeToken);
      localStorage.setItem('rehab_user', JSON.stringify(activeUser));
      localStorage.setItem('rehab_role', 'PATIENT');
      localStorage.setItem('rehab_token', activeToken);
      setIsLoading(false);
      return { success: true };
    }

    if (trimmedEmail === 'doctor@demo.com' || trimmedEmail === 'therapist@demo.com' || trimmedEmail === 'therapist@rehabsense.demo') {
      let activeUser: User = DEMO_THERAPIST;
      let activeToken = `demo-token-therapist-${Date.now()}`;
      try {
        const res = await api.demoSwitch('THERAPIST');
        if (res && res.access_token) {
          activeUser = {
            id: res.user_id || DEMO_THERAPIST.id,
            email: res.email || DEMO_THERAPIST.email,
            name: res.name || DEMO_THERAPIST.name,
            role: 'THERAPIST',
          };
          activeToken = res.access_token;
        }
      } catch {}
      setUser(activeUser);
      setRole('THERAPIST');
      setToken(activeToken);
      localStorage.setItem('rehab_user', JSON.stringify(activeUser));
      localStorage.setItem('rehab_role', 'THERAPIST');
      localStorage.setItem('rehab_token', activeToken);
      setIsLoading(false);
      return { success: true };
    }

    if (trimmedEmail === 'hospital@demo.com' || trimmedEmail === 'hospital@rehabsense.demo') {
      const u = DEMO_HOSPITAL;
      const t = `demo-token-hospital-${Date.now()}`;
      setUser(u);
      setRole('HOSPITAL');
      setToken(t);
      localStorage.setItem('rehab_user', JSON.stringify(u));
      localStorage.setItem('rehab_role', 'HOSPITAL');
      localStorage.setItem('rehab_token', t);
      setIsLoading(false);
      return { success: true };
    }

    // 2. Check local mock storage
    const foundUser = mockStorage.findUserByEmail(trimmedEmail);
    if (foundUser) {
      if (foundUser.password && foundUser.password !== password) {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password' };
      }

      const userRole = (foundUser.role.toUpperCase() as UserRole) || preferredRole || 'PATIENT';
      const authedUser: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: userRole,
      };

      setUser(authedUser);
      setRole(userRole);
      setToken(`local-token-${foundUser.id}`);
      localStorage.setItem('rehab_user', JSON.stringify(authedUser));
      localStorage.setItem('rehab_role', userRole);
      localStorage.setItem('rehab_token', `local-token-${foundUser.id}`);
      setIsLoading(false);
      return { success: true };
    }

    // 3. Fallback: try remote API if configured
    try {
      const res = await api.login(email, password);
      const userRole = (res.role?.toUpperCase() as UserRole) || preferredRole || 'PATIENT';
      const loggedUser: User = {
        id: res.user_id,
        email: res.email,
        name: res.name,
        role: userRole,
      };
      setRole(userRole);
      setUser(loggedUser);
      setToken(res.access_token);
      localStorage.setItem('rehab_token', res.access_token);
      localStorage.setItem('rehab_role', userRole);
      localStorage.setItem('rehab_user', JSON.stringify(loggedUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      // If neither local nor remote found user
      setIsLoading(false);
      return { success: false, error: err?.message || 'Invalid email or password' };
    }
  }, []);

  // Universal Signup Handler
  const signup = useCallback(async (data: { name: string; email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    const existing = mockStorage.findUserByEmail(data.email);
    if (existing) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists' };
    }

    const created = mockStorage.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role.toLowerCase() as any,
    });

    const normalizedRole = data.role.toUpperCase() as UserRole;
    const authedUser: User = {
      id: created.id,
      email: created.email,
      name: created.name,
      role: normalizedRole,
    };

    setUser(authedUser);
    setRole(normalizedRole);
    setToken(`local-token-${created.id}`);

    try {
      localStorage.setItem('rehab_user', JSON.stringify(authedUser));
      localStorage.setItem('rehab_role', normalizedRole);
      localStorage.setItem('rehab_token', `local-token-${created.id}`);
    } catch {}

    setIsLoading(false);
    return { success: true };
  }, []);

  // Full Logout Handler
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

  const completeOnboarding = useCallback(() => {
    setIsOnboardingComplete(true);
    try {
      localStorage.setItem('rehab_onboarding_complete', 'true');
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        isAuthenticated: !!user,
        isOnboardingComplete,
        switchRole,
        login,
        signup,
        demoLogin,
        logout,
        completeOnboarding,
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
