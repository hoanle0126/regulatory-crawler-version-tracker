'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api-client';
import { StatusBadge } from '../../components/StatusBadge';
import { StatsCard } from '../../components/StatsCard';
import { formatDate } from '../../lib/utils';

export default function JobsPage() {
  const [crawls, setCrawls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadCrawls = async () => {
    try {
      setLoading(true);
      const res = await api.getCrawls({ pageSize: 50 });
      setCrawls(res.items || []);
    } catch (err: any) {
      console.error('Failed to load crawl queue runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrawls();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await api.retryCrawl(id);
      setTimeout(() => {
        loadCrawls();
        setRetryingId(null);
      }, 2000);
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
      setRetryingId(null);
    }
  };

  const queuedCount = crawls.filter((c) => c.status === 'QUEUED').length;
  const runningCount = crawls.filter((c) => c.status === 'RUNNING').length;
  const successCount = crawls.filter((c) => c.status === 'SUCCESS').length;
  const failedCount = crawls.filter((c) => c.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            <span>Crawl Queue &amp; Job Execution Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            BullMQ job status, worker execution logs, crawl concurrency, and retry dispatcher.
          </p>
        </div>

        <button
          onClick={loadCrawls}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Queued Jobs" value={queuedCount} badge="BullMQ" variant="default" />
        <StatsCard title="Running Workers" value={runningCount} badge="Active" variant="warning" />
        <StatsCard title="Successful Runs" value={successCount} badge="Done" variant="success" />
        <StatsCard
          title="Failed Executions"
          value={failedCount}
          badge={failedCount > 0 ? 'Action Req' : 'Healthy'}
          variant={failedCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Crawl Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Trigger</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Docs Discovered</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Error / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading job execution queue...
                  </td>
                </tr>
              ) : crawls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No crawl runs found in job history.
                  </td>
                </tr>
              ) : (
                crawls.map((crawl) => {
                  const isRetrying = retryingId === crawl.id;
                  const duration =
                    crawl.startedAt && crawl.completedAt
                      ? `${(
                          (new Date(crawl.completedAt).getTime() -
                            new Date(crawl.startedAt).getTime()) /
                          1000
                        ).toFixed(1)}s`
                      : '—';

                  return (
                    <tr key={crawl.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {crawl.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {crawl.source?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{crawl.trigger}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(crawl.startedAt)}</td>
                      <td className="py-3 px-4 text-slate-200 font-semibold">{duration}</td>
                      <td className="py-3 px-4 text-slate-300">{crawl.documentsDiscovered}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={crawl.status} type="crawl" size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {crawl.errorMessage ? (
                          <span className="text-rose-400">{crawl.errorMessage}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {crawl.status === 'FAILED' ? (
                          <button
                            onClick={() => handleRetry(crawl.id)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>Retry</span>
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
