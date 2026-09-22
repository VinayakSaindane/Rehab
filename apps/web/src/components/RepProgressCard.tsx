'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Flag } from 'lucide-react';

interface RepProgressCardProps {
  completedReps: number;
  targetReps: number;
  validReps: number;
  trackingConfidence: number;
  sessionTimeSeconds: number;
  statusMessage: string;
  isGated: boolean;
  onFinishSession: () => void;
}

export default function RepProgressCard({
  completedReps,
  targetReps,
  validReps,
  trackingConfidence,
  sessionTimeSeconds,
  statusMessage,
  isGated,
  onFinishSession
}: RepProgressCardProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const confidencePct = Math.round(trackingConfidence * 100);

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prescribed Repetitions
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {completedReps.toString().padStart(2, '0')}
              </span>
              <span className="text-xl font-bold text-slate-500">
                / {targetReps.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Elapsed Time
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-1 text-slate-300 font-mono text-lg font-bold">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{formatTime(sessionTimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Valid Reps</p>
              <p className="text-base font-bold font-mono text-emerald-400">
                {validReps} <span className="text-xs text-slate-500 font-normal">verified</span>
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Confidence</p>
              <p className={`text-base font-bold font-mono ${confidencePct >= 75 ? 'text-sky-400' : 'text-amber-400'}`}>
                {confidencePct}%
              </p>
            </div>
            <ShieldCheck className={`w-4 h-4 ${confidencePct >= 75 ? 'text-sky-400' : 'text-amber-400'}`} />
          </div>
        </div>

        {/* Live Feedback Notification Banner */}
        <div className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-2.5 mb-4 ${
          isGated 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : completedReps >= targetReps
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-sky-950/60 text-sky-200 border-sky-800/60'
        }`}>
          {isGated ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          ) : completedReps >= targetReps ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
          )}
          <span className="leading-snug">{statusMessage}</span>
        </div>
      </div>

      <button
        onClick={onFinishSession}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
      >
        <span>Complete & Store Session</span>
      </button>
    </div>
  );
}
