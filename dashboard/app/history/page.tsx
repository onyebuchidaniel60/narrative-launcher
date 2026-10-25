'use client';

import { useState } from 'react';
import { MOCK_HISTORY, LaunchItem } from '@/lib/mock-data';
import { History, Search, ExternalLink, Filter, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredHistory = MOCK_HISTORY.filter((item) => {
    const matchesSearch =
      item.token_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.narrative_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function renderStatusBadge(status: LaunchItem['status']) {
    switch (status) {
      case 'LAUNCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            LAUNCHED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-slate-400" />
            Launch History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical log of detected narratives, decisions, and on-chain token deployments.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
          Total Records: {MOCK_HISTORY.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by token, symbol, or narrative..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="LAUNCHED">Launched</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-medium">
              <tr>
                <th className="px-4 py-3">Token &amp; Narrative</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dev Buy</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Solscan / Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-850/50 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{row.token_name}</span>
                      <span className="font-mono text-slate-400">${row.token_symbol}</span>
                    </div>
                    <div className="text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                      {row.narrative_text}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-200">
                    {row.composite_score}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {renderStatusBadge(row.status)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap">
                    {row.dev_buy_sol.toFixed(2)} SOL
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {row.tx_signature ? (
                      <span className="inline-flex items-center gap-1 font-mono text-slate-400 hover:text-slate-200 cursor-pointer">
                        <span>{row.tx_signature.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No matching launch records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
