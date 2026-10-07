'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Activity, 
  Camera, 
  ShieldCheck, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sliders, 
  Lock, 
  Sparkles, 
  Eye, 
  Volume2, 
  LogIn,
  Cpu,
  Headphones,
  FileCheck,
  Check
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { demoLogin } = useAuth();

  const handleLogin = () => {
    router.push('/login');
  };

  const handlePatientDemo = async () => {
    await demoLogin('PATIENT');
    router.push('/patient/dashboard');
  };

  const handleTherapistDemo = async () => {
    await demoLogin('THERAPIST');
    router.push('/therapist/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen select-none">
      
      {/* 1. HERO SECTION (Spacious, Blue Theme, Transparent Frosted Glass) */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Header Content */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-chip text-blue-900 bg-blue-500/10 text-xs font-bold border border-blue-400/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Problem Statement 05 · Camera-Assisted Rehabilitation Coach</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Precision Recovery. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
                Guided by Vision.
              </span> <br />
              Controlled by Clinicians.
            </h1>

            {/* Subtitle with breathing room */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Empower home physical therapy with real-time browser pose tracking, directional audio feedback, and seamless clinician oversight.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <button
                onClick={handleLogin}
                id="hero-login-btn"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-600/25 hover:scale-[1.02] transition-all flex items-center gap-2.5 group cursor-pointer border border-white/30"
              >
                <LogIn className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>Launch Portal / Login</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handlePatientDemo}
                id="hero-demo-patient-btn"
                className="px-6 py-4 rounded-2xl glass-button text-slate-800 font-bold text-sm border border-white/50 hover:border-blue-400/60 shadow-md transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current text-blue-600" />
                <span>Demo Patient (Aarav)</span>
              </button>

              <button
                onClick={handleTherapistDemo}
                id="hero-demo-therapist-btn"
                className="px-6 py-4 rounded-2xl glass-button text-slate-800 font-bold text-sm border border-white/50 hover:border-blue-400/60 shadow-md transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
              >
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                <span>Demo Therapist (Dr. Demo)</span>
              </button>
            </div>

            {/* Trust Chips Strip */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2 glass-chip px-4 py-2 rounded-full border border-white/50 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Confidence-Gated Biofeedback</span>
              </div>
              <div className="flex items-center gap-2 glass-chip px-4 py-2 rounded-full border border-white/50 shadow-xs">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Privacy by Design (Browser CV)</span>
              </div>
              <div className="flex items-center gap-2 glass-chip px-4 py-2 rounded-full border border-white/50 shadow-xs">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>Therapist-Calibrated ROM Targets</span>
              </div>
            </div>

          </div>

          {/* Hero Transparent Frosted Glass Showcase Grid (Replaces old right-side box animator) */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Feature 1: ROM Tracking */}
              <div className="glass-card-strong p-6 rounded-3xl border border-white/50 shadow-xl space-y-4 hover:border-blue-300 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-400/30 flex items-center justify-center text-blue-600 shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono">Real-Time Bio-Mechanics</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Live ROM Tracking</h3>
                </div>
                <div className="p-3 rounded-2xl glass-chip border border-white/40 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Observed Arc</span>
                    <span className="text-lg font-black font-mono text-blue-600">104°</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-slate-600">
                    <span>Prescribed Target</span>
                    <span className="font-mono font-bold">120°</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time angle computation at 30 fps with smooth cadence pacing.
                </p>
              </div>

              {/* Feature 2: Confidence Gate */}
              <div className="glass-card-strong p-6 rounded-3xl border border-white/50 shadow-xl space-y-4 hover:border-blue-300 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-400/30 flex items-center justify-center text-indigo-600 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono">Edge Quality Control</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Confidence Gate</h3>
                </div>
                <div className="p-3 rounded-2xl glass-chip border border-white/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Keypoint Fidelity</span>
                    <span className="text-xs font-mono font-extrabold text-blue-700 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/40">94% PASS</span>
                  </div>
                  <p className="text-[11px] text-slate-600">No false repetitions when occluded.</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pauses analysis immediately if limbs or joints leave the camera frame.
                </p>
              </div>

              {/* Feature 3: Spatial Audio Coach */}
              <div className="glass-card-strong p-6 rounded-3xl border border-white/50 shadow-xl space-y-4 hover:border-blue-300 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-sky-600/15 border border-sky-400/30 flex items-center justify-center text-sky-600 shadow-xs">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 font-mono">Directional Audio</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Spatial Audio Coach</h3>
                </div>
                <div className="p-3 rounded-2xl glass-chip border border-white/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                    <span>🇬🇧 EN</span>
                    <span className="text-slate-300">·</span>
                    <span>🇮🇳 हिन्दी</span>
                    <span className="text-slate-300">·</span>
                    <span>🚩 मराठी</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Left vs right earphone posture haptics.</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Natural spoken instructions let patients practice without staring at screens.
                </p>
              </div>

              {/* Feature 4: Clinician Census Sync */}
              <div className="glass-card-strong p-6 rounded-3xl border border-white/50 shadow-xl space-y-4 hover:border-blue-300 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-400/30 flex items-center justify-center text-blue-600 shadow-xs">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono">Clinical Oversight</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Clinician Census</h3>
                </div>
                <div className="p-3 rounded-2xl glass-chip border border-white/40 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Assigned Care</span>
                    <span className="font-bold text-slate-800">Dr. Demo</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Hospital MRI & telemetry linked.</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Physiotherapists review session metrics and adjust targets remotely.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. HOW IT WORKS (Streamlined 4-Step Architecture) */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Closed-Loop Rehabilitation Protocol
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How RehabSense Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Edge computer vision meets clinician control for verified, safe home physical therapy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Capture',
                desc: 'Standard laptop or webcam captures exercise motion at 30 fps without specialized sensors.',
                icon: Camera
              },
              {
                step: '02',
                title: 'Detect & Analyze',
                desc: 'MediaPipe estimates 33 body landmarks in browser, computing exact joint angles and ROM.',
                icon: Activity
              },
              {
                step: '03',
                title: 'Confidence Gating',
                desc: 'Immediate pause if lighting, distance, or limb occlusions degrade measurement certainty.',
                icon: ShieldCheck
              },
              {
                step: '04',
                title: 'Therapist Oversight',
                desc: 'Clinicians review longitudinal compliance trends, flag compensatory movement, and adjust protocols.',
                icon: Stethoscope
              }
            ].map((item, idx) => (
              <div key={idx} className="glass-card rounded-3xl p-6 border border-white/45 hover:border-blue-400/60 transition-all flex flex-col justify-between hover:-translate-y-1 shadow-lg space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-blue-600 font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl glass-chip flex items-center justify-center text-blue-600 border border-white/40">
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. CONFIDENCE-GATED ANALYSIS & SAFETY */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                Core Clinical Safeguard
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Confidence-Gated Biofeedback
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                Standard fitness apps blindly count repetitions even when limbs are occluded or out of view. This generates inaccurate data and risks patient safety.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                RehabSense enforces a strict clinical <strong className="text-slate-900">Confidence Gate</strong>: if camera distance, angle, or landmark tracking drops below clinical tolerance, analysis pauses instantly.
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700 font-medium">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Eliminates false rep counts caused by occlusion or improper camera perspective.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Delivers clear guidance: <em>&quot;Please keep wrist visible in frame&quot;</em> instead of erroneous warnings.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Preserves medical fidelity for treating therapists and hospital audit logs.</span>
                </div>
              </div>
            </div>

            {/* Visual Glass Differentiator Cards */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Card 1: Active Analysis */}
              <div className="p-6 rounded-3xl glass-card-strong border border-blue-400/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase text-blue-900">
                      Tracking Optimal (94% Confidence)
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/15 text-blue-900 border border-blue-400/40 font-mono">
                    ACTIVE EVALUATION
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  All critical joints clearly visible. Kinematic state machine evaluates smooth flexion arc and cadence accurately.
                </p>
              </div>

              {/* Card 2: Gated Prompt */}
              <div className="p-6 rounded-3xl glass-card-strong border border-amber-400/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase text-amber-900">
                      Tracking Paused (55% Confidence)
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-400/40 font-mono">
                    GATE ENGAGED
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &quot;Analysis paused — Left wrist partially obscured. Please adjust laptop angle slightly backward.&quot;
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. PRIVACY & SECURITY BY DESIGN */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Healthcare Ethics & Data Protection
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Privacy by Design
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Camera feeds never leave your browser. Zero cloud video streaming guarantees total patient confidentiality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl glass-card border border-white/45 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/50 flex items-center justify-center text-blue-600 shadow-xs">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                100% In-Browser MediaPipe
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer vision runs directly on your device via WebAssembly. No raw video feed or biometric images are ever transmitted over the network.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-white/45 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/50 flex items-center justify-center text-indigo-600 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Numeric Telemetry Only
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only aggregate biomechanical numbers (reps, peak range-of-motion angle, session duration, and form flags) are preserved for clinician review.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-white/45 shadow-lg space-y-3">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/50 flex items-center justify-center text-sky-600 shadow-xs">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Explicit Informed Consent
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Patients retain complete autonomy. Camera access is strictly opt-in, with a camera-free manual logging mode always available.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <div className="glass-card-strong rounded-[32px] p-8 sm:p-12 border border-white/50 shadow-2xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Ready to Experience RehabSense?
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Explore the full interactive system from patient, physiotherapist, or hospital administrator perspectives.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                onClick={handleLogin}
                id="cta-login-btn"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-600/25 hover:scale-105 cursor-pointer border border-white/30 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Access Portal / Login</span>
              </button>
              <button
                onClick={handlePatientDemo}
                className="px-6 py-4 rounded-2xl glass-button text-slate-800 font-bold text-sm transition-all border border-white/50 hover:border-blue-400 shadow-md hover:scale-105 cursor-pointer"
              >
                Patient Demo (Aarav)
              </button>
              <button
                onClick={handleTherapistDemo}
                className="px-6 py-4 rounded-2xl glass-button text-slate-800 font-bold text-sm transition-all border border-white/50 hover:border-blue-400 shadow-md hover:scale-105 cursor-pointer"
              >
                Therapist Console (Dr. Demo)
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
