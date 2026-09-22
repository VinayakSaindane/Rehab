'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Play, 
  Flame, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ArrowRight, 
  Video, 
  Sliders,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function PatientDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getPatientDashboard();
        setData(res);
      } catch (err) {
        // Fallback default mock data matching Aarav Mehta
        setData({
          greeting: 'Good evening, Aarav',
          patient: {
            name: 'Aarav Mehta',
            condition_label: 'Post-operative upper-limb rehabilitation',
            therapist_name: 'Dr. Ananya Sharma'
          },
          todays_rehab: {
            exercise_count: 2,
            estimated_minutes: 12,
            yesterday_completion: '8 / 10 reps completed yesterday',
            assigned_exercises: [
              {
                id: 'elbow-flexion',
                name: 'Elbow Flexion & Extension',
                body_region: 'Upper Limb',
                difficulty: 'Beginner',
                target_reps: 10,
                target_rom: 120.0,
                prescription_id: 'presc-1'
              }
            ]
          },
          streak_days: 6,
          movement_progress: {
            label: '+18% ROM over the last 4 sessions',
            rom_improvement_pct: 18.2,
            neutral_summary: 'Steady upward movement range trajectory observed within prescribed limits.'
          },
          therapist_message: {
            from: 'Dr. Ananya Sharma',
            content: 'Focus on smooth eccentric extension. Targets are calibrated to your current recovery phase.',
            date: 'Today, 11:30 AM'
          },
          recent_session: {
            id: 'session-hist-10',
            exercise_name: 'Elbow Flexion & Extension',
            completed_reps: 10,
            target_reps: 10,
            average_rom: 114,
            tracking_confidence: 0.95,
            started_at: '2026-09-20T18:30:00Z'
          }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading rehabilitation dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Greeting & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{data.patient?.condition_label || 'Post-operative upper-limb rehabilitation'}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supervising Clinician: <strong className="text-slate-700 dark:text-slate-300">{data.patient?.therapist_name || 'Dr. Ananya Sharma'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/patient/onboarding"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Camera Calibration
            </Link>

            <Link
              href="/patient/exercise/elbow-flexion"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Today&apos;s Workout</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Today's Rehab Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Today&apos;s Rehab Plan
              </span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {data.todays_rehab?.exercise_count || 2}
                </span>
                <span className="text-sm font-semibold text-slate-500">exercises</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimated duration: ~{data.todays_rehab?.estimated_minutes || 12} minutes
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{data.todays_rehab?.yesterday_completion || '8 / 10 reps completed yesterday'}</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Streak
              </span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {data.streak_days || 6}
                </span>
                <span className="text-sm font-semibold text-slate-500">consecutive days</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Consistent adherence to prescribed home exercises
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Target: 7-day consistency goal
            </div>
          </div>

          {/* Movement Progress (Neutral Language) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Movement Range Trend
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {data.movement_progress?.label || '+18% ROM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Measured across last 4 recorded sessions
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              Prescribed target: 120° ROM
            </div>
          </div>

        </div>

        {/* Assigned Exercises & Therapist Communication Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 8 Cols: Today's Assigned Exercises */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Assigned Rehabilitation Exercises
              </h2>
              <Link href="/patient/manual" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Use Camera-Free Mode →
              </Link>
            </div>

            <div className="space-y-4">
              {/* Primary Exercise Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-sky-500/40 hover:border-sky-500 shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Upper Limb
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Frontal Camera View</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Elbow Flexion & Extension
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <p><strong>Target:</strong> 10 reps</p>
                    <p><strong>Prescribed ROM:</strong> 40° → 120°</p>
                    <p><strong>Tempo:</strong> 2s flex / 2s extend</p>
                  </div>
                </div>

                <Link
                  href="/patient/exercise/elbow-flexion"
                  className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Live Session</span>
                </Link>
              </div>

              {/* Secondary Exercise Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 opacity-90">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      Upper Limb
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Side Profile View</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Shoulder Flexion (Elevations)
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <p><strong>Target:</strong> 10 reps</p>
                    <p><strong>Prescribed ROM:</strong> 30° → 135°</p>
                    <p><strong>Hold:</strong> 1.0 sec</p>
                  </div>
                </div>

                <Link
                  href="/patient/exercise/shoulder-flexion"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Practice Exercise</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Clinician Note & Next Session */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Clinician Message */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Therapist Communication</span>
                </div>
                <span className="text-[11px] text-slate-400">{data.therapist_message?.date || 'Today'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &quot;{data.therapist_message?.content || 'Focus on smooth eccentric extension. Targets are calibrated to your current recovery phase.'}&quot;
                </p>
                <p className="text-xs font-bold text-teal-800 dark:text-teal-300 mt-3">
                  — {data.therapist_message?.from || 'Dr. Ananya Sharma'}
                </p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Targets are regularly evaluated by Dr. Sharma based on your recorded session metrics.
              </p>
            </div>

            {/* Recent Session Badge */}
            {data.recent_session && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Most Recent Session
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {data.recent_session.exercise_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Reps: {data.recent_session.completed_reps} / {data.recent_session.target_reps} • Avg ROM: {Math.round(data.recent_session.average_rom)}°
                    </p>
                  </div>
                  <Link
                    href="/patient/progress"
                    className="text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    View Trends →
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
