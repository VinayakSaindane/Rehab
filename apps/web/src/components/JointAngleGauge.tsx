'use client';

import React from 'react';

interface JointAngleGaugeProps {
  currentAngle: number;
  targetAngle: number;
  minAngle?: number;
  maxAngle?: number;
  isAngleDecreasingOnFlex?: boolean;
}

export default function JointAngleGauge({
  currentAngle,
  targetAngle,
  minAngle = 40,
  maxAngle = 160,
  isAngleDecreasingOnFlex = true
}: JointAngleGaugeProps) {
  // Calculate percentage progress toward target
  // For elbow flexion: resting is 155, target is 120. Moving from 155 down to 120 is 100% progress.
  let progressPct = 0;
  if (isAngleDecreasingOnFlex) {
    const totalSpan = 155 - targetAngle;
    const currentProgress = 155 - currentAngle;
    progressPct = totalSpan > 0 ? Math.min(100, Math.max(0, (currentProgress / totalSpan) * 100)) : 0;
  } else {
    const totalSpan = targetAngle - minAngle;
    const currentProgress = currentAngle - minAngle;
    progressPct = totalSpan > 0 ? Math.min(100, Math.max(0, (currentProgress / totalSpan) * 100)) : 0;
  }

  const isAtTarget = progressPct >= 95;

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Movement Range (ROM)
        </span>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
          isAtTarget ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
        }`}>
          {isAtTarget ? 'TARGET REACHED' : 'IN PROGRESS'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
          <p className="text-[11px] text-slate-400 font-medium">Observed Angle</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {Math.round(currentAngle)}
            </span>
            <span className="text-sm font-semibold text-slate-400">°</span>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
          <p className="text-[11px] text-slate-400 font-medium">Prescribed Target</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-sky-400">
              {Math.round(targetAngle)}
            </span>
            <span className="text-sm font-semibold text-sky-400">°</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Corridor */}
      <div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
          <span>Target Progress</span>
          <span className="font-mono">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isAtTarget ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-sky-500 to-cyan-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
