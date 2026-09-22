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
  Clock
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading clinical therapist census...</span>
        </div>
      </div>
    );
  }

  const { overview, patients } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Clinician Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Apex Physical Therapy & Orthopaedic Center</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Dr. Ananya Sharma
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lead Musculoskeletal Physiotherapist • Remote Monitoring & Telerehab Census
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/therapist/exercises"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>Exercise Library Config</span>
            </Link>
          </div>
        </div>

        {/* 4 Clinical Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase">Active Patients</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {overview?.total_patients || 14}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Supervised at home</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase">Active Plans</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
              {overview?.active_plans || 1}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Target prescribed</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase">Sessions Today</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {overview?.sessions_today || 3}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Structured telemetry</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-amber-500/50 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-[11px] font-bold uppercase">Pending Review</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce" />
            </div>
            <p className="text-2xl font-black font-mono text-amber-600">
              {overview?.sessions_requiring_review || 1}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">1 flagged session</p>
          </div>
        </div>

        {/* Patient Census List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Patient Rehabilitation Census
              </h2>
              <p className="text-xs text-slate-500">
                Live telemetry from home-based camera rehabilitation sessions.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {patients?.length || 1} Active Patient
            </span>
          </div>

          <div className="space-y-4">
            {patients?.map((patient: any) => (
              <div
                key={patient.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  patient.has_review_flag
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Patient Details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {patient.name}
                    </h3>
                    <span className="text-xs text-slate-500">({patient.age} y/o)</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {patient.condition_label}
                    </span>
                    {patient.has_review_flag && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Flagged Event (Session #6)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <p><strong>Plan:</strong> {patient.assigned_plan}</p>
                    <p><strong>Target:</strong> {patient.target_rom}° ROM ({patient.target_reps} reps)</p>
                    <p><strong>Adherence:</strong> {patient.adherence}</p>
                    <p><strong>Latest Session:</strong> {patient.latest_session?.date || 'Today, 6:42 PM'}</p>
                    <p><strong>Observed ROM:</strong> <span className="font-mono font-bold text-slate-900 dark:text-white">{patient.latest_session?.average_rom || 104}°</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {patient.has_review_flag && (
                    <Link
                      href={`/therapist/review/${patient.flagged_session_id || 'session-hist-6'}`}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Review Flagged Reps</span>
                    </Link>
                  )}

                  <Link
                    href={`/therapist/patients/${patient.id}`}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
