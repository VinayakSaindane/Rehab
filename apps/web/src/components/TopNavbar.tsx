'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { useAccessibility } from '@/lib/accessibility-context';
import { 
  Activity, 
  User, 
  Stethoscope, 
  Building2,
  Volume2, 
  VolumeX, 
  Eye, 
  Type, 
  Headphones,
  LogIn,
  LogOut,
  ChevronDown,
  Globe,
  Check,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isAuthenticated, switchRole, logout } = useAuth();
  const { 
    highContrast, 
    largeText, 
    voiceEnabled, 
    language,
    earphoneMode, 
    toggleHighContrast, 
    toggleLargeText, 
    toggleVoice,
    setLanguage,
    toggleEarphoneMode
  } = useAccessibility();

  // Dropdown states
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const audioMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (audioMenuRef.current && !audioMenuRef.current.contains(event.target as Node)) {
        setAudioMenuOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setRoleMenuOpen(false);
    logout();
    router.push('/login');
  };

  const handleRoleToggle = async (newRole: UserRole) => {
    setRoleMenuOpen(false);
    await switchRole(newRole);
    if (newRole === 'THERAPIST') {
      router.push('/therapist/dashboard');
    } else if (newRole === 'HOSPITAL') {
      router.push('/hospital/dashboard');
    } else {
      router.push('/patient/dashboard');
    }
  };

  const languages = [
    { id: 'en', label: 'English', flag: '🇬🇧', sub: 'Natural Clinical Pacing' },
    { id: 'hi', label: 'हिन्दी', flag: '🇮🇳', sub: 'प्राकृतिक आवाज़' },
    { id: 'mr', label: 'मराठी', flag: '🚩', sub: 'स्पष्ट ऑडिओ मार्गदर्शक' },
  ];

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-4 select-none">
      <div className="glass-navbar px-3.5 sm:px-5 py-2.5 rounded-[24px] border border-white/50 shadow-lg backdrop-blur-2xl flex items-center justify-between gap-2.5">
        
        {/* Left: Brand & Logo */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-all border border-white/40">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                RehabSense
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full glass-chip text-blue-700 border-blue-300/40">
                  PS 05
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean, Spaced Navigation Links */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {!isAuthenticated && (
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                pathname === '/'
                  ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
              }`}
            >
              Overview
            </Link>
          )}

          {/* Authenticated Links with breathing space */}
          {isAuthenticated && role === 'PATIENT' && (
            <>
              <Link
                href="/patient/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/patient/dashboard') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/patient/exercise/elbow-flexion"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.includes('/exercise') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Live Exercise
              </Link>
              <Link
                href="/patient/progress"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/patient/progress') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Progress
              </Link>

            </>
          )}

          {isAuthenticated && role === 'THERAPIST' && (
            <>
              <Link
                href="/therapist/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/therapist/dashboard') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Census
              </Link>
              <Link
                href="/therapist/review/session-hist-6"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.includes('/review') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Review
              </Link>
              <Link
                href="/therapist/exercises"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/therapist/exercises') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Config
              </Link>
            </>
          )}

          {isAuthenticated && role === 'HOSPITAL' && (
            <>
              <Link
                href="/hospital/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/hospital/dashboard') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/hospital/onboard/new"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  pathname.startsWith('/hospital/onboard') 
                    ? 'glass-chip text-blue-900 border-blue-300/50 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                }`}
              >
                Onboard Patient
              </Link>
            </>
          )}

        </nav>

        {/* Right: Consolidated Audio & Role Menus */}
        <div className="flex items-center gap-2">
          
          {/* Notification Bell (Patient only) */}
          {isAuthenticated && role === 'PATIENT' && <NotificationBell />}

          {/* 1. Consolidated Audio & Accessibility Pill Menu */}
          <div className="relative" ref={audioMenuRef}>
            <button
              type="button"
              onClick={() => setAudioMenuOpen(!audioMenuOpen)}
              title="Audio Guidance & Accessibility Settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-button text-xs font-bold text-slate-700 border border-white/50 hover:bg-white/40 transition-all shadow-xs"
            >
              <Headphones className="w-4 h-4 text-blue-600" />
              <span className="uppercase text-blue-900 font-extrabold">{language}</span>
              {earphoneMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {audioMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-3xl glass-card-strong p-4 border border-white/60 shadow-2xl backdrop-blur-3xl z-50 space-y-4 text-xs">
                
                {/* Spoken Language Selector */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-white/30">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Audio Coach Language</span>
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">{language}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id as any)}
                        className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                          language === lang.id
                            ? 'glass-pill-patient-active font-extrabold border-blue-400/60 shadow-xs'
                            : 'glass-card text-slate-700 border-white/40 hover:bg-white/40'
                        }`}
                      >
                        <span className="text-base block">{lang.flag}</span>
                        <span className="text-[11px] font-bold block mt-0.5">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Guidance Toggle */}
                <div className="flex items-center justify-between pt-1 border-t border-white/30">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Voice Audio Coach</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Spoken rep pacing cues</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                      voiceEnabled ? 'glass-pill-patient-active' : 'glass-card text-slate-500'
                    }`}
                  >
                    {voiceEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Spatial Earphone Haptic Feedback */}
                <div className="flex items-center justify-between pt-1 border-t border-white/30">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-blue-600" />
                      <span>Directional Earphones</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Left vs right earbud posture buzz</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleEarphoneMode}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                      earphoneMode ? 'glass-pill-patient-active' : 'glass-card text-slate-500'
                    }`}
                  >
                    {earphoneMode ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* Visual Accessibility Quick Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/30">
                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                      highContrast ? 'glass-pill-hospital-active' : 'glass-button text-slate-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contrast</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleLargeText}
                    className={`p-2 rounded-xl text-center border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                      largeText ? 'glass-pill-patient-active' : 'glass-button text-slate-600'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5 text-blue-600" />
                    <span>Font Size</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* 2. User Profile & Role Dropdown */}
          {!isAuthenticated ? (
            <Link
              href="/login"
              id="navbar-login-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 hover:scale-[1.02] transition-all border border-white/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          ) : (
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-button border border-white/50 hover:bg-white/40 transition-all shadow-xs"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-800 font-black flex items-center justify-center text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-slate-900 text-xs leading-none max-w-[100px] truncate">{user?.name}</p>
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider mt-0.5">{role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl glass-card-strong p-3 border border-white/60 shadow-2xl backdrop-blur-3xl z-50 space-y-3 text-xs">
                  
                  {/* User info banner */}
                  <div className="p-2.5 rounded-2xl glass-chip border border-white/40">
                    <p className="font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-800 border border-blue-400/30">
                      {role} Access Active
                    </div>
                  </div>

                  {/* Role Switcher options */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">
                      Switch Active Perspective
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => handleRoleToggle('PATIENT')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        role === 'PATIENT' ? 'glass-pill-patient-active font-bold' : 'hover:bg-white/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Patient Portal</span>
                      </div>
                      {role === 'PATIENT' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleToggle('THERAPIST')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        role === 'THERAPIST' ? 'glass-pill-therapist-active font-bold' : 'hover:bg-white/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-sky-600" />
                        <span>Therapist Console</span>
                      </div>
                      {role === 'THERAPIST' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleToggle('HOSPITAL')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        role === 'HOSPITAL' ? 'glass-pill-hospital-active font-bold' : 'hover:bg-white/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Hospital Admin</span>
                      </div>
                      {role === 'HOSPITAL' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  </div>

                  {role === 'PATIENT' && (
                    <div className="space-y-1 pt-2 border-t border-white/30">
                      <p className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">
                        Patient tools
                      </p>
                      <Link
                        href="/patient/documents"
                        onClick={() => setRoleMenuOpen(false)}
                        className="block px-2 py-1.5 rounded-xl text-slate-700 hover:bg-white/40 hover:text-blue-900 transition-all"
                      >
                        Medical documents
                      </Link>
                      <Link
                        href="/patient/manual"
                        onClick={() => setRoleMenuOpen(false)}
                        className="block px-2 py-1.5 rounded-xl text-slate-700 hover:bg-white/40 hover:text-blue-900 transition-all"
                      >
                        Camera-free mode
                      </Link>
                      <Link
                        href="/patient/onboarding"
                        onClick={() => setRoleMenuOpen(false)}
                        className="block px-2 py-1.5 rounded-xl text-slate-700 hover:bg-white/40 hover:text-blue-900 transition-all"
                      >
                        Camera calibration
                      </Link>
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-white/30">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-button text-rose-700 hover:bg-rose-500/10 border-rose-300/40 font-bold transition-all"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Log Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
