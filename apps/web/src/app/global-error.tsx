'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-red-800 shadow-xl p-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Critical Error</h1>
              <p className="text-sm text-slate-400 mt-2">
                A critical error occurred. Please refresh the page.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
