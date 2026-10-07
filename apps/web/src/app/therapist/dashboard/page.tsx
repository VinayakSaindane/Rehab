'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { mockStorage } from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Inbox,
  FileCheck
} from 'lucide-react';

export default function TherapistDashboardPage() {
  const { user } = useAuth();
  const currentTherapistId = user?.id || 'therapist-001';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    mockStorage.init();
    
    // Retrieve assigned patients from local storage
    const assignedPatients = mockStorage.getPatients({ therapistId: currentTherapistId });

    // Format patients with documents and plans
    const formattedPatients = assignedPatients.map((p) => {
      const docs = mockStorage.getDocuments(p.id);
      const plan = mockStorage.getTreatmentPlan(p.id);

      return {
        id: p.id,
        name: p.name,
        age: p.age,
        condition_label: p.condition,
        documents_count: docs.length,
        assigned_plan: plan?.exerciseName || 'Elbow Flexion & Extension',
        target_rom: plan?.targetRom || 120,
        target_reps: plan?.targetReps || 10,
        latest_session: {
          id: 'session-hist-6',
          date: 'Today, 6:42 PM',
          average_rom: 104,
          tracking_confidence: 0.93,
          flags_count: p.id === 'patient-001' ? 1 : 0,
        },
        adherence: `${p.totalSessions || 10} sessions completed`,
        streak_days: p.currentStreakDays || 6,
        has_review_flag: p.id === 'patient-001',
        flagged_session_id: 'session-hist-6',
        status: p.status || 'Active',
      };
    });

    try {
      const res = await api.getTherapistDashboard();
      if (res && res.patients && res.patients.length > 0) {
        // Merge with api response if needed
        setData({
          ...res,
          patients: formattedPatients.length > 0 ? formattedPatients : res.patients,
        });
      } else {
        setData({
          overview: {
            total_patients: formattedPatients.length,
            active_plans: formattedPatients.length,
            sessions_today: 3,
            sessions_requiring_review: 1,
          },
          patients: formattedPatients,
        });
      }
    } catch (err) {
      setData({
        overview: {
          total_patients: formattedPatients.length,
          active_plans: formattedPatients.length,
          sessions_today: 3,
          sessions_requiring_review: 1,
        },
        patients: formattedPatients,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleUpdate = () => loadDashboard();
    window.addEventListener('rehabsense:assignment-updated', handleUpdate);
    window.addEventListener('rehabsense:treatment-plan-updated', handleUpdate);
    return () => {
      window.removeEventListener('rehabsense:assignment-updated', handleUpdate);
      window.removeEventListener('rehabsense:treatment-plan-updated', handleUpdate);
    };
  }, [currentTherapistId]);

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
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-3xl p-6 border border-white/70 space-y-4">
                <div className="h-3 w-24 bg-teal-200/50 rounded-full" />
                <div className="h-8 w-16 bg-teal-200/60 rounded-full" />
                <div className="h-3 w-32 bg-teal-200/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { overview, patients } = data;

  return (
    <ProtectedRoute allowedRoles={['THERAPIST']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Clinician Header */}
          <div className="glass-card-strong p-6 sm:p-8 rounded-3xl border border-white/50 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip text-blue-900 text-xs font-semibold mb-2.5 border border-blue-400/30">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                <span>Apex Physical Therapy & Orthopaedic Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {user?.name || 'Dr. Demo'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Lead Musculoskeletal Physiotherapist • Remote Monitoring & Telerehab Census
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/therapist/requests"
                id="therapist-requests-link"
                className="px-4 py-2.5 rounded-xl glass-button text-blue-900 text-xs font-bold transition-all flex items-center gap-2 border border-blue-400/30 shadow-xs hover:bg-white/40"
              >
                <Inbox className="w-4 h-4 text-blue-600" />
                <span>Case Requests</span>
              </Link>
              <Link
                href="/therapist/exercises/record"
                id="record-exercise-link"
                className="px-4 py-2.5 rounded-xl glass-button text-indigo-900 text-xs font-bold transition-all flex items-center gap-2 border border-indigo-400/30 shadow-xs hover:bg-white/40"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Record Exercise Demo</span>
              </Link>
              <Link
                href="/therapist/exercises"
                className="px-4 py-2.5 rounded-xl glass-button text-slate-800 text-xs font-bold transition-all flex items-center gap-2 border border-white/50 shadow-xs hover:bg-white/40"
              >
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Exercise Library Config</span>
              </Link>
            </div>
          </div>

          {/* 4 Clinical Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">My Patients</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
                {patients?.length || 0}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Assigned by hospital</p>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Active Plans</span>
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-indigo-700 mt-1">
                {patients?.length || 1}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Target prescribed</p>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/50 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sessions Today</span>
                <Calendar className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-sky-700 mt-1">
                {overview?.sessions_today || 3}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Structured telemetry</p>
            </div>

            <div className="glass-card-strong rounded-2xl p-4 sm:p-5 border border-amber-400/50 bg-amber-500/10 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-amber-900 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-amber-950 mt-1">
                {overview?.sessions_requiring_review || 1}
              </p>
              <p className="text-[11px] text-amber-900 mt-1 font-semibold">Flagged telemetry</p>
            </div>
          </div>

          {/* Patient Census List */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/35 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/30">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Assigned Patients Rehabilitation Census
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Patients assigned to you by the hospital. Review medical documents, configure treatment targets, and inspect camera sessions.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-700 glass-chip px-3 py-1 rounded-full border border-white/40">
                {patients?.length || 0} Assigned {patients?.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>

            <div className="space-y-4">
              {(!patients || patients.length === 0) ? (
                <div className="p-10 text-center text-slate-600">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-600" />
                  <p className="font-bold">No patients currently assigned</p>
                  <p className="text-xs mt-1">When a hospital assigns patients to your account, they will appear here.</p>
                </div>
              ) : (
                patients.map((patient: any) => (
                  <div
                    key={patient.id}
                    className={`p-6 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                      patient.has_review_flag
                        ? 'glass-card-strong border-amber-400/60 shadow-md bg-amber-500/10'
                        : 'glass-card border-white/35 shadow-xs'
                    }`}
                  >
                    {/* Patient Details */}
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {patient.name}
                        </h3>
                        <span className="text-xs text-slate-600">({patient.age} y/o)</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full glass-chip text-slate-800 border border-white/40">
                          {patient.condition_label}
                        </span>
                        
                        {/* Hospital Document Count Pill */}
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full glass-chip bg-teal-500/15 text-teal-950 border border-teal-400/40 flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-teal-700" />
                          <span>{patient.documents_count || 0} Medical Documents</span>
                        </span>

                        <span className="text-xs font-bold px-2 py-0.5 rounded-full glass-chip bg-emerald-500/15 text-emerald-950 border border-emerald-400/40">
                          Status: Assigned
                        </span>

                        {patient.has_review_flag && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full glass-chip bg-amber-500/20 text-amber-950 border border-amber-400/50 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Flagged Event (Session #6)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                        <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Plan:</strong> {patient.assigned_plan}</p>
                        <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Target:</strong> {patient.target_rom}° ROM ({patient.target_reps} reps)</p>
                        <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Adherence:</strong> {patient.adherence}</p>
                        <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Latest Session:</strong> {patient.latest_session?.date || 'Today, 6:42 PM'}</p>
                        <p className="glass-chip px-2.5 py-1 rounded-lg border border-white/40"><strong>Observed ROM:</strong> <span className="font-mono font-bold text-sky-800">{patient.latest_session?.average_rom || 104}°</span></p>
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
                        id={`view-patient-${patient.id}`}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                      >
                        <span>View Patient & Documents</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
