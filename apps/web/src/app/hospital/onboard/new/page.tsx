'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus, ArrowLeft, Upload, Calendar, Stethoscope,
  FileText, CheckCircle2, AlertTriangle, X
} from 'lucide-react';

import { mockStorage } from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HospitalOnboardNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [form, setForm] = useState({
    patient_name: '',
    patient_email: '',
    operation_type: '',
    injury_description: '',
    surgery_date: '',
    hospital_id: 'hospital-001',
    hospital_name: 'Demo Hospital',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // File upload handler — calls backend upload endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      const res = await fetch('http://localhost:8000/api/hospital/onboard/upload-report', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(prev => [...prev, data.url]);
      }
    } catch {
      setUploadedFiles(prev => [...prev, `/uploads/${file.name}`]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.patient_email || !form.operation_type) return;
    setSaving(true);

    // Save to local mock storage
    try {
      mockStorage.init();
      const newPatient = mockStorage.createPatient({
        userId: `patient-${Date.now()}`,
        name: form.patient_name,
        email: form.patient_email,
        condition: form.operation_type + (form.injury_description ? ` (${form.injury_description})` : ''),
        surgeryDate: form.surgery_date || new Date().toISOString().split('T')[0],
        status: 'Unassigned',
        age: 34,
        gender: 'Not specified',
        hospitalId: 'hospital-001',
        currentStreakDays: 0,
        totalSessions: 0,
      });

      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((fileUrl, idx) => {
          mockStorage.addDocument({
            patientId: newPatient.id,
            name: `${form.operation_type} Clinical Report #${idx + 1}`,
            type: 'Diagnosis Report',
            fileName: fileUrl.split('/').pop() || 'report.pdf',
            fileSize: '1.8 MB',
            uploadedBy: 'hospital-001',
            uploaderName: 'Demo Hospital',
            summary: form.injury_description || 'Pre-operative evaluation documentation.',
          });
        });
      }
    } catch (e) {
      console.error('Failed to save to mockStorage:', e);
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      await fetch('http://localhost:8000/api/hospital/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...form, uploaded_report_urls: uploadedFiles })
      });
    } catch {
      // Ignored for local/offline mode
    } finally {
      setSuccess(true);
      setTimeout(() => router.push('/hospital/dashboard'), 1500);
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800 p-10 text-center max-w-sm w-full shadow-xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Patient Onboarded!</h2>
          <p className="text-sm text-slate-500 mt-2">Redirecting to hospital dashboard…</p>
        </div>
      </div>
    );
  }

  const OPERATION_TYPES = [
    'Elbow Ligament Reconstruction',
    'Total Knee Replacement',
    'Total Hip Replacement',
    'Rotator Cuff Repair',
    'ACL Reconstruction',
    'Shoulder Arthroplasty',
    'Spinal Fusion',
    'Fracture Post-ORIF',
    'Other Orthopaedic Procedure',
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <Link href="/hospital/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Hospital Dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <UserPlus className="w-5 h-5" />
            </div>
            Onboard New Patient
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create a patient account and link their clinical records for therapist matching.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">

          {/* Patient Info */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-sky-500" />
              Patient Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  name="patient_name"
                  value={form.patient_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address *</label>
                <input
                  name="patient_email"
                  type="email"
                  value={form.patient_email}
                  onChange={handleChange}
                  required
                  placeholder="patient@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Clinical Info */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-500" />
              Clinical Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Operation Type *</label>
                <select
                  name="operation_type"
                  value={form.operation_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  <option value="">Select operation type…</option>
                  {OPERATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Injury / Condition Description *</label>
                <textarea
                  name="injury_description"
                  value={form.injury_description}
                  onChange={handleChange as any}
                  required
                  rows={3}
                  placeholder="Describe the injury, surgical procedure, and key rehabilitation goals…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Surgery Date</label>
                <input
                  name="surgery_date"
                  type="date"
                  value={form.surgery_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* File Upload */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-500" />
              Health Reports
              <span className="text-[10px] font-normal text-slate-400">(PDF, images — any format accepted)</span>
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-sky-400 transition-colors bg-slate-50 dark:bg-slate-800/50">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">Click to upload health report</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {/* TODO: Files stored locally for demo — integrate S3/GCS for production */}
                <em>Demo: files saved locally only</em>
              </span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
            </label>

            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadedFiles.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{url}</span>
                    <button type="button" onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))} className="ml-auto shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            id="submit-onboard-btn"
            type="submit"
            disabled={saving || !form.patient_name || !form.patient_email || !form.operation_type}
            className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm"
          >
            {saving ? 'Creating Patient Account…' : 'Create Patient & Save Records'}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            A secure account will be created for the patient. Default login password: RehabSense@123 (patient should reset on first login).
          </p>
        </form>
      </div>
    </div>
  );
}
