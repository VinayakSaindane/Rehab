'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Sliders,
  FileText
} from 'lucide-react';

export default function TherapistPatientDetailPage() {
  const params = useParams();
  const patientId = (params?.id as string) || 'patient-1';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.getTherapistPatientDetail(patientId);
        setData(res);
      } catch (err) {
        // Mock fallback
        setData({
          patient: {
            id: 'patient-1',
            name: 'Aarav Mehta',
            age: 32,
            email: 'patient@rehabsense.demo',
            condition_label: 'Post-operative upper-limb rehabilitation',
            current_streak_days: 6,
            total_sessions_completed: 10
          },
          active_prescription: {
            id: 'presc-1',
            exercise_name: 'Elbow Flexion & Extension',
            target_rom: 120,
            min_rom: 40,
            max_rom: 140,
            target_reps: 10,
            sets: 2,
            frequency_per_day: 2,
            notes: 'Focus on smooth eccentric control. Targets calibrated to recovery phase.'
          },
          sessions: [
            { id: 'session-hist-10', date: 'Sep 20', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 114, max_rom: 120, review_status: 'REVIEWED' },
            { id: 'session-hist-9', date: 'Sep 19', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 110, max_rom: 116, review_status: 'REVIEWED' },
            { id: 'session-hist-8', date: 'Sep 18', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 112, max_rom: 118, review_status: 'REVIEWED' },
            { id: 'session-hist-6', date: 'Sep 16', exercise_name: 'Elbow Flexion & Extension', completed_reps: 8, target_reps: 10, average_rom: 104, max_rom: 110, review_status: 'PENDING_REVIEW', form_flags: ['range_below_target'] }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading patient clinical dossier...</span>
        </div>
      </div>
    );
  }

  const { patient, active_prescription, sessions } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link
          href="/therapist/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinical Census</span>
        </Link>

        {/* Patient Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xl">
              {patient.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {patient.name}
                </h1>
                <span className="text-xs text-slate-500">({patient.age} y/o)</span>
              </div>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                {patient.condition_label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Streak</p>
              <p className="font-mono font-bold text-base text-slate-900 dark:text-white">{patient.current_streak_days} days</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Sessions</p>
              <p className="font-mono font-bold text-base text-teal-600">{patient.total_sessions_completed || 10}</p>
            </div>
          </div>
        </div>

        {/* Active Prescription Configuration */}
        {active_prescription && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Clinical Prescription
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                Active Protocol
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-semibold">EXERCISE</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{active_prescription.exercise_name}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-semibold">TARGET ROM</p>
                <p className="text-base font-bold font-mono text-teal-600 mt-0.5">{active_prescription.target_rom}°</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-semibold">REPETITIONS</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{active_prescription.target_reps} reps</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-semibold">FREQUENCY</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">{active_prescription.frequency_per_day}x / day</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              Notes: &quot;{active_prescription.notes}&quot;
            </p>
          </div>
        )}

        {/* Telemetry Session History */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recorded Session Telemetry
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Reps</th>
                  <th className="py-3 px-4">Avg ROM</th>
                  <th className="py-3 px-4">Peak ROM</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-medium">{s.id}</td>
                    <td className="py-3 px-4 font-mono">{s.completed_reps} / {s.target_reps} reps</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{Math.round(s.average_rom)}°</td>
                    <td className="py-3 px-4 font-mono">{Math.round(s.max_rom)}°</td>
                    <td className="py-3 px-4">
                      {s.review_status === 'PENDING_REVIEW' ? (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reviewed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/therapist/review/${s.id}`}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
