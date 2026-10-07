'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  User, 
  Stethoscope, 
  RotateCcw, 
  ArrowRight, 
  Video, 
  Check, 
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

export default function DemoPortalPage() {
  const router = useRouter();
  const { switchRole } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSelectRole = async (targetRole: 'PATIENT' | 'THERAPIST', targetPath: string) => {
    await switchRole(targetRole);
    router.push(targetPath);
  };

  const handleResetData = async () => {
    setResetting(true);
    setResetSuccess(false);
    try {
      await api.resetDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch {
      setResetSuccess(true);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Floating Light Glass Header Card */}
        <div className="glass-card-strong rounded-[32px] p-8 sm:p-10 shadow-xl border border-white/90 relative overflow-hidden backdrop-blur-3xl">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-chip text-sky-800 border border-white/90 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Judge & Evaluator Demo Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              RehabSense Live Evaluation Suite
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
              Experience the end-to-end rehabilitation workflow without manual registration. Pre-seeded with 10 historical sessions, therapist-configured targets, flagged kinematic events, and real-time computer vision analysis.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="px-5 py-2.5 rounded-[18px] glass-chip hover:bg-white text-slate-800 text-xs font-bold border border-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting Data...' : 'Reset Demo to Clean Baseline'}</span>
              </button>

              {resetSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Demo state successfully restored!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Role Switcher Floating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Patient Card */}
          <div className="glass-card rounded-[32px] p-6 sm:p-8 border border-white/85 hover:border-white shadow-xl transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center text-sky-600 border border-white/90">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-sky-800 font-mono border border-white/90">
                  DEMO PATIENT
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aarav Mehta</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  32 y/o • Post-operative upper-limb rehabilitation
                </p>
              </div>

              <div className="glass-card rounded-[22px] p-4 text-xs space-y-1.5 text-slate-700 border border-white/80">
                <p><strong className="text-slate-900">Assigned Plan:</strong> Elbow Flexion & Extension</p>
                <p><strong className="text-slate-900">Prescribed Target:</strong> 120° ROM • 10 reps • 2x/day</p>
                <p><strong className="text-slate-900">Streak:</strong> 6 days • 10 historical sessions recorded</p>
                <p><strong className="text-slate-900">Supervising Clinician:</strong> Dr. Ananya Sharma</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/dashboard')}
                className="w-full py-4 rounded-[20px] bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Launch Patient Dashboard</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/exercise/elbow-flexion')}
                className="w-full py-3.5 rounded-[20px] glass-chip hover:bg-white text-sky-800 font-bold text-xs border border-white/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Video className="w-3.5 h-3.5 text-sky-600" />
                <span>Jump Directly to Live Camera Exercise</span>
              </button>
            </div>
          </div>

          {/* Therapist Card */}
          <div className="glass-card rounded-[32px] p-6 sm:p-8 border border-white/85 hover:border-white shadow-xl transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center text-teal-600 border border-white/90">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-teal-800 font-mono border border-white/90">
                  DEMO THERAPIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dr. Ananya Sharma</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lead Musculoskeletal Physiotherapist • Apex Orthopaedic Center
                </p>
              </div>

              <div className="glass-card rounded-[22px] p-4 text-xs space-y-1.5 text-slate-700 border border-white/80">
                <p><strong className="text-slate-900">Active Clinical Census:</strong> 14 active patients</p>
                <p><strong className="text-slate-900">Pending Flagged Sessions:</strong> 1 requiring clinical review</p>
                <p><strong className="text-slate-900">Flagged Event:</strong> Aarav Mehta (Session #6: 108° vs 120°)</p>
                <p><strong className="text-slate-900">Authority:</strong> Review, Override Targets & Configure Exercises</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/dashboard')}
                className="w-full py-4 rounded-[20px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Launch Therapist Dashboard</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/review/session-hist-6')}
                className="w-full py-3.5 rounded-[20px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 font-bold text-xs border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs backdrop-blur"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Jump Directly to Flagged Session Review</span>
              </button>
            </div>
          </div>

        </div>

        {/* Step-by-Step Judge Walkthrough Script */}
        <div className="glass-card-strong rounded-[32px] p-6 sm:p-8 border border-white/90 shadow-xl space-y-6 backdrop-blur-3xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-700">
                Judging Guide
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                Suggested 3-Minute Live Demo Flow
              </h2>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              {
                step: 1,
                title: "Launch Patient Experience",
                desc: "Select Demo Patient (Aarav Mehta). Observe greeting, streak (6 days), today's assigned rehab plan, and clinician notes from Dr. Ananya Sharma.",
                linkText: "Open Patient Dashboard",
                href: "/patient/dashboard"
              },
              {
                step: 2,
                title: "Camera Readiness & Framing Wizard",
                desc: "Navigate through the 7-step guided setup ensuring 6-10 ft distance, lighting, and full body visibility before exercising.",
                linkText: "Open Onboarding Wizard",
                href: "/patient/onboarding"
              },
              {
                step: 3,
                title: "Live Camera Exercise & Confidence Gate",
                desc: "Start Elbow Flexion. Use your webcam (Real Mode) or toggle Simulation Mode. Move your arm: observe skeleton overlay, joint angle tag (104°), and rep counter. Block camera to test the Confidence Gate pausing movement analysis!",
                linkText: "Open Live Exercise Screen",
                href: "/patient/exercise/elbow-flexion"
              },
              {
                step: 4,
                title: "Session Performance Metrics & Progress Trends",
                desc: "Complete the exercise session to view session metrics (valid reps, peak ROM, tracking quality). Check the Progress dashboard to view longitudinal ROM trends across 10 sessions.",
                linkText: "Open Progress Trends",
                href: "/patient/progress"
              },
              {
                step: 5,
                title: "Switch to Therapist & Inspect Flagged Session",
                desc: "Switch to Therapist (Dr. Ananya Sharma). Open flagged Session #6. Note the rule-engine flag on Rep #6 (Achieved 108° vs prescribed 120°).",
                linkText: "Open Flagged Session Review",
                href: "/therapist/review/session-hist-6"
              },
              {
                step: 6,
                title: "Execute Clinician Override & Close the Loop",
                desc: "Click 'Override Target', adjust target ROM from 120° to 110°, enter clinical justification ('Temporary reduced ROM target for progressive recovery'), and save. Switch back to Patient to verify the active prescription updated immediately!",
                linkText: "Open Therapist Clinical Census",
                href: "/therapist/dashboard"
              }
            ].map((item) => (
              <div key={item.step} className="p-4 sm:p-5 rounded-[22px] glass-card border border-white/85 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-purple-800 glass-chip hover:bg-white/90 border border-white/90 transition-colors shrink-0"
                >
                  <span>{item.linkText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
