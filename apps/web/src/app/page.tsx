'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Activity, 
  Camera, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Sliders, 
  Lock, 
  Sparkles, 
  Eye, 
  Volume2, 
  HelpCircle,
  TrendingUp,
  Cpu,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { switchRole } = useAuth();

  const handlePatientDemo = async () => {
    await switchRole('PATIENT');
    router.push('/patient/dashboard');
  };

  const handleTherapistDemo = async () => {
    await switchRole('THERAPIST');
    router.push('/therapist/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-50 via-sky-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Problem Statement 05 — Camera-Assisted Home Rehabilitation Coach</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                Your Recovery. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-600">
                  Your Camera.
                </span> <br />
                Your Care Team.
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Camera-assisted rehabilitation that empowers patients to practice therapist-prescribed exercises at home with real-time confidence-gated feedback — while keeping clinical teams in continuous control.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handlePatientDemo}
                  className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Try Patient Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleTherapistDemo}
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-base border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>Therapist Dashboard Demo</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Confidence-Gated Feedback</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <span>Privacy by Design (Browser CV)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>Therapist Configured Targets</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Product Interface Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto rounded-3xl bg-slate-950 p-3 shadow-2xl border border-slate-800">
                {/* Simulated Camera Feed View */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 aspect-[4/5] flex flex-col justify-between p-4 text-white">
                  
                  {/* Top HUD */}
                  <div className="flex items-center justify-between z-10">
                    <div className="bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60">
                      <span className="text-[11px] font-semibold text-sky-300">Elbow Flexion & Extension</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>94% CONFIDENCE</span>
                    </div>
                  </div>

                  {/* Pose Skeleton Graphic Simulation */}
                  <div className="relative flex-1 flex items-center justify-center my-2">
                    <svg className="w-full h-full max-h-56" viewBox="0 0 200 240" fill="none">
                      {/* Body lines */}
                      <line x1="100" y1="50" x2="80" y2="80" stroke="#0284C7" strokeWidth="2.5" />
                      <line x1="100" y1="50" x2="120" y2="80" stroke="#0284C7" strokeWidth="2.5" />
                      <line x1="80" y1="80" x2="120" y2="80" stroke="#0284C7" strokeWidth="2.5" />
                      <line x1="80" y1="80" x2="85" y2="140" stroke="#0284C7" strokeWidth="2.5" />
                      <line x1="120" y1="80" x2="115" y2="140" stroke="#0284C7" strokeWidth="2.5" />
                      
                      {/* Active Arm (Elbow Flexion) */}
                      <line x1="80" y1="80" x2="65" y2="125" stroke="#10B981" strokeWidth="3.5" />
                      <line x1="65" y1="125" x2="72" y2="85" stroke="#10B981" strokeWidth="3.5" />
                      
                      {/* Joint Dots */}
                      <circle cx="100" cy="35" r="10" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
                      <circle cx="80" cy="80" r="5" fill="#10B981" />
                      <circle cx="65" cy="125" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="72" cy="85" r="5" fill="#10B981" />
                      <circle cx="120" cy="80" r="4" fill="#0284C7" />
                      <circle cx="135" cy="120" r="4" fill="#0284C7" />

                      {/* Live Angle Arc & Callout */}
                      <path d="M 68 110 A 15 15 0 0 1 78 122" stroke="#38BDF8" strokeWidth="2" strokeDasharray="2 2" fill="none" />
                      <rect x="18" y="112" width="40" height="20" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="38" y="126" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">104°</text>
                    </svg>
                  </div>

                  {/* Bottom Stats HUD */}
                  <div className="space-y-2 z-10">
                    <div className="bg-slate-900/90 backdrop-blur rounded-xl p-3 border border-slate-800 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">REPS</p>
                        <p className="text-lg font-black font-mono text-white">07<span className="text-xs text-slate-500">/10</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">CURRENT ROM</p>
                        <p className="text-lg font-black font-mono text-sky-400">104°</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">TARGET ROM</p>
                        <p className="text-lg font-black font-mono text-emerald-400">120°</p>
                      </div>
                    </div>

                    <div className="bg-sky-950/80 border border-sky-800/80 px-3 py-2 rounded-lg text-[11px] text-sky-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Good cadence — move smoothly within prescribed range</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (6-STEP REHABILITATION WORKFLOW) */}
      <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
              System Architecture & Data Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              How RehabSense Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
              A closed-loop rehabilitation flow combining local edge computer vision, confidence-gated feedback, and therapist supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              {
                step: '01',
                title: 'Capture',
                desc: 'Standard laptop or mobile camera captures user workspace at 30 fps.',
                icon: Camera
              },
              {
                step: '02',
                title: 'Detect',
                desc: 'MediaPipe Pose Landmarker predicts 33 body landmarks in browser.',
                icon: Activity
              },
              {
                step: '03',
                title: 'Analyze',
                desc: 'Calculates joint angles and continuous Range of Motion (ROM).',
                icon: Sliders
              },
              {
                step: '04',
                title: 'Validate',
                desc: 'Confidence Gate verifies landmark visibility before form evaluation.',
                icon: ShieldCheck
              },
              {
                step: '05',
                title: 'Feedback',
                desc: 'Rule engine delivers explainable visual and audio feedback cues.',
                icon: Volume2
              },
              {
                step: '06',
                title: 'Review',
                desc: 'Structured metrics sent to therapist to review and adjust targets.',
                icon: Stethoscope
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 hover:border-sky-500 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                      {item.step}
                    </span>
                    <item.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CORE DIFFERENTIATOR: CONFIDENCE GATE */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Core Clinical Differentiator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Confidence-Gated Movement Analysis
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                Most consumer fitness apps blindly generate form feedback even when limbs are occluded, leading to false counts and potentially misleading data.
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                RehabSense introduces a strict <strong>Confidence Gate</strong>. If camera distance, lighting, or joint visibility falls below clinical threshold, the system immediately pauses analysis.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    Prevents false rep counting when limbs are partially obstructed.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    Clear guidance prompts: <em>&quot;Keep your elbow visible in frame&quot;</em> instead of inaccurate form warnings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    Preserves data fidelity for the clinician&apos;s longitudinal review.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                
                {/* Visualizing Gate High vs Gated */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                      Tracking Optimal (94%)
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Active Analysis
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    All required joints visible. Joint angle and repetition state machine operational.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                      Tracking Paused (55%)
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                      Confidence Gate Engaged
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    &quot;Movement analysis paused — Required joints obscured: Please adjust camera so left wrist remains visible.&quot;
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PRIVACY BY DESIGN */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
              Healthcare Trust & Data Ethics
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              Privacy by Design
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
              Patient privacy is paramount. Camera imagery never leaves your physical device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                100% On-Device Pose Estimation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                MediaPipe runs in the client browser. No raw video feed or biometric images are ever uploaded or transmitted over the network.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Structured Numeric Metrics Only
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Only aggregate session data (reps, peak ROM angle, duration, tracking confidence, form flags) is persisted for clinician review.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Explicit Informed Consent
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Clear onboarding camera permissions with an explicit consent modal. Patients retain complete autonomy over camera access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACCESSIBILITY & CAMERA-FREE MODE */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
                Universal Accessibility
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                Built for Every Patient, Every Setup
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                Rehabilitation should never be restricted by hardware limitations or visual impairments. RehabSense includes a full accessibility suite and an inclusive <strong>Camera-Free Mode</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">High Contrast & Large Font</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Optimized for low-vision patients and distant screen viewing.</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Voice Feedback (Web Speech)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Spoken rep counting and pacing cues so patients don&apos;t need to stare at screens.</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Camera-Free Manual Logging</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enables exercise instruction, manual logging, and therapist communication without camera.</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Simulation Mode for Demos</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Deterministic kinematic movement generator for pitch-perfect hackathon demos.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-sky-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-200">Interactive Demo</span>
                <h3 className="text-2xl font-bold mt-1 mb-3">Experience the Complete Journey</h3>
                <p className="text-sm text-sky-100 leading-relaxed mb-6">
                  Experience onboarding, camera calibration, live exercise, progress tracking, and therapist review with preloaded clinical data for Aarav Mehta.
                </p>
              </div>

              <Link
                href="/demo"
                className="w-full py-3.5 px-4 bg-white text-slate-900 font-bold rounded-xl text-center hover:bg-slate-100 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Open Hackathon Demo Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            Ready to Explore RehabSense?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-base">
            Select a perspective below to experience the live prototype as a patient practicing at home or a therapist supervising recovery.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={handlePatientDemo}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              Start as Patient (Aarav Mehta)
            </button>
            <button
              onClick={handleTherapistDemo}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              Start as Therapist (Dr. Ananya Sharma)
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
