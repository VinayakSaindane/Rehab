'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 1. Not authenticated -> redirect to login
    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Role check if specified
    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedCurrentRole = role?.toUpperCase() as UserRole;
      const isAllowed = allowedRoles.some(
        (r) => r.toUpperCase() === normalizedCurrentRole
      );

      if (!isAllowed) {
        // Redirect to user's authorized home dashboard
        if (normalizedCurrentRole === 'THERAPIST') {
          router.replace('/therapist/dashboard');
        } else if (normalizedCurrentRole === 'HOSPITAL') {
          router.replace('/hospital/dashboard');
        } else {
          router.replace('/patient/dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, role, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-[#244b38] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[#435147]">
            Verifying Session Authorization…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedCurrentRole = role?.toUpperCase() as UserRole;
    const isAllowed = allowedRoles.some((r) => r.toUpperCase() === normalizedCurrentRole);
    if (!isAllowed) return null;
  }

  return <>{children}</>;
}
