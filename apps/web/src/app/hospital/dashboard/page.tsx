'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mockStorage, MockPatient } from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Building2, 
  UserPlus, 
  Users, 
  ClipboardList, 
  CheckCircle2,
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Stethoscope, 
  FileText,
  ChevronRight
} from 'lucide-react';

export default function HospitalDashboardPage() {
  const [patients, setPatients] = useState<MockPatient[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [therapistNames, setTherapistNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadHospitalData = () => {
    mockStorage.init();
    const patientList = mockStorage.getPatients();
    setPatients(patientList);

    // Compute document counts and therapist mapping
    const counts: Record<string, number> = {};
    const tMap: Record<string, string> = {};

    patientList.forEach((p) => {
      counts[p.id] = mockStorage.getDocuments(p.id).length;
      if (p.therapistId) {
        const t = mockStorage.getTherapistById(p.therapistId);
        if (t) tMap[p.id] = t.name;
      }
    });

    setDocCounts(counts);
    setTherapistNames(tMap);
    setLoading(false);
  };

  useEffect(() => {
    loadHospitalData();

    const handleUpdate = () => loadHospitalData();
    window.addEventListener('rehabsense:assignment-updated', handleUpdate);
    return () => window.removeEventListener('rehabsense:assignment-updated', handleUpdate);
  }, []);

  const totalPatients = patients.length;
  const assignedPatients = patients.filter((p) => !!p.therapistId).length;
  const unassignedPatients = totalPatients - assignedPatients;
  const totalDocuments = Object.values(docCounts).reduce((a, b) => a + b, 0);

  return (
    <ProtectedRoute allowedRoles={['HOSPITAL']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Hospital Header */}
          <div className="glass-card-strong p-6 sm:p-8 rounded-[30px] border border-white/35 shadow-xl backdrop-blur-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl glass-chip bg-sky-500/20 text-sky-900 border border-sky-400/30 shadow-xs">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full glass-chip text-sky-900 text-[11px] font-bold border border-sky-400/30 mb-1">
                  <span>Hospital Administration & Clinical Onboarding</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Demo Hospital
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Apollo Orthopedics & Telerehab Center • Hospital ID: <span className="font-mono font-bold">hospital-001</span>
                </p>
              </div>
            </div>

            <Link
              href="/hospital/onboard/new"
              id="onboard-new-patient-btn"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02] border border-white/20 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Patient</span>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-white/35 shadow-md">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Patients</span>
                <Users className="w-4 h-4 text-sky-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">{totalPatients}</p>
              <p className="text-[11px] text-slate-600 mt-1">Hospital census</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/35 shadow-md">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Assigned to Therapist</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-1">{assignedPatients}</p>
              <p className="text-[11px] text-emerald-800 mt-1">Supervised recovery</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/35 shadow-md">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Awaiting Therapist</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-amber-800 mt-1">{unassignedPatients}</p>
              <p className="text-[11px] text-amber-900 mt-1">Ready for assignment</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/35 shadow-md">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Medical Documents</span>
                <FileText className="w-4 h-4 text-teal-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-teal-800 mt-1">{totalDocuments}</p>
              <p className="text-[11px] text-slate-600 mt-1">MRIs, Rx & assessments</p>
            </div>
          </div>

          {/* Patients Table Card */}
          <div className="glass-card rounded-[28px] border border-white/35 shadow-xl overflow-hidden space-y-4">
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-sky-700" />
                  <span>Hospital Patient Census</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select a patient to review medical records, upload documents, and assign to a therapist.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full glass-chip border border-white/40 text-slate-700">
                {totalPatients} Patients Recorded
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold">Loading patient records...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-12 text-center text-slate-600">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                <p className="font-bold">No patients onboarded yet</p>
                <p className="text-xs mt-1">Click &quot;Onboard New Patient&quot; to register the first patient.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/20">
                {patients.map((patient) => {
                  const isAssigned = !!patient.therapistId;
                  const assignedTherapist = therapistNames[patient.id] || (isAssigned ? 'Assigned' : 'Unassigned');
                  const docCount = docCounts[patient.id] || 0;

                  return (
                    <div 
                      key={patient.id} 
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md border border-white/20">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-slate-900">
                              {patient.name}
                            </h3>
                            <span className="text-xs text-slate-600">
                              ({patient.age} y/o, {patient.gender})
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md glass-chip text-slate-700 border border-white/40">
                              ID: {patient.id}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-900 font-medium">
                            {patient.condition}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap pt-0.5">
                            <span className="glass-chip px-2.5 py-0.5 rounded-lg border border-white/40 flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                              <span>Therapist: <strong>{assignedTherapist}</strong></span>
                            </span>
                            <span className="glass-chip px-2.5 py-0.5 rounded-lg border border-white/40 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-teal-700" />
                              <span>{docCount} {docCount === 1 ? 'Document' : 'Documents'}</span>
                            </span>
                            {patient.surgeryDate && (
                              <span className="text-[11px] text-slate-600">
                                Surgery: {patient.surgeryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold glass-chip ${
                          isAssigned 
                            ? 'bg-emerald-500/20 text-emerald-950 border border-emerald-400/40' 
                            : 'bg-amber-500/20 text-amber-950 border border-amber-400/40'
                        }`}>
                          {isAssigned ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Assigned</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Unassigned</span>
                            </>
                          )}
                        </span>

                        <Link
                          href={`/hospital/patients/${patient.id}`}
                          id={`manage-patient-${patient.id}`}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer border border-white/20"
                        >
                          <span>Manage Patient & Docs</span>
                          <ChevronRight className="w-4 h-4" />
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
    </ProtectedRoute>
  );
}
