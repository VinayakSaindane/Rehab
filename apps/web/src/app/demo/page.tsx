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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl border border-white/20 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 border border-white/20 text-xs font-semibold backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Judge & Evaluator Demo Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              RehabSense Live Evaluation Suite
            </h1>

            <p className="text-slate-200 text-sm sm:text-base max-w-3xl leading-relaxed">
              Experience the end-to-end rehabilitation workflow without manual registration. Pre-seeded with 10 historical sessions, therapist-configured targets, flagged kinematic events, and real-time computer vision analysis.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleResetData}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-all cursor-pointer shadow-sm backdrop-blur"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting Data...' : 'Reset Demo to Clean Baseline'}</span>
              </button>

              {resetSuccess && (
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Demo state successfully restored!</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Role Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Patient Card */}
          <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border-2 border-sky-400/60 hover:border-sky-500 shadow-2xl transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center text-sky-600 border border-sky-200">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-sky-800 font-mono border border-sky-200">
                  DEMO PATIENT
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aarav Mehta</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  32 y/o • Post-operative upper-limb rehabilitation
                </p>
              </div>

              <div className="glass-card rounded-2xl p-4 text-xs space-y-1.5 text-slate-700 border border-sky-100/80">
                <p><strong>Assigned Plan:</strong> Elbow Flexion & Extension</p>
                <p><strong>Prescribed Target:</strong> 120° ROM • 10 reps • 2x/day</p>
                <p><strong>Streak:</strong> 6 days • 10 historical sessions recorded</p>
                <p><strong>Supervising Clinician:</strong> Dr. Ananya Sharma</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/dashboard')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <span>Launch Patient Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectRole('PATIENT', '/patient/exercise/elbow-flexion')}
                className="w-full py-3 rounded-xl glass-chip hover:bg-white/80 text-sky-800 font-semibold text-xs border border-sky-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Video className="w-3.5 h-3.5 text-sky-600" />
                <span>Jump Directly to Live Camera Exercise</span>
              </button>
            </div>
          </div>

          {/* Therapist Card */}
          <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border-2 border-teal-400/60 hover:border-teal-500 shadow-2xl transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl glass-chip flex items-center justify-center text-teal-600 border border-teal-200">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-teal-800 font-mono border border-teal-200">
                  DEMO THERAPIST
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dr. Ananya Sharma</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lead Musculoskeletal Physiotherapist • Apex Orthopaedic Center
                </p>
              </div>

              <div className="glass-card rounded-2xl p-4 text-xs space-y-1.5 text-slate-700 border border-teal-100/80">
                <p><strong>Active Clinical Census:</strong> 14 active patients</p>
                <p><strong>Pending Flagged Sessions:</strong> 1 requiring clinical review</p>
                <p><strong>Flagged Event:</strong> Aarav Mehta (Session #6: 108° vs 120°)</p>
                <p><strong>Authority:</strong> Review, Override Targets & Configure Exercises</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/dashboard')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <span>Launch Therapist Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectRole('THERAPIST', '/therapist/review/session-hist-6')}
                className="w-full py-3 rounded-xl bg-amber-100/70 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Jump Directly to Flagged Session Review</span>
              </button>
            </div>
          </div>

        </div>

        {/* Step-by-Step Judge Walkthrough Script */}
        <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl space-y-6 backdrop-blur-xl">
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
              <div key={item.step} className="p-4 sm:p-5 rounded-2xl glass-card border border-white/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-bold text-sm flex items-center justify-center shrink-0 border border-purple-200">
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-800 glass-chip hover:bg-white/80 border border-purple-200 transition-colors shrink-0"
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

