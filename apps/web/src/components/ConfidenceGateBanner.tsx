'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, Lightbulb } from 'lucide-react';

interface ConfidenceGateBannerProps {
  isGated: boolean;
  confidenceScore: number;
  reason?: string | null;
  missingLandmarks?: string[];
}

/** User-friendly label for technical landmark names */
function friendlyLandmarkName(raw: string): string {
  const map: Record<string, string> = {
    left_shoulder: 'left shoulder',
    right_shoulder: 'right shoulder',
    left_elbow: 'left elbow',
    right_elbow: 'right elbow',
    left_wrist: 'left wrist',
    right_wrist: 'right wrist',
    left_hip: 'left hip',
    right_hip: 'right hip',
    left_knee: 'left knee',
    right_knee: 'right knee',
    left_ankle: 'left ankle',
    right_ankle: 'right ankle',
  };
  return map[raw] || raw.replace(/_/g, ' ');
}

/** Translate technical gate reason into plain, actionable guidance */
function friendlyReason(reason: string | null | undefined, missing: string[]): string {
  if (missing.length > 0) {
    const parts = missing.map(friendlyLandmarkName);
    return `We can't see your ${parts.join(' and ')} clearly. Try stepping back so your full arm is in frame.`;
  }
  if (reason?.includes('visibility') || reason?.includes('obscured')) {
    return "Part of your body is hidden from the camera. Please adjust your position so the camera can see your full movement.";
  }
  if (reason?.includes('confidence') || reason?.includes('low')) {
    return "The lighting may be too dim, or you're too close to the camera. Try moving to a brighter spot and stepping back.";
  }
  return "We've paused tracking to protect accuracy. Please make sure your full body is visible and well-lit.";
}

export default function ConfidenceGateBanner({
  isGated,
  confidenceScore,
  reason,
  missingLandmarks = []
}: ConfidenceGateBannerProps) {
  if (!isGated) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-40 bg-amber-500/95 text-slate-950 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-amber-300 flex items-start sm:items-center justify-between gap-3 animate-pulse-subtle">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 bg-amber-950 text-amber-300 rounded-lg shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm sm:text-base uppercase tracking-wide">
              Tracking Paused
            </h4>
            <span className="text-xs bg-amber-900 text-amber-100 px-2 py-0.5 rounded-full font-mono font-medium">
              {Math.round(confidenceScore * 100)}% visible
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5">
            {friendlyReason(reason, missingLandmarks)}
          </p>

          {/* Actionable tips */}
          <div className="flex items-start gap-1.5 mt-1.5 text-[11px] font-semibold text-amber-950">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Tip: Stand 6–8 feet from the camera in a well-lit room. Your reps won't count until tracking resumes.</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs font-semibold bg-amber-400/80 px-3 py-1.5 rounded-lg shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-900" />
        <span>Safety pause active</span>
      </div>
    </div>
  );
}
