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
  Cpu
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
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-chip text-[#244b38] bg-emerald-600/10 text-xs font-bold border border-emerald-700/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#244b38]" />
                <span>Problem Statement 05 — Camera-Assisted Home Rehabilitation Coach</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1a2620] tracking-tight leading-[1.1]">
                Your Recovery. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#244b38] via-[#356e52] to-[#5a8e73]">
                  Your Camera.
                </span> <br />
                Your Care Team.
              </h1>

              <p className="text-lg sm:text-xl text-[#435147] max-w-2xl leading-relaxed font-normal">
                Camera-assisted rehabilitation that empowers patients to practice therapist-prescribed exercises at home with real-time confidence-gated feedback — while keeping clinical teams in continuous control.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handlePatientDemo}
                  className="px-7 py-4 rounded-[22px] bg-gradient-to-r from-[#244b38] via-[#2f5e46] to-[#3f7b5c] hover:from-[#1e3f2f] hover:to-[#35674c] text-white font-black text-base shadow-xl shadow-emerald-950/20 hover:scale-[1.02] transition-all flex items-center gap-2 group cursor-pointer border border-white/25"
                >
                  <Play className="w-4 h-4 fill-current text-white group-hover:scale-110 transition-transform" />
                  <span>Try Patient Demo</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleTherapistDemo}
                  className="px-7 py-4 rounded-[22px] glass-card text-[#222e26] font-bold text-base border border-[#e5dfd4] hover:border-stone-300 hover:bg-white/80 shadow-md transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
                >
                  <Stethoscope className="w-4 h-4 text-[#b86b45]" />
                  <span>Therapist Dashboard</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#435147] font-medium">
                <div className="flex items-center gap-2 glass-chip px-3.5 py-1.5 rounded-full border border-white/90 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#2f5e46]" />
                  <span>Confidence-Gated Feedback</span>
                </div>
                <div className="flex items-center gap-2 glass-chip px-3.5 py-1.5 rounded-full border border-white/90 shadow-xs">
                  <Lock className="w-4 h-4 text-[#4a5f52]" />
                  <span>Privacy by Design (Browser CV)</span>
                </div>
                <div className="flex items-center gap-2 glass-chip px-3.5 py-1.5 rounded-full border border-white/90 shadow-xs">
                  <Sliders className="w-4 h-4 text-[#b86b45]" />
                  <span>Therapist Configured Targets</span>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Product Interface Mockup Floating Glass Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto rounded-[32px] glass-card-strong p-4 sm:p-5 shadow-2xl border border-white/95">
                
                {/* Simulated Camera Feed View */}
                <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-b from-[#0c1812] via-[#12231a] to-[#182e23] aspect-[4/5] flex flex-col justify-between p-4 text-white border border-white/15">
                  
                  {/* Top HUD */}
                  <div className="flex items-center justify-between z-10">
                    <div className="bg-[#0e1d15]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
                      <span className="text-[11px] font-semibold text-[#bfe0cd]">Elbow Flexion & Extension</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#244b38]/40 text-[#8ce3b2] border border-[#4a8665]/50 px-3 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-[#52d18d] animate-pulse" />
                      <span>94% CONFIDENCE</span>
                    </div>
                  </div>

                  {/* Pose Skeleton Graphic Simulation */}
                  <div className="relative flex-1 flex items-center justify-center my-2">
                    <svg className="w-full h-full max-h-56" viewBox="0 0 200 240" fill="none">
                      {/* Body lines */}
                      <line x1="100" y1="50" x2="80" y2="80" stroke="#6d947f" strokeWidth="2.5" />
                      <line x1="100" y1="50" x2="120" y2="80" stroke="#6d947f" strokeWidth="2.5" />
                      <line x1="80" y1="80" x2="120" y2="80" stroke="#6d947f" strokeWidth="2.5" />
                      <line x1="80" y1="80" x2="85" y2="140" stroke="#6d947f" strokeWidth="2.5" />
                      <line x1="120" y1="80" x2="115" y2="140" stroke="#6d947f" strokeWidth="2.5" />
                      
                      {/* Active Arm (Elbow Flexion) */}
                      <line x1="80" y1="80" x2="65" y2="125" stroke="#49db96" strokeWidth="3.5" />
                      <line x1="65" y1="125" x2="72" y2="85" stroke="#49db96" strokeWidth="3.5" />
                      
                      {/* Joint Dots */}
                      <circle cx="100" cy="35" r="10" fill="#12251b" stroke="#87aa95" strokeWidth="2" />
                      <circle cx="80" cy="80" r="5" fill="#49db96" />
                      <circle cx="65" cy="125" r="7" fill="#49db96" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx="72" cy="85" r="5" fill="#49db96" />
                      <circle cx="120" cy="80" r="4" fill="#87aa95" />
                      <circle cx="135" cy="120" r="4" fill="#87aa95" />

                      {/* Live Angle Arc & Callout */}
                      <path d="M 68 110 A 15 15 0 0 1 78 122" stroke="#49db96" strokeWidth="2" strokeDasharray="2 2" fill="none" />
                      <rect x="18" y="112" width="40" height="20" rx="6" fill="#0a1610" stroke="#49db96" strokeWidth="1" />
                      <text x="38" y="126" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">104°</text>
                    </svg>
                  </div>

                  {/* Bottom Stats HUD */}
                  <div className="space-y-2 z-10">
                    <div className="bg-[#0c1812]/90 rounded-2xl p-3 border border-white/15 grid grid-cols-3 gap-2 text-center backdrop-blur-md">
                      <div>
                        <p className="text-[10px] text-white/70 font-semibold uppercase">REPS</p>
                        <p className="text-lg font-black font-mono text-white">07<span className="text-xs text-white/50">/10</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/70 font-semibold uppercase">CURRENT ROM</p>
                        <p className="text-lg font-black font-mono text-[#8ce3b2]">104°</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/70 font-semibold uppercase">TARGET ROM</p>
                        <p className="text-lg font-black font-mono text-[#49db96]">120°</p>
                      </div>
                    </div>

                    <div className="bg-[#13281d]/85 border border-[#3f7b5c]/50 px-3 py-2 rounded-xl text-[11px] text-[#c7eed7] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#49db96] animate-ping" />
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
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2f5e46]">
              System Architecture & Data Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2620] mt-2">
              How RehabSense Works
            </h2>
            <p className="text-[#435147] mt-3 text-base font-normal">
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
              <div key={idx} className="glass-card rounded-[28px] p-5 border border-white/85 hover:border-stone-300 transition-all flex flex-col justify-between hover:-translate-y-1 shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#2f5e46] font-mono">
                      {item.step}
                    </span>
                    <item.icon className="w-5 h-5 text-stone-400" />
                  </div>
                  <h3 className="text-base font-bold text-[#1a2620] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#435147] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CORE DIFFERENTIATOR: CONFIDENCE GATE */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#b86b45]">
                Core Clinical Differentiator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1a2620] tracking-tight">
                Confidence-Gated Movement Analysis
              </h2>
              <p className="text-[#435147] text-base leading-relaxed font-normal">
                Most consumer fitness apps blindly generate form feedback even when limbs are occluded, leading to false counts and potentially misleading data.
              </p>
              <p className="text-[#435147] text-base leading-relaxed font-normal">
                RehabSense introduces a strict <strong className="text-[#1a2620]">Confidence Gate</strong>. If camera distance, lighting, or joint visibility falls below clinical threshold, the system immediately pauses analysis.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2f5e46] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#2b3930] font-medium">
                    Prevents false rep counting when limbs are partially obstructed.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2f5e46] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#2b3930] font-medium">
                    Clear guidance prompts: <em>&quot;Keep your elbow visible in frame&quot;</em> instead of inaccurate form warnings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2f5e46] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#2b3930] font-medium">
                    Preserves data fidelity for the clinician&apos;s longitudinal review.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="glass-card-strong rounded-[32px] p-6 border border-white/90 shadow-xl space-y-4">
                
                {/* Visualizing Gate High vs Gated */}
                <div className="p-5 rounded-[22px] bg-[#ebf4ee] border border-[#b9d9c3] backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-[#1a442e]">
                      Tracking Optimal (94%)
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#cee4d6] text-[#123623] border border-[#a6ceb5]">
                      Active Analysis
                    </span>
                  </div>
                  <p className="text-xs text-[#30483a]">
                    All required joints visible. Joint angle and repetition state machine operational.
                  </p>
                </div>

                <div className="p-5 rounded-[22px] bg-[#fbf1eb] border border-[#ebd0c2] backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-[#7a3f22]">
                      Tracking Paused (55%)
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f6ded1] text-[#7a3f22] border border-[#ebc2ae]">
                      Confidence Gate Engaged
                    </span>
                  </div>
                  <p className="text-xs text-[#522c1b] font-medium">
                    &quot;Movement analysis paused — Required joints obscured: Please adjust camera so left wrist remains visible.&quot;
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. PRIVACY BY DESIGN */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2f5e46]">
              Healthcare Trust & Data Ethics
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2620] mt-2">
              Privacy by Design
            </h2>
            <p className="text-[#435147] mt-3 text-base font-normal">
              Patient privacy is paramount. Camera imagery never leaves your physical device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[28px] glass-card border border-white/85 hover:border-stone-300 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/90 flex items-center justify-center text-[#2f5e46] mb-4 shadow-xs bg-emerald-500/10">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2620] mb-2">
                100% On-Device Pose Estimation
              </h3>
              <p className="text-xs text-[#435147] leading-relaxed">
                MediaPipe runs in the client browser. No raw video feed or biometric images are ever uploaded or transmitted over the network.
              </p>
            </div>

            <div className="p-6 rounded-[28px] glass-card border border-white/85 hover:border-stone-300 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/90 flex items-center justify-center text-[#b86b45] mb-4 shadow-xs bg-amber-500/10">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2620] mb-2">
                Structured Numeric Metrics Only
              </h3>
              <p className="text-xs text-[#435147] leading-relaxed">
                Only aggregate session data (reps, peak ROM angle, duration, tracking confidence, form flags) is persisted for clinician review.
              </p>
            </div>

            <div className="p-6 rounded-[28px] glass-card border border-white/85 hover:border-stone-300 transition-all shadow-md">
              <div className="w-12 h-12 rounded-2xl glass-chip border border-white/90 flex items-center justify-center text-[#3e7259] mb-4 shadow-xs bg-teal-500/10">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2620] mb-2">
                Explicit Informed Consent
              </h3>
              <p className="text-xs text-[#435147] leading-relaxed">
                Clear onboarding camera permissions with an explicit consent modal. Patients retain complete autonomy over camera access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACCESSIBILITY & CAMERA-FREE MODE */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2f5e46]">
                Universal Accessibility
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1a2620]">
                Built for Every Patient, Every Setup
              </h2>
              <p className="text-[#435147] text-base leading-relaxed font-normal">
                Rehabilitation should never be restricted by hardware limitations or visual impairments. RehabSense includes a full accessibility suite and an inclusive <strong className="text-[#1a2620]">Camera-Free Mode</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-[24px] glass-card border border-white/85">
                  <h4 className="font-bold text-sm text-[#1a2620] mb-1">High Contrast & Large Font</h4>
                  <p className="text-xs text-[#435147]">Optimized for low-vision patients and distant screen viewing.</p>
                </div>
                <div className="p-5 rounded-[24px] glass-card border border-white/85">
                  <h4 className="font-bold text-sm text-[#1a2620] mb-1">Voice Feedback (Web Speech)</h4>
                  <p className="text-xs text-[#435147]">Spoken rep counting and pacing cues so patients don&apos;t need to stare at screens.</p>
                </div>
                <div className="p-5 rounded-[24px] glass-card border border-white/85">
                  <h4 className="font-bold text-sm text-[#1a2620] mb-1">Camera-Free Manual Logging</h4>
                  <p className="text-xs text-[#435147]">Enables exercise instruction, manual logging, and therapist communication without camera.</p>
                </div>
                <div className="p-5 rounded-[24px] glass-card border border-white/85">
                  <h4 className="font-bold text-sm text-[#1a2620] mb-1">Simulation Mode for Demos</h4>
                  <p className="text-xs text-[#435147]">Deterministic kinematic movement generator for pitch-perfect hackathon demos.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 glass-card-strong rounded-[32px] p-8 text-[#1a2620] shadow-2xl flex flex-col justify-between border border-white/95 backdrop-blur-3xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2f5e46]">Interactive Demo</span>
                <h3 className="text-2xl font-black mt-2 mb-3 text-[#1a2620]">Experience the Complete Journey</h3>
                <p className="text-sm text-[#435147] leading-relaxed mb-6">
                  Experience onboarding, camera calibration, live exercise, progress tracking, and therapist review with preloaded clinical data for Aarav Mehta.
                </p>
              </div>

              <Link
                href="/demo"
                className="w-full py-4 px-6 bg-gradient-to-r from-[#244b38] via-[#2f5e46] to-[#3f7b5c] hover:from-[#1e3f2f] hover:to-[#35674c] text-white font-black rounded-[22px] text-center hover:scale-[1.02] transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-[#a5e4c0]" />
                <span>Open Hackathon Demo Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a2620]">
            Ready to Explore RehabSense?
          </h2>
          <p className="text-[#435147] max-w-xl mx-auto text-base">
            Select a perspective below to experience the live prototype as a patient practicing at home or a therapist supervising recovery.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={handlePatientDemo}
              className="px-7 py-4 rounded-[22px] bg-gradient-to-r from-[#244b38] via-[#2f5e46] to-[#3f7b5c] hover:from-[#1e3f2f] hover:to-[#35674c] text-white font-black transition-all shadow-xl shadow-emerald-950/20 hover:scale-105 cursor-pointer border border-white/20"
            >
              Start as Patient (Aarav Mehta)
            </button>
            <button
              onClick={handleTherapistDemo}
              className="px-7 py-4 rounded-[22px] glass-card text-[#222e26] font-black transition-all border border-[#e5dfd4] hover:border-stone-300 hover:bg-white/80 shadow-md hover:scale-105 cursor-pointer"
            >
              Start as Therapist (Dr. Ananya Sharma)
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
