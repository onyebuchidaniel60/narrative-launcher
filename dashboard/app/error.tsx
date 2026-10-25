'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly without exposing sensitive context
    console.error('Dashboard Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded bg-rose-950/50 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-white">Application Error</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        An unexpected error occurred while rendering the dashboard view.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
