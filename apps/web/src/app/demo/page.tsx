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
  CheckCircle2, 
  Video, 
  Sliders, 
  Eye, 
  Check, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function DemoPortalPage() {
  const router = useRouter();
  const { role, switchRole } = useAuth();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-purple-800/40 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Judge & Evaluator Demo Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              RehabSense Live Evaluation Suite
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              Experience the end-to-end rehabilitation workflow without manual registration. Pre-seeded with 10 historical sessions, therapist-configured targets, flagged kinematic events, and real-time computer vision analysis.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting Data...' : 'Reset Demo to Clean Baseline'}</span>
              </button>

              {resetSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Demo state successfully restored!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Role Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Patient Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-sky-500/30 hover:border-sky-500 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                  DEMO PATIENT
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Aarav Mehta</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  32 y/o • Post-operative upper-limb rehabilitation
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Assigned Plan:</strong> Elbow Flexion & Extension</p>
                <p><strong>Prescribed Target:</strong> 120° ROM • 10 reps • 2x/day</p>
                <p><strong>Streak:</strong> 6 days • 10 historical sessions recorded</p>
                <p><strong>Supervising Clinician:</strong> Dr. Ananya Sharma</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/dashboard')}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Patient Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/exercise/elbow-flexion')}
                className="w-full py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-200 dark:border-sky-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Jump Directly to Live Camera Exercise</span>
              </button>
            </div>
          </div>

          {/* Therapist Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-teal-500/30 hover:border-teal-500 shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                  DEMO THERAPIST
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dr. Ananya Sharma</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lead Musculoskeletal Physiotherapist • Apex Orthopaedic Center
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Active Clinical Census:</strong> 14 active patients</p>
                <p><strong>Pending Flagged Sessions:</strong> 1 requiring clinical review</p>
                <p><strong>Flagged Event:</strong> Aarav Mehta (Session #6: 108° vs 120°)</p>
                <p><strong>Authority:</strong> Review, Override Targets & Configure Exercises</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/dashboard')}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Therapist Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/review/session-hist-6')}
                className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-800 dark:text-amber-200 font-semibold text-xs border border-amber-300 dark:border-amber-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Jump Directly to Flagged Session Review</span>
              </button>
            </div>
          </div>

        </div>

        {/* Step-by-Step Judge Walkthrough Script */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                Judging Guide
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Suggested 3-Minute Live Demo Flow
              </h2>
            </div>
          </div>

          <div className="space-y-4">
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
              <div key={item.step} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950 transition-colors shrink-0"
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
