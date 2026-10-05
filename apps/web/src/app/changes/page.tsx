'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  Filter,
  Search,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function ChangesPage() {
  const [changes, setChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const res = await api.getChanges({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        pageSize: 30,
      });
      setChanges(res.items || []);
    } catch (err: any) {
      console.error('Failed to load changes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoadingId(id);
      await api.updateChangeStatus(id, newStatus);
      await loadChanges();
    } catch (err: any) {
      alert(`Failed to update change status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-amber-400" />
            <span>Regulatory Change Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Track and review clause-level modifications, newly introduced articles, and repealed legal provisions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadChanges();
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search changes by regulation title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </form>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="">All Review Statuses</option>
            <option value="DETECTED">DETECTED (Unreviewed)</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="IGNORED">IGNORED</option>
          </select>
        </div>
      </div>

      {/* Changes Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            Loading regulatory changes...
          </div>
        ) : changes.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No regulatory changes match your current filters.
          </div>
        ) : (
          changes.map((change) => {
            const isLoading = actionLoadingId === change.id;
            return (
              <div
                key={change.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={change.status} type="changeset" size="sm" />
                    <span className="text-[11px] font-mono text-slate-500">
                      Detected: {formatDate(change.detectedAt)}
                    </span>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-slate-500 text-[11px] mr-1">Review:</span>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'REVIEWED')}
                      disabled={isLoading}
                      title="Mark as Reviewed"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-[11px] transition-colors"
                    >
                      Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'ACKNOWLEDGED')}
                      disabled={isLoading}
                      title="Acknowledge Compliance Impact"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(change.id, 'IGNORED')}
                      disabled={isLoading}
                      title="Ignore Change"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-[11px] transition-colors"
                    >
                      Ignore
                    </button>
                  </div>
                </div>

                <div>
                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="text-base font-bold text-slate-100 hover:text-sky-400 transition-colors font-sans block"
                  >
                    {change.document?.documentNumber ? `${change.document.documentNumber}: ` : ''}
                    {change.document?.title || 'Regulatory Document'}
                  </Link>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{change.summary}</span>
                  </div>

                  <Link
                    href={`/documents/${change.documentId}/compare?from=${change.previousVersionId}&to=${change.newVersionId}`}
                    className="text-sky-400 hover:underline flex items-center gap-1 shrink-0 font-semibold"
                  >
                    <span>Inspect Provision Diff</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
