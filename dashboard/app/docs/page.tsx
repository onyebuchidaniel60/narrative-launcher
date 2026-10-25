import { FileText, Shield, Terminal, BookOpen, AlertOctagon, HelpCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-slate-400" />
          Operator Documentation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Reference guide for bot operations, safety rails, commands, and failure recovery.
        </p>
      </div>

      {/* Section 1: Core Architecture */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-400" />
          1. System Architecture
        </h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p>
            Narrative Launcher is composed of two primary components operating on a single VPS (plus this Vercel inspection dashboard):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-200">Bot:</strong> Long-running Node.js process polling narrative sources (SentimentAlpha or CoinGecko), scoring emerging trends, synthesizing token identities with gpt-4o-mini, pinning to Pinata IPFS, dispatching Telegram approval cards, and executing token creation via PumpPortal Lightning API.
            </li>
            <li>
              <strong className="text-slate-200">Dashboard:</strong> Next.js App Router authenticated interface for real-time status inspection, approval oversight, history audit, and emergency pause. Reads a snapshot in Vercel mode or SQLite directly in self-hosted mode.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Safety Rails */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          2. Mandatory Safety Rails
        </h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-slate-950 border border-slate-850">
              <span className="font-semibold text-white block mb-1">Manual Approval Default</span>
              <span className="text-slate-400">
                Every launch requires explicit operator confirmation via Telegram inline button or Dashboard. Auto-launch is disabled by default.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850">
              <span className="font-semibold text-white block mb-1">Zero Stored Secret Keys</span>
              <span className="text-slate-400">
                The bot only holds the funding burner public key. The mint keypair is generated ephemerally per launch and discarded.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850">
              <span className="font-semibold text-white block mb-1">Dev Buy &amp; Daily Caps</span>
              <span className="text-slate-400">
                Hard limit of 0.10 SOL dev buy per launch and maximum daily launch quota (default 1/day) enforced in SQLite.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-850">
              <span className="font-semibold text-white block mb-1">Idempotent Execution</span>
              <span className="text-slate-400">
                Double-approvals and duplicate callback events are guarded by conditional database updates. A launch cannot trigger twice.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Operator Telegram Commands */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-400" />
          3. Telegram Bot Commands
        </h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
          <div className="space-y-2">
            <div>
              <span className="text-emerald-400">/status</span>
              <span className="text-slate-400 block font-sans text-xs">Returns bot running state, current burner SOL balance, and daily launch count.</span>
            </div>
            <div>
              <span className="text-emerald-400">/launch &lt;narrative text&gt;</span>
              <span className="text-slate-400 block font-sans text-xs">Manually initiates the pipeline for a custom narrative, bypassing source polling.</span>
            </div>
            <div>
              <span className="text-emerald-400">/pause</span>
              <span className="text-slate-400 block font-sans text-xs">Emergency halts poller cycles and suspends token deployments.</span>
            </div>
            <div>
              <span className="text-emerald-400">/resume</span>
              <span className="text-slate-400 block font-sans text-xs">Resumes normal poller and queue operations.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Emergency Handling */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-400" />
          4. Failure Recovery &amp; Kill Switch
        </h2>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p>
            If PumpPortal API encounters network errors or timeouts:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-200">No Blind Retries:</strong> Once a create request has been sent to PumpPortal, the bot will not retry automatically to prevent duplicate token creation and lost funds.
            </li>
            <li>
              <strong className="text-slate-200">Balance Depletion:</strong> If the burner balance falls below the dev buy plus gas estimate, the pipeline immediately halts and alerts the operator.
            </li>
            <li>
              <strong className="text-slate-200">Emergency Stop:</strong> Use the Dashboard Settings page or send <code>/pause</code> in Telegram.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
