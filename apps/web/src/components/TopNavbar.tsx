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
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  RehabSense
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    PS 05
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Your Recovery. Your Camera. Your Care Team.
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  My Rehab Plan
                </Link>
                <Link
                  href="/patient/exercise/elbow-flexion"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.includes('/exercise') 
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Live Camera Exercise
                </Link>
                <Link
                  href="/patient/progress"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/patient/progress') 
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Progress Trends
                </Link>
                <Link
                  href="/patient/manual"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/patient/manual') 
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Clinical Census
                </Link>
                <Link
                  href="/therapist/review/session-hist-6"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.includes('/review') 
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>Session Review</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                </Link>
                <Link
                  href="/therapist/exercises"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/therapist/exercises') 
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                  ? 'bg-purple-100 text-purple-800 font-semibold' 
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Hub
            </Link>
          </nav>

          {/* Right Controls: Role Switcher & Accessibility */}
          <div className="flex items-center space-x-2">
            
            {/* Accessibility Toggles */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 space-x-1">
              <button
                onClick={toggleVoice}
                title={voiceEnabled ? 'Mute voice feedback' : 'Enable voice feedback'}
                className={`p-1.5 rounded-md transition-colors ${voiceEnabled ? 'text-sky-600 bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'}`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleHighContrast}
                title="Toggle High Contrast Mode"
                className={`p-1.5 rounded-md transition-colors ${highContrast ? 'text-amber-600 bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'}`}
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={toggleLargeText}
                title="Toggle Large Typography"
                className={`p-1.5 rounded-md transition-colors ${largeText ? 'text-emerald-600 bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-400'}`}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Role Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
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
