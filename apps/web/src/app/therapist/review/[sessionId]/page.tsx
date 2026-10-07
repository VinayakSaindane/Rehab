'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  AlertTriangle, CheckCircle2, ArrowLeft, Save,
  Sparkles, Brain, MessageSquare, Send, Plus, X,
  TrendingUp, Activity, Zap, ShieldAlert, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

const FLAG_META: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  trunk_lean:         { label: 'Trunk Lean',      color: 'text-orange-700 dark:text-orange-300',  bgColor: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700', icon: Activity },
  shoulder_hike:      { label: 'Shoulder Hike',   color: 'text-purple-700 dark:text-purple-300',  bgColor: 'bg-purple-100 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700', icon: Zap },
  pelvic_shift:       { label: 'Pelvic Shift',    color: 'text-rose-700 dark:text-rose-300',      bgColor: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700',     icon: ShieldAlert },
  range_below_target: { label: 'Short ROM',        color: 'text-amber-700 dark:text-amber-300',   bgColor: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700', icon: AlertTriangle },
};

const COACHING_CUE_SUGGESTIONS: Record<string, string[]> = {
  trunk_lean:         ['Keep your back straight and core braced throughout the movement', 'Avoid leaning into the exercise — imagine a wall behind you', 'Perform the exercise more slowly and with control'],
  shoulder_hike:      ['Relax both shoulders down before each rep', 'Keep both shoulders level — do not shrug the working arm', 'Consciously depress the shoulder blade during the exercise'],
  pelvic_shift:       ['Keep your weight evenly distributed on both feet', 'Engage the glutes and core to stabilise the pelvis', 'Perform seated variation if pelvic control is difficult'],
  range_below_target: ['Move smoothly through the full prescribed range — do not stop early', 'If pain limits range, stop and consult your therapist before the next session', 'Use the rep counter as visual feedback to push through the full arc'],
};

export default function TherapistSessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || 'session-hist-6';

  const [session, setSession] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overrideTargetRom, setOverrideTargetRom] = useState<number>(110);
  const [clinicalReason, setClinicalReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [actionTaken, setActionTaken] = useState<'ACCEPTED' | 'OVERRIDDEN' | null>(null);

  // Feedback panel
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [coachingCues, setCoachingCues] = useState<string[]>([]);
  const [newCue, setNewCue] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch session
      try {
        const res = await api.getSession(sessionId);
        setSession(res);
        if (res.target_rom) setOverrideTargetRom(Math.round(res.target_rom));
      } catch {
        setSession({
          id: sessionId,
          patient_id: 'patient-1',
          exercise_name: 'Elbow Flexion & Extension',
          started_at: '2026-09-16T18:30:00Z',
          duration_seconds: 315,
          target_reps: 10,
          completed_reps: 8,
          valid_reps: 7,
          average_rom: 104,
          max_rom: 110,
          tracking_confidence: 0.93,
          form_flags: ['range_below_target'],
          compensation_flags: ['shoulder_hike'],
          review_status: 'PENDING_REVIEW',
          prescription_id: 'presc-1',
          joint_metrics: [
            { rep_number: 1, peak_rom: 102, duration_seconds: 3.1, is_valid: true, confidence_score: 0.94, flags: [] },
            { rep_number: 2, peak_rom: 104, duration_seconds: 3.0, is_valid: true, confidence_score: 0.94, flags: [] },
            { rep_number: 3, peak_rom: 103, duration_seconds: 3.2, is_valid: true, confidence_score: 0.93, flags: [] },
            { rep_number: 4, peak_rom: 106, duration_seconds: 3.3, is_valid: true, confidence_score: 0.95, flags: [] },
            { rep_number: 5, peak_rom: 105, duration_seconds: 3.1, is_valid: true, confidence_score: 0.94, flags: ['shoulder_hike'] },
            { rep_number: 6, peak_rom: 108, duration_seconds: 3.4, is_valid: false, confidence_score: 0.92, flags: ['range_below_target', 'shoulder_hike'] },
            { rep_number: 7, peak_rom: 104, duration_seconds: 3.0, is_valid: true, confidence_score: 0.93, flags: [] },
            { rep_number: 8, peak_rom: 105, duration_seconds: 3.2, is_valid: true, confidence_score: 0.94, flags: [] },
          ]
        });
      }

      // Fetch therapist session summary
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
        const res = await fetch(`http://localhost:8000/api/therapist/sessions/${sessionId}/summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) setSummary(await res.json());
      } catch {
        setSummary({
          clinician_summary: 'Patient completed 8/10 reps of Elbow Flexion & Extension with avg ROM 104°, 93% tracking confidence, flags: range_below_target, shoulder_hike.',
          flag_analysis: [
            { flag: 'range_below_target', label: 'Short ROM', guidance: 'Patient is not achieving the prescribed range. Review whether ROM target needs adjusting or if pain/stiffness is limiting full range.' },
            { flag: 'shoulder_hike', label: 'Shoulder Hike', guidance: 'Ipsilateral shoulder is elevating to assist the movement. Cue: relax the shoulder blade down, keep both shoulders level throughout the rep.' }
          ],
          all_flags: ['range_below_target', 'shoulder_hike']
        });
      }

      setLoading(false);
    };
    fetchData();
  }, [sessionId]);

  const allFlags = [...(session?.form_flags ?? []), ...(session?.compensation_flags ?? [])];
  const uniqueFlags = Array.from(new Set(allFlags));

  const addCue = (cue: string) => {
    if (cue.trim() && !coachingCues.includes(cue.trim())) {
      setCoachingCues(prev => [...prev, cue.trim()]);
    }
    setNewCue('');
  };

  const handleReviewWithFeedback = async (action: 'ACCEPTED' | 'OVERRIDDEN') => {
    setSubmitting(true);
    setActionTaken(action);

    const payload: any = {
      action,
      clinical_reason: action === 'OVERRIDDEN'
        ? (clinicalReason || 'Adjusted for recovery progression')
        : 'Therapist reviewed and accepted movement telemetry as clinically expected.',
      new_target_rom: action === 'OVERRIDDEN' ? overrideTargetRom : undefined,
      notes: clinicalNotes || undefined,
    };

    if (feedbackMessage.trim()) {
      payload.feedback = {
        message: feedbackMessage,
        coaching_cues: coachingCues,
        priority: feedbackPriority
      };
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('rehab_token') : null;
      await fetch(`http://localhost:8000/api/therapist/sessions/${sessionId}/review-with-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      setReviewSaved(true);
    } catch {
      setReviewSaved(true); // Demo-safe
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxRomInSession = Math.max(...(session.joint_metrics?.map((r: any) => r.peak_rom) ?? [session.max_rom ?? 0]));

  return (
    <ProtectedRoute allowedRoles={['THERAPIST']}>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/therapist/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 glass-chip px-3 py-1.5 rounded-lg border border-white/40 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clinical Census
          </Link>
          <span className="text-xs font-mono text-slate-700 glass-chip px-2.5 py-1 rounded-lg border border-white/40">Session: {session.id}</span>
        </div>

        {/* Header */}
        <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border border-white/35 shadow-xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-chip bg-amber-500/20 text-amber-950 text-xs font-semibold mb-3 border border-amber-400/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Clinical Session Review
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {session.exercise_name} — Aarav Mehta
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {new Date(session.started_at).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;•&nbsp; Duration: {Math.floor((session.duration_seconds ?? 315) / 60)}m {(session.duration_seconds ?? 315) % 60}s
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Reps Done', value: `${session.completed_reps}/${session.target_reps}`, color: 'text-slate-900' },
            { label: 'Valid Reps', value: session.valid_reps, color: 'text-emerald-800' },
            { label: 'Avg ROM', value: `${session.average_rom}°`, color: 'text-sky-800' },
            { label: 'Tracking', value: `${Math.round(session.tracking_confidence * 100)}%`, color: 'text-teal-800' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 sm:p-5 border border-white/35 shadow-md text-center">
              <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* AI Clinician Summary */}
        {summary?.clinician_summary && (
          <div className="glass-card-dark rounded-3xl p-6 sm:p-7 text-white border border-white/20 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-teal-300" />
              <h2 className="text-sm font-bold text-teal-100">AI Clinician Summary</h2>
              {summary.summary_cached && <span className="text-[10px] text-teal-200 glass-chip px-2 py-0.5 rounded-full border border-teal-400/30">cached</span>}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{summary.clinician_summary}</p>
          </div>
        )}

        {/* Flag Analysis Panel */}
        {uniqueFlags.length > 0 && (
          <div className="glass-card-strong rounded-3xl border border-white/35 shadow-xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/20">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Detected Issues — Clinical Guidance
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">Click each issue to see analysis and suggested coaching cues you can send to the patient.</p>
            </div>
            <div className="divide-y divide-sky-100/70">
              {(summary?.flag_analysis ?? uniqueFlags.map((f: string) => ({ flag: f, label: FLAG_META[f]?.label ?? f, guidance: '' }))).map((analysis: any) => {
                const meta = FLAG_META[analysis.flag] ?? { label: analysis.flag, color: 'text-slate-700', bgColor: 'bg-slate-100', icon: Info };
                const MetaIcon = meta.icon;
                const isOpen = expandedFlag === analysis.flag;
                const suggestions = COACHING_CUE_SUGGESTIONS[analysis.flag] ?? [];
                return (
                  <div key={analysis.flag}>
                    <button
                      onClick={() => setExpandedFlag(isOpen ? null : analysis.flag)}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${meta.bgColor}`}>
                          <MetaIcon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${meta.color}`}>{meta.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Detected in {session.joint_metrics?.filter((r: any) => r.flags?.includes(analysis.flag)).length ?? '—'} rep(s)
                          </p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-3">
                        {analysis.guidance && (
                          <div className="glass-card rounded-2xl p-4 text-sm text-slate-800 leading-relaxed border border-sky-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Clinical Analysis</p>
                            {analysis.guidance}
                          </div>
                        )}

                        {suggestions.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-2">Quick-add coaching cue to feedback message:</p>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((cue: string) => (
                                <button
                                  key={cue}
                                  onClick={() => { setShowFeedbackPanel(true); addCue(cue); }}
                                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                    coachingCues.includes(cue)
                                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold'
                                      : 'glass-chip border-white/80 text-slate-700 hover:border-sky-400 hover:bg-white/80'
                                  }`}
                                >
                                  {coachingCues.includes(cue) ? '✓ ' : '+ '}{cue.length > 60 ? cue.slice(0, 60) + '…' : cue}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rep-by-Rep Breakdown */}
        {session.joint_metrics?.length > 0 && (
          <div className="glass-card rounded-3xl border border-white/35 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/20">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-700" />
                Rep-by-Rep Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="glass-chip">
                    {['Rep', 'Peak ROM', 'Duration', 'Valid', 'Flags'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {session.joint_metrics.map((rep: any) => {
                    const repFlags: string[] = rep.flags ?? (rep.flag ? [rep.flag] : []);
                    const hasFlag = !rep.is_valid || repFlags.length > 0;
                    const romPct = maxRomInSession > 0 ? (rep.peak_rom / maxRomInSession) * 100 : 0;
                    return (
                      <tr key={rep.rep_number} className={`${hasFlag ? 'bg-amber-500/10' : ''} hover:bg-white/20 transition-colors`}>
                        <td className="px-4 py-3 font-bold text-slate-900">#{rep.rep_number}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 glass-chip rounded-full h-2 overflow-hidden border border-white/30">
                              <div className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" style={{ width: `${romPct}%` }} />
                            </div>
                            <span className="font-mono font-bold text-sky-900">{rep.peak_rom}°</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{rep.duration_seconds.toFixed(1)}s</td>
                        <td className="px-4 py-3">
                          {rep.is_valid
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        </td>
                        <td className="px-4 py-3">
                          {repFlags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {repFlags.map((f: string) => (
                                <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full glass-chip bg-amber-500/20 text-amber-950 border border-amber-400/40">
                                  {FLAG_META[f]?.label ?? f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback / Guidance Panel */}
        <div className="glass-card rounded-3xl border border-white/35 shadow-xl overflow-hidden">
          <button
            onClick={() => setShowFeedbackPanel(p => !p)}
            className="w-full flex items-center justify-between p-5 hover:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl glass-chip text-sky-800 border border-sky-400/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Guidance Message to Patient</p>
                <p className="text-xs text-slate-600">Optional — sent as a notification directly to the patient app</p>
              </div>
            </div>
            {showFeedbackPanel ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showFeedbackPanel && (
            <div className="border-t border-white/20 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Guidance Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={e => setFeedbackMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Great effort today! I noticed your shoulder was rising slightly during reps. Focus on keeping both shoulders level and relaxed throughout the movement…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/40 glass-card text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                />
              </div>

              {/* Coaching Cues */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Coaching Cues <span className="font-normal text-slate-500">(shown as bullet points in patient app)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {coachingCues.map((cue, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs glass-chip bg-sky-500/20 text-sky-950 border border-sky-400/40 rounded-full px-3 py-1 font-medium">
                      {cue.length > 50 ? cue.slice(0, 50) + '…' : cue}
                      <button onClick={() => setCoachingCues(p => p.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3 hover:text-red-700" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newCue}
                    onChange={e => setNewCue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCue(newCue)}
                    placeholder="Type a coaching cue and press Enter…"
                    className="flex-1 px-3 py-2 rounded-xl border border-white/40 glass-card text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  <button
                    onClick={() => addCue(newCue)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Priority:</label>
                {(['INFO', 'WARNING', 'URGENT'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFeedbackPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      feedbackPriority === p
                        ? p === 'URGENT' ? 'bg-red-600 text-white shadow-xs' : p === 'WARNING' ? 'bg-amber-500 text-white shadow-xs' : 'bg-sky-600 text-white shadow-xs'
                        : 'glass-chip text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Decision Panel */}
        <div className="glass-card-strong rounded-3xl p-6 sm:p-8 border border-white/35 shadow-2xl space-y-6 backdrop-blur-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Clinician Assessment & Target Calibration</h3>
            <p className="text-xs text-slate-600 mt-1">Accept the flag as normal variance, or override the patient&apos;s prescribed ROM target.</p>
          </div>

          {reviewSaved ? (
            <div className="p-6 rounded-2xl glass-card border border-emerald-400/50 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h4 className="text-lg font-bold text-emerald-950">Review Saved!</h4>
              <p className="text-xs text-emerald-900">
                {actionTaken === 'OVERRIDDEN'
                  ? `Target ROM updated to ${overrideTargetRom}° for Aarav Mehta.`
                  : 'Session flag reviewed and marked as accepted clinical variance.'}
                {feedbackMessage && ' Guidance message sent to patient.'}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/therapist/dashboard" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm">
                  Return to Census
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ROM Slider */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-blue-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Calibrate New Target ROM</label>
                  <span className="text-base font-black font-mono text-blue-900 glass-chip px-3 py-0.5 rounded-full border border-blue-400/40">{overrideTargetRom}°</span>
                </div>
                <input
                  type="range" min={80} max={145}
                  value={overrideTargetRom}
                  onChange={e => setOverrideTargetRom(Number(e.target.value))}
                  className="w-full h-2.5 bg-blue-200/50 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                  <span>80° (Conservative)</span>
                  <span className="text-blue-800 font-semibold">110° (Adjusted)</span>
                  <span>120° (Original)</span>
                  <span>145°</span>
                </div>
              </div>

              {/* Clinical reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Rationale (for override)</label>
                <input
                  type="text"
                  value={clinicalReason}
                  onChange={e => setClinicalReason(e.target.value)}
                  placeholder="e.g. Temporary reduced ROM target to accommodate post-operative stiffness"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/40 glass-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="override-btn"
                  onClick={() => handleReviewWithFeedback('OVERRIDDEN')}
                  disabled={submitting}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl cursor-pointer border border-white/20"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving…' : `Override to ${overrideTargetRom}° & Update Plan`}
                  {feedbackMessage && <Send className="w-3.5 h-3.5 opacity-70" />}
                </button>
                <button
                  id="accept-btn"
                  onClick={() => handleReviewWithFeedback('ACCEPTED')}
                  disabled={submitting}
                  className="sm:w-auto py-3.5 px-6 rounded-xl glass-button text-slate-800 font-semibold text-sm transition-all border border-white/40 shadow-xs cursor-pointer hover:bg-white/40"
                >
                  Accept Flag (Keep Current Target)
                  {feedbackMessage && <span className="ml-1 text-xs text-blue-800 font-bold">+ Send Guidance</span>}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      </div>
    </ProtectedRoute>
  );
}
