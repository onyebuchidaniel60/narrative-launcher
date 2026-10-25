'use client';

import { useState } from 'react';
import { MOCK_APPROVALS, LaunchItem } from '@/lib/mock-data';
import {
  CheckSquare,
  Clock,
  Sparkles,
  ExternalLink,
  Coins,
  Shield,
  CheckCircle2,
  XCircle,
  TimerReset,
  Info,
} from 'lucide-react';

export default function ApprovalsPage() {
  const [items, setItems] = useState<LaunchItem[]>(MOCK_APPROVALS);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  function handleAction(id: string, action: 'approve' | 'reject' | 'snooze') {
    if (action === 'approve') {
      setActionFeedback(`[Mock Action] Token ${id} approved for simulated launch! (DRY_RUN=true)`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else if (action === 'reject') {
      setActionFeedback(`[Mock Action] Token ${id} rejected.`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else if (action === 'snooze') {
      setActionFeedback(`[Mock Action] Token ${id} snoozed for 10 minutes.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            Pending Approvals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operator authorization queue for token launches on Pump.fun.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
          Queue: {items.length} Pending
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-400 hover:text-white ml-2 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-slate-900/50 border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300">No Approvals Pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            The queue is empty. When narratives exceed the composite score gate (&gt;= 75), approval cards will appear here.
          </p>
          <button
            onClick={() => setItems(MOCK_APPROVALS)}
            className="mt-4 px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Reset Mock Approval Item
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-lg"
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                    PENDING APPROVAL
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.id}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expires in ~25m (30m TTL)</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Narrative & Source */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Detected Narrative</span>
                    <span className="text-emerald-400 font-mono">Score: {item.composite_score} / 100</span>
                  </div>
                  <p className="text-base font-semibold text-slate-100">
                    &quot;{item.narrative_text}&quot;
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Source: {item.source}</p>
                </div>

                {/* Token Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Generated Identity</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{item.token_name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                        ${item.token_symbol}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{item.token_description}</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Generated Mint Public Key (one-time)</span>
                      <span className="font-mono text-slate-300 break-all select-all">
                        {item.mint_public_key}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">IPFS Metadata URI</span>
                      <span className="font-mono text-slate-400 truncate block">
                        {item.metadata_uri}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Estimations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded bg-slate-950 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Dev Buy Allocation</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {item.dev_buy_sol.toFixed(4)} SOL
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Estimated PumpPortal Fee</span>
                    <span className="text-sm font-bold font-mono text-white">0.0200 SOL</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Total Estimated Cost</span>
                    <span className="text-sm font-bold font-mono text-amber-300">
                      {item.estimated_cost_sol.toFixed(4)} SOL
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(item.id, 'approve')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Launch (Dry Run)</span>
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'reject')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-800/60 text-xs font-medium transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAction(item.id, 'snooze')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium transition"
                  >
                    <TimerReset className="w-3.5 h-3.5" />
                    <span>Snooze (+10m)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded bg-slate-900/40 border border-slate-800 text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-400">Irreversibility Notice: </span>
          In live mode, approving a launch issues an irrevocable create instruction to PumpPortal Lightning API. In Phase 1 preview, actions execute simulated mock transitions.
        </div>
      </div>
    </div>
  );
}
