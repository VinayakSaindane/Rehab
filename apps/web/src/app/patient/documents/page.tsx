'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { mockStorage, MockDocument } from '@/lib/mock-storage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  FileText, 
  FileCheck, 
  Eye, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  X,
  Lock
} from 'lucide-react';

export default function PatientDocumentsPage() {
  const { user } = useAuth();
  const patientId = user?.id || 'patient-001';

  const [documents, setDocuments] = useState<MockDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<MockDocument | null>(null);

  useEffect(() => {
    mockStorage.init();
    // Privacy guarantee: ONLY retrieve documents for the currently authenticated patient!
    const myDocs = mockStorage.getDocuments(patientId);
    setDocuments(myDocs);
    setLoading(false);
  }, [patientId]);

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 select-none">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Link */}
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 hover:text-blue-950 transition-colors glass-chip px-3.5 py-1.5 rounded-xl border border-white/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Rehab Plan</span>
          </Link>

          {/* Page Banner */}
          <div className="glass-card-strong p-6 sm:p-8 rounded-[30px] border border-white/50 shadow-xl backdrop-blur-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full glass-chip text-blue-900 text-[11px] font-bold border border-blue-300/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Secure Patient Health Record (PHR)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  My Medical Documents
                </h1>
                <p className="text-xs text-slate-600">
                  Diagnostic scans, surgical prescriptions, and physiotherapy assessments uploaded by your hospital care team.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 glass-chip px-3.5 py-1.5 rounded-xl border border-white/50 text-xs font-bold text-slate-700 shrink-0">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Private to You</span>
            </div>
          </div>

          {/* Document Grid */}
          <div className="glass-card-strong rounded-[28px] p-6 sm:p-7 border border-white/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/40">
              <h2 className="text-base font-bold text-slate-900">
                Hospital-Verified Records ({documents.length})
              </h2>
              <span className="text-xs text-slate-500">
                Patient ID: <span className="font-mono font-bold text-slate-700">{patientId}</span>
              </span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading your documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center text-slate-600 space-y-2">
                <FileText className="w-12 h-12 mx-auto opacity-30 text-slate-400" />
                <p className="font-bold text-slate-800">No documents uploaded yet</p>
                <p className="text-xs text-slate-500">
                  When your hospital uploads reports or prescriptions, they will securely appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-card p-5 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group hover:border-blue-300"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-800 flex items-center justify-center shrink-0 border border-blue-400/30">
                            <FileCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">
                              {doc.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {doc.fileName} {doc.fileSize && `• ${doc.fileSize}`}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full glass-chip text-blue-800 border border-blue-300/40">
                          {doc.type}
                        </span>
                      </div>

                      {doc.summary && (
                        <p className="text-xs text-slate-700 italic glass-chip p-2.5 rounded-xl border border-white/40 leading-relaxed">
                          &quot;{doc.summary}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/30 text-slate-500">
                      <span className="text-[11px]">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        id={`patient-view-doc-${doc.id}`}
                        className="px-3.5 py-1.5 rounded-xl glass-button text-xs font-bold text-blue-900 flex items-center gap-1 border border-white/50 transition-all cursor-pointer hover:bg-white/40"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Document</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Patient Document Viewer Modal (Translucent Blue Frosted Glass) */}
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
              <div className="flex items-center justify-between pb-3 border-b border-white/30 text-[11px] text-slate-500">
                <span>Patient: <strong className="text-slate-800">{user?.name || 'Demo Patient'}</strong></span>
                <span>Date: <strong className="text-slate-800">{new Date(previewDoc.uploadedAt).toLocaleDateString()}</strong></span>
                <span>Uploaded by: <strong className="text-slate-800">{previewDoc.uploaderName || 'Demo Hospital'}</strong></span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">
                  Clinical Examination & Findings
                </h4>
                <div className="glass-chip p-4 rounded-xl border border-white/50 text-slate-700 leading-relaxed font-sans">
                  {previewDoc.summary || 'Detailed radiological and clinical findings verified by attending orthopedic specialist. Approved for home tele-rehabilitation monitoring.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Verified Hospital Medical Record</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Simulated document download: ${previewDoc.fileName}`)}
                  className="px-4 py-2 rounded-xl glass-button text-xs font-bold text-blue-900 hover:bg-white/40 flex items-center gap-1.5 border border-white/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
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
