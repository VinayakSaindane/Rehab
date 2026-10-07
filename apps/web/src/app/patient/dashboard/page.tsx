'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { mockStorage } from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Sparkles,
  FileText,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import AudioCoachWidget from '@/components/AudioCoachWidget';

export default function PatientDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.id || 'patient-001';

  const [data, setData] = useState<any>(null);
  const [documentsCount, setDocumentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadPatientDashboard = async () => {
    mockStorage.init();

    const localPatient = mockStorage.getPatientById(patientId);
    const localPlan = mockStorage.getTreatmentPlan(patientId);
    const localDocs = mockStorage.getDocuments(patientId);
    setDocumentsCount(localDocs.length);

    let assignedTherapistName = 'Dr. Demo';
    if (localPatient?.therapistId) {
      const t = mockStorage.getTherapistById(localPatient.therapistId);
      if (t) assignedTherapistName = t.name;
    }

    const defaultPlan = {
      id: localPlan?.exerciseId || 'elbow-flexion',
      name: localPlan?.exerciseName || 'Elbow Flexion & Extension',
      body_region: 'Upper Limb',
      difficulty: 'Beginner',
      target_reps: localPlan?.targetReps || 10,
      target_rom: localPlan?.targetRom || 120.0,
      notes: localPlan?.notes || 'Focus on smooth eccentric extension. Targets calibrated to current recovery phase.',
      prescription_id: 'presc-1'
    };

    try {
      const res = await api.getPatientDashboard();
      setData({
        ...res,
        greeting: `Good day, ${user?.name?.split(' ')[0] || 'Aarav'}`,
        patient: {
          ...res.patient,
          name: user?.name || localPatient?.name || res.patient?.name,
          therapist_name: assignedTherapistName,
          condition_label: localPatient?.condition || res.patient?.condition_label,
        },
        active_plan: defaultPlan,
        therapist_message: {
          from: assignedTherapistName,
          content: localPlan?.notes || res.therapist_message?.content || 'Focus on smooth eccentric extension. Targets are calibrated to your current recovery phase.',
          date: 'Today, Active Protocol'
        }
      });
    } catch (err) {
      // Fallback default mock data matching current patient
      setData({
        greeting: `Good day, ${user?.name?.split(' ')[0] || 'Aarav'}`,
        patient: {
          name: user?.name || localPatient?.name || 'Demo Patient',
          condition_label: localPatient?.condition || 'Post-operative upper-limb rehabilitation',
          therapist_name: assignedTherapistName
        },
        active_plan: defaultPlan,
        todays_rehab: {
          exercise_count: 2,
          estimated_minutes: 12,
          yesterday_completion: '8 / 10 reps completed yesterday',
          assigned_exercises: [defaultPlan]
        },
        streak_days: localPatient?.currentStreakDays || 6,
        movement_progress: {
          label: '+18% ROM over the last 4 sessions',
          rom_improvement_pct: 18.2,
          neutral_summary: 'Steady upward movement range trajectory observed within prescribed limits.'
        },
        therapist_message: {
          from: assignedTherapistName,
          content: localPlan?.notes || 'Focus on smooth eccentric extension. Targets are calibrated to your current recovery phase.',
          date: 'Today, Active Protocol'
        },
        recent_session: {
          id: 'session-hist-10',
          exercise_name: defaultPlan.name,
          completed_reps: 10,
          target_reps: defaultPlan.target_reps,
          average_rom: 114,
          tracking_confidence: 0.95,
          started_at: '2026-09-20T18:30:00Z'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientDashboard();

    const handlePlanUpdate = () => loadPatientDashboard();
    window.addEventListener('rehabsense:treatment-plan-updated', handlePlanUpdate);
    window.addEventListener('rehabsense:assignment-updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('rehabsense:treatment-plan-updated', handlePlanUpdate);
      window.removeEventListener('rehabsense:assignment-updated', handlePlanUpdate);
    };
  }, [patientId, user?.name]);

  if (loading || !data) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="glass-card-strong p-6 rounded-3xl border border-white/80">
            <div className="h-3 w-48 bg-sky-200/50 rounded-full mb-3" />
            <div className="h-7 w-64 bg-sky-200/60 rounded-full mb-2" />
            <div className="h-3 w-40 bg-sky-200/40 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-4">
                <div className="h-3 w-24 bg-sky-200/50 rounded-full" />
                <div className="h-8 w-16 bg-sky-200/60 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activePlan = data.active_plan || {
    id: 'elbow-flexion',
    name: 'Elbow Flexion & Extension',
    target_rom: 120,
    target_reps: 10,
    notes: 'Focus on smooth eccentric extension.'
  };

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Greeting & Status Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card-strong p-6 sm:p-8 rounded-3xl border border-white/50 shadow-xl backdrop-blur-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-blue-800 text-xs font-semibold mb-2.5 border border-blue-400/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>{data.patient?.condition_label || 'Post-operative upper-limb rehabilitation'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {data.greeting}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <span>Supervising Clinician:</span>
                <strong className="text-slate-800 font-semibold">{data.patient?.therapist_name || 'Dr. Demo'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/patient/documents"
                id="patient-docs-banner-link"
                className="px-4 py-2.5 rounded-xl glass-button text-blue-900 text-xs font-bold transition-all border border-blue-300/40 flex items-center gap-2 shadow-xs hover:bg-white/40"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Medical Documents ({documentsCount})</span>
              </Link>

              <Link
                href="/patient/onboarding"
                className="px-4 py-2.5 rounded-xl glass-button text-slate-700 text-xs font-bold transition-all border border-white/50 shadow-xs hover:bg-white/40"
              >
                Camera Calibration
              </Link>

              <Link
                href={`/patient/exercise/${activePlan.id || 'elbow-flexion'}`}
                id="start-workout-btn"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all flex items-center gap-2 border border-white/30 cursor-pointer"
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
            <div className="glass-card rounded-3xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Today&apos;s Rehab Plan
                </span>
                <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-sky-600 border border-white/40">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                    {data.todays_rehab?.exercise_count || 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">prescribed exercises</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Estimated duration: ~{data.todays_rehab?.estimated_minutes || 10} minutes
                </p>
              </div>
              <div className="pt-3 border-t border-white/30 text-xs text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{data.todays_rehab?.yesterday_completion || '8 / 10 reps completed yesterday'}</span>
              </div>
            </div>

            {/* Current Streak */}
            <div className="glass-card rounded-3xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/20 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Streak
                </span>
                <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-amber-500 border border-white/40">
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
              <div className="pt-3 border-t border-white/30 text-xs text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-medium">Target: 7-day consistency goal</span>
              </div>
            </div>

            {/* Movement Progress (Neutral Language) */}
            <div className="glass-card rounded-3xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all space-y-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-all" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Movement Range Trend
                </span>
                <div className="w-8 h-8 rounded-xl glass-chip flex items-center justify-center text-sky-600 border border-white/40">
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
              <div className="pt-3 border-t border-white/30 text-xs text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="font-medium">Prescribed target: {activePlan.target_rom}° ROM</span>
              </div>
            </div>

          </div>

          {/* Assigned Exercises & Therapist Communication Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 8 Cols: Assigned Exercises */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Assigned Treatment Plan
                </h2>
                <Link href="/patient/manual" className="text-xs font-semibold text-sky-700 hover:text-sky-900 glass-chip px-3 py-1.5 rounded-lg border border-white/40 transition-colors">
                  Use Camera-Free Mode →
                </Link>
              </div>

              <div className="space-y-4">
                {/* Primary Prescribed Exercise Card */}
                <div className="glass-card-strong rounded-3xl p-6 sm:p-7 border-2 border-blue-400/50 hover:border-blue-400 shadow-xl hover:shadow-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 inset-y-0 bg-gradient-to-b from-blue-500 to-indigo-500" />
                  <div className="space-y-2.5 pl-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-blue-900 border border-blue-300/50">
                        Prescribed Protocol
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Frontal Camera AI Analysis
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {activePlan.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Target:</strong> {activePlan.target_reps} reps</p>
                      <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Prescribed Target ROM:</strong> {activePlan.target_rom}°</p>
                      <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Supervised By:</strong> {data.patient?.therapist_name}</p>
                    </div>
                  </div>

                  <Link
                    href={`/patient/exercise/${activePlan.id || 'elbow-flexion'}`}
                    id="start-live-session-btn"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/30"
                  >
                    <Video className="w-4 h-4" />
                    <span>Start Live Camera Session</span>
                  </Link>
                </div>

                {/* Secondary Exercise Card */}
                <div className="glass-card rounded-3xl p-6 border border-white/40 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-blue-300">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-full glass-chip text-blue-800 border border-blue-300/40">
                        Upper Limb
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Side Profile View
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Shoulder Forward Flexion (Elevations)
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Target:</strong> 10 reps</p>
                      <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Prescribed ROM:</strong> 135°</p>
                    </div>
                  </div>

                  <Link
                    href="/patient/exercise/shoulder-flexion"
                    className="px-5 py-3 rounded-xl glass-button text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/50 shadow-xs hover:bg-white/40"
                  >
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>Practice Exercise</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Clinician Guidance & Documents Card */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Patient Medical Documents Section */}
              <div className="glass-card-strong rounded-3xl p-6 border border-white/45 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-lg glass-chip flex items-center justify-center text-blue-600 border border-white/40">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <span>My Medical Records</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full glass-chip text-blue-900 border border-blue-300/40">
                    {documentsCount} Files
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Hospital-uploaded MRI scans, initial assessments, and discharge summaries informing your current treatment.
                </p>

                <Link
                  href="/patient/documents"
                  id="patient-view-docs-btn"
                  className="w-full py-2.5 px-4 rounded-xl glass-button text-blue-900 font-bold text-xs flex items-center justify-between border border-blue-300/40 hover:bg-white/40 transition-all"
                >
                  <span>View All Medical Documents</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Clinician Message */}
              <div className="glass-card-strong rounded-3xl p-6 border border-white/45 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-lg glass-chip flex items-center justify-center text-blue-600 border border-white/40">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span>Therapist Instructions</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{data.therapist_message?.date || 'Today'}</span>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-blue-300/40 shadow-xs">
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{data.therapist_message?.content || activePlan.notes}&quot;
                  </p>
                  <p className="text-xs font-bold text-blue-900 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>— {data.therapist_message?.from || 'Dr. Demo'}</span>
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Targets are evaluated continuously by your care team based on real-time browser pose estimation metrics.
                </p>
              </div>

              {/* Recent Session Badge */}
              {data.recent_session && (
                <div className="glass-card rounded-3xl p-6 border border-white/30 shadow-lg space-y-3">
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
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 glass-chip px-3 py-1.5 rounded-lg border border-white/40 transition-colors"
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
    </ProtectedRoute>
  );
}
