import Link from 'next/link';
import { MOCK_BOT_STATE, MOCK_APPROVALS } from '@/lib/mock-data';
import {
  Activity,
  Wallet,
  Clock,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export default function StatusPage() {
  const state = MOCK_BOT_STATE;
  const pendingCount = MOCK_APPROVALS.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Status</h1>
          <p className="text-sm text-slate-400 mt-1">
            Bot runtime health, balance guard, and active pipeline overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Bot Active (Polling)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-300 border border-slate-800">
            DRY_RUN=true
          </span>
        </div>
      </div>

      {/* Pending Approvals Callout Banner */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-300 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {pendingCount} Pending Token Launch Approval
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Token &quot;{MOCK_APPROVALS[0].token_name}&quot; (${MOCK_APPROVALS[0].token_symbol}) awaiting operator decision.
              </p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition shrink-0"
          >
            <span>Review Token</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SOL Balance */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Burner Balance</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {state.balance_sol.toFixed(4)} <span className="text-sm text-slate-400 font-normal">SOL</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate font-mono">
            {state.burner_wallet_pubkey}
          </p>
        </div>

        {/* Daily Cap */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Daily Launch Cap</span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {state.daily_launches_count} / {state.max_launches_per_day}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Hard cap: max {state.max_launches_per_day} token launch per UTC day
          </p>
        </div>

        {/* Dev Buy Cap */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dev Buy Cap</span>
            <TrendingUp className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {state.max_dev_buy_sol.toFixed(2)} <span className="text-sm text-slate-400 font-normal">SOL</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Max initial dev allocation per token launch
          </p>
        </div>

        {/* Ingestion & Score Threshold */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Gate Threshold</span>
            <Cpu className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            &gt;= {state.score_threshold} <span className="text-sm text-slate-400 font-normal">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total Narratives Detected: {state.total_detected}
          </p>
        </div>
      </div>

      {/* Status Details / Operations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline State */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Runtime Configuration
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Poll cycle: every {state.poll_interval_minutes}m
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400 font-medium">Launch Mode</div>
              <div className="text-slate-200 font-mono">DRY_RUN (Simulated Deploys)</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400 font-medium">Operator Authorization</div>
              <div className="text-slate-200 font-mono">Manual Telegram &amp; Web Callback</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400 font-medium">Auto-Launch Setting</div>
              <div className="text-slate-200 font-mono">Disabled (AUTO_LAUNCH=false)</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850 space-y-1">
              <div className="text-slate-400 font-medium">Approval TTL Window</div>
              <div className="text-slate-200 font-mono">{state.approval_ttl_minutes} minutes</div>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Last Polled: {new Date(state.last_polled_at).toLocaleTimeString()} UTC</span>
            <span className="text-emerald-400 font-medium">RPC &amp; Ingestion Healthy</span>
          </div>
        </div>

        {/* Right Col: Safety Summary */}
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Safety Rails Active
          </h2>
          <ul className="text-xs text-slate-400 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>Burner wallet holds zero secret keys in persistent storage.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>Approval cards require operator sign-off before PumpPortal create.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>Double-approval guard strictly enforced via conditional database UPDATE.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <span>Emergency kill switch accessible via Telegram and Dashboard.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
