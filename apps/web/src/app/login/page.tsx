'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/lib/auth-context';
import { 
  Activity, 
  User, 
  Stethoscope, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

import { Suspense } from 'react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { login, signup, demoLogin, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick Demo Login Handler (Instant 1-Click for Hackathons / Demonstrations)
  const handleDemoAuth = async (role: UserRole) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await demoLogin(role);
      if (role === 'THERAPIST') {
        router.push(redirectPath?.startsWith('/therapist') ? redirectPath : '/therapist/dashboard');
      } else if (role === 'HOSPITAL') {
        router.push(redirectPath?.startsWith('/hospital') ? redirectPath : '/hospital/dashboard');
      } else {
        router.push(redirectPath?.startsWith('/patient') ? redirectPath : '/patient/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Standard Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await login(email, password, selectedRole);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      if (selectedRole === 'THERAPIST') {
        router.push(redirectPath?.startsWith('/therapist') ? redirectPath : '/therapist/dashboard');
      } else if (selectedRole === 'HOSPITAL') {
        router.push(redirectPath?.startsWith('/hospital') ? redirectPath : '/hospital/dashboard');
      } else {
        router.push(redirectPath?.startsWith('/patient') ? redirectPath : '/patient/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Standard Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      setErrorMsg('Please complete all signup fields.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: selectedRole,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Account creation failed.');
        return;
      }

      if (selectedRole === 'THERAPIST') {
        router.push('/therapist/dashboard');
      } else if (selectedRole === 'HOSPITAL') {
        router.push('/hospital/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for testing manual login
  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'PATIENT') {
      setEmail('patient@demo.com');
      setPassword('demo123');
    } else if (role === 'THERAPIST') {
      setEmail('doctor@demo.com');
      setPassword('demo123');
    } else {
      setEmail('hospital@demo.com');
      setPassword('demo123');
    }
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] py-8 sm:py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Requirement 14: Atmospheric Blobs positioned directly behind login card */}
      <div className="absolute w-[500px] h-[500px] -top-20 -left-20 bg-teal-400/30 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] -bottom-20 -right-20 bg-sky-400/35 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute w-[420px] h-[420px] top-[30%] -right-16 bg-emerald-400/25 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Main card stack */}
      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-600/25 border border-white/40 mx-auto">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Universal Sign In
          </h1>
          <p className="text-sm text-slate-600">
            Camera-Assisted Rehabilitation & Care Team Gateway
          </p>
        </div>

        {/* 1-CLICK INSTANT DEMO LOGIN ACCESS CARD */}
        <div className="glass-card-strong p-5 rounded-[26px] border border-white/50 shadow-xl backdrop-blur-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant Demo Access</span>
            </div>
            <span className="text-[10px] glass-chip text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Zero Credentials Needed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              id="demo-patient-btn"
              onClick={() => handleDemoAuth('PATIENT')}
              disabled={submitting}
              className="py-3 px-3 rounded-2xl glass-button border-white/50 text-slate-900 hover:bg-white/40 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>Demo Patient</span>
              <span className="text-[10px] opacity-75 font-normal">Aarav Sharma</span>
            </button>

            <button
              type="button"
              id="demo-therapist-btn"
              onClick={() => handleDemoAuth('THERAPIST')}
              disabled={submitting}
              className="py-3 px-3 rounded-2xl glass-button border-white/50 text-slate-900 hover:bg-white/40 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              <span>Demo Therapist</span>
              <span className="text-[10px] opacity-75 font-normal">Dr. Demo</span>
            </button>

            <button
              type="button"
              id="demo-hospital-btn"
              onClick={() => handleDemoAuth('HOSPITAL')}
              disabled={submitting}
              className="py-3 px-3 rounded-2xl glass-button border-white/50 text-slate-900 hover:bg-white/40 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Demo Hospital</span>
              <span className="text-[10px] opacity-75 font-normal">Apollo Center</span>
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="glass-card-strong p-6 sm:p-7 rounded-[30px] border border-white/50 shadow-2xl backdrop-blur-3xl space-y-5">
          
          {/* Mode Switcher: Sign In vs Sign Up */}
          <div className="flex rounded-2xl glass-chip p-1 border border-white/40">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'glass-card text-slate-900 border-white/60 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'glass-card text-slate-900 border-white/60 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Switcher Tabs (Requirement 13 & 14: Translucent Role Switcher) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Select Your Clinical Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl glass-chip border border-white/40">
              <button
                type="button"
                id="role-tab-patient"
                onClick={() => setSelectedRole('PATIENT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'PATIENT'
                    ? 'glass-pill-patient-active font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                id="role-tab-therapist"
                onClick={() => setSelectedRole('THERAPIST')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'THERAPIST'
                    ? 'glass-pill-therapist-active font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Therapist</span>
              </button>

              <button
                type="button"
                id="role-tab-hospital"
                onClick={() => setSelectedRole('HOSPITAL')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'HOSPITAL'
                    ? 'glass-pill-hospital-active font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Hospital</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-400/40 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Content: SIGN IN (Requirement 14: Glass Inputs) */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Email or Username</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(selectedRole)}
                    className="text-[10px] text-emerald-800 hover:underline font-bold"
                  >
                    Autofill {selectedRole.toLowerCase()} demo
                  </button>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none z-10" />
                  <input
                    type="text"
                    id="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'PATIENT' 
                        ? 'patient@demo.com' 
                        : selectedRole === 'THERAPIST' 
                        ? 'doctor@demo.com' 
                        : 'hospital@demo.com'
                    }
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none z-10" />
                  <input
                    type="password"
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-600/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/30 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In as {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}</span>
              </button>
            </form>
          ) : (
            /* Form Content: SIGN UP */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  id="signup-name-input"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder={
                    selectedRole === 'PATIENT' ? 'e.g. John Doe' : selectedRole === 'THERAPIST' ? 'e.g. Dr. Jane Smith' : 'e.g. City General Hospital'
                  }
                  className="glass-input w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none z-10" />
                  <input
                    type="email"
                    id="signup-email-input"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none z-10" />
                  <input
                    type="password"
                    id="signup-password-input"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a password"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="signup-submit-btn"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-600/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/30 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Account</span>
              </button>
            </form>
          )}

          {/* Quick test account legend - interactive 1-click buttons */}
          <div className="pt-2 border-t border-white/30 text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                <span>Pre-Seeded Demo Test Accounts:</span>
              </p>
              <span className="text-[10px] text-blue-800 font-semibold">Click any to log in</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-[11px] font-mono">
              <button
                type="button"
                id="demo-card-patient"
                onClick={() => handleDemoAuth('PATIENT')}
                disabled={submitting}
                className="glass-chip p-2.5 rounded-xl border border-emerald-400/50 hover:bg-emerald-500/15 hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-xs"
                title="Click to sign in instantly as Demo Patient"
              >
                <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                  <span className="text-emerald-900 group-hover:underline">Patient</span>
                  <span className="text-[9px] bg-emerald-600/15 text-emerald-800 px-1 py-0.2 rounded font-sans font-bold">1-Click</span>
                </div>
                <div className="text-[10px] text-slate-600 truncate">patient@demo.com</div>
                <div className="text-[9px] text-slate-400 mt-0.5">pwd: demo123</div>
              </button>

              <button
                type="button"
                id="demo-card-therapist"
                onClick={() => handleDemoAuth('THERAPIST')}
                disabled={submitting}
                className="glass-chip p-2.5 rounded-xl border border-amber-400/50 hover:bg-amber-500/15 hover:border-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-xs"
                title="Click to sign in instantly as Demo Therapist"
              >
                <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                  <span className="text-amber-900 group-hover:underline">Doctor</span>
                  <span className="text-[9px] bg-amber-600/15 text-amber-800 px-1 py-0.2 rounded font-sans font-bold">1-Click</span>
                </div>
                <div className="text-[10px] text-slate-600 truncate">doctor@demo.com</div>
                <div className="text-[9px] text-slate-400 mt-0.5">pwd: demo123</div>
              </button>

              <button
                type="button"
                id="demo-card-hospital"
                onClick={() => handleDemoAuth('HOSPITAL')}
                disabled={submitting}
                className="glass-chip p-2.5 rounded-xl border border-sky-400/50 hover:bg-sky-500/15 hover:border-sky-500 hover:scale-[1.02] active:scale-[0.98] transition-all text-left cursor-pointer group shadow-xs"
                title="Click to sign in instantly as Demo Hospital"
              >
                <div className="flex items-center justify-between text-slate-900 font-bold mb-0.5">
                  <span className="text-sky-900 group-hover:underline">Hospital</span>
                  <span className="text-[9px] bg-sky-600/15 text-sky-800 px-1 py-0.2 rounded font-sans font-bold">1-Click</span>
                </div>
                <div className="text-[10px] text-slate-600 truncate">hospital@demo.com</div>
                <div className="text-[9px] text-slate-400 mt-0.5">pwd: demo123</div>
              </button>
            </div>
          </div>

        </div>

        {/* Back to landing link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline transition-colors"
          >
            ← Return to Overview Landing Page
          </Link>
        </div>

      </div>

    </div>
  );
}

export default function UniversalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading authentication portal...</span>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

