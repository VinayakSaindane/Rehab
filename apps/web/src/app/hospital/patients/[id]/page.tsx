'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  mockStorage, 
  MockPatient, 
  MockTherapist, 
  MockDocument 
} from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Stethoscope, 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Clock, 
  X, 
  FileCheck, 
  Download,
  Share2
} from 'lucide-react';

export default function HospitalPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = (params?.id as string) || 'patient-001';

  const [patient, setPatient] = useState<MockPatient | null>(null);
  const [therapists, setTherapists] = useState<MockTherapist[]>([]);
  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment modal / selector state
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<MockDocument['type']>('MRI');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadFileData, setUploadFileData] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<MockDocument | null>(null);

  const loadData = () => {
    mockStorage.init();
    const p = mockStorage.getPatientById(patientId);
    if (p) {
      setPatient(p);
      setSelectedTherapistId(p.therapistId || '');
    }
    const tList = mockStorage.getTherapists();
    setTherapists(tList);

    const docList = mockStorage.getDocuments(patientId);
    setDocuments(docList);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  // Handle Therapist Assignment
  const handleAssignTherapist = () => {
    if (!selectedTherapistId || !patient) return;
    setAssigning(true);
    mockStorage.assignTherapist(patient.id, selectedTherapistId, 'hospital-001');
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      setAssigning(false);
      loadData();
    }, 1200);
  };

  // Handle File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      setUploadFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      const reader = new FileReader();
      reader.onload = () => setUploadFileData(String(reader.result));
      reader.onerror = () => setUploadError('Unable to read the selected file.');
      reader.readAsDataURL(file);
      if (!uploadTitle) {
        // Auto-fill title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  // Handle Document Upload Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle || !patient || !uploadFileName) {
      setUploadError('Please provide a document title and select a file.');
      return;
    }

    try {
      const fileInput = document.getElementById('upload-doc-file') as HTMLInputElement | null;
      const file = fileInput?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', patient.id);
        const token = localStorage.getItem('rehab_token');
        const response = await fetch('http://localhost:8000/api/hospital/onboard/upload-report', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!response.ok) throw new Error('The file could not be uploaded.');
        await response.json();
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The file could not be uploaded.');
      return;
    }

    const newDoc = mockStorage.addDocument({
      patientId: patient.id,
      name: uploadTitle,
      type: uploadType,
      fileName: uploadFileName || `${uploadTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      fileSize: uploadFileSize || '2.1 MB',
      uploadedBy: 'hospital-001',
      uploaderName: 'Demo Hospital',
      summary: uploadSummary || 'Clinical documentation submitted by hospital orthopedic care team.',
      fileData: uploadFileData || undefined,
    });

    setShowUploadModal(false);
    setUploadTitle('');
    setUploadSummary('');
    setUploadFileName('');
    setUploadFileSize('');
    setUploadFileData('');
    setUploadError(null);
    loadData();
  };

  // Handle Document Deletion
  const handleDeleteDoc = (docId: string) => {
    if (confirm('Are you sure you want to remove this medical document?')) {
      mockStorage.deleteDocument(docId);
      loadData();
    }
  };

  const assignedTherapistObj = therapists.find((t) => t.id === patient?.therapistId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen py-12 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">Patient not found</p>
        <Link href="/hospital/dashboard" className="text-sky-600 text-sm mt-2 underline">
          Return to Hospital Dashboard
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['HOSPITAL']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Navigation link */}
          <Link
            href="/hospital/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#435147] hover:text-[#1a2620] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hospital Patient Census</span>
          </Link>

          {/* 1. Patient Dossier Header */}
          <div className="glass-card-strong p-6 sm:p-8 rounded-[30px] border border-white/95 shadow-xl backdrop-blur-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg">
                {patient.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1a2620] tracking-tight">
                    {patient.name}
                  </h1>
                  <span className="text-xs text-stone-500 font-semibold">
                    ({patient.age} y/o • {patient.gender})
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full glass-chip border border-white/80 text-stone-700">
                    ID: {patient.id}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#244b38]">
                  {patient.condition}
                </p>
                <div className="flex items-center gap-4 text-xs text-[#435147] pt-1">
                  <span>Email: <strong>{patient.email}</strong></span>
                  {patient.surgeryDate && (
                    <span>Surgery Date: <strong>{patient.surgeryDate}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3">
              <div className="glass-card p-3 rounded-2xl border border-white/80 text-center min-w-[120px]">
                <p className="text-[10px] uppercase font-bold text-[#435147]">Care Status</p>
                <p className={`text-xs font-black mt-0.5 ${patient.therapistId ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {patient.therapistId ? 'Assigned' : 'Unassigned'}
                </p>
              </div>
              <div className="glass-card p-3 rounded-2xl border border-white/80 text-center min-w-[120px]">
                <p className="text-[10px] uppercase font-bold text-[#435147]">Documents</p>
                <p className="text-xs font-black text-teal-700 mt-0.5 font-mono">
                  {documents.length} Records
                </p>
              </div>
            </div>
          </div>

          {/* 2. Assign Patient to Therapist Section */}
          <div className="glass-card rounded-[28px] p-6 sm:p-7 border border-white/90 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
              <div>
                <h2 className="text-lg font-bold text-[#1a2620] flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                  <span>Therapist Assignment & Supervisory Access</span>
                </h2>
                <p className="text-xs text-[#435147] mt-0.5">
                  Assign this patient to a licensed physiotherapist. The assigned therapist will gain access to clinical records, treatment plans, and live exercise telemetry.
                </p>
              </div>

              {assignedTherapistObj && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Assignment</span>
                </div>
              )}
            </div>

            <div className="bg-white/60 rounded-2xl p-4 sm:p-5 border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-bold text-[#1a2620]">
                  Select Clinical Physiotherapist:
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="assign-therapist-select"
                    value={selectedTherapistId}
                    onChange={(e) => setSelectedTherapistId(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-semibold text-[#1a2620] outline-hidden focus:ring-2 focus:ring-sky-600 shadow-inner"
                  >
                    <option value="">-- Choose Therapist from Registry --</option>
                    {therapists.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.specialty}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    id="confirm-assign-therapist-btn"
                    onClick={handleAssignTherapist}
                    disabled={!selectedTherapistId || assigning}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-700 to-sky-800 hover:from-sky-800 hover:to-sky-900 text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02] cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Assign Therapist'}
                  </button>
                </div>
              </div>

              {/* Assignment Feedback */}
              {assignSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Assigned successfully to {assignedTherapistObj?.name || 'Therapist'}!</span>
                </div>
              )}
            </div>

            {/* Currently Assigned Display */}
            {assignedTherapistObj ? (
              <div className="p-4 rounded-2xl glass-chip border border-white/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#244b38] text-white flex items-center justify-center font-bold text-sm">
                    {assignedTherapistObj.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#1a2620]">
                      Assigned Therapist: {assignedTherapistObj.name}
                    </p>
                    <p className="text-[11px] text-[#435147]">
                      {assignedTherapistObj.specialty} • {assignedTherapistObj.email}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Full Dossier & Exercise Prescribing Enabled
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Patient is currently unassigned. Select a therapist above to grant clinical review and treatment privileges.</span>
              </div>
            )}
          </div>

          {/* 3. Patient Medical Documents Section */}
          <div className="glass-card rounded-[28px] p-6 sm:p-7 border border-white/90 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200/60">
              <div>
                <h2 className="text-lg font-bold text-[#1a2620] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span>Patient Medical Records & Diagnostic Reports</span>
                </h2>
                <p className="text-xs text-[#435147] mt-0.5">
                  MRIs, surgical prescriptions, physiotherapy evaluations, and operative summaries for this patient.
                </p>
              </div>

              {/* Upload Document Action */}
              <button
                type="button"
                id="open-upload-doc-modal-btn"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#244b38] to-[#386c52] hover:from-[#1b3a2b] hover:to-[#2e5d45] text-white text-xs font-bold transition-all shadow-md hover:scale-[1.02] cursor-pointer border border-white/20 shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>

            {/* Document Cards / Table */}
            {documents.length === 0 ? (
              <div className="p-10 text-center text-[#435147]">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-stone-500" />
                <p className="font-bold">No documents uploaded for this patient yet</p>
                <p className="text-xs mt-1">Click &quot;Upload Document&quot; above to attach MRI scans or clinical reports.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  return (
                    <div
                      key={doc.id}
                      className="glass-card p-5 rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                              <FileCheck className="w-4 h-4 text-teal-700" />
                            </span>
                            <div>
                              <h3 className="font-bold text-sm text-[#1a2620] leading-snug">
                                {doc.name}
                              </h3>
                              <p className="text-[11px] text-stone-500 font-mono">
                                {doc.fileName} {doc.fileSize && `• ${doc.fileSize}`}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wide">
                            {doc.type}
                          </span>
                        </div>

                        {doc.summary && (
                          <p className="text-xs text-[#435147] line-clamp-2 bg-white/50 p-2.5 rounded-xl border border-white/70 italic">
                            &quot;{doc.summary}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200/60 text-stone-500">
                        <span className="text-[11px]">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} by {doc.uploaderName || 'Hospital'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            id={`view-doc-${doc.id}`}
                            className="px-3 py-1.5 rounded-lg glass-chip hover:bg-white text-xs font-bold text-[#244b38] flex items-center gap-1 border border-white/80 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Open</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            id={`delete-doc-${doc.id}`}
                            title="Delete document"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card-strong max-w-lg w-full rounded-[30px] p-6 sm:p-7 border border-white/95 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-[#1a2620]">
                  Upload Medical Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1a2620]">Document Title *</label>
                <input
                  type="text"
                  id="upload-doc-title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Follow-up MRI Scan or Post-op Prescription"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-[#1a2620] outline-hidden focus:ring-2 focus:ring-sky-600 shadow-inner"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Document Type</label>
                  <select
                    id="upload-doc-type"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-[#1a2620] outline-hidden focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="MRI">MRI</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Physiotherapy Assessment">Physiotherapy Assessment</option>
                    <option value="Previous Treatment Report">Previous Treatment Report</option>
                    <option value="Diagnosis Report">Diagnosis Report</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1a2620]">Select File (PDF, JPG, PNG)</label>
                  <input
                    type="file"
                    id="upload-doc-file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full text-xs text-stone-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                  />
                </div>
              </div>

              {uploadFileName && (
                <div className="p-2.5 rounded-xl glass-chip border border-white/80 text-[11px] text-[#244b38] flex items-center justify-between">
                  <span>Selected file: <strong>{uploadFileName}</strong></span>
                  <span>{uploadFileSize}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-[#1a2620]">Clinical Summary / Findings</label>
                <textarea
                  id="upload-doc-summary"
                  rows={3}
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  placeholder="Summary of radiologist or orthopedic findings for the physiotherapy care team..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-[#1a2620] outline-hidden focus:ring-2 focus:ring-sky-600 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl glass-card text-stone-700 font-bold hover:bg-stone-200/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-upload-doc-btn"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-700 to-sky-800 hover:from-sky-800 hover:to-sky-900 text-white font-bold shadow-md cursor-pointer"
                >
                  Save & Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Document Viewer Modal (Translucent Blue Frosted Glass) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-strong max-w-2xl w-full rounded-[32px] p-6 sm:p-8 border border-white/60 shadow-2xl backdrop-blur-3xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
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

            {/* Document preview and clinical details */}
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
                <span>Origin: <strong className="text-slate-800">{previewDoc.uploaderName || 'Demo Hospital'}</strong></span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                  Clinical Examination & Findings
                </h4>
                <div className="glass-chip p-4 rounded-xl border border-white/50 text-slate-700 leading-relaxed font-sans">
                  {previewDoc.summary || 'Detailed radiological and clinical findings verified by attending orthopedic specialist. Approved for home tele-rehabilitation monitoring.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600 font-mono">
                <div className="glass-chip p-2 rounded-lg border border-white/40">
                  <strong>Verification:</strong> Clinically Signed
                </div>
                <div className="glass-chip p-2 rounded-lg border border-white/40">
                  <strong>Sharing Scope:</strong> Assigned Therapist Only
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Verified Clinical Record</span>
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
                  <span>Download PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer border border-white/30"
                >
                  Close Viewer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}
