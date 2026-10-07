'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { useAccessibility } from '@/lib/accessibility-context';
import { 
  Activity, 
  User, 
  Stethoscope, 
  Volume2, 
  VolumeX, 
  Eye, 
  Type, 
  Sparkles, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, switchRole } = useAuth();
  const { highContrast, largeText, voiceEnabled, toggleHighContrast, toggleLargeText, toggleVoice } = useAccessibility();

  const handleRoleToggle = async (newRole: UserRole) => {
    await switchRole(newRole);
    if (newRole === 'THERAPIST') {
      router.push('/therapist/dashboard');
    } else {
      router.push('/patient/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card-strong border-b border-white/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                  RehabSense
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full glass-chip text-sky-700">
                    PS 05
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Your Recovery. Your Camera. Your Care Team.
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 md:order-none md:w-auto md:pb-0">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'glass-chip text-slate-900' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              Overview
            </Link>

            {role === 'PATIENT' ? (
              <>
                <Link
                  href="/patient/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/patient/dashboard') 
                      ? 'glass-chip text-sky-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  My Rehab Plan
                </Link>
                <Link
                  href="/patient/exercise/elbow-flexion"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.includes('/exercise') 
                      ? 'glass-chip text-sky-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Live Camera Exercise
                </Link>
                <Link
                  href="/patient/progress"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/patient/progress') 
                      ? 'glass-chip text-sky-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Progress Trends
                </Link>
                <Link
                  href="/patient/manual"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/patient/manual') 
                      ? 'glass-chip text-sky-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Camera-Free Mode
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/therapist/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/therapist/dashboard') 
                      ? 'glass-chip text-teal-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Clinical Census
                </Link>
                <Link
                  href="/therapist/review/session-hist-6"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.includes('/review') 
                      ? 'glass-chip text-amber-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <span>Session Review</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </Link>
                <Link
                  href="/therapist/exercises"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/therapist/exercises') 
                      ? 'glass-chip text-teal-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Exercise Config
                </Link>
              </>
            )}

            <Link
              href="/demo"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                pathname === '/demo' 
                  ? 'glass-chip text-purple-800 font-semibold' 
                  : 'text-purple-700 hover:bg-white/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Hub
            </Link>
          </nav>

          {/* Right Controls: Role Switcher & Accessibility */}
          <div className="flex items-center gap-2">
            
            {/* Accessibility Toggles */}
            <div className="flex items-center glass-chip rounded-lg p-1 space-x-1">
              <button
                onClick={toggleVoice}
                title={voiceEnabled ? 'Mute voice feedback' : 'Enable voice feedback'}
                className={`p-1.5 rounded-md transition-colors ${voiceEnabled ? 'text-sky-600 bg-white/80 shadow-xs' : 'text-slate-400'}`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleHighContrast}
                title="Toggle High Contrast Mode"
                className={`p-1.5 rounded-md transition-colors ${highContrast ? 'text-amber-600 bg-white/80 shadow-xs' : 'text-slate-400'}`}
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={toggleLargeText}
                title="Toggle Large Typography"
                className={`p-1.5 rounded-md transition-colors ${largeText ? 'text-emerald-600 bg-white/80 shadow-xs' : 'text-slate-400'}`}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Bell */}
            {role === 'PATIENT' && <NotificationBell />}

            {/* Quick 1-Click Role Switcher */}
            <div className="flex items-center glass-chip rounded-lg p-1 border border-white/70">
              <button
                onClick={() => handleRoleToggle('PATIENT')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  role === 'PATIENT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
              
              <button
                onClick={() => handleRoleToggle('THERAPIST')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  role === 'THERAPIST'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Therapist</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
