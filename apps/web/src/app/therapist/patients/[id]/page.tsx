'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  mockStorage, 
  MockPatient, 
  MockDocument, 
  MockTreatmentPlan 
} from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  FileText,
  Eye,
  Download,
  X,
  FileCheck,
  Plus,
  Play,
  Activity
} from 'lucide-react';

export default function TherapistPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = (params?.id as string) || 'patient-001';

  const [patient, setPatient] = useState<any>(null);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState<MockTreatmentPlan | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<MockDocument | null>(null);

  // Treatment plan prescription modal
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [planExercise, setPlanExercise] = useState('elbow-flexion');
  const [planExerciseName, setPlanExerciseName] = useState('Elbow Flexion & Extension');
  const [planTargetRom, setPlanTargetRom] = useState(120);
  const [planTargetReps, setPlanTargetReps] = useState(10);
  const [planSets, setPlanSets] = useState(2);
  const [planFrequency, setPlanFrequency] = useState(2);
  const [planNotes, setPlanNotes] = useState('Focus on smooth eccentric extension. Targets calibrated to current recovery phase.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPatientData = async () => {
    mockStorage.init();

    // 1. Get patient from mockStorage
    const localPatient = mockStorage.getPatientById(patientId);
    
    // 2. Get medical documents uploaded by hospital for ONLY this patient
    const localDocs = mockStorage.getDocuments(patientId);
    setDocuments(localDocs);
    try {
      const backendDocs = await api.getHospitalPatientDocuments(patientId, localPatient?.email);
      const normalizedDocs: MockDocument[] = backendDocs.map((doc) => ({
        id: doc.id,
        patientId: doc.patient_id,
        name: doc.name,
        type: doc.type,
        fileName: doc.file_name,
        fileSize: doc.file_size || undefined,
        uploadedAt: doc.uploaded_at || new Date().toISOString(),
        uploadedBy: doc.uploaded_by,
        uploaderName: doc.uploader_name,
        summary: doc.summary,
        fileData: doc.file_url?.startsWith('/')
          ? `http://localhost:8000${doc.file_url}`
          : doc.file_url,
      }));
      if (normalizedDocs.length > 0) {
        // Backend records are authoritative. Do not show seeded demo records
        // alongside the real hospital files for this patient.
        setDocuments(normalizedDocs);
      }
    } catch (error) {
      console.warn('Unable to load hospital documents from the backend:', error);
    }

    // 3. Get treatment plan
    const localPlan = mockStorage.getTreatmentPlan(patientId) || {
      patientId,
      exerciseId: 'elbow-flexion',
      exerciseName: 'Elbow Flexion & Extension',
      targetRom: 120,
      targetReps: 10,
      sets: 2,
      frequencyPerDay: 2,
      notes: 'Focus on smooth eccentric extension. Targets calibrated to recovery phase.',
      updatedAt: new Date().toISOString(),
    };
    setTreatmentPlan(localPlan);
    setPlanExercise(localPlan.exerciseId);
    setPlanExerciseName(localPlan.exerciseName);
    setPlanTargetRom(localPlan.targetRom);
    setPlanTargetReps(localPlan.targetReps);
    setPlanSets(localPlan.sets);
    setPlanFrequency(localPlan.frequencyPerDay);
    setPlanNotes(localPlan.notes);

    // 4. Default sessions history
    const defaultSessions = [
      { id: 'session-hist-10', date: 'Sep 20', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 114, max_rom: 120, review_status: 'REVIEWED' },
      { id: 'session-hist-9', date: 'Sep 19', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 110, max_rom: 116, review_status: 'REVIEWED' },
      { id: 'session-hist-8', date: 'Sep 18', exercise_name: 'Elbow Flexion & Extension', completed_reps: 10, target_reps: 10, average_rom: 112, max_rom: 118, review_status: 'REVIEWED' },
      { id: 'session-hist-6', date: 'Sep 16', exercise_name: 'Elbow Flexion & Extension', completed_reps: 8, target_reps: 10, average_rom: 104, max_rom: 110, review_status: 'PENDING_REVIEW', form_flags: ['range_below_target'] }
    ];

    if (localPatient) {
      setPatient({
        id: localPatient.id,
        name: localPatient.name,
        age: localPatient.age,
        gender: localPatient.gender,
        email: localPatient.email,
        condition_label: localPatient.condition,
        current_streak_days: localPatient.currentStreakDays || 6,
        total_sessions_completed: localPatient.totalSessions || 10,
      });
      setSessions(defaultSessions);
      setLoading(false);
      return;
    }

    // Try backend fallback if patient wasn't in mockStorage
    try {
      const res = await api.getTherapistPatientDetail(patientId);
      setPatient(res.patient);
      if (res.active_prescription) {
        setTreatmentPlan({
          patientId,
          exerciseId: 'elbow-flexion',
          exerciseName: res.active_prescription.exercise_name || 'Elbow Flexion & Extension',
          targetRom: res.active_prescription.target_rom || 120,
          targetReps: res.active_prescription.target_reps || 10,
          sets: res.active_prescription.sets || 2,
          frequencyPerDay: res.active_prescription.frequency_per_day || 2,
          notes: res.active_prescription.notes || '',
          updatedAt: new Date().toISOString(),
        });
      }
      setSessions(res.sessions || defaultSessions);
    } catch {
      setPatient({
        id: patientId,
        name: 'Demo Patient',
        age: 32,
        gender: 'Male',
        email: 'patient@demo.com',
        condition_label: 'Post-operative upper-limb rehabilitation',
        current_streak_days: 6,
        total_sessions_completed: 10,
      });
      setSessions(defaultSessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();

    const handlePlanUpdate = () => loadPatientData();
    window.addEventListener('rehabsense:treatment-plan-updated', handlePlanUpdate);
    return () => window.removeEventListener('rehabsense:treatment-plan-updated', handlePlanUpdate);
  }, [patientId]);

  // Handle Save Treatment Plan
  const handleSaveTreatmentPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    const updated = mockStorage.saveTreatmentPlan(patient.id, {
      exerciseId: planExercise,
      exerciseName: planExerciseName,
      targetRom: Number(planTargetRom),
      targetReps: Number(planTargetReps),
      sets: Number(planSets),
      frequencyPerDay: Number(planFrequency),
      notes: planNotes,
    });

    setTreatmentPlan(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowPrescribeModal(false);
    }, 1200);
  };

  if (loading || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading patient clinical dossier...</span>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['THERAPIST']}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Back Link */}
          <Link
            href="/therapist/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clinical Census</span>
          </Link>

          {/* 1. Patient Header Card */}
          <div className="glass-card-strong rounded-3xl p-6 sm:p-7 border border-white/35 shadow-xl backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md border border-white/20">
                {patient.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900">
                    {patient.name}
                  </h1>
                  <span className="text-xs text-slate-600 font-semibold">({patient.age} y/o)</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full glass-chip border border-white/40 text-slate-700">
                    ID: {patient.id}
                  </span>
                </div>
                <p className="text-xs text-teal-900 font-bold mt-0.5">
                  {patient.condition_label}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Assigned by Hospital • Full clinical dossier & treatment planning authority
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="glass-chip p-3 rounded-2xl border border-white/40 text-center min-w-[100px]">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Streak</p>
                <p className="font-mono font-bold text-base text-slate-900">{patient.current_streak_days} days</p>
              </div>
              <div className="glass-chip p-3 rounded-2xl border border-white/40 text-center min-w-[100px]">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Sessions</p>
                <p className="font-mono font-bold text-base text-teal-800">{patient.total_sessions_completed || 10}</p>
              </div>
              <div className="glass-chip p-3 rounded-2xl border border-white/40 text-center min-w-[100px]">
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Documents</p>
                <p className="font-mono font-bold text-base text-teal-800">{documents.length}</p>
              </div>
            </div>
          </div>

          {/* 2. Medical Documents Section (Uploaded by Hospital) */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/35 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/20">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>Hospital-Transferred Medical Records ({documents.length})</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Diagnostic scans, surgical prescriptions, and assessments provided by the hospital care team.
                </p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full glass-chip bg-teal-500/15 text-teal-950 border border-teal-400/30">
                Hospital Authenticated
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-semibold text-xs">No medical records uploaded by the hospital yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl glass-card border border-white/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg glass-chip bg-teal-500/20 text-teal-900 flex items-center justify-center font-bold text-xs border border-teal-400/30">
                            <FileCheck className="w-4 h-4 text-teal-700" />
                          </span>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                              {doc.name}
                            </h3>
                            <p className="text-[10px] text-slate-600 font-mono">
                              {doc.fileName} {doc.fileSize && `• ${doc.fileSize}`}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-chip bg-teal-500/15 text-teal-950 border border-teal-400/30">
                          {doc.type}
                        </span>
                      </div>

                      {doc.summary && (
                        <p className="text-xs text-slate-700 italic glass-chip p-2 rounded-xl border border-white/30">
                          &quot;{doc.summary}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20 text-slate-600">
                      <span className="text-[10px]">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} by {doc.uploaderName || 'Hospital'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        id={`therapist-view-doc-${doc.id}`}
                        className="px-3 py-1 rounded-lg glass-button text-xs font-bold text-emerald-950 flex items-center gap-1 border border-white/40 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Record</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. THERAPIST TREATMENT FLOW: Active Clinical Prescription & Exercise Configuration */}
          <div className="glass-card-strong rounded-3xl p-6 sm:p-7 border border-white/35 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/20">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-700" />
                  <span>Prescribed Treatment Protocol & Exercise Targets</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Configure ROM goals and repetitions that feed directly into the patient&apos;s camera-based AI feedback engine.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="open-prescribe-plan-modal-btn"
                  onClick={() => setShowPrescribeModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Adjust Treatment Targets</span>
                </button>

                <Link
                  href="/therapist/exercises"
                  className="px-3 py-2 rounded-xl glass-button text-xs font-bold text-slate-700 border border-white/40"
                >
                  Library Config
                </Link>
              </div>
            </div>

            {treatmentPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl glass-chip border border-white/40 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE EXERCISE</p>
                    <p className="text-xs font-black text-slate-900 mt-1">{treatmentPlan.exerciseName}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-chip border border-white/40 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TARGET ROM</p>
                    <p className="text-lg font-black font-mono text-teal-800 mt-0.5">{treatmentPlan.targetRom}°</p>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-chip border border-white/40 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">REPETITIONS</p>
                    <p className="text-lg font-black font-mono text-slate-900 mt-0.5">{treatmentPlan.targetReps} reps</p>
                  </div>
                  <div className="p-3.5 rounded-2xl glass-chip border border-white/40 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DAILY FREQUENCY</p>
                    <p className="text-lg font-black font-mono text-slate-900 mt-0.5">{treatmentPlan.frequencyPerDay}x / day</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-chip border border-white/40 text-xs text-slate-700 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Clinician Clinical Instructions: </span>
                    <span className="italic">&quot;{treatmentPlan.notes}&quot;</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Recorded Session Telemetry */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/35 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Recorded Session Telemetry & AI Form Evaluations
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="glass-chip uppercase font-semibold text-slate-600 border-b border-white/20">
                  <tr>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reps</th>
                    <th className="py-3 px-4">Avg ROM</th>
                    <th className="py-3 px-4">Peak ROM</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {sessions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">{s.id}</td>
                      <td className="py-3 px-4">{s.date}</td>
                      <td className="py-3 px-4 font-mono">{s.completed_reps} / {s.target_reps} reps</td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">{Math.round(s.average_rom)}°</td>
                      <td className="py-3 px-4 font-mono">{Math.round(s.max_rom)}°</td>
                      <td className="py-3 px-4">
                        {s.review_status === 'PENDING_REVIEW' ? (
                          <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Flagged Reps</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reviewed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/therapist/review/${s.id}`}
                          className="text-xs font-bold text-teal-800 hover:text-teal-900"
                        >
                          Inspect Reps →
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

      {/* Prescription / Treatment Plan Adjustment Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card-strong max-w-lg w-full rounded-[30px] p-6 sm:p-7 border border-white/95 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-700" />
                <h3 className="text-lg font-bold text-[#1a2620]">
                  Configure Treatment Plan for {patient.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescribeModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Treatment plan updated! Patient dashboard will immediately reflect this.</span>
              </div>
            )}

            <form onSubmit={handleSaveTreatmentPlan} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1a2620]">Select Prescribed Exercise</label>
                <select
                  id="plan-exercise-select"
                  value={planExercise}
                  onChange={(e) => {
                    setPlanExercise(e.target.value);
                    if (e.target.value === 'elbow-flexion') {
                      setPlanExerciseName('Elbow Flexion & Extension');
                      setPlanTargetRom(120);
                    } else if (e.target.value === 'shoulder-flexion') {
                      setPlanExerciseName('Shoulder Forward Flexion');
                      setPlanTargetRom(135);
                    } else if (e.target.value === 'knee-extension') {
                      setPlanExerciseName('Knee Extension & Quad Sets');
                      setPlanTargetRom(90);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#1a2620] outline-hidden focus:ring-2 focus:ring-teal-700"
                >
                  <option value="elbow-flexion">Elbow Flexion & Extension (Upper Limb)</option>
                  <option value="shoulder-flexion">Shoulder Forward Flexion (Upper Limb)</option>
                  <option value="knee-extension">Knee Extension & Quad Sets (Lower Limb)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Target Range of Motion (ROM °)</label>
                  <input
                    type="number"
                    id="plan-rom-input"
                    value={planTargetRom}
                    onChange={(e) => setPlanTargetRom(Number(e.target.value))}
                    min={20}
                    max={180}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs sm:text-sm text-[#1a2620]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Target Reps per Session</label>
                  <input
                    type="number"
                    id="plan-reps-input"
                    value={planTargetReps}
                    onChange={(e) => setPlanTargetReps(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs sm:text-sm text-[#1a2620]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Sets</label>
                  <input
                    type="number"
                    value={planSets}
                    onChange={(e) => setPlanSets(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs sm:text-sm text-[#1a2620]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Frequency (times / day)</label>
                  <input
                    type="number"
                    value={planFrequency}
                    onChange={(e) => setPlanFrequency(Number(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs sm:text-sm text-[#1a2620]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#1a2620]">Instructions / Clinical Guidance for Patient</label>
                <textarea
                  id="plan-notes-input"
                  rows={3}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-[#1a2620] outline-hidden focus:ring-2 focus:ring-teal-700 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="px-4 py-2.5 rounded-xl glass-card text-stone-700 font-bold hover:bg-stone-200/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-plan-submit-btn"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold shadow-md cursor-pointer"
                >
                  Save & Prescribe to Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal for Therapist (Translucent Blue Frosted Glass) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-strong max-w-2xl w-full rounded-[32px] p-6 sm:p-8 border border-white/60 shadow-2xl backdrop-blur-3xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-white/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full glass-chip text-blue-900 border border-blue-300/50">
                    {previewDoc.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {previewDoc.id}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {previewDoc.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {previewDoc.fileName} {previewDoc.fileSize && `• ${previewDoc.fileSize}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full hover:bg-white/40 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/50 shadow-inner space-y-4 text-xs text-slate-800">
              {previewDoc.fileData && (
                <div className="rounded-xl overflow-hidden border border-white/60 bg-white/60">
                  {previewDoc.fileData.startsWith('data:image/') ? (
                    <img src={previewDoc.fileData} alt={previewDoc.name} className="max-h-80 w-full object-contain" />
                  ) : previewDoc.fileData.startsWith('data:application/pdf') ? (
                    <iframe title={previewDoc.name} src={previewDoc.fileData} className="h-80 w-full" />
                  ) : (
                    <p className="p-4 text-slate-600">This file type cannot be previewed here. Use Download File to open it.</p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pb-3 border-b border-white/30 text-[11px] text-slate-500">
                <span>Patient: <strong className="text-slate-800">{patient.name}</strong></span>
                <span>Date: <strong className="text-slate-800">{new Date(previewDoc.uploadedAt).toLocaleDateString()}</strong></span>
                <span>Uploaded by: <strong className="text-slate-800">{previewDoc.uploaderName || 'Hospital'}</strong></span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                  Radiological & Clinical Evaluation
                </h4>
                <div className="glass-chip p-4 rounded-xl border border-white/50 text-slate-700 leading-relaxed font-sans">
                  {previewDoc.summary || 'Detailed clinical report submitted by hospital orthopedic team for telerehabilitation supervision.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Hospital Authenticated Record</span>
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl glass-button text-xs font-bold text-blue-900 hover:bg-white/40 flex items-center gap-1.5 border border-white/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer border border-white/30"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}
