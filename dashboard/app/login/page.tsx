'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(tokenToSubmit: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToSubmit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const destination = params?.get('from') || '/';

      router.push(destination);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Shield className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Operator Authentication</h1>
            <p className="text-xs text-slate-400">Single-tenant bearer token access</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(token);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="token" className="block text-xs font-medium text-slate-300 mb-1.5">
              Dashboard Bearer Token (≥32 bytes)
            </label>
            <div className="relative">
              <input
                id="token"
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste operator token..."
                className="w-full px-3 py-2 pl-9 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-slate-100 hover:bg-white text-slate-900 font-medium text-sm transition disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
