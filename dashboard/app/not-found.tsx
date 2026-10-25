import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-12 h-12 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-white">404 — Page Not Found</h1>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The requested dashboard route does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
