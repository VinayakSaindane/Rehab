'use client';

import React from 'react';
import { Activity, TriangleAlert } from 'lucide-react';

interface CompensationWarningBannerProps {
  hasCompensation: boolean;
  compensationFlags: string[];
  reasons: string[];
}

/** User-friendly label mapping for compensation flag strings */
const FLAG_LABELS: Record<string, string> = {
  trunk_lean: 'Trunk Lean',
  shoulder_hike: 'Shoulder Hike',
  pelvic_shift: 'Pelvic Shift',
};

export default function CompensationWarningBanner({
  hasCompensation,
  compensationFlags,
  reasons,
}: CompensationWarningBannerProps) {
  if (!hasCompensation || compensationFlags.length === 0) return null;

  return (
    <div className="absolute top-20 left-4 right-4 z-40 bg-orange-500/95 text-slate-950 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-orange-300 flex items-start gap-3">
      <div className="p-2 bg-orange-950 text-orange-300 rounded-lg shrink-0 mt-0.5">
        <Activity className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm uppercase tracking-wide">
            Movement Compensation Detected
          </h4>
          {/* Flag chips */}
          <div className="flex gap-1 flex-wrap">
            {compensationFlags.map((flag) => (
              <span
                key={flag}
                className="text-[10px] bg-orange-900 text-orange-100 px-2 py-0.5 rounded-full font-mono font-medium"
              >
                {FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* First reason is most actionable; show it prominently */}
        {reasons.length > 0 && (
          <p className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5 leading-snug">
            {reasons[0]}
          </p>
        )}

        <div className="flex items-start gap-1.5 mt-1.5 text-[11px] font-semibold text-orange-950">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Rep still counted, but flagged for therapist review. Focus on
            controlled movement rather than range.
          </span>
        </div>
      </div>
    </div>
  );
}
