'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900 shadow-xl p-8 space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950 mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            An unexpected error occurred. Your session data is safe.
          </p>
          {error?.message && (
            <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl mt-3 text-left break-all">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/patient/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
