'use client';

import React from 'react';
import { AlertTriangle, Video, Maximize2, ShieldAlert } from 'lucide-react';

interface ConfidenceGateBannerProps {
  isGated: boolean;
  confidenceScore: number;
  reason?: string | null;
  missingLandmarks?: string[];
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
              Movement Analysis Paused
            </h4>
            <span className="text-xs bg-amber-900 text-amber-100 px-2 py-0.5 rounded-full font-mono font-medium">
              Confidence: {Math.round(confidenceScore * 100)}%
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-900 mt-0.5">
            {reason || "We can't confidently assess your movement. Please make sure your full body is visible."}
          </p>
          {missingLandmarks.length > 0 && (
            <p className="text-[11px] text-amber-950 font-semibold mt-1">
              Required joints obscured: {missingLandmarks.map(n => n.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs font-semibold bg-amber-400/80 px-3 py-1.5 rounded-lg shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-900" />
        <span>Gated to protect clinical integrity</span>
      </div>
    </div>
  );
}
