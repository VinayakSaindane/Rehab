'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Building2, UserPlus, Users, ClipboardList, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Stethoscope, Activity
} from 'lucide-react';

export default function HospitalDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await (api as any).get('/hospital/dashboard');
        setData(res);
      } catch {
        // Demo fallback data
        setData({
          hospital_name: 'Apollo Orthopedics Hospital',
          total_patients: 1,
          patients: [
            {
              id: 'hosp-rec-demo-1',
              patient_id: 'patient-1',
              patient_name: 'Aarav Mehta',
              operation_type: 'Elbow Ligament Reconstruction',
              injury_description: 'Post-operative UCL reconstruction, sports injury',
              surgery_date: '2026-09-01',
              status: 'active',
              case_status: 'accepted',
              uploaded_report_urls: ['/uploads/demo-pre-op-report.pdf'],
              created_at: new Date(Date.now() - 15 * 86400000).toISOString()
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    unassigned:     { label: 'Unassigned',       color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: AlertCircle },
    awaiting_quote: { label: 'Awaiting Quote',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
    active:         { label: 'Active',            color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
    accepted:       { label: 'Therapist Matched', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300', icon: CheckCircle2 },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {data?.hospital_name ?? 'Hospital Dashboard'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data?.total_patients ?? 0} onboarded patients
              </p>
            </div>
          </div>

          <Link
            href="/hospital/onboard/new"
            id="onboard-new-patient-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Patient</span>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: data?.total_patients ?? 0, icon: Users, color: 'text-sky-500' },
            { label: 'Active with Therapist', value: data?.patients?.filter((p: any) => p.case_status === 'accepted' || p.case_status === 'active').length ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Awaiting Quote', value: data?.patients?.filter((p: any) => p.case_status === 'awaiting_quote').length ?? 0, icon: Clock, color: 'text-amber-500' },
            { label: 'Unassigned', value: data?.patients?.filter((p: any) => !p.case_status || p.case_status === 'unassigned').length ?? 0, icon: AlertCircle, color: 'text-slate-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Patient list */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-sky-500" />
              Onboarded Patients
            </h2>
          </div>

          {(!data?.patients || data.patients.length === 0) ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No patients onboarded yet</p>
              <p className="text-sm mt-1">Click "Onboard New Patient" to register the first patient.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.patients.map((patient: any) => {
                const status = patient.case_status || 'unassigned';
                const cfg = statusConfig[status] ?? statusConfig['unassigned'];
                const StatusIcon = cfg.icon;
                return (
                  <div key={patient.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {patient.patient_name?.charAt(0) ?? 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{patient.patient_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{patient.operation_type}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{patient.injury_description}</p>
                        {patient.surgery_date && (
                          <p className="text-[10px] text-slate-400 mt-1">Surgery: {patient.surgery_date}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <Link
                        href={`/patient/find-therapist`}
                        className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        Find Therapist <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
