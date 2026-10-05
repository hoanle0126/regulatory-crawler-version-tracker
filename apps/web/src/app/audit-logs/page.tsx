'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Search, RefreshCw, User } from 'lucide-react';
import { api } from '../../lib/api-client';
import { formatDate } from '../../lib/utils';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ pageSize: 50, search: search.trim() || undefined });
      setLogs(res.items || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80';
    if (action.includes('UPDATED')) return 'text-amber-400 bg-amber-950/80 border-amber-800/80';
    if (action.includes('DELETED')) return 'text-rose-400 bg-rose-950/80 border-rose-800/80';
    if (action.includes('TRIGGERED')) return 'text-sky-400 bg-sky-950/80 border-sky-800/80';
    return 'text-slate-300 bg-slate-800 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-sky-400" />
            <span>Security &amp; Administrative Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Immutable log of administrative configuration changes, crawl triggers, and security events.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs();
          }}
          className="relative max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, actor, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit log records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.actorEmail || 'System Process'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{log.entityType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {log.entityId ? `${log.entityId.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-sm truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
