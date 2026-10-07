'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Users, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  ArrowRight, 
  Stethoscope, 
  CheckCircle2, 
  Sliders, 
  ChevronRight,
  TrendingUp,
  Clock,
  Camera,
  Inbox
} from 'lucide-react';

export default function TherapistDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTherapistData = async () => {
      try {
        const res = await api.getTherapistDashboard();
        setData(res);
      } catch (err) {
        // Mock fallback
        setData({
          overview: {
            total_patients: 1,
            active_plans: 1,
            sessions_today: 3,
            sessions_requiring_review: 1
          },
          patients: [
            {
              id: 'patient-1',
              name: 'Aarav Mehta',
              age: 32,
              condition_label: 'Post-operative upper-limb rehabilitation',
              assigned_plan: 'Elbow Flexion & Extension',
              target_rom: 120,
              target_reps: 10,
              latest_session: {
                id: 'session-hist-6',
                date: 'Today, 6:42 PM',
                average_rom: 104,
                tracking_confidence: 0.93,
                flags_count: 1
              },
              adherence: '12 / 14 sessions',
              streak_days: 6,
              has_review_flag: true,
              flagged_session_id: 'session-hist-6'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTherapistData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="glass-card-strong p-6 rounded-3xl border border-white/80">
            <div className="h-3 w-36 bg-teal-200/50 rounded-full mb-3" />
            <div className="h-7 w-56 bg-teal-200/60 rounded-full mb-2" />
            <div className="h-3 w-44 bg-teal-200/40 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-4">
                <div className="h-3 w-24 bg-teal-200/50 rounded-full" />
                <div className="h-8 w-16 bg-teal-200/60 rounded-full" />
                <div className="h-3 w-32 bg-teal-200/40 rounded-full" />
              </div>
            ))}
          </div>
          {[1,2].map(i => (
            <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-teal-200/50 rounded-full" />
                <div className="h-6 w-24 bg-teal-200/60 rounded-full" />
              </div>
              <div className="h-3 w-full bg-teal-200/40 rounded-full" />
              <div className="h-3 w-3/4 bg-teal-200/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { overview, patients } = data;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Clinician Header */}
        <div className="glass-card-strong p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-teal-800 text-xs font-semibold mb-2.5 border border-white/80">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Apex Physical Therapy & Orthopaedic Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dr. Ananya Sharma
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Lead Musculoskeletal Physiotherapist • Remote Monitoring & Telerehab Census
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/therapist/requests"
              id="therapist-requests-link"
              className="px-4 py-2.5 rounded-xl glass-chip hover:bg-white/80 text-sky-800 text-xs font-bold transition-all flex items-center gap-2 border border-sky-200/80 shadow-xs"
            >
              <Inbox className="w-4 h-4 text-sky-600" />
              <span>Case Requests</span>
            </Link>
            <Link
              href="/therapist/exercises/record"
              id="record-exercise-link"
              className="px-4 py-2.5 rounded-xl glass-chip hover:bg-white/80 text-emerald-800 text-xs font-bold transition-all flex items-center gap-2 border border-emerald-200/80 shadow-xs"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Record Exercise Demo</span>
            </Link>
            <Link
              href="/therapist/exercises"
              className="px-4 py-2.5 rounded-xl glass-chip hover:bg-white/80 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 border border-white/80 shadow-xs"
            >
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Exercise Library Config</span>
            </Link>
          </div>
        </div>

        {/* 4 Clinical Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/80 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Patients</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
              {overview?.total_patients || 14}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Supervised at home</p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/80 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Plans</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-teal-700 mt-1">
              {overview?.active_plans || 1}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Target prescribed</p>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/80 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sessions Today</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">
              {overview?.sessions_today || 3}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Structured telemetry</p>
          </div>

          <div className="glass-card-strong rounded-2xl p-4 sm:p-5 border-2 border-amber-400/80 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-700 mt-1">
              {overview?.sessions_requiring_review || 1}
            </p>
            <p className="text-[11px] text-amber-800 mt-1 font-semibold">1 flagged session</p>
          </div>
        </div>

        {/* Patient Census List */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-sky-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Patient Rehabilitation Census
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live telemetry from home-based camera rehabilitation sessions.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 glass-chip px-3 py-1 rounded-full border border-white/80">
              {patients?.length || 1} Active Patient
            </span>
          </div>

          <div className="space-y-4">
            {patients?.map((patient: any) => (
              <div
                key={patient.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  patient.has_review_flag
                    ? 'glass-card-strong border-amber-300 shadow-md'
                    : 'glass-card border-white/80 shadow-xs'
                }`}
              >
                {/* Patient Details */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {patient.name}
                    </h3>
                    <span className="text-xs text-slate-500">({patient.age} y/o)</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full glass-chip text-slate-700 border border-white/80">
                      {patient.condition_label}
                    </span>
                    {patient.has_review_flag && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Flagged Event (Session #6)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Plan:</strong> {patient.assigned_plan}</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Target:</strong> {patient.target_rom}° ROM ({patient.target_reps} reps)</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Adherence:</strong> {patient.adherence}</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Latest Session:</strong> {patient.latest_session?.date || 'Today, 6:42 PM'}</p>
                    <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/70"><strong>Observed ROM:</strong> <span className="font-mono font-bold text-sky-700">{patient.latest_session?.average_rom || 104}°</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {patient.has_review_flag && (
                    <Link
                      href={`/therapist/review/${patient.flagged_session_id || 'session-hist-6'}`}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-white/20"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Review Flagged Reps</span>
                    </Link>
                  )}

                  <Link
                    href={`/therapist/patients/${patient.id}`}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                  >
                    <span>View Patient Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
