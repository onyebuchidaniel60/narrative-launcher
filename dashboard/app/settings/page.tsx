'use client';

import { useState } from 'react';
import { MOCK_BOT_STATE } from '@/lib/mock-data';
import { Settings, ShieldAlert, Power, Sliders, Database, Key, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [botPaused, setBotPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function toggleBotState() {
    const nextState = !botPaused;
    setBotPaused(nextState);
    setStatusMessage(
      nextState
        ? '[Mock Action] Bot emergency pause signaled. Bot will halt polling within 10s.'
        : '[Mock Action] Bot polling resumed.'
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-slate-400" />
            Bot &amp; Safety Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Read-mostly bot configuration, kill switch, and safety envelope limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Source: .env + SQLite bot_state
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-amber-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emergency Kill Switch */}
      <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Power className="w-4 h-4 text-rose-400" />
              Emergency Pause / Kill Switch
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Immediately halts the poller cycle and rejects any incoming approval dispatch.
            </p>
          </div>
          <button
            onClick={toggleBotState}
            className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-2 ${
              botPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-700'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{botPaused ? 'Resume Bot Polling' : 'Emergency Pause Bot'}</span>
          </button>
        </div>

        <div className="text-xs font-mono p-3 rounded bg-slate-950 border border-slate-850 flex items-center justify-between">
          <span className="text-slate-400">Current Process Status:</span>
          <span className={botPaused ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            {botPaused ? 'PAUSED BY OPERATOR' : 'ACTIVE / RUNNING'}
          </span>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Limits */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            Fixed Safety Limits (Enforced by Bot)
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-850">
              <span className="text-slate-400">Daily Launch Hard Cap</span>
              <span className="font-mono text-slate-200 font-bold">
                {MOCK_BOT_STATE.max_launches_per_day} per UTC day
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-850">
              <span className="text-slate-400">Max Dev Buy Allocation</span>
              <span className="font-mono text-slate-200 font-bold">
                {MOCK_BOT_STATE.max_dev_buy_sol.toFixed(2)} SOL
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-850">
              <span className="text-slate-400">Composite Score Threshold</span>
              <span className="font-mono text-slate-200 font-bold">
                &gt;= {MOCK_BOT_STATE.score_threshold} / 100
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-850">
              <span className="text-slate-400">Approval Card Expiry (TTL)</span>
              <span className="font-mono text-slate-200 font-bold">
                {MOCK_BOT_STATE.approval_ttl_minutes} minutes
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-850">
              <span className="text-slate-400">Auto-Launch Mode</span>
              <span className="font-mono text-slate-400">
                Disabled (Manual Operator Approval Required)
              </span>
            </div>
          </div>
        </div>

        {/* Security & Credentials Overview */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            Security Boundaries
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400">Burner Wallet Public Key</div>
              <div className="font-mono text-slate-300 break-all select-all">
                {MOCK_BOT_STATE.burner_wallet_pubkey}
              </div>
              <div className="text-slate-500 text-[11px]">
                Private key is never stored by the bot or dashboard.
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400">Telegram Operator Allowlist</div>
              <div className="font-mono text-slate-300">[123456789] (Strict integer comparison)</div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400">Log Redaction Policy</div>
              <div className="text-slate-300">Pino redaction active for keys, tokens, and authorization headers.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
