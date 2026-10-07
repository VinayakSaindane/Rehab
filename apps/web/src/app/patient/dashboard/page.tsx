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
import AudioCoachWidget from '@/components/AudioCoachWidget';

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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          {/* Header skeleton */}
          <div className="glass-card-strong p-6 rounded-3xl border border-white/80">
            <div className="h-3 w-48 bg-sky-200/50 rounded-full mb-3" />
            <div className="h-7 w-64 bg-sky-200/60 rounded-full mb-2" />
            <div className="h-3 w-40 bg-sky-200/40 rounded-full" />
          </div>

          {/* 3 metric card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-sky-200/50 rounded-full" />
                  <div className="h-4 w-4 bg-sky-200/50 rounded" />
                </div>
                <div className="h-8 w-16 bg-sky-200/60 rounded-full" />
                <div className="h-3 w-36 bg-sky-200/40 rounded-full" />
              </div>
            ))}
          </div>

          {/* Exercise card skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-5 w-48 bg-sky-200/50 rounded-full" />
              {[1, 2].map(i => (
                <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-3">
                  <div className="h-3 w-20 bg-sky-200/50 rounded-full" />
                  <div className="h-5 w-48 bg-sky-200/60 rounded-full" />
                  <div className="h-3 w-64 bg-sky-200/40 rounded-full" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-white/70 space-y-3">
                <div className="h-3 w-32 bg-sky-200/50 rounded-full" />
                <div className="h-12 w-full bg-sky-200/40 rounded-2xl" />
                <div className="h-3 w-40 bg-sky-200/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Greeting & Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card-strong p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xl backdrop-blur-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-sky-800 text-xs font-semibold mb-2.5 border border-white/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{data.patient?.condition_label || 'Post-operative upper-limb rehabilitation'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {data.greeting}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Supervising Clinician:</span>
              <strong className="text-slate-800 font-semibold">{data.patient?.therapist_name || 'Dr. Ananya Sharma'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/patient/find-therapist"
              id="find-therapist-link"
              className="px-4 py-2.5 rounded-xl glass-chip hover:bg-white/80 text-sky-800 text-xs font-bold transition-all border border-sky-200/80 flex items-center gap-2 shadow-xs hover:shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Find Therapist
            </Link>

            <Link
              href="/patient/onboarding"
              className="px-4 py-2.5 rounded-xl glass-chip hover:bg-white/80 text-slate-700 text-xs font-bold transition-all border border-white/80 shadow-xs hover:shadow-sm"
            >
              Camera Calibration
            </Link>

            <Link
              href="/patient/exercise/elbow-flexion"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 border border-white/30"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Today&apos;s Workout</span>
            </Link>
          </div>
        </div>

        {/* Multi-Language Voice & Spatial Earphone Calibration Widget */}
        <AudioCoachWidget />

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Today's Rehab Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Rehab Plan
              </span>
              <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-sky-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                  {data.todays_rehab?.exercise_count || 2}
                </span>
                <span className="text-sm font-semibold text-slate-500">exercises prescribed</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimated duration: ~{data.todays_rehab?.estimated_minutes || 12} minutes
              </p>
            </div>
            <div className="pt-3 border-t border-white/70 text-xs text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{data.todays_rehab?.yesterday_completion || '8 / 10 reps completed yesterday'}</span>
            </div>
          </div>

          {/* Current Streak */}
          <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/20 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Streak
              </span>
              <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-amber-600 font-mono tracking-tight">
                  {data.streak_days || 6}
                </span>
                <span className="text-sm font-semibold text-slate-500">consecutive days</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Consistent adherence to prescribed home exercises
              </p>
            </div>
            <div className="pt-3 border-t border-white/70 text-xs text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium">Target: 7-day consistency goal</span>
            </div>
          </div>

          {/* Movement Progress (Neutral Language) */}
          <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-all" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Movement Range Trend
              </span>
              <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-sky-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight">
                  {data.movement_progress?.label || '+18% ROM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Measured across last 4 recorded sessions
              </p>
            </div>
            <div className="pt-3 border-t border-white/70 text-xs text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="font-medium">Prescribed target: 120° ROM</span>
            </div>
          </div>

        </div>

        {/* Assigned Exercises & Therapist Communication Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 8 Cols: Today's Assigned Exercises */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Assigned Rehabilitation Exercises
              </h2>
              <Link href="/patient/manual" className="text-xs font-semibold text-sky-700 hover:text-sky-900 glass-chip px-3 py-1.5 rounded-lg border border-white/80 transition-colors">
                Use Camera-Free Mode →
              </Link>
            </div>

            <div className="space-y-4">
              {/* Primary Exercise Card */}
              <div className="glass-card-strong rounded-3xl p-6 sm:p-7 border-2 border-sky-400/60 hover:border-sky-500 shadow-xl hover:shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 inset-y-0 bg-gradient-to-b from-sky-500 to-teal-500" />
                <div className="space-y-2.5 pl-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-sky-800 border border-sky-200/80">
                      Upper Limb
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Frontal Camera View
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Elbow Flexion & Extension
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Target:</strong> 10 reps</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Prescribed ROM:</strong> 40° → 120°</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Tempo:</strong> 2s flex / 2s extend</p>
                  </div>
                </div>

                <Link
                  href="/patient/exercise/elbow-flexion"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/30"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Live Session</span>
                </Link>
              </div>

              {/* Secondary Exercise Card */}
              <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-teal-800 border border-teal-200/80">
                      Upper Limb
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Side Profile View
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Shoulder Flexion (Elevations)
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Target:</strong> 10 reps</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Prescribed ROM:</strong> 30° → 135°</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Hold:</strong> 1.0 sec</p>
                  </div>
                </div>

                <Link
                  href="/patient/exercise/shoulder-flexion"
                  className="px-5 py-3 rounded-xl glass-chip hover:bg-white/80 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/80 shadow-xs"
                >
                  <Video className="w-4 h-4 text-teal-600" />
                  <span>Practice Exercise</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Clinician Note & Next Session */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Clinician Message */}
            <div className="glass-card-strong rounded-3xl p-6 border border-white/80 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
                  <div className="w-7 h-7 rounded-lg glass-chip flex items-center justify-center text-teal-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>Therapist Communication</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{data.therapist_message?.date || 'Today'}</span>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-teal-200/70 shadow-xs">
                {data.therapist_message?.has_guidance && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100/80 text-teal-800 text-[10px] font-bold mb-2.5 border border-teal-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    <span>New Guidance Received</span>
                  </div>
                )}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &quot;{data.therapist_message?.content || 'Focus on smooth eccentric extension. Targets are calibrated to your current recovery phase.'}&quot;
                </p>
                <p className="text-xs font-bold text-teal-800 mt-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  <span>— {data.therapist_message?.from || 'Dr. Ananya Sharma'}</span>
                </p>

                {data.therapist_message?.coaching_cues?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-teal-100 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                      Doctor&apos;s Coaching Cues:
                    </p>
                    <ul className="space-y-1">
                      {data.therapist_message.coaching_cues.map((cue: string, i: number) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-teal-600 font-bold">•</span>
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Targets are regularly evaluated by Dr. Sharma based on your recorded session metrics.
              </p>
            </div>

            {/* Recent Session Badge */}
            {data.recent_session && (
              <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Most Recent Session
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {data.recent_session.exercise_name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reps: {data.recent_session.completed_reps} / {data.recent_session.target_reps} • Avg ROM: {Math.round(data.recent_session.average_rom)}°
                    </p>
                  </div>
                  <Link
                    href="/patient/progress"
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 glass-chip px-3 py-1.5 rounded-lg border border-white/80 transition-colors"
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
