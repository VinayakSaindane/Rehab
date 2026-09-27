'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Inbox, ArrowLeft, CheckCircle2, Clock, XCircle,
  IndianRupee, FileText, ChevronDown, ChevronUp, Send
} from 'lucide-react';

export default function TherapistRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quoting, setQuoting] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState<{ charge: string; notes: string }>({ charge: '', notes: '' });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
        const res = await fetch('http://localhost:8000/api/hospital/case-requests/therapist', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setRequests(data.length > 0 ? data : getDemoRequests());
        } else {
          setRequests(getDemoRequests());
        }
      } catch {
        setRequests(getDemoRequests());
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getDemoRequests = () => [
    {
      id: 'case-demo-1',
      patient_id: 'patient-1',
      status: 'accepted',
      quoted_charge: 8500,
      therapist_notes: 'Standard 4-week post-operative elbow rehab program.',
      patient_notes: 'Hoping to recover full ROM within 6 weeks.',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      hospital_record: {
        patient_id: 'patient-1',
        patient_name: 'Aarav Mehta',
        operation_type: 'Elbow Ligament Reconstruction',
        injury_description: 'Post-operative UCL reconstruction, sports injury',
        surgery_date: '2026-09-01',
        uploaded_report_urls: ['/uploads/demo-pre-op-report.pdf']
      }
    }
  ];

  const handleSubmitQuote = async (caseId: string) => {
    if (!quoteForm.charge) return;
    setQuoting(caseId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      const res = await fetch(`http://localhost:8000/api/hospital/case-requests/${caseId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ quoted_charge: parseFloat(quoteForm.charge), therapist_notes: quoteForm.notes })
      });
      setRequests(prev => prev.map(r => r.id === caseId
        ? { ...r, status: 'quoted', quoted_charge: parseFloat(quoteForm.charge), therapist_notes: quoteForm.notes }
        : r));
      setExpanded(null);
    } catch {
      setRequests(prev => prev.map(r => r.id === caseId
        ? { ...r, status: 'quoted', quoted_charge: parseFloat(quoteForm.charge), therapist_notes: quoteForm.notes }
        : r));
      setExpanded(null);
    } finally {
      setQuoting(null);
      setQuoteForm({ charge: '', notes: '' });
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending_quote: { label: 'Awaiting Your Quote', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Clock },
    quoted:        { label: 'Quote Sent',          color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300', icon: Send },
    accepted:      { label: 'Accepted',            color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
    declined:      { label: 'Declined',            color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <Link href="/therapist/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Inbox className="w-5 h-5" />
            </div>
            Incoming Case Requests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review patient clinical records, enter your programme quote, and manage your caseload.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No incoming case requests</p>
            <p className="text-sm mt-1">Patients who find you on the marketplace can send requests here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req: any) => {
              const cfg = statusConfig[req.status] ?? statusConfig['pending_quote'];
              const StatusIcon = cfg.icon;
              const rec = req.hospital_record;
              const isOpen = expanded === req.id;

              return (
                <div key={req.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : req.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(rec?.patient_name || 'P').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{rec?.patient_name || 'Patient'}</p>
                        <p className="text-xs text-slate-500">{rec?.operation_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 p-5 space-y-4">
                      {/* Clinical details */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">Clinical Record</p>
                        <p><span className="text-slate-400 text-xs">Operation:</span> <span className="font-medium text-slate-900 dark:text-white">{rec?.operation_type}</span></p>
                        <p><span className="text-slate-400 text-xs">Surgery Date:</span> <span className="font-medium text-slate-900 dark:text-white">{rec?.surgery_date || 'N/A'}</span></p>
                        <p><span className="text-slate-400 text-xs">Description:</span> <span className="font-medium text-slate-900 dark:text-white">{rec?.injury_description}</span></p>
                        {rec?.uploaded_report_urls?.length > 0 && (
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Uploaded Reports:</p>
                            {rec.uploaded_report_urls.map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline">
                                <FileText className="w-3.5 h-3.5" />
                                {url.split('/').pop()}
                                <span className="text-slate-400 text-[10px]">(demo only — local file)</span>
                              </a>
                            ))}
                          </div>
                        )}
                        {req.patient_notes && (
                          <p><span className="text-slate-400 text-xs">Patient Note:</span> <span className="italic text-slate-600 dark:text-slate-400">{req.patient_notes}</span></p>
                        )}
                      </div>

                      {/* Quote form (only for pending_quote) */}
                      {req.status === 'pending_quote' && (
                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Submit Your Quote</p>
                          <div className="flex gap-3">
                            <div className="flex-1 relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="number"
                                value={quoteForm.charge}
                                onChange={e => setQuoteForm(p => ({ ...p, charge: e.target.value }))}
                                placeholder="Programme fee (₹)"
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                              />
                            </div>
                          </div>
                          <textarea
                            value={quoteForm.notes}
                            onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Clinical notes and programme plan for the patient…"
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                          />
                          <button
                            id={`submit-quote-${req.id}`}
                            onClick={() => handleSubmitQuote(req.id)}
                            disabled={!quoteForm.charge || quoting === req.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {quoting === req.id ? 'Sending…' : 'Send Quote to Patient'}
                          </button>
                        </div>
                      )}

                      {/* Accepted state — show the quote */}
                      {(req.status === 'quoted' || req.status === 'accepted') && req.quoted_charge && (
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                              Quote: ₹{req.quoted_charge.toLocaleString('en-IN')}
                              {req.status === 'accepted' && <span className="ml-2 text-xs">(Accepted by patient)</span>}
                            </p>
                            {req.therapist_notes && <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{req.therapist_notes}</p>}
                            {req.status === 'accepted' && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                {/* TODO: payment gateway not yet integrated — this is a STUB acceptance */}
                                STUB: No payment was processed. Integrate Razorpay/Stripe for production.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
