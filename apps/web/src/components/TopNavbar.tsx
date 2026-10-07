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
  Sparkles
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, switchRole } = useAuth();
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
    <header className="sticky top-3 z-50 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-4">
      <div className="glass-card-strong px-4 sm:px-6 py-2.5 rounded-[26px] border border-white/90 shadow-xl backdrop-blur-3xl flex flex-wrap items-center justify-between gap-3">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-all border border-white/60">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                RehabSense
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full glass-chip text-sky-800 border-white/90">
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
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              pathname === '/' 
                ? 'bg-white text-slate-900 border border-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Overview
          </Link>

          {role === 'PATIENT' ? (
            <>
              <Link
                href="/patient/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/patient/dashboard') 
                    ? 'bg-white text-sky-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                My Rehab Plan
              </Link>
              <Link
                href="/patient/exercise/elbow-flexion"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.includes('/exercise') 
                    ? 'bg-white text-sky-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Live Camera Exercise
              </Link>
              <Link
                href="/patient/progress"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/patient/progress') 
                    ? 'bg-white text-sky-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Progress Trends
              </Link>
              <Link
                href="/patient/manual"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/patient/manual') 
                    ? 'bg-white text-sky-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Camera-Free Mode
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/therapist/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/therapist/dashboard') 
                    ? 'bg-white text-teal-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Clinical Census
              </Link>
              <Link
                href="/therapist/review/session-hist-6"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  pathname.includes('/review') 
                    ? 'bg-white text-amber-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>Session Review</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </Link>
              <Link
                href="/therapist/exercises"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/therapist/exercises') 
                    ? 'bg-white text-teal-800 border border-white shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                Exercise Config
              </Link>
            </>
          )}

          <Link
            href="/demo"
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 ${
              pathname === '/demo' 
                ? 'bg-white text-purple-800 border border-white shadow-xs font-bold' 
                : 'text-purple-700 hover:text-purple-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Demo Hub
          </Link>
        </nav>

        {/* Right Controls: Role Switcher & Accessibility */}
        <div className="flex items-center gap-2">
          
          {/* Accessibility Toggles */}
          <div className="flex items-center glass-chip rounded-xl p-1 space-x-1 border border-white/80">
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? 'Mute voice feedback' : 'Enable voice feedback'}
              className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? 'text-sky-700 bg-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleHighContrast}
              title="Toggle High Contrast Mode"
              className={`p-1.5 rounded-lg transition-colors ${highContrast ? 'text-amber-700 bg-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={toggleLargeText}
              title="Toggle Large Typography"
              className={`p-1.5 rounded-lg transition-colors ${largeText ? 'text-emerald-700 bg-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Bell */}
          {role === 'PATIENT' && <NotificationBell />}

          {/* Quick 1-Click Role Switcher */}
          <div className="flex items-center glass-chip rounded-xl p-1 border border-white/80">
            <button
              onClick={() => handleRoleToggle('PATIENT')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                role === 'PATIENT'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient</span>
            </button>
            
            <button
              onClick={() => handleRoleToggle('THERAPIST')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                role === 'THERAPIST'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Therapist</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
